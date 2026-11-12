package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// ---------- สิทธิ์แอดมิน ----------

func requireAdmin(w http.ResponseWriter, r *http.Request) bool {
	_, role, ok := authUser(r)
	if !ok {
		writeErr(w, http.StatusUnauthorized, "login required")
		return false
	}
	if role != "admin" {
		writeErr(w, http.StatusForbidden, "admin only")
		return false
	}
	return true
}

// ---------- ข้อมูลที่รับเข้า ----------

type gameInput struct {
	Name          string   `json:"name"`
	Category      string   `json:"category"` // slug ของหมวดหมู่
	Description   string   `json:"description"`
	Publisher     string   `json:"publisher"`
	Designer      string   `json:"designer"`
	GameType      string   `json:"game_type"`
	MinPlayers    int      `json:"min_players"`
	MaxPlayers    int      `json:"max_players"`
	MinPlayTime   int      `json:"min_play_time"`
	MaxPlayTime   int      `json:"max_play_time"`
	MinAge        int      `json:"min_age"`
	HowToPlay     []string `json:"how_to_play"`
	Highlights    []string `json:"highlights"`
	Tags          []string `json:"tags"`
	IsRecommended bool     `json:"is_recommended"`
	CoverURL      string   `json:"cover_url"` // ใหม่: รูปปก (null/ว่าง = ไม่มีรูป)
}

func cleanLines(in []string) []string {
	out := []string{}
	for _, s := range in {
		if s = strings.TrimSpace(s); s != "" {
			out = append(out, s)
		}
	}
	return out
}

func nullIfEmpty(s string) any {
	if s = strings.TrimSpace(s); s == "" {
		return nil
	}
	return s
}

var nonSlug = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(name string) string {
	s := strings.Trim(nonSlug.ReplaceAllString(strings.ToLower(name), "-"), "-")
	if s == "" { // ชื่อภาษาไทยล้วน
		s = fmt.Sprintf("game-%d", time.Now().Unix())
	}
	return s
}

// รูปปกต้องเป็นไฟล์ในเว็บเรา (/uploads/..., /covers/...) หรือลิงก์ http(s) เท่านั้น
func validCoverURL(s string) bool {
	if s == "" {
		return true
	}
	if len(s) > 500 {
		return false
	}
	if strings.HasPrefix(s, "/") && !strings.HasPrefix(s, "//") {
		return true
	}
	return strings.HasPrefix(s, "http://") || strings.HasPrefix(s, "https://")
}

func readGameInput(w http.ResponseWriter, r *http.Request) (gameInput, bool) {
	var in gameInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeErr(w, http.StatusBadRequest, "ข้อมูลไม่ถูกต้อง")
		return in, false
	}
	in.Name = strings.TrimSpace(in.Name)
	in.Description = strings.TrimSpace(in.Description)
	in.CoverURL = strings.TrimSpace(in.CoverURL)
	in.HowToPlay = cleanLines(in.HowToPlay)
	in.Highlights = cleanLines(in.Highlights)
	in.Tags = cleanLines(in.Tags)

	switch {
	case in.Name == "" || len(in.Name) > 120:
		writeErr(w, http.StatusBadRequest, "กรุณากรอกชื่อเกม (ไม่เกิน 120 ตัวอักษร)")
	case in.Category == "":
		writeErr(w, http.StatusBadRequest, "กรุณาเลือกหมวดหมู่")
	case in.Description == "":
		writeErr(w, http.StatusBadRequest, "กรุณากรอกรายละเอียดเกม")
	case in.MinPlayers < 1 || in.MaxPlayers < in.MinPlayers:
		writeErr(w, http.StatusBadRequest, "จำนวนผู้เล่นไม่ถูกต้อง")
	case in.MinPlayTime < 1 || in.MaxPlayTime < in.MinPlayTime:
		writeErr(w, http.StatusBadRequest, "เวลาเล่นไม่ถูกต้อง")
	case in.MinAge < 0:
		writeErr(w, http.StatusBadRequest, "อายุที่แนะนำไม่ถูกต้อง")
	case !validCoverURL(in.CoverURL):
		writeErr(w, http.StatusBadRequest, "ที่อยู่รูปปกไม่ถูกต้อง")
	default:
		return in, true
	}
	return in, false
}

func categoryID(r *http.Request, slug string) (int64, bool) {
	var id int64
	err := db.QueryRow(r.Context(), `SELECT id FROM categories WHERE slug = $1`, slug).Scan(&id)
	return id, err == nil
}

// ---------- handlers ----------

// POST /api/admin/games
func handleAdminCreateGame(w http.ResponseWriter, r *http.Request) {
	if !requireAdmin(w, r) {
		return
	}
	in, ok := readGameInput(w, r)
	if !ok {
		return
	}
	catID, found := categoryID(r, in.Category)
	if !found {
		writeErr(w, http.StatusBadRequest, "ไม่พบหมวดหมู่นี้")
		return
	}

	slug := slugify(in.Name)
	var id int64
	err := db.QueryRow(r.Context(),
		`INSERT INTO games (slug, name, category_id, description, publisher, designer, game_type,
		                    min_players, max_players, min_play_time, max_play_time, min_age,
		                    how_to_play, highlights, tags, is_recommended, cover_url, is_published)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,true)
		 RETURNING id`,
		slug, in.Name, catID, in.Description, nullIfEmpty(in.Publisher), nullIfEmpty(in.Designer), nullIfEmpty(in.GameType),
		in.MinPlayers, in.MaxPlayers, in.MinPlayTime, in.MaxPlayTime, in.MinAge,
		in.HowToPlay, in.Highlights, in.Tags, in.IsRecommended, nullIfEmpty(in.CoverURL)).Scan(&id)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			writeErr(w, http.StatusConflict, "มีเกมชื่อนี้อยู่แล้ว")
			return
		}
		log.Printf("admin create game error: %v", err)
		writeErr(w, http.StatusInternalServerError, "เพิ่มเกมไม่สำเร็จ")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"id": id, "slug": slug})
}

// PUT /api/admin/games/{id}
func handleAdminUpdateGame(w http.ResponseWriter, r *http.Request) {
	if !requireAdmin(w, r) {
		return
	}
	gid, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "id ไม่ถูกต้อง")
		return
	}
	in, ok := readGameInput(w, r)
	if !ok {
		return
	}
	catID, found := categoryID(r, in.Category)
	if !found {
		writeErr(w, http.StatusBadRequest, "ไม่พบหมวดหมู่นี้")
		return
	}

	// cover_url ไม่ใช้ COALESCE เพราะต้องลบรูปได้ (ส่งค่าว่าง = ลบรูป)
	tag, err := db.Exec(r.Context(),
		`UPDATE games SET
		   name = $1, category_id = $2, description = $3,
		   publisher = COALESCE($4, publisher), designer = COALESCE($5, designer), game_type = COALESCE($6, game_type),
		   min_players = $7, max_players = $8, min_play_time = $9, max_play_time = $10, min_age = $11,
		   how_to_play = $12, highlights = $13, tags = $14, is_recommended = $15, cover_url = $16
		 WHERE id = $17`,
		in.Name, catID, in.Description, nullIfEmpty(in.Publisher), nullIfEmpty(in.Designer), nullIfEmpty(in.GameType),
		in.MinPlayers, in.MaxPlayers, in.MinPlayTime, in.MaxPlayTime, in.MinAge,
		in.HowToPlay, in.Highlights, in.Tags, in.IsRecommended, nullIfEmpty(in.CoverURL), gid)
	if err != nil {
		log.Printf("admin update game error: %v", err)
		writeErr(w, http.StatusInternalServerError, "แก้ไขเกมไม่สำเร็จ")
		return
	}
	if tag.RowsAffected() == 0 {
		writeErr(w, http.StatusNotFound, "game not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// DELETE /api/admin/games/{id}
func handleAdminDeleteGame(w http.ResponseWriter, r *http.Request) {
	if !requireAdmin(w, r) {
		return
	}
	gid, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "id ไม่ถูกต้อง")
		return
	}

	tx, err := db.Begin(r.Context())
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "ลบเกมไม่สำเร็จ")
		return
	}
	defer tx.Rollback(r.Context())

	// ลบรายการโปรดที่อ้างถึงเกมนี้ก่อน (กัน foreign key ขวาง)
	if _, err := tx.Exec(r.Context(), `DELETE FROM user_favorites WHERE game_id = $1`, gid); err != nil {
		log.Printf("admin delete favorites error: %v", err)
		writeErr(w, http.StatusInternalServerError, "ลบเกมไม่สำเร็จ")
		return
	}
	tag, err := tx.Exec(r.Context(), `DELETE FROM games WHERE id = $1`, gid)
	if err != nil {
		log.Printf("admin delete game error: %v", err)
		writeErr(w, http.StatusInternalServerError, "ลบเกมไม่สำเร็จ")
		return
	}
	if tag.RowsAffected() == 0 {
		writeErr(w, http.StatusNotFound, "game not found")
		return
	}
	if err := tx.Commit(r.Context()); err != nil {
		writeErr(w, http.StatusInternalServerError, "ลบเกมไม่สำเร็จ")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
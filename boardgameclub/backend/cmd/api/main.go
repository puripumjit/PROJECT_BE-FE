package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var (
	db        *pgxpool.Pool
	jwtSecret []byte
)

// ---------- helpers ----------

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// ---------- CORS ----------

func cors(next http.Handler) http.Handler {
	origin := getenv("CORS_ORIGIN", "*")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ---------- token (HMAC ลงลายมือชื่ออย่างง่าย) ----------

func makeToken(userID int64, role string) string {
	exp := time.Now().Add(24 * time.Hour).Unix()
	payload := fmt.Sprintf("%d:%s:%d", userID, role, exp)
	enc := base64.RawURLEncoding.EncodeToString([]byte(payload))
	mac := hmac.New(sha256.New, jwtSecret)
	mac.Write([]byte(enc))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return enc + "." + sig
}

func parseToken(tok string) (int64, string, bool) {
	parts := strings.Split(tok, ".")
	if len(parts) != 2 {
		return 0, "", false
	}
	mac := hmac.New(sha256.New, jwtSecret)
	mac.Write([]byte(parts[0]))
	want := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(want), []byte(parts[1])) {
		return 0, "", false
	}
	raw, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return 0, "", false
	}
	f := strings.Split(string(raw), ":")
	if len(f) != 3 {
		return 0, "", false
	}
	uid, err1 := strconv.ParseInt(f[0], 10, 64)
	exp, err2 := strconv.ParseInt(f[2], 10, 64)
	if err1 != nil || err2 != nil || time.Now().Unix() > exp {
		return 0, "", false
	}
	return uid, f[1], true
}

func authUser(r *http.Request) (int64, string, bool) {
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(h, "Bearer ") {
		return 0, "", false
	}
	return parseToken(strings.TrimPrefix(h, "Bearer "))
}

// ---------- models ----------

type Category struct {
	ID          int64   `json:"id"`
	Slug        string  `json:"slug"`
	NameTH      string  `json:"name_th"`
	NameEN      string  `json:"name_en"`
	Description *string `json:"description"`
	Icon        *string `json:"icon"`
	CoverURL    *string `json:"cover_url"`
	SortOrder   int     `json:"sort_order"`
}

type Game struct {
	ID            int64    `json:"id"`
	Slug          string   `json:"slug"`
	Name          string   `json:"name"`
	CategorySlug  string   `json:"category"`
	Description   *string  `json:"description"`
	Publisher     *string  `json:"publisher"`
	Designer      *string  `json:"designer"`
	GameType      *string  `json:"game_type"`
	MinPlayers    int      `json:"min_players"`
	MaxPlayers    int      `json:"max_players"`
	MinPlayTime   int      `json:"min_play_time"`
	MaxPlayTime   int      `json:"max_play_time"`
	MinAge        int      `json:"min_age"`
	HowToPlay     []string `json:"how_to_play"`
	Highlights    []string `json:"highlights"`
	Tags          []string `json:"tags"`
	IsRecommended bool     `json:"is_recommended"`
}

const gameSelect = `
SELECT g.id, g.slug, g.name, c.slug, g.description, g.publisher, g.designer, g.game_type,
       g.min_players, g.max_players, g.min_play_time, g.max_play_time, g.min_age,
       g.how_to_play, g.highlights, g.tags, g.is_recommended
FROM games g
JOIN categories c ON c.id = g.category_id
`

func scanGame(rows pgx.Rows) (Game, error) {
	var g Game
	err := rows.Scan(
		&g.ID, &g.Slug, &g.Name, &g.CategorySlug, &g.Description, &g.Publisher, &g.Designer, &g.GameType,
		&g.MinPlayers, &g.MaxPlayers, &g.MinPlayTime, &g.MaxPlayTime, &g.MinAge,
		&g.HowToPlay, &g.Highlights, &g.Tags, &g.IsRecommended,
	)
	return g, err
}

func collectGames(rows pgx.Rows) ([]Game, error) {
	defer rows.Close()
	games := []Game{}
	for rows.Next() {
		g, err := scanGame(rows)
		if err != nil {
			return nil, err
		}
		games = append(games, g)
	}
	return games, rows.Err()
}

// ---------- handlers ----------

func handleHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	if err := db.Ping(ctx); err != nil {
		writeErr(w, http.StatusServiceUnavailable, "database not reachable")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func handleCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(r.Context(),
		`SELECT id, slug, name_th, name_en, description, icon, cover_url, sort_order
		 FROM categories ORDER BY sort_order, id`)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	list := []Category{}
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Slug, &c.NameTH, &c.NameEN, &c.Description, &c.Icon, &c.CoverURL, &c.SortOrder); err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		list = append(list, c)
	}
	writeJSON(w, http.StatusOK, list)
}

// GET /api/games?category=family&q=catan&recommended=true
func handleGames(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	category := q.Get("category")
	search := q.Get("q")
	recommended := q.Get("recommended") == "true"

	rows, err := db.Query(r.Context(), gameSelect+`
		WHERE g.is_published
		  AND ($1 = '' OR c.slug = $1)
		  AND ($2 = '' OR g.name ILIKE '%' || $2 || '%')
		  AND ($3 = false OR g.is_recommended)
		ORDER BY g.id`, category, search, recommended)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	games, err := collectGames(rows)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, games)
}

func handleGameDetail(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	rows, err := db.Query(r.Context(), gameSelect+` WHERE g.slug = $1 AND g.is_published`, slug)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	games, err := collectGames(rows)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	if len(games) == 0 {
		writeErr(w, http.StatusNotFound, "game not found")
		return
	}
	writeJSON(w, http.StatusOK, games[0])
}

// POST /api/login  {"username":"admin","password":"123456"}  (username จะเป็นอีเมลก็ได้)
func handleLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Username == "" || body.Password == "" {
		writeErr(w, http.StatusBadRequest, "username and password are required")
		return
	}

	var (
		id          int64
		username    string
		email       string
		hash        string
		displayName *string
		role        string
		active      bool
	)
	err := db.QueryRow(r.Context(),
		`SELECT id, username, email, password_hash, display_name, role::text, is_active
		 FROM users
		 WHERE lower(username) = lower($1) OR lower(email) = lower($1)`,
		body.Username).Scan(&id, &username, &email, &hash, &displayName, &role, &active)
	if err != nil {
		writeErr(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if !active || bcrypt.CompareHashAndPassword([]byte(hash), []byte(body.Password)) != nil {
		writeErr(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	_, _ = db.Exec(r.Context(), `UPDATE users SET last_login_at = now() WHERE id = $1`, id)

	writeJSON(w, http.StatusOK, map[string]any{
		"token": makeToken(id, role),
		"user": map[string]any{
			"id":           id,
			"username":     username,
			"email":        email,
			"display_name": displayName,
			"role":         role,
		},
	})
}

// GET /api/favorites  (ต้องแนบ Authorization: Bearer <token>)
func handleFavorites(w http.ResponseWriter, r *http.Request) {
	uid, _, ok := authUser(r)
	if !ok {
		writeErr(w, http.StatusUnauthorized, "login required")
		return
	}
	rows, err := db.Query(r.Context(), gameSelect+`
		JOIN user_favorites f ON f.game_id = g.id
		WHERE f.user_id = $1
		ORDER BY f.added_at DESC`, uid)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	games, err := collectGames(rows)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, games)
}

// PUT /api/favorites/{slug}
func handleAddFavorite(w http.ResponseWriter, r *http.Request) {
	uid, _, ok := authUser(r)
	if !ok {
		writeErr(w, http.StatusUnauthorized, "login required")
		return
	}
	_, err := db.Exec(r.Context(),
		`INSERT INTO user_favorites (user_id, game_id)
		 SELECT $1, id FROM games WHERE slug = $2
		 ON CONFLICT DO NOTHING`, uid, r.PathValue("slug"))
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// DELETE /api/favorites/{slug}
func handleRemoveFavorite(w http.ResponseWriter, r *http.Request) {
	uid, _, ok := authUser(r)
	if !ok {
		writeErr(w, http.StatusUnauthorized, "login required")
		return
	}
	_, err := db.Exec(r.Context(),
		`DELETE FROM user_favorites
		 WHERE user_id = $1 AND game_id = (SELECT id FROM games WHERE slug = $2)`,
		uid, r.PathValue("slug"))
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---------- main ----------

func main() {
	dsn := getenv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/boardgamehub?sslmode=disable")
	jwtSecret = []byte(getenv("JWT_SECRET", "dev-secret-change-me"))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var err error
	db, err = pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("cannot create db pool: %v", err)
	}
	defer db.Close()
	if err := db.Ping(ctx); err != nil {
		log.Fatalf("cannot connect to database: %v", err)
	}
	log.Println("connected to database")

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", handleHealth)
	mux.HandleFunc("GET /api/categories", handleCategories)
	mux.HandleFunc("GET /api/games", handleGames)
	mux.HandleFunc("GET /api/games/{slug}", handleGameDetail)
	mux.HandleFunc("POST /api/login", handleLogin)
	mux.HandleFunc("GET /api/favorites", handleFavorites)
	mux.HandleFunc("PUT /api/favorites/{slug}", handleAddFavorite)
	mux.HandleFunc("DELETE /api/favorites/{slug}", handleRemoveFavorite)

	addr := ":" + getenv("PORT", "8080")
	log.Printf("listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, cors(mux)))
}
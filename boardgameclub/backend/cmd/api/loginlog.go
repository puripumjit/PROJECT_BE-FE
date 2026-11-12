package main

// ใช้ db, writeJSON, writeErr จาก main.go และ requireAdmin จาก admin.go

import (
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// ---------- บันทึกการเข้าสู่ระบบ ----------

func clientIP(r *http.Request) string {
	if xf := r.Header.Get("X-Forwarded-For"); xf != "" {
		return strings.TrimSpace(strings.Split(xf, ",")[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// logLogin เรียกจาก handleLogin ทุกครั้งที่มีการพยายามเข้าสู่ระบบ
// ไม่เก็บรหัสผ่าน เก็บเฉพาะชื่อที่พิมพ์ ผลลัพธ์ IP และอุปกรณ์
func logLogin(r *http.Request, userID *int64, username string, success bool) {
	ua := r.UserAgent()
	if len(ua) > 300 {
		ua = ua[:300]
	}
	_, _ = db.Exec(r.Context(),
		`INSERT INTO login_logs (user_id, username, success, ip, user_agent)
		 VALUES ($1, $2, $3, $4, $5)`,
		userID, username, success, clientIP(r), ua)
}

// ---------- ดูประวัติ (เฉพาะแอดมิน อ่านอย่างเดียว) ----------

type LoginLog struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	Success   bool      `json:"success"`
	IP        string    `json:"ip"`
	UserAgent string    `json:"user_agent"`
	CreatedAt time.Time `json:"created_at"`
}

// GET /api/admin/login-logs?page=1&limit=10&q=ชื่อหรืออีเมล&status=success|failed&role=admin|member
func handleLoginLogs(w http.ResponseWriter, r *http.Request) {
	if !requireAdmin(w, r) { // มีอยู่แล้วใน admin.go
		return
	}

	q := r.URL.Query()
	search := strings.TrimSpace(q.Get("q"))
	status := q.Get("status")
	role := q.Get("role")
	if status != "success" && status != "failed" {
		status = ""
	}
	if role != "admin" && role != "member" {
		role = ""
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 10
	}
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	const from = `
		FROM login_logs l
		LEFT JOIN users u ON u.id = l.user_id
		WHERE ($1 = '' OR l.username ILIKE '%' || $1 || '%' OR COALESCE(u.email, '') ILIKE '%' || $1 || '%')
		  AND ($2 = '' OR ($2 = 'success' AND l.success) OR ($2 = 'failed' AND NOT l.success))
		  AND ($3 = '' OR COALESCE(u.role::text, '') = $3)`

	var total int64
	if err := db.QueryRow(r.Context(), `SELECT COUNT(*) `+from, search, status, role).Scan(&total); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}

	rows, err := db.Query(r.Context(),
		`SELECT l.id, l.username, COALESCE(u.email, ''), COALESCE(u.role::text, ''),
		        l.success, COALESCE(l.ip, ''), COALESCE(l.user_agent, ''), l.created_at `+from+`
		 ORDER BY l.created_at DESC, l.id DESC
		 LIMIT $4 OFFSET $5`, search, status, role, limit, offset)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	items := []LoginLog{}
	for rows.Next() {
		var it LoginLog
		if err := rows.Scan(&it.ID, &it.Username, &it.Email, &it.Role, &it.Success, &it.IP, &it.UserAgent, &it.CreatedAt); err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		items = append(items, it)
	}

	// สถิติของ "วันนี้" นับตามเวลากรุงเทพฯ
	const today = `date_trunc('day', now() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok'`
	var loginsToday, uniqueToday, failedToday int64
	var lastLogin *time.Time
	err = db.QueryRow(r.Context(),
		`SELECT
		   COUNT(*) FILTER (WHERE success AND created_at >= `+today+`),
		   COUNT(DISTINCT user_id) FILTER (WHERE success AND created_at >= `+today+`),
		   COUNT(*) FILTER (WHERE NOT success AND created_at >= `+today+`),
		   MAX(created_at) FILTER (WHERE success)
		 FROM login_logs`).Scan(&loginsToday, &uniqueToday, &failedToday, &lastLogin)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"total": total,
		"page":  page,
		"limit": limit,
		"items": items,
		"stats": map[string]any{
			"logins_today":  loginsToday,
			"unique_today":  uniqueToday,
			"failed_today":  failedToday,
			"last_login_at": lastLogin,
		},
	})
}
package main

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const (
	uploadDir     = "uploads"
	maxUploadSize = 3 << 20 // 3MB
)

var imageExt = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

// POST /api/admin/upload  (multipart/form-data, ฟิลด์ชื่อ "image")
func handleAdminUpload(w http.ResponseWriter, r *http.Request) {
	if !requireAdmin(w, r) {
		return
	}

	// เผื่อ overhead ของ multipart เล็กน้อย แล้วเช็คขนาดไฟล์จริงอีกที
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize+(1<<20))
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeErr(w, http.StatusBadRequest, "รูปต้องมีขนาดไม่เกิน 3MB")
		return
	}
	file, header, err := r.FormFile("image")
	if err != nil {
		writeErr(w, http.StatusBadRequest, "ไม่พบไฟล์รูป")
		return
	}
	defer file.Close()

	if header.Size > maxUploadSize {
		writeErr(w, http.StatusBadRequest, "รูปต้องมีขนาดไม่เกิน 3MB")
		return
	}

	// ตรวจชนิดไฟล์จากเนื้อไฟล์จริง ไม่เชื่อชื่อไฟล์ที่ส่งมา
	head := make([]byte, 512)
	n, _ := file.Read(head)
	ext, ok := imageExt[http.DetectContentType(head[:n])]
	if !ok {
		writeErr(w, http.StatusBadRequest, "รองรับเฉพาะไฟล์ JPG, PNG, WEBP")
		return
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		writeErr(w, http.StatusInternalServerError, "อัปโหลดรูปไม่สำเร็จ")
		return
	}

	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		writeErr(w, http.StatusInternalServerError, "อัปโหลดรูปไม่สำเร็จ")
		return
	}
	name := hex.EncodeToString(b) + ext

	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		log.Printf("upload mkdir error: %v", err)
		writeErr(w, http.StatusInternalServerError, "อัปโหลดรูปไม่สำเร็จ")
		return
	}
	dst, err := os.Create(filepath.Join(uploadDir, name))
	if err != nil {
		log.Printf("upload create error: %v", err)
		writeErr(w, http.StatusInternalServerError, "อัปโหลดรูปไม่สำเร็จ")
		return
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		log.Printf("upload write error: %v", err)
		writeErr(w, http.StatusInternalServerError, "อัปโหลดรูปไม่สำเร็จ")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"url": "/uploads/" + name})
}

// เสิร์ฟรูปใน uploads/ โดยไม่ให้เปิดดูรายชื่อไฟล์ทั้งโฟลเดอร์
func uploadsHandler() http.Handler {
	fs := http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadDir)))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") {
			http.NotFound(w, r)
			return
		}
		fs.ServeHTTP(w, r)
	})
}

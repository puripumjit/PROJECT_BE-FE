// ตัวช่วยเรียกรายการโปรดผ่าน backend (ผูกกับบัญชีผู้ใช้ ต้องล็อกอิน)
// วางไว้ที่ src/favorites.js
const API = import.meta.env.VITE_API_URL ?? 'https://project-be-fe-clsv.onrender.com'

export const getToken = () => localStorage.getItem('token') ?? sessionStorage.getItem('token')
export const isLoggedIn = () => !!getToken()

async function call(path, method = 'GET') {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (res.status === 401) {
    // token หมดอายุหรือไม่ถูกต้อง: ล้างสถานะล็อกอินให้ Navbar อัปเดตด้วย
    ;['token', 'user'].forEach((k) => {
      localStorage.removeItem(k)
      sessionStorage.removeItem(k)
    })
    window.dispatchEvent(new Event('auth-change'))
    throw new Error('unauthorized')
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.status === 204 ? null : res.json()
}

export const fetchFavorites = () => call('/api/favorites') // คืนรายการเกมเต็ม เรียงล่าสุดก่อน
export const addFavorite = (slug) => call(`/api/favorites/${encodeURIComponent(slug)}`, 'PUT')
export const removeFavorite = (slug) => call(`/api/favorites/${encodeURIComponent(slug)}`, 'DELETE')

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Cover from '../components/Cover.jsx'

const API = import.meta.env.VITE_API_URL ?? 'https://project-be-fe-clsv.onrender.com'
const NAVY = '#0f1f4b'
const ORANGE = '#f97316'
const NAVY_GRAD = 'linear-gradient(180deg,#0b1437 0%,#14275f 100%)'

const EMPTY = {
  name: '',
  category: '',
  min_players: '',
  max_players: '',
  min_play_time: '',
  max_play_time: '',
  min_age: '',
  description: '',
  how_to_play: '',
  highlights: '',
  tags: '',
  is_recommended: false,
  cover_url: '', // ใหม่: รูปปกเกม
}

/* ---------- helpers ---------- */
function getAuth() {
  try {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    return { token, user: raw ? JSON.parse(raw) : null }
  } catch {
    return { token: null, user: null }
  }
}

async function api(path, { method = 'GET', body } = {}) {
  const { token } = getAuth()
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `เกิดข้อผิดพลาด (HTTP ${res.status})`)
  return data
}

// ใหม่: อัปโหลดรูป (ใช้ FormData ห้ามตั้ง Content-Type เอง)
async function uploadImage(file) {
  const { token } = getAuth()
  const fd = new FormData()
  fd.append('image', file)
  const res = await fetch(`${API}/api/admin/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'อัปโหลดรูปไม่สำเร็จ')
  return data.url
}

// ใหม่: แปลง path รูปให้เป็น URL เต็ม
const imgSrc = (u) => (!u ? '' : /^https?:\/\//.test(u) ? u : `${API}${u}`)

const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean)
const toForm = (g) => ({
  name: g.name,
  category: g.category,
  min_players: String(g.min_players),
  max_players: String(g.max_players),
  min_play_time: String(g.min_play_time),
  max_play_time: String(g.max_play_time),
  min_age: String(g.min_age),
  description: g.description ?? '',
  how_to_play: (g.how_to_play ?? []).join('\n'),
  highlights: (g.highlights ?? []).join('\n'),
  tags: (g.tags ?? []).join(', '),
  is_recommended: !!g.is_recommended,
  cover_url: g.cover_url ?? '',
})
const toPayload = (f) => ({
  name: f.name.trim(),
  category: f.category,
  description: f.description.trim(),
  min_players: Number(f.min_players),
  max_players: Number(f.max_players),
  min_play_time: Number(f.min_play_time),
  max_play_time: Number(f.max_play_time),
  min_age: Number(f.min_age),
  how_to_play: lines(f.how_to_play),
  highlights: lines(f.highlights),
  tags: f.tags.split(',').map((x) => x.trim()).filter(Boolean),
  is_recommended: f.is_recommended,
  cover_url: f.cover_url || null,
})

/* ---------- ส่วนประกอบฟอร์ม ---------- */
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1.5px solid #e2e8f0',
  background: '#fff',
  fontSize: 15,
  color: NAVY,
  outline: 'none',
  fontFamily: 'inherit',
}
const focus = (e) => (e.target.style.borderColor = ORANGE)
const blur = (e) => (e.target.style.borderColor = '#e2e8f0')

function Field({ label, required, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 700, color: NAVY }}>
        {label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
      {hint && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{hint}</p>}
    </div>
  )
}

function Range({ value, onChange, unit, placeholderMin, placeholderMax, min = 1 }) {
  const [a, b] = value
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="number" min={min} value={a} placeholder={placeholderMin} onChange={(e) => onChange([e.target.value, b])} style={inputStyle} onFocus={focus} onBlur={blur} />
      <span style={{ color: '#64748b' }}>ถึง</span>
      <input type="number" min={min} value={b} placeholder={placeholderMax} onChange={(e) => onChange([a, e.target.value])} style={inputStyle} onFocus={focus} onBlur={blur} />
      <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{unit}</span>
    </div>
  )
}

/* ---------- แท็บ: เพิ่ม/แก้ไขเกม ---------- */
function GameForm({ categories, editing, onSaved, onCancel }) {
  const [f, setF] = useState(editing ? toForm(editing) : EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }))
  const bind = (k) => ({ value: f[k], onChange: (e) => set(k)(e.target.value), onFocus: focus, onBlur: blur })

  async function onPickImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (file.size > 3 * 1024 * 1024) {
      e.target.value = ''
      return setError('รูปต้องมีขนาดไม่เกิน 3MB')
    }
    setUploading(true)
    try {
      set('cover_url')(await uploadImage(file))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!f.name.trim() || !f.category || !f.description.trim()) return setError('กรุณากรอกชื่อเกม หมวดหมู่ และรายละเอียดให้ครบ')
    if (!f.min_players || !f.max_players || !f.min_play_time || !f.max_play_time || f.min_age === '') return setError('กรุณากรอกจำนวนผู้เล่น เวลาเล่น และอายุให้ครบ')
    if (uploading) return setError('กำลังอัปโหลดรูป กรุณารอสักครู่')
    setSaving(true)
    try {
      if (editing) await api(`/api/admin/games/${editing.id}`, { method: 'PUT', body: toPayload(f) })
      else await api('/api/admin/games', { method: 'POST', body: toPayload(f) })
      onSaved(editing ? 'แก้ไขเกมเรียบร้อยแล้ว' : 'เพิ่มเกมเรียบร้อยแล้ว')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 style={{ margin: '0 0 24px', fontSize: 28, fontWeight: 800, color: NAVY }}>{editing ? `แก้ไขเกม: ${editing.name}` : 'เพิ่มบอร์ดเกมใหม่'}</h1>

      {error && (
        <div role="alert" style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', columnGap: 28 }}>
        <div>
          <Field label="ชื่อเกม" required>
            <input type="text" placeholder="กรอกชื่อเกม" {...bind('name')} style={inputStyle} />
          </Field>
          <Field label="หมวดหมู่" required>
            <select {...bind('category')} style={inputStyle}>
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name_th}
                </option>
              ))}
            </select>
          </Field>
          <Field label="จำนวนผู้เล่น" required>
            <Range value={[f.min_players, f.max_players]} onChange={([a, b]) => setF((p) => ({ ...p, min_players: a, max_players: b }))} unit="คน" placeholderMin="ต่ำสุด" placeholderMax="สูงสุด" />
          </Field>
          <Field label="เวลาเล่น" required>
            <Range value={[f.min_play_time, f.max_play_time]} onChange={([a, b]) => setF((p) => ({ ...p, min_play_time: a, max_play_time: b }))} unit="นาที" placeholderMin="ต่ำสุด" placeholderMax="สูงสุด" />
          </Field>
          <Field label="อายุที่แนะนำ (ปีขึ้นไป)" required>
            <input type="number" min="0" placeholder="เช่น 8" {...bind('min_age')} style={inputStyle} />
          </Field>
          <Field label="แท็ก" hint="คั่นด้วยเครื่องหมายจุลภาค เช่น กลยุทธ์, ครอบครัว">
            <input type="text" placeholder="กลยุทธ์, ครอบครัว" {...bind('tags')} style={inputStyle} />
          </Field>
        </div>

        <div>
          {/* ใหม่: รูปปกเกม */}
          <Field label="รูปปกเกม" hint="JPG, PNG, WEBP ไม่เกิน 3MB">
            {f.cover_url && (
              <Cover
                game={{ ...(editing ?? {}), name: f.name || 'เกม', slug: editing?.slug, cover_url: f.cover_url }}
                className="mb-2.5 h-56 w-full"
                showBadge={false}
              />
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <label style={{ padding: '10px 16px', borderRadius: 10, background: '#e0f2fe', color: '#0369a1', fontWeight: 700, cursor: uploading ? 'wait' : 'pointer' }}>
                {uploading ? 'กำลังอัปโหลด…' : f.cover_url ? 'เปลี่ยนรูป' : 'เลือกรูป'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickImage} disabled={uploading} style={{ display: 'none' }} />
              </label>
              {f.cover_url && (
                <button type="button" onClick={() => set('cover_url')('')} style={{ padding: '10px 16px', border: 0, borderRadius: 10, background: '#fee2e2', color: '#b91c1c', fontWeight: 700, cursor: 'pointer' }}>
                  ลบรูป
                </button>
              )}
            </div>
          </Field>
          <Field label="รายละเอียดเกม" required>
            <textarea rows={5} placeholder="อธิบายเกมและจุดเด่น..." {...bind('description')} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
          <Field label="วิธีเล่น" hint="1 บรรทัด = 1 ขั้นตอน">
            <textarea rows={5} placeholder={'ขั้นตอนที่ 1\nขั้นตอนที่ 2'} {...bind('how_to_play')} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
          <Field label="จุดเด่น" hint="1 บรรทัด = 1 ข้อ">
            <textarea rows={3} placeholder="เล่นง่าย สนุกกับทุกวัย" {...bind('highlights')} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569', cursor: 'pointer' }}>
            <input type="checkbox" checked={f.is_recommended} onChange={(e) => set('is_recommended')(e.target.checked)} style={{ width: 16, height: 16, accentColor: ORANGE }} />
            แสดงเป็นเกมแนะนำ
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap' }}>
        <button type="submit" disabled={saving || uploading} style={{ flex: '2 1 220px', padding: '14px 20px', border: 0, borderRadius: 12, background: saving || uploading ? '#fdba74' : ORANGE, color: '#fff', fontSize: 16, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', boxShadow: '0 4px 10px rgba(249,115,22,.35)' }}>
          {saving ? 'กำลังบันทึก…' : 'บันทึกข้อมูล'}
        </button>
        <button type="button" onClick={onCancel} style={{ flex: '1 1 140px', padding: '14px 20px', border: 0, borderRadius: 12, background: '#eef2f7', color: NAVY, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
          ยกเลิก
        </button>
      </div>
    </form>
  )
}

/* ---------- แท็บ: แก้ไข/ลบเกม ---------- */
function GameList({ games, categories, loading, onEdit, onDelete }) {
  const [q, setQ] = useState('')
  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.slug, c.name_th])), [categories])
  const shown = games.filter((g) => g.name.toLowerCase().includes(q.trim().toLowerCase()))
  const th = { textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }
  const td = { padding: '12px', fontSize: 14, color: NAVY, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }

  return (
    <div>
      <h1 style={{ margin: '0 0 20px', fontSize: 28, fontWeight: 800, color: NAVY }}>แก้ไข/ลบเกม</h1>
      <input type="search" placeholder="ค้นหาชื่อเกม…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, maxWidth: 360, marginBottom: 16 }} onFocus={focus} onBlur={blur} />
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>รูป</th>
              <th style={th}>ชื่อเกม</th>
              <th style={th}>หมวดหมู่</th>
              <th style={th}>ผู้เล่น</th>
              <th style={th}>เวลา (นาที)</th>
              <th style={th}>อายุ</th>
              <th style={{ ...th, textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((g) => (
              <tr key={g.id}>
                <td style={td}>
                  <Cover game={g} className="h-11 w-11" showBadge={false} />
                </td>
                <td style={{ ...td, fontWeight: 700 }}>{g.name}</td>
                <td style={td}>{catName[g.category] ?? g.category}</td>
                <td style={td}>{g.min_players === g.max_players ? g.min_players : `${g.min_players}-${g.max_players}`}</td>
                <td style={td}>{g.min_play_time === g.max_play_time ? g.min_play_time : `${g.min_play_time}-${g.max_play_time}`}</td>
                <td style={td}>{g.min_age}+</td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button type="button" onClick={() => onEdit(g)} style={{ marginRight: 8, padding: '7px 14px', border: 0, borderRadius: 8, background: '#e0f2fe', color: '#0369a1', fontWeight: 700, cursor: 'pointer' }}>
                    แก้ไข
                  </button>
                  <button type="button" onClick={() => onDelete(g)} style={{ padding: '7px 14px', border: 0, borderRadius: 8, background: '#fee2e2', color: '#b91c1c', fontWeight: 700, cursor: 'pointer' }}>
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
            {!loading && shown.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: 'center', color: '#64748b' }}>
                  ไม่พบเกม
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: 'center', color: '#64748b' }}>
                  กำลังโหลด…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------- แท็บ: ประวัติการเข้าใช้งาน (ดูอย่างเดียว) ---------- */
const AVATAR_COLORS = ['#fb923c', '#38bdf8', '#a78bfa', '#34d399', '#f472b6', '#facc15']

function ago(iso) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'เมื่อสักครู่'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`
  return `${Math.floor(h / 24)} วันที่แล้ว`
}

const fmtDate = (iso) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

function deviceOf(ua = '') {
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac OS/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'ไม่ทราบระบบ'
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'เบราว์เซอร์อื่น'
  return `${browser} · ${os}`
}

function pageList(cur, total) {
  const nums = [...new Set([1, total, cur - 1, cur, cur + 1])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  nums.forEach((p, i) => {
    if (i > 0 && p - nums[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

function StatCard({ label, value, hint, bg, color }) {
  return (
    <div style={{ padding: '16px 18px', borderRadius: 16, background: bg, border: '1px solid rgba(15,31,75,.06)' }}>
      <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color }}>{value}</p>
      {hint && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{hint}</p>}
    </div>
  )
}

function Badge({ bg, color, children }) {
  return (
    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: bg, color, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function LoginLogs() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [tick, setTick] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // หน่วงการค้นหาเล็กน้อย ไม่ยิง API ทุกตัวอักษร
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('q', search)
    if (status) params.set('status', status)
    if (role) params.set('role', role)

    api(`/api/admin/login-logs?${params}`)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [search, status, role, page, limit, tick])

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const stats = data?.stats
  const pages = Math.max(1, Math.ceil(total / limit))

  const th = { textAlign: 'left', padding: '12px', fontSize: 13, fontWeight: 700, color: '#475569', background: '#eef2fb', whiteSpace: 'nowrap' }
  const td = { padding: '11px 12px', fontSize: 14, color: NAVY, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }
  const select = { ...inputStyle, width: 'auto', padding: '10px 14px', borderRadius: 12 }
  const pageBtn = (active, disabled) => ({
    minWidth: 36,
    height: 36,
    padding: '0 10px',
    borderRadius: 10,
    border: active ? 0 : '1px solid #e2e8f0',
    background: active ? '#2563eb' : '#fff',
    color: active ? '#fff' : NAVY,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  })

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: NAVY }}>ประวัติการเข้าใช้งาน</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>ดูว่าใครเข้าสู่ระบบเมื่อไหร่ (ดูอย่างเดียว ไม่สามารถแก้ไขได้)</p>
        </div>
        <button type="button" onClick={() => setTick((n) => n + 1)} style={{ padding: '10px 18px', borderRadius: 999, border: '1.5px solid #e2e8f0', background: '#fff', color: NAVY, fontWeight: 700, cursor: 'pointer' }}>
          ↻ รีเฟรช
        </button>
      </div>

      {/* สถิติ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard label="เข้าสู่ระบบวันนี้" value={stats ? `${stats.logins_today} ครั้ง` : '–'} bg="#eff6ff" color="#1d4ed8" />
        <StatCard label="ผู้ใช้ที่เข้าวันนี้" value={stats ? `${stats.unique_today} คน` : '–'} hint="ไม่นับซ้ำ" bg="#ecfdf5" color="#047857" />
        <StatCard label="เข้าไม่สำเร็จวันนี้" value={stats ? `${stats.failed_today} ครั้ง` : '–'} bg="#fef2f2" color="#b91c1c" />
        <StatCard label="เข้าใช้งานล่าสุด" value={stats?.last_login_at ? ago(stats.last_login_at) : '–'} bg="#fff7ed" color="#c2410c" />
      </div>

      {/* ค้นหา / ตัวกรอง */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาชื่อผู้ใช้หรืออีเมล…"
          style={{ ...inputStyle, flex: '1 1 260px', borderRadius: 12 }}
          onFocus={focus}
          onBlur={blur}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} style={select} aria-label="กรองตามผลการเข้าสู่ระบบ">
          <option value="">ผลทั้งหมด</option>
          <option value="success">สำเร็จ</option>
          <option value="failed">ไม่สำเร็จ</option>
        </select>
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} style={select} aria-label="กรองตามบทบาท">
          <option value="">บทบาททั้งหมด</option>
          <option value="admin">ผู้ดูแลระบบ</option>
          <option value="member">สมาชิกทั่วไป</option>
        </select>
      </div>

      {error && (
        <div role="alert" style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* ตาราง */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>ผู้ใช้</th>
              <th style={th}>อีเมล</th>
              <th style={th}>บทบาท</th>
              <th style={th}>ผล</th>
              <th style={th}>เวลา</th>
              <th style={th}>IP</th>
              <th style={th}>อุปกรณ์</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id}>
                <td style={td}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                    <span
                      aria-hidden="true"
                      style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: '50%', background: AVATAR_COLORS[l.username.charCodeAt(0) % AVATAR_COLORS.length], color: '#fff', fontSize: 14 }}
                    >
                      {l.username.slice(0, 1).toUpperCase()}
                    </span>
                    {l.username}
                  </span>
                </td>
                <td style={{ ...td, color: '#475569' }}>{l.email || '–'}</td>
                <td style={td}>
                  {l.role === 'admin' ? (
                    <Badge bg="#fff4d6" color="#b45309">👑 ผู้ดูแลระบบ</Badge>
                  ) : l.role === 'member' ? (
                    <Badge bg="#e0eaff" color="#1d4ed8">สมาชิกทั่วไป</Badge>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>–</span>
                  )}
                </td>
                <td style={td}>
                  {l.success ? (
                    <span style={{ color: '#047857', fontWeight: 700 }}>● สำเร็จ</span>
                  ) : (
                    <span style={{ color: '#b91c1c', fontWeight: 700 }}>● ไม่สำเร็จ</span>
                  )}
                </td>
                <td style={td} title={fmtDate(l.created_at)}>
                  <div>{ago(l.created_at)}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{fmtDate(l.created_at)}</div>
                </td>
                <td style={{ ...td, fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>{l.ip || '–'}</td>
                <td style={{ ...td, color: '#475569' }} title={l.user_agent}>{deviceOf(l.user_agent)}</td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: 'center', color: '#64748b' }}>กำลังโหลด…</td>
              </tr>
            )}
            {!loading && !error && items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: 'center', color: '#64748b' }}>ยังไม่มีประวัติการเข้าใช้งาน</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* แบ่งหน้า */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569' }}>
          แสดงผลต่อหน้า
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }} style={select}>
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} รายการ</option>
            ))}
          </select>
          <span style={{ color: '#64748b' }}>ทั้งหมด {total} รายการ</span>
        </label>

        <nav aria-label="เลือกหน้า" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button type="button" style={pageBtn(false, page <= 1)} disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="หน้าก่อนหน้า">‹</button>
          {pageList(page, pages).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} style={{ color: '#94a3b8', padding: '0 4px' }}>…</span>
            ) : (
              <button key={p} type="button" style={pageBtn(p === page, false)} onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined}>{p}</button>
            ),
          )}
          <button type="button" style={pageBtn(false, page >= pages)} disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="หน้าถัดไป">›</button>
        </nav>
      </div>
    </div>
  )
}

/* ---------- หน้าแอดมิน ---------- */
export default function Admin() {
  const { user } = getAuth()
  const [tab, setTab] = useState('add') // 'add' | 'list' | 'logs'
  const [editing, setEditing] = useState(null)
  const [games, setGames] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [g, c] = await Promise.all([api('/api/games'), api('/api/categories')])
      setGames(g)
      setCategories(c)
    } catch (err) {
      setNotice(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'จัดการเกม | BoardGame Catalog'
    load()
  }, [load])

  if (user?.role !== 'admin') {
    return (
      <div style={{ background: '#fff8f0', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ color: NAVY, fontSize: 28, fontWeight: 800 }}>ไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
        <p style={{ color: '#475569' }}>หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
        <Link to={user ? '/' : '/login'} style={{ color: ORANGE, fontWeight: 700 }}>
          {user ? 'กลับหน้าแรก' : 'เข้าสู่ระบบ'}
        </Link>
      </div>
    )
  }

  async function handleDelete(g) {
    if (!window.confirm(`ต้องการลบเกม "${g.name}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`)) return
    try {
      await api(`/api/admin/games/${g.id}`, { method: 'DELETE' })
      setNotice(`ลบ "${g.name}" แล้ว`)
      load()
    } catch (err) {
      setNotice(err.message)
    }
  }

  const goTab = (t) => {
    setTab(t)
    setEditing(null)
    setNotice('')
  }

  const navBtn = (active) => ({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '12px 16px',
    marginBottom: 6,
    border: 0,
    borderRadius: 10,
    background: active ? '#2563eb' : 'transparent',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  })

  return (
    <div style={{ background: '#fff8f0', padding: '32px 24px 64px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexWrap: 'wrap', overflow: 'hidden', borderRadius: 20, background: '#fffdf9', boxShadow: '0 16px 36px rgba(15,31,75,.15)', minHeight: 560 }}>
        {/* เมนูด้านซ้าย */}
        <aside style={{ flex: '0 0 230px', padding: '28px 16px', background: NAVY_GRAD }}>
          <p style={{ margin: '0 8px 18px', fontSize: 13, color: 'rgba(255,255,255,.6)' }}>จัดการเกม</p>
          <button type="button" style={navBtn(tab === 'add' && !editing)} onClick={() => goTab('add')}>
            ＋ เพิ่มเกมใหม่
          </button>
          <button type="button" style={navBtn(tab === 'list' || !!editing)} onClick={() => goTab('list')}>
            ✎ แก้ไข/ลบเกม
          </button>
          <button type="button" style={navBtn(tab === 'logs' && !editing)} onClick={() => goTab('logs')}>
            ▤ ประวัติการเข้าใช้งาน
          </button>
        </aside>

        {/* เนื้อหา */}
        <main style={{ flex: '1 1 480px', minWidth: 0, padding: '32px 36px' }}>
          {notice && tab !== 'logs' && (
            <div role="status" style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 12, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: 14 }}>
              {notice}
            </div>
          )}

          {tab === 'add' && !editing && <GameForm key="new" categories={categories} onCancel={() => goTab('list')} onSaved={(m) => { setNotice(m); load(); setTab('list') }} />}

          {editing && <GameForm key={editing.id} categories={categories} editing={editing} onCancel={() => goTab('list')} onSaved={(m) => { setEditing(null); setTab('list'); setNotice(m); load() }} />}

          {tab === 'list' && !editing && <GameList games={games} categories={categories} loading={loading} onEdit={(g) => { setNotice(''); setEditing(g) }} onDelete={handleDelete} />}

          {tab === 'logs' && !editing && <LoginLogs />}
        </main>
      </div>
    </div>
  )
}

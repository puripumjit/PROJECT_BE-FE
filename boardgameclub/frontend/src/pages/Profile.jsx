import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Heart, LogOut, Lock, Eye, EyeOff, Save, Star, Clock } from 'lucide-react'

const API = import.meta.env.VITE_API_URL ?? 'https://project-be-fe-clsv.onrender.com'

/* ---------- helpers ---------- */
function getAuth() {
  try {
    const store = localStorage.getItem('token') ? localStorage : sessionStorage
    const raw = store.getItem('user')
    return { token: store.getItem('token'), user: raw ? JSON.parse(raw) : null, store }
  } catch {
    return { token: null, user: null, store: localStorage }
  }
}

async function api(path, { method = 'GET', body } = {}) {
  const { token } = getAuth()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `เกิดข้อผิดพลาด (HTTP ${res.status})`)
  return data
}

function ago(iso) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'เมื่อสักครู่'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชม.ที่แล้ว`
  return `${Math.floor(h / 24)} วันที่แล้ว`
}

const inputCls =
  'w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-[15px] text-[#0f1f4b] outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 placeholder:text-slate-400'

/* ---------- ส่วนประกอบเล็ก ๆ ---------- */
function Alert({ kind, children }) {
  if (!children) return null
  const cls = kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
  return (
    <div role={kind === 'ok' ? 'status' : 'alert'} className={`mb-4 rounded-xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  )
}

function Label({ children, required }) {
  return (
    <label className="mb-1.5 block text-sm font-bold text-[#0f1f4b]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  )
}

function PasswordInput({ value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} className={`${inputCls} pl-10 pr-11`} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0f1f4b]">
        {show ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  )
}

/* ---------- หน้าโปรไฟล์ ---------- */
export default function Profile() {
  const navigate = useNavigate()
  const { token, user: stored } = getAuth()

  const [me, setMe] = useState(stored)
  const [favCount, setFavCount] = useState(null)
  const [name, setName] = useState(stored?.display_name || stored?.username || '')
  const [saving, setSaving] = useState(false)
  const [infoMsg, setInfoMsg] = useState({ kind: '', text: '' })

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState({ kind: '', text: '' })

  useEffect(() => {
    document.title = 'โปรไฟล์ของฉัน | BoardGame Catalog'
    if (!token) return navigate('/login', { replace: true })

    api('/api/me')
      .then((u) => {
        setMe(u)
        setName(u.display_name || u.username || '')
      })
      .catch((e) => {
        // token หมดอายุ → ให้ล็อกอินใหม่
        if (/login required|401/i.test(e.message)) logout()
      })
    api('/api/favorites').then((l) => setFavCount(Array.isArray(l) ? l.length : 0)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!token) return null

  const shownName = me?.display_name || me?.username || name
  const isAdmin = me?.role === 'admin'

  function persist(next) {
    const { store } = getAuth()
    const merged = { ...(me || {}), ...next }
    setMe(merged)
    try { store.setItem('user', JSON.stringify(merged)) } catch { /* ignore */ }
    window.dispatchEvent(new Event('auth-change')) // ให้ Navbar อัปเดตชื่อทันที
  }

  async function saveInfo(e) {
    e.preventDefault()
    setInfoMsg({ kind: '', text: '' })
    const v = name.trim()
    if (v.length < 3) return setInfoMsg({ kind: 'err', text: 'ชื่อที่แสดงต้องมีอย่างน้อย 3 ตัวอักษร' })
    setSaving(true)
    try {
      const u = await api('/api/me', { method: 'PUT', body: { display_name: v } })
      persist({ display_name: u?.display_name ?? v })
      setInfoMsg({ kind: 'ok', text: 'บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว' })
    } catch (err) {
      setInfoMsg({ kind: 'err', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwMsg({ kind: '', text: '' })
    if (!pw.current || !pw.next || !pw.confirm) return setPwMsg({ kind: 'err', text: 'กรุณากรอกรหัสผ่านให้ครบทุกช่อง' })
    if (pw.next.length < 8) return setPwMsg({ kind: 'err', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' })
    if (pw.next !== pw.confirm) return setPwMsg({ kind: 'err', text: 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน' })
    if (pw.next === pw.current) return setPwMsg({ kind: 'err', text: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม' })
    setPwSaving(true)
    try {
      await api('/api/me/password', { method: 'PUT', body: { current_password: pw.current, new_password: pw.next } })
      setPw({ current: '', next: '', confirm: '' })
      setPwMsg({ kind: 'ok', text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' })
    } catch (err) {
      setPwMsg({ kind: 'err', text: err.message })
    } finally {
      setPwSaving(false)
    }
  }

  function logout() {
    ;[localStorage, sessionStorage].forEach((s) => { s.removeItem('token'); s.removeItem('user') })
    navigate('/login')
  }

  const navItem = (active) =>
    `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition ${active ? 'bg-blue-600 text-white' : 'text-white/90 hover:bg-white/10'}`

  return (
    <div className="px-4 pb-16 pt-8 sm:px-6">
      <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[240px_1fr]">
        {/* เมนูซ้าย */}
        <aside className="rounded-3xl bg-gradient-to-b from-[#0b1437] to-[#14275f] p-4 shadow-xl lg:self-start">
          <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col">
            <span className={navItem(true)}><User size={20} /> โปรไฟล์ของฉัน</span>
            <Link to="/favorites" className={navItem(false)}><Heart size={20} /> รายการโปรด</Link>
            {isAdmin && <Link to="/admin" className={navItem(false)}><Star size={20} /> จัดการเกม</Link>}
            <button type="button" onClick={logout} className={navItem(false)}><LogOut size={20} /> ออกจากระบบ</button>
          </nav>
        </aside>

        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#0f1f4b] text-white"><User size={26} /></span>
            <div>
              <h1 className="m-0 text-3xl font-extrabold text-[#0f1f4b]">โปรไฟล์ของฉัน</h1>
              <p className="m-0 text-slate-500">จัดการข้อมูลส่วนตัวของคุณ</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
            {/* การ์ดโปรไฟล์ */}
            <section className="rounded-3xl bg-white p-6 text-center shadow-lg xl:self-start">
              <div
                aria-hidden="true"
                className="mx-auto grid h-40 w-40 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-orange-400 to-orange-600 text-6xl font-bold text-white shadow-lg ring-4 ring-indigo-200"
              >
                {(shownName || '?').slice(0, 1).toUpperCase()}
              </div>
              <h2 className="mt-4 break-words text-2xl font-extrabold text-[#0f1f4b]">{shownName}</h2>
              <span className={`mt-2 inline-block rounded-full px-4 py-1 text-sm font-bold ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {isAdmin ? '👑 ผู้ดูแลระบบ' : 'สมาชิกทั่วไป'}
              </span>

              <div className="mt-5 grid grid-cols-2 divide-x divide-slate-200 rounded-2xl bg-slate-50 py-4">
                <div>
                  <Star size={22} className="mx-auto text-amber-500" />
                  <p className="mt-1 text-2xl font-extrabold text-[#0f1f4b]">{favCount ?? '–'}</p>
                  <p className="text-xs text-slate-500">รายการโปรด</p>
                </div>
                <div>
                  <Clock size={22} className="mx-auto text-blue-600" />
                  <p className="mt-1 text-base font-extrabold leading-8 text-[#0f1f4b]">{me?.last_login_at ? ago(me.last_login_at) : '–'}</p>
                  <p className="text-xs text-slate-500">เข้าใช้งานล่าสุด</p>
                </div>
              </div>
            </section>

            <div className="grid gap-6">
              {/* ข้อมูลส่วนตัว */}
              <form onSubmit={saveInfo} noValidate className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
                <h2 className="mb-5 flex w-fit items-center gap-2 border-b-2 border-orange-500 pb-2 text-lg font-extrabold text-[#0f1f4b]">
                  <User size={20} className="text-blue-600" /> ข้อมูลส่วนตัว
                </h2>
                <Alert kind={infoMsg.kind}>{infoMsg.text}</Alert>

                <div className="mb-4">
                  <Label>ชื่อผู้ใช้ (ใช้เข้าสู่ระบบ)</Label>
                  <div className="relative">
                    <input value={me?.username || ''} readOnly disabled className={`${inputCls} cursor-not-allowed bg-slate-100 pr-36 text-slate-500`} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">ไม่สามารถเปลี่ยนได้</span>
                  </div>
                </div>

                <div className="mb-4">
                  <Label required>ชื่อที่แสดง</Label>
                  <div className="relative">
                    <input value={name} onChange={(e) => setName(e.target.value.slice(0, 50))} maxLength={50} className={`${inputCls} pr-16`} autoComplete="nickname" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">{name.length} / 50</span>
                  </div>
                </div>

                <div className="mb-6">
                  <Label>อีเมล</Label>
                  <div className="relative">
                    <input value={me?.email || ''} readOnly disabled className={`${inputCls} cursor-not-allowed bg-slate-100 pr-36 text-slate-500`} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">ไม่สามารถเปลี่ยนได้</span>
                  </div>
                </div>

                <button type="submit" disabled={saving} className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 text-lg font-bold text-white shadow-[0_5px_0_#d9690c] transition hover:bg-orange-400 active:translate-y-1 active:shadow-[0_1px_0_#d9690c] disabled:cursor-wait disabled:opacity-70">
                  <Save size={20} /> {saving ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </form>

              {/* เปลี่ยนรหัสผ่าน (อยู่หน้าเดียวกัน) */}
              <form onSubmit={changePassword} noValidate className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
                <h2 className="mb-5 flex w-fit items-center gap-2 border-b-2 border-orange-500 pb-2 text-lg font-extrabold text-[#0f1f4b]">
                  <Lock size={20} className="text-blue-600" /> เปลี่ยนรหัสผ่าน
                </h2>
                <Alert kind={pwMsg.kind}>{pwMsg.text}</Alert>

                <div className="mb-4">
                  <Label required>รหัสผ่านปัจจุบัน</Label>
                  <PasswordInput value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} placeholder="กรอกรหัสผ่านปัจจุบัน" autoComplete="current-password" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label required>รหัสผ่านใหม่</Label>
                    <PasswordInput value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="อย่างน้อย 8 ตัวอักษร" autoComplete="new-password" />
                  </div>
                  <div>
                    <Label required>ยืนยันรหัสผ่านใหม่</Label>
                    <PasswordInput value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" autoComplete="new-password" />
                  </div>
                </div>

                <button type="submit" disabled={pwSaving} className="mx-auto mt-6 flex w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-[#0f1f4b] px-6 py-3.5 text-lg font-bold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-70">
                  <Lock size={20} /> {pwSaving ? 'กำลังเปลี่ยนรหัสผ่าน…' : 'เปลี่ยนรหัสผ่าน'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

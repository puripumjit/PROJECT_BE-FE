import { useEffect, useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL ?? ''
// ปรับ path ให้ตรงกับ backend ของคุณ (คาดว่าส่ง { email, password } แล้วได้ { token, user } กลับมา)
const LOGIN_URL = `${API}/api/auth/login`

const NAVY_GRAD = 'linear-gradient(160deg,#0b1437 0%,#14275f 55%,#1d3a8a 100%)'
const ORANGE = '#f97316'
const NAVY = '#0f1f4b'

/* ---------- ภาพประกอบ (SVG) ---------- */
const MEEPLE_PATH =
  'M12 2a3 3 0 0 0-3 3c0 .9.4 1.7 1 2.2-2.7.6-5 1.2-8 2.3-.5.2-.5 1 0 1.2 1.6.7 2.6 1.4 3.2 2.3.6 1-.2 2.8-1.7 5.2-.4.7.1 1.8 1 1.8H9c1 0 1.7-.9 2.2-1.9.3-.6.5-.9.8-.9s.5.3.8.9c.5 1 1.2 1.9 2.2 1.9h3.5c.9 0 1.4-1.1 1-1.8-1.5-2.4-2.3-4.2-1.7-5.2.6-.9 1.6-1.6 3.2-2.3.5-.2.5-1 0-1.2-3-1.1-5.3-1.7-8-2.3.6-.5 1-1.3 1-2.2a3 3 0 0 0-3-3z'

const TONES = {
  red: ['#fca5a5', '#ef4444', '#991b1b'],
  blue: ['#93c5fd', '#3b82f6', '#1e40af'],
  yellow: ['#fef08a', '#facc15', '#a16207'],
  green: ['#86efac', '#22c55e', '#166534'],
}

function Meeple({ tone = 'red', ...rest }) {
  const id = useId().replace(/:/g, '')
  const [light, mid, dark] = TONES[tone]
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...rest}>
      <defs>
        <linearGradient id={`m${id}`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.45" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id={`h${id}`} cx="0.32" cy="0.22" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={MEEPLE_PATH} fill={`url(#m${id})`} stroke={dark} strokeWidth="0.35" strokeLinejoin="round" />
      <path d={MEEPLE_PATH} fill={`url(#h${id})`} />
    </svg>
  )
}

function Dice(props) {
  const pip = (x, y) => <circle key={`${x}${y}`} cx={x} cy={y} r="0.085" fill="#0f1f4b" />
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <polygon points="32,6 56,18 32,30 8,18" fill="#fff" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
      <polygon points="8,18 32,30 32,58 8,46" fill="#e2e8f0" stroke="#e2e8f0" strokeWidth="4" strokeLinejoin="round" />
      <polygon points="32,30 56,18 56,46 32,58" fill="#f1f5f9" stroke="#f1f5f9" strokeWidth="4" strokeLinejoin="round" />
      <g transform="matrix(24 12 -24 12 32 6)">{[[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]].map(([x, y]) => pip(x, y))}</g>
      <g transform="matrix(24 12 0 28 8 18)">{[[0.25, 0.22], [0.5, 0.5], [0.75, 0.78]].map(([x, y]) => pip(x, y))}</g>
      <g transform="matrix(24 -12 0 28 32 30)">{[[0.28, 0.28], [0.72, 0.72]].map(([x, y]) => pip(x, y))}</g>
    </svg>
  )
}

function Icon({ d, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const ICON = {
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M17.9 17.9A10.1 10.1 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M1 1l22 22',
}

/* ---------- ช่องกรอกข้อมูล ---------- */
function Field({ label, icon, right, ...input }) {
  const id = useId()
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 700, color: NAVY }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'inline-flex' }}>
          <Icon d={icon} />
        </span>
        <input
          id={id}
          {...input}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: right ? '13px 46px 13px 44px' : '13px 14px 13px 44px',
            borderRadius: 12,
            border: '1.5px solid #e2e8f0',
            background: '#fff',
            fontSize: 15,
            color: NAVY,
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = ORANGE)}
          onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
        />
        {right && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>{right}</span>}
      </div>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'เข้าสู่ระบบ | BoardGame Catalog'
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่านให้ครบ')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      if (data.token) (remember ? localStorage : sessionStorage).setItem('token', data.token)
      navigate('/')
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#fff8f0', minHeight: '70vh', padding: '40px 24px 64px' }}>
      <div
        style={{
          maxWidth: 940,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          overflow: 'hidden',
          borderRadius: 24,
          background: '#fff',
          boxShadow: '0 20px 40px rgba(15,31,75,.15)',
        }}
      >
        {/* ฝั่งซ้าย: ภาพประกอบ */}
        <div
          style={{
            flex: '1 1 320px',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 360,
            padding: '44px 40px',
            background: NAVY_GRAD,
            color: '#fff',
          }}
        >
          <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(249,115,22,.3)', filter: 'blur(50px)' }} aria-hidden="true" />
          <div style={{ position: 'absolute', left: -40, bottom: 80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(56,189,248,.22)', filter: 'blur(50px)' }} aria-hidden="true" />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.3, fontWeight: 800 }}>
              ยินดีต้อนรับ<span style={{ color: ORANGE }}>กลับมา</span>
            </h1>
            <p style={{ margin: '12px 0 0', maxWidth: 300, fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,.85)' }}>
              เข้าสู่ระบบเพื่อดูรายการโปรด และค้นหาบอร์ดเกมที่ใช่สำหรับคุณ
            </p>
          </div>

          <div style={{ position: 'absolute', left: 24, right: 24, bottom: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} aria-hidden="true">
            <Dice style={{ width: 64, height: 64, marginRight: 4, marginBottom: 4 }} />
            <Meeple tone="red" style={{ width: 80, height: 80, filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.35))' }} />
            <Meeple tone="blue" style={{ width: 112, height: 112, marginLeft: -14, filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.35))' }} />
            <Meeple tone="yellow" style={{ width: 92, height: 92, marginLeft: -14, filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.35))' }} />
            <Meeple tone="green" style={{ width: 104, height: 104, marginLeft: -14, filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.35))' }} />
          </div>
        </div>

        {/* ฝั่งขวา: ฟอร์ม */}
        <form onSubmit={handleSubmit} noValidate style={{ flex: '1 1 340px', padding: '44px 40px' }}>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: NAVY }}>เข้าสู่ระบบ</h2>
          <span style={{ display: 'block', margin: '8px 0 28px', height: 4, width: 48, borderRadius: 4, background: ORANGE }} aria-hidden="true" />

          {error && (
            <div role="alert" style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 14 }}>
              {error}
            </div>
          )}

          <Field label="อีเมล" icon={ICON.mail} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />

          <Field
            label="รหัสผ่าน"
            icon={ICON.lock}
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="รหัสผ่านของคุณ"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            right={
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                style={{ border: 0, background: 'transparent', padding: 8, cursor: 'pointer', color: '#64748b', display: 'inline-flex' }}
              >
                <Icon d={show ? ICON.eyeOff : ICON.eye} />
              </button>
            }
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, fontSize: 14, color: '#475569', cursor: 'pointer' }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: ORANGE }} />
            จดจำฉันไว้ในเครื่องนี้
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 20px',
              border: 0,
              borderRadius: 12,
              background: loading ? '#fdba74' : ORANGE,
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 4px 10px rgba(249,115,22,.4)',
            }}
          >
            {loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>

          <p style={{ margin: '22px 0 0', textAlign: 'center', fontSize: 14, color: '#475569' }}>
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" style={{ fontWeight: 700, color: ORANGE, textDecoration: 'none' }}>
              สมัครสมาชิก
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

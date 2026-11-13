import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Home, LayoutGrid, Heart, Users } from 'lucide-react'

const links = [
  { label: 'หน้าแรก', to: '/', Icon: Home },
  { label: 'หมวดหมู่', to: '/categories', Icon: LayoutGrid },
  { label: 'รายการโปรด', to: '/favorites', Icon: Heart },
  { label: 'เกี่ยวกับเรา', to: '/about', Icon: Users },
]

/* ---------- สถานะล็อกอิน (Login.jsx เก็บ token + user ไว้ใน storage) ---------- */
function readUser() {
  try {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    return token && raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function useAuth() {
  const navigate = useNavigate()
  const [user, setUser] = useState(readUser)

  useEffect(() => {
    const sync = () => setUser(readUser())
    window.addEventListener('auth-change', sync) // ล็อกอิน/ออกในแท็บนี้
    window.addEventListener('storage', sync) // ล็อกอิน/ออกจากแท็บอื่น
    return () => {
      window.removeEventListener('auth-change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const logout = () => {
    ;['token', 'user'].forEach((k) => {
      localStorage.removeItem(k)
      sessionStorage.removeItem(k)
    })
    window.dispatchEvent(new Event('auth-change'))
    navigate('/')
  }

  return { user, logout }
}

function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const name = user.display_name || user.username

  // ปิดเมนูเมื่อคลิกข้างนอก หรือกด Esc
  useEffect(() => {
    if (!open) return
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const item = { display: 'block', width: '100%', boxSizing: 'border-box', padding: '10px 16px', textAlign: 'left', border: 0, background: 'transparent', fontSize: 14, fontWeight: 600, color: '#0f1f4b', textDecoration: 'none', cursor: 'pointer' }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-label={`เมนูของ ${name}`}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold transition hover:bg-white/10"
        style={{ border: 0, background: 'transparent', color: '#fff', cursor: 'pointer' }}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-base font-extrabold text-white" aria-hidden="true">
          {name.charAt(0).toUpperCase()}
        </span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 50, width: 230, overflow: 'hidden', borderRadius: 14, background: '#fff', boxShadow: '0 12px 30px rgba(15,31,75,.3)' }}>
          <div style={{ padding: '14px 16px', background: '#fff8f0', borderBottom: '1px solid #f1e6d8' }}>
            <p style={{ margin: 0, fontWeight: 800, color: '#0f1f4b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
            {user.email && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>}
          </div>

          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)} style={item}>
            โปรไฟล์ของฉัน
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin" role="menuitem" onClick={() => setOpen(false)} style={item}>
              จัดการเกม
            </Link>
          )}

          <Link to="/favorites" role="menuitem" onClick={() => setOpen(false)} style={item}>
            รายการโปรดของฉัน
          </Link>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); logout() }} style={{ ...item, color: '#dc2626', borderTop: '1px solid #f1f5f9' }}>
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  )
}

function Logo() {
  return <img src="/logo.png" alt="" className="h-11 w-11 object-contain" />
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <header className="bg-navy text-white">
      <nav className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4" aria-label="เมนูหลัก">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <Logo />
          <span className="text-lg font-bold leading-tight">BoardGame<br />Club</span>
        </Link>

        <ul className="ml-4 hidden items-center gap-8 lg:flex">
          {links.map(({ label, to, Icon }) => (
            <li key={to}>
              <NavLink to={to} end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 border-b-2 py-2 text-sm font-medium transition hover:text-white ${isActive ? 'border-brand text-white' : 'border-transparent text-white/80'
                  }`}>
                <Icon size={18} fill="currentColor" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <UserMenu user={user} logout={logout} />
            </>
          ) : (
            <>
              <Link to="/login"
                className="rounded-full border border-white/50 px-4 py-2 text-sm font-medium transition hover:bg-white/10">
                เข้าสู่ระบบ
              </Link>
              <Link to="/register"
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold transition hover:bg-brand-dark">
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>

        <button type="button" aria-label="เปิดเมนู" aria-expanded={open} aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10 md:hidden">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="space-y-3 border-t border-white/15 px-6 pb-5 pt-4 md:hidden">
          <div>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-white/90 hover:bg-white/10">
                {l.label}
              </NavLink>
            ))}
          </div>
          {user ? (
            <div className="flex justify-end">
              <UserMenu user={user} logout={logout} />
            </div>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-white/50 py-2 text-center text-sm font-medium">
                เข้าสู่ระบบ
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}
                className="flex-1 rounded-full bg-brand py-2 text-center text-sm font-semibold">
                สมัครสมาชิก
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

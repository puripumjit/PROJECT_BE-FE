import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

const links = [
  { label: 'หน้าแรก', to: '/' },
  { label: 'หมวดหมู่', to: '/categories' },
  { label: 'รายการโปรด', to: '/favorites' },
  { label: 'เกี่ยวกับเรา', to: '/about' },
]

function SearchForm({ id }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    navigate(`/games?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <form onSubmit={onSubmit} role="search"
          className="flex w-full items-center rounded-full bg-white p-1 pl-4 text-slate-500">
      <label htmlFor={id} className="sr-only">ค้นหาชื่อเกม</label>
      <input id={id} type="search" value={q} onChange={(e) => setQ(e.target.value)}
             placeholder="ค้นหาชื่อเกม..."
             className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
      <button type="submit" aria-label="ค้นหา"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"
             strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
        </svg>
      </button>
    </form>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true">
      <rect x="4" y="4" width="40" height="40" rx="10" fill="#f7931e" />
      <rect x="11" y="11" width="26" height="26" rx="6" fill="#fff" />
      {[[18, 18], [30, 18], [24, 24], [18, 30], [30, 30]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="#11224f" />
      ))}
    </svg>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-navy text-white">
      <nav className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4" aria-label="เมนูหลัก">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <Logo />
          <span className="text-lg font-bold leading-tight">BoardGame<br />Catalog</span>
        </Link>

        <ul className="ml-4 hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.to === '/'}
                className={({ isActive }) =>
                  `block border-b-2 py-2 text-sm font-medium transition hover:text-white ${
                    isActive ? 'border-white text-white' : 'border-transparent text-white/80'
                  }`}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden w-64 md:block">
          <SearchForm id="nav-search" />
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login"
                className="rounded-full border border-white/50 px-4 py-2 text-sm font-medium transition hover:bg-white/10">
            เข้าสู่ระบบ
          </Link>
          <Link to="/register"
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold transition hover:bg-brand-dark">
            สมัครสมาชิก
          </Link>
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
          <SearchForm id="nav-search-m" />
          <div>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setOpen(false)}
                       className="block rounded-lg px-3 py-2 text-white/90 hover:bg-white/10">
                {l.label}
              </NavLink>
            ))}
          </div>
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
        </div>
      )}
    </header>
  )
}
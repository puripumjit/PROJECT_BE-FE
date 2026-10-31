import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL ?? ''

const COVERS = [
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-700',
  'from-sky-400 to-indigo-600',
  'from-rose-400 to-red-700',
  'from-violet-400 to-purple-700',
  'from-lime-400 to-green-700',
]

const checkJson = (r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}
const range = (min, max, unit) => (min === max ? `${min} ${unit}` : `${min}-${max} ${unit}`)

/* ---------- รายการโปรด (คีย์เดียวกับหน้ารายละเอียดเกม) ---------- */
const FAV_KEY = 'bg_favorites'
const readFavs = () => {
  try {
    const v = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
const writeFavs = (list) => {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

function Svg({ d, className = 'h-4 w-4', fill = 'none' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const ICON = {
  players: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  time: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  play: 'M5 3l14 9-14 9z',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6',
}

function FavCard({ game, onRemove }) {
  return (
    <li className="flex flex-col rounded-3xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
      <Link
        to={`/games/${game.slug}`}
        className={`grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br text-5xl font-bold text-white/90 ${
          COVERS[(Number(game.id) || 0) % COVERS.length]
        }`}
        aria-label={`ดูรายละเอียด ${game.name}`}
      >
        {game.image_url ? (
          <img src={game.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true">{game.name.slice(0, 2)}</span>
        )}
      </Link>

      <div className="mt-3 flex-1 px-1">
        <h2 className="truncate text-lg font-bold text-navy">{game.name}</h2>
        <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Svg d={ICON.players} className="h-4 w-4 text-sky-600" />
            {range(game.min_players, game.max_players, 'คน')}
          </span>
          <span className="flex items-center gap-1.5">
            <Svg d={ICON.time} className="h-4 w-4 text-slate-400" />
            {range(game.min_play_time, game.max_play_time, 'นาที')}
          </span>
        </p>
        {game.description && <p className="mt-2 truncate text-sm text-slate-600">{game.description}</p>}
      </div>

      <div className="mt-4 flex gap-2.5">
        <Link
          to={`/games/${game.slug}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-sky-50 py-2.5 text-sm font-bold text-navy transition hover:bg-sky-100"
        >
          <Svg d={ICON.play} className="h-3.5 w-3.5 text-sky-600" fill="currentColor" />
          ดูรายละเอียด
        </Link>
        <button
          type="button"
          onClick={() => onRemove(game.slug)}
          aria-label={`ลบ ${game.name} ออกจากรายการโปรด`}
          title="ลบออกจากรายการโปรด"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500 transition hover:bg-rose-100 active:scale-90"
        >
          <Svg d={ICON.trash} className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}

export default function Favorites() {
  const [slugs, setSlugs] = useState(readFavs)
  const [state, setState] = useState({ status: 'loading', games: [] })

  useEffect(() => {
    document.title = 'รายการโปรด | BoardGame Catalog'
    const ctrl = new AbortController()
    fetch(`${API}/api/games`, { signal: ctrl.signal })
      .then(checkJson)
      .then((games) => setState({ status: 'ready', games }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ status: 'error', games: [] })
      })
    return () => ctrl.abort()
  }, [])

  // ซิงก์กับแท็บอื่นที่เปิดอยู่
  useEffect(() => {
    const sync = () => setSlugs(readFavs())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const remove = (slug) => {
    const next = slugs.filter((s) => s !== slug)
    setSlugs(next)
    writeFavs(next)
  }

  const clearAll = () => {
    if (!window.confirm('ลบเกมทั้งหมดออกจากรายการโปรด?')) return
    setSlugs([])
    writeFavs([])
  }

  // เกมที่เพิ่งเพิ่มล่าสุดอยู่ก่อน
  const items = [...slugs]
    .reverse()
    .map((s) => state.games.find((g) => g.slug === s))
    .filter(Boolean)

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 pt-8">
      {/* หัวข้อ */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-navy">รายการโปรด</h1>
          <p className="mt-1.5 text-lg text-slate-600">เกมที่คุณชื่นชอบ เก็บไว้เล่นได้ทุกเมื่อ</p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-2 rounded-full border-2 border-rose-200 bg-white px-5 py-2.5 text-sm font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <Svg d={ICON.trash} className="h-4 w-4" />
            ลบทั้งหมด
          </button>
        )}
      </header>

      <div className="mt-7">
        {state.status === 'loading' ? (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="h-80 animate-pulse rounded-3xl bg-slate-200/70" />
            ))}
          </ul>
        ) : state.status === 'error' ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100">
            <p className="text-lg font-semibold text-navy">เชื่อมต่อเซิร์ฟเวอร์ไม่ได้</p>
            <p className="mt-2 text-slate-500">ตรวจสอบว่า backend และฐานข้อมูลเปิดอยู่ แล้วลองรีเฟรชหน้านี้</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100">
            <p className="text-lg font-semibold text-navy">ยังไม่มีเกมในรายการโปรด</p>
            <p className="mt-2 text-slate-500">กด "เพิ่มในรายการโปรด" ในหน้าเกมที่ชอบ เพื่อเก็บไว้ที่นี่</p>
            <Link
              to="/categories"
              className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 font-bold text-white hover:bg-brand-dark"
            >
              ดูเกมทั้งหมด
            </Link>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((g) => (
              <FavCard key={g.slug} game={g} onRemove={remove} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

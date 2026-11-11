import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Cover from '../components/Cover.jsx'

// ถ้าตั้ง proxy ใน vite.config.js ให้ปล่อยว่างไว้ (เรียก /api/... ได้เลย)
// ถ้าไม่ใช้ proxy ให้สร้างไฟล์ .env แล้วใส่ VITE_API_URL=http://localhost:8080
const API = import.meta.env.VITE_API_URL ?? ''
const PAGE_SIZE = 10

const PLAYER_OPTIONS = [
  { id: 'p2', label: '2 คน', min: 2, max: 2 },
  { id: 'p34', label: '3-4 คน', min: 3, max: 4 },
  { id: 'p56', label: '5-6 คน', min: 5, max: 6 },
  { id: 'p7', label: '7+ คน', min: 7, max: Infinity },
]
const TIME_OPTIONS = [
  { id: 't30', label: 'ไม่เกิน 30 นาที', min: 0, max: 30 },
  { id: 't60', label: '30-60 นาที', min: 30, max: 60 },
  { id: 't120', label: '60-120 นาที', min: 60, max: 120 },
  { id: 't120p', label: 'มากกว่า 120 นาที', min: 121, max: Infinity },
]
const AGE_OPTIONS = [
  { id: 'a8', label: 'ไม่เกิน 8 ปี', min: 0, max: 8 },
  { id: 'a12', label: '8-12 ปี', min: 8, max: 12 },
  { id: 'a13', label: '13+ ปี', min: 13, max: Infinity },
]

const SORTS = {
  recommended: {
    label: 'แนะนำ',
    fn: (a, b) => Number(b.is_recommended) - Number(a.is_recommended) || a.name.localeCompare(b.name),
  },
  name: { label: 'ชื่อเกม A-Z', fn: (a, b) => a.name.localeCompare(b.name) },
  time: { label: 'เวลาเล่นน้อยไปมาก', fn: (a, b) => a.min_play_time - b.min_play_time },
  players: { label: 'จำนวนผู้เล่นมากสุด', fn: (a, b) => b.max_players - a.max_players },
}

const TAG_STYLES = [
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
]

const ICONS = {
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.35-4.35',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
  users: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
  smile: 'M12 3a9 9 0 100 18 9 9 0 000-18zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  chevron: 'M6 9l6 6 6-6',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  sort: 'M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3',
  heart: 'M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z',
}

function Icon({ name, className = 'h-5 w-5', fill = 'none' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill} stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

const EMPTY_FILTERS = { categories: [], players: [], time: [], age: [] }

const checkJson = (r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

const range = (min, max) => (min === max ? `${min}` : `${min}-${max}`)

function matchesGroup(selectedIds, options, test) {
  if (selectedIds.length === 0) return true
  return options.some((o) => selectedIds.includes(o.id) && test(o))
}

function gameMatches(g, f) {
  const overlap = (gMin, gMax) => (o) => gMin <= o.max && gMax >= o.min
  return (
    (f.categories.length === 0 || f.categories.includes(g.category)) &&
    matchesGroup(f.players, PLAYER_OPTIONS, overlap(g.min_players, g.max_players)) &&
    matchesGroup(f.time, TIME_OPTIONS, overlap(g.min_play_time, g.max_play_time)) &&
    matchesGroup(f.age, AGE_OPTIONS, (o) => g.min_age >= o.min && g.min_age <= o.max)
  )
}

/* ปุ่มตัวกรองแบบ dropdown (กดแล้วมีเมนู checkbox ลงมา) */
function FilterDropdown({ label, icon, options, selected, onToggle }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-sm ring-1 transition ${
          selected.length ? 'text-brand-dark ring-brand' : 'text-navy ring-slate-100 hover:ring-slate-200'
        }`}
      >
        <Icon name={icon} className="h-5 w-5 text-navy" />
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs text-white">
            {selected.length}
          </span>
        )}
        <Icon name="chevron" className={`h-4 w-4 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 max-h-80 w-64 overflow-auto rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-100">
          <ul className="space-y-1">
            {options.map((o) => (
              <li key={o.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selected.includes(o.id)}
                    onChange={() => onToggle(o.id)}
                    className="h-4 w-4 rounded border-slate-300 accent-[#f7931e]"
                  />
                  <span className="flex-1">{o.label}</span>
                  {o.count !== undefined && <span className="text-xs text-slate-400">{o.count}</span>}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function GameCard({ game, category, tagStyle, list, saved, onSave }) {
  return (
    <div className="group relative">
      <Link
        to={`/games/${game.slug}`}
        className={`flex rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition hover:shadow-lg ${
          list ? 'items-center gap-4' : 'h-full flex-col'
        }`}
      >
        <Cover game={game} className={list ? 'h-24 w-24 shrink-0' : 'aspect-[4/5] w-full'} />

        <div className={list ? 'min-w-0 flex-1 pr-10' : 'mt-3 px-1 pb-1'}>
          <h3 className="truncate text-base font-bold text-navy group-hover:text-brand-dark">{game.name}</h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Icon name="users" className="h-4 w-4" />
              {range(game.min_players, game.max_players)} คน
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="clock" className="h-4 w-4" />
              {range(game.min_play_time, game.max_play_time)} นาที
            </span>
          </p>
          {category && (
            <span className={`mt-3 inline-block max-w-full truncate rounded-full px-3 py-1.5 text-xs font-semibold ${tagStyle}`}>
              {category.name_th}
            </span>
          )}
        </div>
      </Link>

      {/* ปุ่มหัวใจ (อยู่นอก Link เพื่อไม่ให้กดแล้วเปลี่ยนหน้า) */}
      <button
        type="button"
        aria-label={saved ? 'เอาออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
        aria-pressed={saved}
        onClick={() => onSave(game.id)}
        className={`absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm transition hover:scale-110 ${
          saved ? 'text-rose-500' : 'text-slate-500'
        } ${list ? 'top-1/2 -translate-y-1/2 hover:!scale-110' : ''}`}
      >
        <Icon name="heart" className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-80 animate-pulse rounded-3xl bg-slate-200/70" />
      ))}
    </div>
  )
}

export default function Category() {
  // รองรับ /categories, /games, /categories/:slug และ ?q=ชื่อเกม&category=slug
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const urlCategory = slug ?? searchParams.get('category')

  const [state, setState] = useState({ status: 'loading', categories: [], games: [] })
  const [retry, setRetry] = useState(0)

  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, categories: urlCategory ? [urlCategory] : [] })
  const [query, setQuery] = useState(urlQuery)
  const [sort, setSort] = useState('recommended')
  const [view, setView] = useState('grid')
  const [page, setPage] = useState(1)
  const [saved, setSaved] = useState(() => new Set()) // รายการโปรด (เก็บในหน้านี้ก่อน ต่อ API ภายหลังได้)

  // ถ้า URL เปลี่ยน ให้ตั้งตัวกรองใหม่ตาม URL
  useEffect(() => {
    setQuery(urlQuery)
    setFilters({ ...EMPTY_FILTERS, categories: urlCategory ? [urlCategory] : [] })
  }, [urlQuery, urlCategory])

  // ดึงหมวดและเกมทั้งหมดจาก backend
  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: 'loading', categories: [], games: [] })

    Promise.all([
      fetch(`${API}/api/categories`, { signal: ctrl.signal }).then(checkJson),
      fetch(`${API}/api/games`, { signal: ctrl.signal }).then(checkJson),
    ])
      .then(([categories, games]) => setState({ status: 'ready', categories, games }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ status: 'error', categories: [], games: [] })
      })

    return () => ctrl.abort()
  }, [retry])

  // เปลี่ยนตัวกรองแล้วกลับไปหน้า 1
  useEffect(() => setPage(1), [filters, query, sort])

  const { status, categories, games } = state

  const catBySlug = useMemo(() => Object.fromEntries(categories.map((c) => [c.slug, c])), [categories])
  // สีแท็กตามลำดับหมวด (หมวดเดียวกันได้สีเดียวกันเสมอ)
  const tagByCat = useMemo(
    () => Object.fromEntries(categories.map((c, i) => [c.slug, TAG_STYLES[i % TAG_STYLES.length]])),
    [categories],
  )

  const activeCat = filters.categories.length === 1 ? catBySlug[filters.categories[0]] : null

  useEffect(() => {
    document.title = activeCat ? `${activeCat.name_th} | BoardGame Catalog` : 'หมวดหมู่ | BoardGame Catalog'
  }, [activeCat])

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        id: c.slug,
        label: c.name_th,
        count: games.filter((g) => g.category === c.slug).length,
      })),
    [categories, games],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return games
      .filter((g) => (q ? g.name.toLowerCase().includes(q) : true))
      .filter((g) => gameMatches(g, filters))
      .sort(SORTS[sort].fn)
  }, [games, filters, query, sort])

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const pageItems = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const toggle = (group) => (id) =>
    setFilters((f) => ({
      ...f,
      [group]: f[group].includes(id) ? f[group].filter((x) => x !== id) : [...f[group], id],
    }))

  const toggleSaved = (id) =>
    setSaved((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const hasFilter =
    query || filters.categories.length || filters.players.length || filters.time.length || filters.age.length
  const clearAll = () => {
    setFilters(EMPTY_FILTERS)
    setQuery('')
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-navy">เชื่อมต่อเซิร์ฟเวอร์ไม่ได้</h1>
        <p className="mt-3 text-slate-600">
          ตรวจสอบว่า backend รันอยู่ (go run ./cmd/api) และฐานข้อมูลเปิดอยู่ แล้วลองใหม่อีกครั้ง
        </p>
        <button
          type="button"
          onClick={() => setRetry((n) => n + 1)}
          className="mt-6 rounded-full bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          ลองใหม่
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 pt-6">
      {/* hero banner */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-amber-50 via-orange-50 to-sky-50 px-8 py-10 md:px-12">
        {/* ถ้ามีรูปตกแต่ง (มีพเพิล/ลูกเต๋า) วางที่ public/category-hero.png แล้วเอาคอมเมนต์ออก
        <img src="/category-hero.png" alt="" aria-hidden="true"
             className="pointer-events-none absolute inset-y-0 right-0 hidden h-full object-contain md:block" /> */}

        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h1 className="text-4xl font-extrabold text-navy md:text-5xl">
              {activeCat ? activeCat.name_th : 'หมวดหมู่'}
            </h1>
            <p className="mt-1 text-lg font-medium text-slate-600">
              {activeCat ? (activeCat.name_en ?? '') : 'Browse all board games'}
            </p>
            <p className="mt-3 text-slate-600">
              {activeCat?.description ??
                'เลือกบอร์ดเกมทั้งหมด แล้วใช้ตัวกรองเพื่อจัดตามหมวด จำนวนผู้เล่น เวลาเล่น และอายุที่เหมาะสม'}
            </p>
          </div>

          {status === 'ready' && (
            <div className="flex shrink-0 -rotate-3 items-center gap-4 rounded-3xl bg-gradient-to-br from-brand to-orange-500 px-8 py-5 text-white shadow-lg">
              <span className="text-5xl" aria-hidden="true">🎲</span>
              <div>
                <p className="text-3xl font-extrabold leading-none">{games.length} เกม</p>
                <p className="mt-1 text-sm font-medium text-white/90">จาก {categories.length} หมวดหมู่</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* แถบค้นหา + ตัวกรอง (แทน sidebar เดิม) */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[2rem] bg-white p-3 shadow-sm ring-1 ring-slate-100">
        <div className="relative min-w-[220px] flex-1">
          <label htmlFor="game-search" className="sr-only">ค้นหาชื่อเกม</label>
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy" />
          <input
            id="game-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อเกม..."
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-12 pr-4 text-sm outline-none focus:border-brand"
          />
        </div>

        <FilterDropdown label="หมวดหมู่" icon="layers" options={categoryOptions} selected={filters.categories} onToggle={toggle('categories')} />
        <FilterDropdown label="จำนวนผู้เล่น" icon="users" options={PLAYER_OPTIONS} selected={filters.players} onToggle={toggle('players')} />
        <FilterDropdown label="เวลาเล่น" icon="clock" options={TIME_OPTIONS} selected={filters.time} onToggle={toggle('time')} />
        <FilterDropdown label="อายุที่เหมาะสม" icon="smile" options={AGE_OPTIONS} selected={filters.age} onToggle={toggle('age')} />

        <div className="flex gap-1 rounded-xl bg-slate-50 p-1" role="group" aria-label="รูปแบบการแสดงผล">
          {[
            ['grid', 'แบบตาราง'],
            ['list', 'แบบรายการ'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-label={label}
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={`grid h-10 w-10 place-items-center rounded-lg transition ${
                view === key ? 'bg-brand text-white shadow-sm' : 'text-navy hover:bg-white'
              }`}
            >
              <Icon name={key} />
            </button>
          ))}
        </div>
      </div>

      {/* จำนวนผลลัพธ์ + เรียงตาม */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="font-semibold text-navy" aria-live="polite">
            {status === 'ready' ? `แสดง ${visible.length} จาก ${games.length} เกม` : 'กำลังโหลด...'}
          </p>
          {hasFilter && (
            <button type="button" onClick={clearAll} className="text-sm font-medium text-brand-dark hover:underline">
              ล้างตัวกรอง
            </button>
          )}
        </div>

        <div className="relative">
          <label htmlFor="game-sort" className="sr-only">เรียงตาม</label>
          <Icon name="sort" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy" />
          <select
            id="game-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none rounded-full bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-navy shadow-sm ring-1 ring-slate-100"
          >
            {Object.entries(SORTS).map(([key, s]) => (
              <option key={key} value={key}>เรียงตาม: {s.label}</option>
            ))}
          </select>
          <Icon name="chevron" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      {/* รายการเกม */}
      <section className="mt-5">
        {status === 'loading' ? (
          <Skeleton />
        ) : visible.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-slate-100">
            <p className="text-lg font-semibold text-navy">ไม่พบเกมที่ตรงกับตัวกรอง</p>
            <p className="mt-2 text-slate-500">ลองเอาตัวกรองบางข้อออก หรือค้นหาด้วยชื่ออื่น</p>
            <button type="button" onClick={clearAll} className="mt-5 rounded-full bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark">
              ล้างตัวกรอง
            </button>
          </div>
        ) : (
          <>
            <div className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' : 'space-y-3'}>
              {pageItems.map((g) => (
                <GameCard
                  key={g.id}
                  game={g}
                  category={catBySlug[g.category]}
                  tagStyle={tagByCat[g.category]}
                  list={view === 'list'}
                  saved={saved.has(g.id)}
                  onSave={toggleSaved}
                />
              ))}
            </div>

            {pageCount > 1 && (
              <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="เลือกหน้า">
                <button
                  type="button"
                  aria-label="หน้าก่อนหน้า"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white ring-1 ring-slate-200 disabled:opacity-40"
                >
                  &lt;
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-current={n === current ? 'page' : undefined}
                    onClick={() => setPage(n)}
                    className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-medium ${
                      n === current ? 'bg-navy text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="หน้าถัดไป"
                  disabled={current === pageCount}
                  onClick={() => setPage(current + 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white ring-1 ring-slate-200 disabled:opacity-40"
                >
                  &gt;
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  )
}

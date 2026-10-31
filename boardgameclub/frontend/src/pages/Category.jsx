import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

// ถ้าตั้ง proxy ใน vite.config.js ให้ปล่อยว่างไว้ (เรียก /api/... ได้เลย)
// ถ้าไม่ใช้ proxy ให้สร้างไฟล์ .env แล้วใส่ VITE_API_URL=http://localhost:8080
const API = import.meta.env.VITE_API_URL ?? ''
const PAGE_SIZE = 12

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
  name: { label: 'ชื่อเกม A-Z', fn: (a, b) => a.name.localeCompare(b.name) },
  recommended: {
    label: 'เกมแนะนำก่อน',
    fn: (a, b) => Number(b.is_recommended) - Number(a.is_recommended) || a.name.localeCompare(b.name),
  },
  time: { label: 'เวลาเล่นน้อยไปมาก', fn: (a, b) => a.min_play_time - b.min_play_time },
  players: { label: 'จำนวนผู้เล่นมากสุด', fn: (a, b) => b.max_players - a.max_players },
}

// ยังไม่มีรูปปกในฐานข้อมูล เลยใช้สีไล่เฉดแทนก่อน (ถ้ามี game.image_url จะแสดงรูปแทน)
const COVERS = [
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-700',
  'from-sky-400 to-indigo-600',
  'from-rose-400 to-red-700',
  'from-violet-400 to-purple-700',
  'from-lime-400 to-green-700',
]
const TAG_STYLES = [
  'bg-amber-100 text-amber-800',
  'bg-sky-100 text-sky-800',
  'bg-rose-100 text-rose-800',
  'bg-emerald-100 text-emerald-800',
  'bg-violet-100 text-violet-800',
]

const EMPTY_FILTERS = { categories: [], players: [], time: [], age: [] }

const checkJson = (r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

const range = (min, max, unit) => (min === max ? `${min} ${unit}` : `${min}-${max} ${unit}`)

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

function FilterGroup({ title, options, selected, onToggle }) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-3 text-base font-bold text-navy">{title}</legend>
      <div className="space-y-2.5">
        {options.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              onChange={() => onToggle(o.id)}
              className="h-4 w-4 rounded border-slate-300 accent-[#f7931e]"
            />
            <span className="flex-1">{o.label}</span>
            {o.count !== undefined && <span className="text-xs text-slate-400">{o.count}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function GameCard({ game, category, list }) {
  const tagStyle = TAG_STYLES[game.id % TAG_STYLES.length]
  return (
    <Link
      to={`/games/${game.slug}`}
      className={`group flex rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md ${
        list ? 'items-center gap-4' : 'flex-col'
      }`}
    >
      <div
        className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br text-4xl font-bold text-white/90 ${
          COVERS[game.id % COVERS.length]
        } ${list ? 'h-24 w-24' : 'aspect-square w-full'}`}
        aria-hidden="true"
      >
        {game.image_url ? (
          <img src={game.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          game.name.slice(0, 2)
        )}
        {game.is_recommended && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-brand-dark">
            แนะนำ
          </span>
        )}
      </div>

      <div className={list ? 'min-w-0 flex-1' : 'mt-3'}>
        <h3 className="truncate font-semibold text-navy group-hover:text-brand-dark">{game.name}</h3>
        <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
          <span>{range(game.min_players, game.max_players, 'คน')}</span>
          <span>{range(game.min_play_time, game.max_play_time, 'นาที')}</span>
        </p>
        {category && (
          <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${tagStyle}`}>
            {category.name_th}
          </span>
        )}
      </div>
    </Link>
  )
}

function Skeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
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
  const [sort, setSort] = useState('name')
  const [view, setView] = useState('grid')
  const [page, setPage] = useState(1)

  // ถ้า URL เปลี่ยน (เช่นค้นหาจาก Navbar หรือกดหมวดจากหน้าแรก) ให้ตั้งตัวกรองใหม่ตาม URL
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

  // หมวดที่เลือกอยู่ (เมื่อเลือกหมวดเดียว) ใช้เปลี่ยนชื่อหัวข้อ breadcrumb และชื่อแท็บ
  const activeCat = filters.categories.length === 1 ? catBySlug[filters.categories[0]] : null

  useEffect(() => {
    document.title = activeCat ? `${activeCat.name_th} | BoardGame Catalog` : 'หมวดหมู่ | BoardGame Catalog'
  }, [activeCat])

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        id: c.slug,
        label: `${c.icon ?? ''} ${c.name_th}`.trim(),
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
    <div className="mx-auto max-w-7xl px-6 pb-16">
      {/* breadcrumb */}
      <nav aria-label="breadcrumb" className="py-5 text-sm text-slate-500">
        <Link to="/" className="hover:text-navy">หน้าแรก</Link>
        <span className="mx-2">&gt;</span>
        {activeCat ? (
          <>
            <Link to="/categories" className="hover:text-navy">หมวดหมู่</Link>
            <span className="mx-2">&gt;</span>
            <span className="text-navy">{activeCat.name_th}</span>
          </>
        ) : (
          <span className="text-navy">หมวดหมู่</span>
        )}
      </nav>

      {/* hero */}
      <section className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-sky-50 p-8 md:flex-row md:items-center">
        <div className="max-w-xl">
          <h1 className="text-3xl font-extrabold text-navy md:text-4xl">
            {activeCat ? activeCat.name_th : 'หมวดหมู่'}
          </h1>
          <p className="mt-1 text-lg text-slate-500">
            {activeCat ? (activeCat.name_en ?? '') : 'Browse all board games'}
          </p>
          <p className="mt-4 text-slate-600">
            {activeCat?.description ??
              'เลือกดูบอร์ดเกมทั้งหมด แล้วใช้ตัวกรองเลือกตามหมวด จำนวนผู้เล่น เวลาเล่น และอายุที่เหมาะสม'}
          </p>
        </div>
        {status === 'ready' && (
          <div className="shrink-0 rounded-2xl bg-brand px-8 py-4 text-white shadow-sm">
            <p className="text-3xl font-bold">{games.length} เกม</p>
            <p className="text-sm text-white/90">จาก {categories.length} หมวดหมู่</p>
          </div>
        )}
      </section>

      {/* toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <label htmlFor="game-search" className="sr-only">ค้นหาชื่อเกม</label>
          <input
            id="game-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อเกม..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>

        <label className="sr-only" htmlFor="game-sort">เรียงตาม</label>
        <select
          id="game-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700"
        >
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>

        <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200" role="group" aria-label="รูปแบบการแสดงผล">
          {[
            ['grid', 'แบบตาราง', 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'],
            ['list', 'แบบรายการ', 'M4 6h16M4 12h16M4 18h16'],
          ].map(([key, label, d]) => (
            <button
              key={key}
              type="button"
              aria-label={label}
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={`grid h-9 w-9 place-items-center rounded-lg ${
                view === key ? 'bg-brand text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={d} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* ตัวกรอง */}
        <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100" aria-label="ตัวกรอง">
          <h2 className="mb-5 text-xl font-bold text-navy">ตัวกรอง</h2>
          <FilterGroup title="หมวดหมู่" options={categoryOptions} selected={filters.categories} onToggle={toggle('categories')} />
          <FilterGroup title="จำนวนผู้เล่น" options={PLAYER_OPTIONS} selected={filters.players} onToggle={toggle('players')} />
          <FilterGroup title="เวลาเล่น" options={TIME_OPTIONS} selected={filters.time} onToggle={toggle('time')} />
          <FilterGroup title="อายุที่แนะนำ" options={AGE_OPTIONS} selected={filters.age} onToggle={toggle('age')} />
          <button
            type="button"
            onClick={clearAll}
            disabled={!hasFilter}
            className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 enabled:hover:bg-slate-50 disabled:opacity-50"
          >
            ล้างตัวกรอง
          </button>
        </aside>

        {/* รายการเกม */}
        <section aria-live="polite">
          {status === 'loading' ? (
            <Skeleton />
          ) : visible.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-100">
              <p className="text-lg font-semibold text-navy">ไม่พบเกมที่ตรงกับตัวกรอง</p>
              <p className="mt-2 text-slate-500">ลองเอาตัวกรองบางข้อออก หรือค้นหาด้วยชื่ออื่น</p>
              <button type="button" onClick={clearAll} className="mt-5 rounded-full bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark">
                ล้างตัวกรอง
              </button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500">
                แสดง {visible.length} จาก {games.length} เกม
              </p>
              <div className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-4' : 'space-y-3'}>
                {pageItems.map((g) => (
                  <GameCard key={g.id} game={g} category={catBySlug[g.category]} list={view === 'list'} />
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
    </div>
  )
}

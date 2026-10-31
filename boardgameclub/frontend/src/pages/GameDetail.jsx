import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL ?? ''

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

const checkJson = (r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}
const range = (min, max, unit) => (min === max ? `${min} ${unit}` : `${min}-${max} ${unit}`)

/* ---------- รายการโปรด (เก็บในเบราว์เซอร์ก่อน ยังไม่มีระบบล็อกอิน) ---------- */
const FAV_KEY = 'bg_favorites'
const readFavs = () => {
  try {
    const v = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
function useFavorite(slug) {
  const [favs, setFavs] = useState(readFavs)
  useEffect(() => {
    const sync = () => setFavs(readFavs())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  const isFav = favs.includes(slug)
  const toggle = () => {
    const next = isFav ? favs.filter((s) => s !== slug) : [...favs, slug]
    setFavs(next)
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }
  return [isFav, toggle]
}

/* ---------- ชิ้นส่วนย่อย ---------- */
function Svg({ d, className = 'h-5 w-5', fill = 'none' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const ICON = {
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
  players: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  time: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  age: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  check: 'M5 12l5 5L20 7',
  dice: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01',
  play: 'M5 3l14 9-14 9z',
}

function Pill({ icon, children }) {
  return (
    <span className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur">
      <Svg d={icon} className="h-4 w-4" />
      {children}
    </span>
  )
}

function SectionTitle({ icon, children }) {
  return (
    <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold text-navy">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy/10 text-navy">
        <Svg d={icon} className="h-4 w-4" />
      </span>
      {children}
    </h2>
  )
}

function Steps({ items }) {
  return (
    <ol className="space-y-4">
      {items.map((s, i) => (
        <li key={i} className="relative flex gap-3">
          {i < items.length - 1 && <span className="absolute left-[13px] top-8 h-[calc(100%-0.5rem)] w-px bg-slate-200" aria-hidden="true" />}
          <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
            {i + 1}
          </span>
          <p className="pt-0.5 text-sm leading-relaxed text-slate-700">{s}</p>
        </li>
      ))}
    </ol>
  )
}

function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-2.5 text-sm last:border-0">
      {icon && <Svg d={icon} className="h-4 w-4 shrink-0 text-slate-400" />}
      <dt className="text-slate-500">{label}</dt>
      <dd className="ml-auto text-right font-semibold text-navy">{value}</dd>
    </div>
  )
}

/* ---------- หน้าหลัก ---------- */
export default function GameDetail() {
  const { slug } = useParams()
  const [state, setState] = useState({ status: 'loading', game: null, categories: [], games: [] })
  const [tab, setTab] = useState('detail')
  const [isFav, toggleFav] = useFavorite(slug)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: 'loading', game: null, categories: [], games: [] })
    setTab('detail')
    window.scrollTo(0, 0)

    const opt = { signal: ctrl.signal }
    Promise.all([
      fetch(`${API}/api/categories`, opt).then(checkJson),
      fetch(`${API}/api/games`, opt).then(checkJson),
      // ถ้ามี endpoint รายละเอียดเดี่ยวจะใช้ ถ้าไม่มีก็ใช้ข้อมูลจากรายการรวม
      fetch(`${API}/api/games/${encodeURIComponent(slug)}`, opt).then(checkJson).catch(() => null),
    ])
      .then(([categories, games, detail]) => {
        const fromList = games.find((g) => g.slug === slug)
        const game = fromList || detail ? { ...fromList, ...detail } : null
        setState({ status: game ? 'ready' : 'notfound', game, categories, games })
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ status: 'error', game: null, categories: [], games: [] })
      })

    return () => ctrl.abort()
  }, [slug])

  const { status, game, categories, games } = state

  const category = useMemo(() => {
    if (!game) return null
    const key = typeof game.category === 'object' ? game.category?.slug : game.category
    return categories.find((c) => c.slug === key) ?? null
  }, [game, categories])

  const related = useMemo(() => {
    if (!game || !category) return []
    return games.filter((g) => g.category === category.slug && g.slug !== game.slug).slice(0, 5)
  }, [game, category, games])

  useEffect(() => {
    if (game) document.title = `${game.name} | BoardGame Catalog`
  }, [game])

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: game.name, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      /* ผู้ใช้ยกเลิกการแชร์ */
    }
  }

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="h-64 animate-pulse rounded-3xl bg-slate-200/70" />
        <div className="mt-6 grid animate-pulse gap-6 lg:grid-cols-[1fr_320px]">
          <div className="h-64 rounded-3xl bg-slate-200/70" />
          <div className="h-64 rounded-3xl bg-slate-200/70" />
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-navy">เชื่อมต่อเซิร์ฟเวอร์ไม่ได้</h1>
        <p className="mt-3 text-slate-600">ตรวจสอบว่า backend และฐานข้อมูลเปิดอยู่ แล้วลองรีเฟรชหน้านี้</p>
      </div>
    )
  }

  if (status === 'notfound') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-navy">ไม่พบเกมนี้</h1>
        <Link to="/categories" className="mt-4 inline-block font-semibold text-brand-dark underline">
          กลับไปดูเกมทั้งหมด
        </Link>
      </div>
    )
  }

  const idx = Number(game.id) || 0
  const tags = game.tags ?? []
  const steps = game.how_to_play ?? []
  const highlights = game.highlights ?? []
  const hasAbout = Boolean(game.description)

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      {/* breadcrumb */}
      <nav aria-label="breadcrumb" className="py-5 text-sm text-slate-500">
        <Link to="/" className="hover:text-navy">หน้าแรก</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/categories" className="hover:text-navy">หมวดหมู่</Link>
        {category && (
          <>
            <span className="mx-2">&gt;</span>
            <Link to={`/categories/${category.slug}`} className="hover:text-navy">{category.name_th}</Link>
          </>
        )}
        <span className="mx-2">&gt;</span>
        <span className="text-navy">{game.name}</span>
      </nav>

      {/* แบนเนอร์ */}
      <header className={`relative overflow-hidden rounded-3xl bg-gradient-to-br px-6 pb-14 pt-6 shadow-lg md:px-10 md:pt-8 ${COVERS[idx % COVERS.length]}`}>
        <div className="absolute inset-0 bg-slate-900/35" aria-hidden="true" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-white/10" aria-hidden="true" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* รูปปก + หัวใจมุมขวาบน */}
          <div className="relative mx-auto w-36 shrink-0 sm:mx-0 sm:w-44">
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-white/15 shadow-2xl ring-2 ring-white/50">
              {game.image_url ? (
                <img src={game.image_url} alt={game.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-5xl font-bold text-white" aria-hidden="true">
                  {game.name.slice(0, 2)}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={toggleFav}
              aria-pressed={isFav}
              aria-label={isFav ? 'เอาออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
              className={`absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full shadow-lg transition active:scale-90 ${
                isFav ? 'bg-rose-500 text-white' : 'bg-white text-rose-500 hover:bg-rose-50'
              }`}
            >
              <Svg d={ICON.heart} className="h-5 w-5" fill={isFav ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="min-w-0 text-center text-white sm:text-left">
            <h1 className="text-3xl font-extrabold leading-tight drop-shadow-sm md:text-5xl">{game.name}</h1>
            {game.designer && <p className="mt-2 font-medium text-white/90">ออกแบบโดย {game.designer}</p>}

            <div className="mt-4 flex flex-wrap justify-center gap-2.5 sm:justify-start">
              <Pill icon={ICON.players}>{range(game.min_players, game.max_players, 'คน')}</Pill>
              <Pill icon={ICON.time}>{range(game.min_play_time, game.max_play_time, 'นาที')}</Pill>
              <Pill icon={ICON.age}>{game.min_age}+ ปี</Pill>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
              <button
                type="button"
                onClick={toggleFav}
                aria-pressed={isFav}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold shadow-md transition active:scale-95 ${
                  isFav ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-white text-navy hover:bg-slate-100'
                }`}
              >
                <Svg d={ICON.heart} className="h-4 w-4" fill={isFav ? 'currentColor' : 'none'} />
                {isFav ? 'อยู่ในรายการโปรดแล้ว' : 'เพิ่มในรายการโปรด'}
              </button>
              <button
                type="button"
                onClick={share}
                className="flex items-center gap-2 rounded-full bg-white/15 px-6 py-2.5 text-sm font-bold text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-white/25"
              >
                <Svg d={ICON.share} className="h-4 w-4" />
                {copied ? 'คัดลอกลิงก์แล้ว' : 'แชร์'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* แผ่นเนื้อหาซ้อนขึ้นไปทับแบนเนอร์ */}
      <div className="relative -mt-8 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-100 md:p-7">
        {/* แท็บ */}
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="ข้อมูลเกม">
          {[
            ['detail', 'รายละเอียดเกม'],
            ['how', 'วิธีเล่น'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                tab === key ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'detail' ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]" role="tabpanel">
            <div className="min-w-0 space-y-8">
              {hasAbout && (
                <section>
                  <SectionTitle icon={ICON.doc}>เกี่ยวกับเกม</SectionTitle>
                  <p className="leading-relaxed text-slate-600">{game.description}</p>
                </section>
              )}

              {highlights.length > 0 && (
                <section>
                  <SectionTitle icon={ICON.star}>จุดเด่น</SectionTitle>
                  <ul className="space-y-2.5">
                    {highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 text-slate-700">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-navy text-white">
                          <Svg d={ICON.check} className="h-3 w-3" />
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {steps.length > 0 && (
                <section className="rounded-2xl bg-sky-50 p-5 ring-1 ring-sky-100">
                  <SectionTitle icon={ICON.dice}>วิธีเล่น (ย่อ)</SectionTitle>
                  <Steps items={steps} />
                  {game.video_url && (
                    <a
                      href={game.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-dark ring-1 ring-sky-200 hover:ring-brand"
                    >
                      <Svg d={ICON.play} className="h-3.5 w-3.5" fill="currentColor" />
                      ดูวิดีโอวิธีเล่น
                    </a>
                  )}
                </section>
              )}
            </div>

            {/* การ์ดข้อมูลเกม */}
            <aside className="h-fit rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100">
              <h2 className="mb-1 text-base font-bold text-navy">ข้อมูลเกม</h2>
              <dl>
                <InfoRow icon={ICON.players} label="ผู้เล่น" value={range(game.min_players, game.max_players, 'คน')} />
                <InfoRow icon={ICON.time} label="เวลาเล่น" value={range(game.min_play_time, game.max_play_time, 'นาที')} />
                <InfoRow icon={ICON.age} label="อายุที่แนะนำ" value={`${game.min_age}+ ปี`} />
                <InfoRow label="ผู้ผลิต" value={game.publisher} />
                <InfoRow label="นักออกแบบ" value={game.designer} />
                <InfoRow label="ประเภท" value={game.game_type} />
              </dl>

              {(category || tags.length > 0) && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-navy">หมวดและแท็ก</p>
                  <div className="flex flex-wrap gap-2">
                    {category && (
                      <Link
                        to={`/categories/${category.slug}`}
                        className="rounded-full bg-navy px-3 py-1 text-xs font-medium text-white hover:bg-navy/90"
                      >
                        {category.name_th}
                      </Link>
                    )}
                    {tags.map((t, i) => (
                      <span key={t} className={`rounded-full px-3 py-1 text-xs font-medium ${TAG_STYLES[i % TAG_STYLES.length]}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        ) : (
          <div className="max-w-2xl" role="tabpanel">
            <SectionTitle icon={ICON.dice}>วิธีเล่น {game.name}</SectionTitle>
            {steps.length > 0 ? <Steps items={steps} /> : <p className="text-slate-500">ยังไม่มีข้อมูลวิธีเล่นสำหรับเกมนี้</p>}
          </div>
        )}

        {/* เกมอื่นในหมวดเดียวกัน */}
        {related.length > 0 && (
          <section className="mt-10 border-t border-slate-100 pt-7">
            <div className="mb-4 flex items-center justify-between gap-4">
              <SectionTitle icon={ICON.dice}>เกมอื่นในหมวด {category.name_th}</SectionTitle>
              <Link to={`/categories/${category.slug}`} className="mb-3 shrink-0 text-sm font-semibold text-brand-dark hover:underline">
                ดูทั้งหมด →
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {related.map((g, i) => (
                <li key={g.slug}>
                  <Link
                    to={`/games/${g.slug}`}
                    className="group flex h-full items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-brand/50"
                  >
                    <span
                      className={`grid h-14 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br text-base font-bold text-white ${
                        COVERS[(Number(g.id) || i) % COVERS.length]
                      }`}
                      aria-hidden="true"
                    >
                      {g.image_url ? <img src={g.image_url} alt="" className="h-full w-full object-cover" /> : g.name.slice(0, 2)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-navy group-hover:text-brand-dark">{g.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{category.name_th}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

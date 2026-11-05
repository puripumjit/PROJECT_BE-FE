import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL ?? ''

const checkJson = (r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

/* =====================================================================
   ภาพประกอบทั้งหมดวาดด้วย SVG ในโค้ด (ไม่ต้องใช้ไฟล์รูป)
   ===================================================================== */

/* ---------- มีเปิล (ไล่เฉด + ไฮไลต์ให้ดูเป็นชิ้นไม้/พลาสติก) ---------- */
const MEEPLE_PATH =
  'M12 2a3 3 0 0 0-3 3c0 .9.4 1.7 1 2.2-2.7.6-5 1.2-8 2.3-.5.2-.5 1 0 1.2 1.6.7 2.6 1.4 3.2 2.3.6 1-.2 2.8-1.7 5.2-.4.7.1 1.8 1 1.8H9c1 0 1.7-.9 2.2-1.9.3-.6.5-.9.8-.9s.5.3.8.9c.5 1 1.2 1.9 2.2 1.9h3.5c.9 0 1.4-1.1 1-1.8-1.5-2.4-2.3-4.2-1.7-5.2.6-.9 1.6-1.6 3.2-2.3.5-.2.5-1 0-1.2-3-1.1-5.3-1.7-8-2.3.6-.5 1-1.3 1-2.2a3 3 0 0 0-3-3z'

const MEEPLE_TONES = {
  red: ['#fca5a5', '#ef4444', '#991b1b'],
  blue: ['#93c5fd', '#3b82f6', '#1e40af'],
  yellow: ['#fef08a', '#facc15', '#a16207'],
  green: ['#86efac', '#22c55e', '#166534'],
}

function Meeple({ tone = 'red', className = '', ...rest }) {
  const id = useId().replace(/:/g, '')
  const [light, mid, dark] = MEEPLE_TONES[tone]
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...rest}>
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

/* ---------- ลูกเต๋า 3 มิติ (มุมมองไอโซเมตริก) ---------- */
function Dice({ className = '', ...rest }) {
  const pip = (x, y) => <circle key={`${x}${y}`} cx={x} cy={y} r="0.085" fill="#0f1f4b" />
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" {...rest}>
      {/* ด้านบน */}
      <polygon points="32,6 56,18 32,30 8,18" fill="#ffffff" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" />
      {/* ด้านซ้าย */}
      <polygon points="8,18 32,30 32,58 8,46" fill="#e2e8f0" stroke="#e2e8f0" strokeWidth="4" strokeLinejoin="round" />
      {/* ด้านขวา */}
      <polygon points="32,30 56,18 56,46 32,58" fill="#f1f5f9" stroke="#f1f5f9" strokeWidth="4" strokeLinejoin="round" />
      <polygon points="32,6 56,18 32,30 8,18" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
      {/* จุดบนลูกเต๋า วางด้วย matrix ให้เอียงตามหน้า */}
      <g transform="matrix(24 12 -24 12 32 6)">{[[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]].map(([x, y]) => pip(x, y))}</g>
      <g transform="matrix(24 12 0 28 8 18)">{[[0.25, 0.22], [0.5, 0.5], [0.75, 0.78]].map(([x, y]) => pip(x, y))}</g>
      <g transform="matrix(24 -12 0 28 32 30)">{[[0.28, 0.28], [0.72, 0.72]].map(([x, y]) => pip(x, y))}</g>
    </svg>
  )
}

/* ---------- ประกายสีส้มข้างหัวข้อ ---------- */
function Sparkle({ className = '', style }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M20 4v9" />
      <path d="M6 12l8 5" />
      <path d="M34 12l-8 5" />
    </svg>
  )
}

function Svg({ d, className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

/* ---------- ภาพแบนเนอร์ด้านขวา: การ์ด ลูกเต๋า มีเปิล ---------- */
function BannerArt({ className = '', style }) {
  return (
    <svg viewBox="0 0 560 260" preserveAspectRatio="xMaxYMax meet" className={className} style={style} aria-hidden="true">
      <defs>
        <filter id="bn-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <linearGradient id="bn-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e3a8a" stopOpacity="0" />
          <stop offset="1" stopColor="#0b1437" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* ไฟโบเก้ด้านหลัง */}
      <g filter="url(#bn-blur)" opacity="0.85">
        <circle cx="90" cy="60" r="26" fill="#f59e0b" />
        <circle cx="170" cy="30" r="20" fill="#38bdf8" />
        <circle cx="300" cy="40" r="24" fill="#fb7185" />
        <circle cx="430" cy="34" r="22" fill="#fbbf24" />
        <circle cx="520" cy="80" r="30" fill="#60a5fa" />
        <circle cx="40" cy="150" r="22" fill="#a78bfa" />
      </g>
      <rect x="0" y="150" width="560" height="110" fill="url(#bn-floor)" />

      {/* กองการ์ด */}
      <g transform="translate(430 150)">
        <rect x="0" y="40" width="130" height="14" rx="3" fill="#7c2d12" />
        <rect x="0" y="30" width="130" height="14" rx="3" fill="#b45309" />
        <rect x="-4" y="20" width="132" height="14" rx="3" fill="#ca8a04" />
        <rect x="4" y="10" width="130" height="14" rx="3" fill="#f8fafc" />
        <rect x="8" y="0" width="120" height="14" rx="3" fill="#e2e8f0" />
      </g>
      <g transform="translate(360 168) rotate(-14)">
        <rect width="46" height="64" rx="5" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="23" cy="32" r="9" fill="#ef4444" />
      </g>

      {/* ลูกเต๋า */}
      <ellipse cx="56" cy="238" rx="38" ry="8" fill="#000" opacity="0.35" />
      <Dice x="6" y="150" width="100" height="100" style={{ transform: 'rotate(-6deg)', transformOrigin: '56px 200px' }} />

      {/* มีเปิล + เงา */}
      <ellipse cx="190" cy="244" rx="30" ry="7" fill="#000" opacity="0.35" />
      <ellipse cx="262" cy="248" rx="38" ry="8" fill="#000" opacity="0.35" />
      <ellipse cx="346" cy="246" rx="32" ry="7" fill="#000" opacity="0.35" />
      <ellipse cx="430" cy="248" rx="38" ry="8" fill="#000" opacity="0.35" />
      <Meeple tone="red" x="158" y="168" width="68" height="78" />
      <Meeple tone="blue" x="216" y="120" width="92" height="130" />
      <Meeple tone="yellow" x="304" y="140" width="84" height="108" />
      <Meeple tone="green" x="388" y="112" width="92" height="138" />
    </svg>
  )
}

/* ---------- ภาพ "จุดเริ่มต้น": กล่องบอร์ดเกมซ้อนกันบนโต๊ะไม้ ---------- */
function hex(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
}

function BoxesScene({ className = '' }) {
  const catanTiles = [
    [304, '#16a34a'], [326, '#eab308'], [348, '#78716c'], [370, '#f97316'], [392, '#fde68a'],
  ]
  return (
    <svg viewBox="0 0 480 330" className={className} role="img" aria-label="กล่องบอร์ดเกม Catan, Splendor และ Ticket to Ride วางซ้อนกัน">
      <defs>
        <linearGradient id="bx-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde9c4" />
          <stop offset="0.6" stopColor="#f6c98a" />
          <stop offset="1" stopColor="#e7a867" />
        </linearGradient>
        <linearGradient id="bx-table" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c08457" />
          <stop offset="1" stopColor="#7c4a26" />
        </linearGradient>
        <linearGradient id="bx-catan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="1" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="bx-splendor" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="bx-ticket" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b45309" />
          <stop offset="1" stopColor="#713f12" />
        </linearGradient>
        <filter id="bx-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="bx-shadow" x="-10%" y="-20%" width="120%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      <rect width="480" height="330" fill="url(#bx-bg)" />

      {/* ชั้นวางและไฟโบเก้ด้านหลัง */}
      <g filter="url(#bx-blur)" opacity="0.8">
        <circle cx="70" cy="50" r="22" fill="#fff7d6" />
        <circle cx="140" cy="28" r="14" fill="#ffe08a" />
        <circle cx="430" cy="40" r="26" fill="#fff0c2" />
        <circle cx="380" cy="20" r="12" fill="#fde68a" />
      </g>
      <rect x="0" y="118" width="480" height="5" fill="#a16207" opacity="0.25" />

      {/* ต้นไม้ในกระถาง */}
      <g>
        <path d="M44 150c-18-20-20-44-6-62 8 18 12 38 6 62z" fill="#15803d" />
        <path d="M44 150c4-26 16-44 34-54-2 22-14 42-34 54z" fill="#22c55e" />
        <path d="M44 150c-8-22-28-34-44-34 6 20 22 32 44 34z" fill="#166534" />
        <path d="M30 150h28l-4 30H34z" fill="#e2e8f0" />
      </g>

      {/* โต๊ะไม้ */}
      <rect x="0" y="262" width="480" height="68" fill="url(#bx-table)" />
      <g stroke="#5b3318" strokeWidth="1" opacity="0.35">
        <path d="M0 282h480M0 302h480" />
      </g>

      {/* กล่อง: Ticket to Ride (ล่างสุด) */}
      <g transform="rotate(-1.5 250 230)" filter="url(#bx-shadow)">
        <rect x="70" y="204" width="330" height="62" rx="5" fill="#451a03" />
        <rect x="70" y="190" width="330" height="62" rx="6" fill="url(#bx-ticket)" />
        <rect x="76" y="196" width="318" height="50" rx="3" fill="none" stroke="#fde68a" strokeWidth="1.5" opacity="0.8" />
        <text x="96" y="228" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="800" fontSize="23" letterSpacing="2" fill="#fef3c7">
          TICKET TO RIDE
        </text>
        <path d="M300 238h84" stroke="#fde68a" strokeWidth="2.5" strokeDasharray="8 4" />
        <rect x="346" y="206" width="38" height="16" rx="3" fill="#ef4444" />
        <rect x="350" y="209" width="6" height="6" fill="#fef3c7" />
        <rect x="360" y="209" width="6" height="6" fill="#fef3c7" />
        <rect x="370" y="209" width="6" height="6" fill="#fef3c7" />
      </g>

      {/* กล่อง: Splendor */}
      <g transform="rotate(1 240 170)" filter="url(#bx-shadow)">
        <rect x="104" y="148" width="300" height="56" rx="5" fill="#0b1226" />
        <rect x="100" y="136" width="300" height="56" rx="6" fill="url(#bx-splendor)" />
        <text x="122" y="174" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="32" fill="#fcd34d">
          Splendor
        </text>
        {[
          [300, 164, '#ef4444'], [326, 154, '#22c55e'], [352, 164, '#3b82f6'], [378, 154, '#f8fafc'],
        ].map(([x, y, c]) => (
          <polygon key={x} points={`${x},${y - 14} ${x + 12},${y} ${x},${y + 14} ${x - 12},${y}`} fill={c} stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
        ))}
      </g>

      {/* กล่อง: CATAN (บนสุด) */}
      <g transform="rotate(-2 260 110)" filter="url(#bx-shadow)">
        <rect x="150" y="96" width="260" height="52" rx="5" fill="#450a0a" />
        <rect x="146" y="82" width="260" height="52" rx="6" fill="url(#bx-catan)" />
        <text x="164" y="120" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="800" fontSize="34" letterSpacing="3" fill="#fde68a">
          CATAN
        </text>
        {catanTiles.map(([x, c]) => (
          <polygon key={x} points={hex(x, 108, 11.5)} fill={c} stroke="#fff7ed" strokeWidth="1.2" />
        ))}
      </g>

      {/* ตัวมีเปิลและลูกเต๋าหน้าโต๊ะ */}
      <ellipse cx="140" cy="292" rx="70" ry="9" fill="#000" opacity="0.22" />
      <Meeple tone="blue" x="76" y="244" width="30" height="40" />
      <Meeple tone="red" x="108" y="250" width="26" height="34" />
      <Dice x="132" y="244" width="46" height="46" />
      <Meeple tone="green" x="176" y="246" width="28" height="38" />
      <Meeple tone="yellow" x="330" y="252" width="26" height="34" />
      <Meeple tone="red" x="358" y="246" width="30" height="40" />
      <Dice x="388" y="252" width="40" height="40" />
    </svg>
  )
}

const NAVY_GRAD = 'linear-gradient(90deg,#0b1437 0%,#14275f 55%,#1d3a8a 100%)'

/* ---------- ข้อมูลหน้าเว็บ ---------- */
const ICON = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
}

const FEATURES = [
  {
    icon: ICON.search,
    title: 'ค้นหาเกมได้ง่าย',
    text: 'ค้นหาบอร์ดเกมที่ใช่ได้ในไม่กี่คลิก',
    tone: 'bg-sky-100 text-sky-600',
  },
  {
    icon: ICON.star,
    title: 'เลือกเกมที่เหมาะกับคุณ',
    text: 'ด้วยหมวดหมู่ที่หลากหลาย',
    tone: 'bg-amber-100 text-amber-500',
  },
  {
    icon: ICON.users,
    title: 'แบ่งปันประสบการณ์',
    text: 'พูดคุย แลกเปลี่ยนความคิดเห็นกับชุมชนคนรักบอร์ดเกม',
    tone: 'bg-blue-100 text-blue-600',
  },
]

function StatItem({ icon, value, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '20px 16px', position: 'relative', zIndex: 1 }}>
      <span style={{ color: '#fff', display: 'inline-flex' }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: 36, lineHeight: 1, fontWeight: 800, color: '#fbbf24' }}>{value}</p>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(255,255,255,.85)' }}>{label}</p>
      </div>
    </div>
  )
}

export default function About() {
  // ตัวเลขเกมและหมวดหมู่ดึงจากข้อมูลจริง ถ้าโหลดไม่ได้จะใช้ค่าเริ่มต้นไปก่อน
  const [stats, setStats] = useState({ games: 100, categories: 10 })

  useEffect(() => {
    document.title = 'เกี่ยวกับเรา | BoardGame Catalog'
    const ctrl = new AbortController()
    Promise.all([
      fetch(`${API}/api/games`, { signal: ctrl.signal }).then(checkJson),
      fetch(`${API}/api/categories`, { signal: ctrl.signal }).then(checkJson),
    ])
      .then(([games, categories]) => {
        if (!Array.isArray(games) || games.length === 0) return
        setStats({ games: games.length, categories: categories.length })
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [])

  return (
    <div className="bg-[#fff8f0]">
      <div className="mx-auto max-w-6xl space-y-6 px-6 pb-16 pt-6">
        {/* แบนเนอร์หัวเรื่อง */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 24,
            padding: '48px 56px',
            minHeight: 230,
            background: NAVY_GRAD,
            boxShadow: '0 10px 25px rgba(15,31,75,.25)',
          }}
        >
          <div style={{ position: 'absolute', right: -40, top: -90, width: 320, height: 320, borderRadius: '50%', background: 'rgba(249,115,22,.28)', filter: 'blur(60px)' }} aria-hidden="true" />
          <div style={{ position: 'absolute', left: '33%', bottom: -120, width: 280, height: 280, borderRadius: '50%', background: 'rgba(56,189,248,.2)', filter: 'blur(60px)' }} aria-hidden="true" />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: 460 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <h1 style={{ margin: 0, fontSize: 56, lineHeight: 1.25, fontWeight: 800, color: '#fff' }}>
                เกี่ยวกับ<span style={{ color: '#f97316' }}>เรา</span>
              </h1>
              <Sparkle style={{ position: 'absolute', right: -44, top: -8, width: 40, height: 40 }} />
            </div>
            <p style={{ margin: '12px 0 0', display: 'inline-block', borderBottom: '3px solid #f97316', paddingBottom: 6, fontSize: 20, fontWeight: 600, color: '#fff' }}>
              พื้นที่สำหรับคนรักบอร์ดเกม
            </p>
          </div>

          <BannerArt className="banner-art" style={{ position: 'absolute', right: 0, bottom: 0, height: '100%', width: 'auto', pointerEvents: 'none' }} />
        </div>

        {/* จุดเริ่มต้น */}
        <section className="grid items-center gap-8 py-4 md:grid-cols-2 md:gap-12">
          <div className="relative overflow-hidden rounded-3xl shadow-md ring-1 ring-black/5">
            <BoxesScene className="block h-auto w-full" />
          </div>

          <div className="relative">
            <h2 className="text-2xl font-extrabold text-navy md:text-3xl">
              จุดเริ่มต้นของ <span className="text-brand">BoardGame Catalog</span>
            </h2>
            <span className="mt-2 block h-1 w-14 rounded-full bg-brand" aria-hidden="true" />
            <p className="mt-5 leading-relaxed text-slate-600">
              เราเริ่มต้นจากความรักในบอร์ดเกม และอยากให้ทุกคนได้ค้นหาเกมที่ชอบได้ง่ายขึ้น จึงเกิดเป็นเว็บไซต์ BoardGame Catalog
              ขึ้นมา เพื่อเป็นแหล่งรวมข้อมูลบอร์ดเกมหลากหลายประเภท พร้อมรีวิวและคำแนะนำที่เข้าใจง่าย
            </p>
          </div>
        </section>

        {/* จุดเด่น 3 ข้อ */}
        <ul className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${f.tone}`}>
                <Svg d={f.icon} className="h-8 w-8" />
              </span>
              <div>
                <h3 className="font-bold text-navy">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* แถบตัวเลข */}
        <div
          aria-label="สถิติ"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 16,
            background: NAVY_GRAD,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            boxShadow: '0 6px 16px rgba(15,31,75,.2)',
          }}
        >
          <Meeple tone="blue" style={{ position: 'absolute', left: -8, top: '50%', width: 96, height: 96, transform: 'translateY(-50%)', opacity: 0.15 }} />
          <Meeple tone="yellow" style={{ position: 'absolute', right: -8, top: '50%', width: 96, height: 96, transform: 'translateY(-50%)', opacity: 0.15 }} />
          <StatItem icon={<Dice style={{ width: 48, height: 48 }} />} value={`${stats.games}+`} label="เกม" />
          <StatItem icon={<Svg d={ICON.grid} className="h-10 w-10" />} value={stats.categories} label="หมวดหมู่" />
          <StatItem icon={<Svg d={ICON.users} className="h-11 w-11" />} value="1,000+" label="ผู้เล่น" />
        </div>

        {/* เป้าหมาย */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 16,
            padding: 28,
            background: 'linear-gradient(90deg,#fef3c7 0%,#fff7ed 55%,#fffbeb 100%)',
            border: '1px solid #fde68a',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', flexShrink: 0 }} aria-hidden="true">
              <Meeple tone="blue" style={{ width: 92, height: 92, filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.25))' }} />
              <Meeple tone="red" style={{ width: 108, height: 108, marginLeft: -16, filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.25))' }} />
              <Meeple tone="yellow" style={{ width: 92, height: 92, marginLeft: -16, filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.25))' }} />
              <Dice style={{ width: 56, height: 56, marginLeft: 4 }} />
            </div>

            <div style={{ flex: '1 1 280px', minWidth: 240 }}>
              <h2 className="text-xl font-extrabold text-navy md:text-2xl" style={{ margin: 0, color: '#0f1f4b' }}>เป้าหมายของเรา</h2>
              <span style={{ display: 'block', marginTop: 8, height: 4, width: 48, borderRadius: 4, background: '#f97316' }} aria-hidden="true" />
              <p style={{ margin: '12px 0 0', color: '#475569' }}>
                เรามุ่งมั่นที่จะเป็นแพลตฟอร์มที่ดีที่สุดสำหรับคนรักบอร์ดเกม ให้ทุกคนสามารถค้นหา เลือก และสนุกกับบอร์ดเกมได้อย่างเต็มที่
              </p>
            </div>

            <Link
              to="/categories"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '14px 28px', borderRadius: 12, background: '#f97316', color: '#fff', fontWeight: 700, boxShadow: '0 4px 10px rgba(249,115,22,.4)', textDecoration: 'none' }}
            >
              <Svg d={ICON.search} className="h-5 w-5" />
              เริ่มค้นหาเกม
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/* =====================================================================
   รูปทั้งหมดอยู่ที่ frontend/public/about/
   ถ้ายังไม่มีไฟล์ จะแสดง emoji แทนชั่วคราว หน้าเว็บจะไม่พัง
   ===================================================================== */
const IMG = {
  boxes: '/about/boxes.png', // กล่อง Catan / Splendor / Ticket to Ride + ลูกเต๋า (พื้นหลังโปร่งใส)
  vision: '/about/vision.png', // กล้องส่องทางไกล
  mission: '/about/mission.png', // โล่
  library: '/about/library.png', // ชั้นหนังสือ
  review: '/about/review.png', // ดาว + ยกนิ้ว
  tips: '/about/tips.png', // หลอดไฟ
  community: '/about/community.png', // ฟองคำพูด
}

/* ข้อมูลติดต่อ — แก้เป็นของจริงได้ที่นี่ */
const CONTACT = {
  email: 'info@boardgameclub.com',
  socials: [
    { label: 'Facebook', href: '#', icon: 'facebook' },
    { label: 'Discord', href: '#', icon: 'discord' },
    { label: 'Instagram', href: '#', icon: 'instagram' },
  ],
}

const NAVY_GRAD = 'linear-gradient(100deg,#0b1437 0%,#14275f 60%,#1d3a8a 100%)'

const FEATURES = [
  { img: IMG.library, emoji: '📚', title: 'คลังข้อมูลครบถ้วน', text: 'รวบรวมข้อมูลบอร์ดเกมไว้ในที่เดียว ค้นหาง่าย ดูได้ทันที' },
  { img: IMG.review, emoji: '👍', title: 'รีวิวตรงไปตรงมา', text: 'ข้อมูลและความเห็นที่เป็นกลาง ช่วยให้ตัดสินใจได้ง่ายขึ้น' },
  { img: IMG.tips, emoji: '💡', title: 'คำแนะนำที่ใช่', text: 'แนะนำเกมให้เหมาะกับจำนวนผู้เล่น เวลา และอายุ' },
  { img: IMG.community, emoji: '💬', title: 'สังคมแบ่งปัน', text: 'พูดคุยแลกเปลี่ยนกับคนรักบอร์ดเกมเหมือนกัน' },
]

const VISION_MISSION = [
  { img: IMG.vision, emoji: '🔭', title: 'วิสัยทัศน์ของเรา', text: 'เราตั้งใจเป็นคลังข้อมูลบอร์ดเกมอันดับ 1 ที่คนรักบอร์ดเกมเข้าถึงได้ง่ายที่สุด' },
  { img: IMG.mission, emoji: '🛡️', title: 'ภารกิจของเรา', text: 'เพื่อให้ชุมชนคนรักบอร์ดเกมเข้าถึงข้อมูลที่มีคุณภาพ ทันสมัย และแบ่งปันประสบการณ์ร่วมกัน' },
]

/* รูปที่มี fallback ถ้าไฟล์ยังไม่มี */
function Pic({ src, alt = '', fallback, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className={`grid place-items-center bg-slate-100 text-4xl ${className}`} aria-hidden="true">
        {fallback}
      </div>
    )
  }
  return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />
}

/* หัวข้อ + เส้นสีส้มใต้หัวข้อ */
function Heading({ children, center = false }) {
  return (
    <div className={center ? 'text-center' : ''}>
      <h2 className="text-2xl font-extrabold text-navy md:text-3xl">{children}</h2>
      <span className={`mt-2 block h-1 w-14 rounded-full bg-brand ${center ? 'mx-auto' : ''}`} aria-hidden="true" />
    </div>
  )
}

function SocialIcon({ name }) {
  const common = { viewBox: '0 0 24 24', className: 'h-6 w-6', 'aria-hidden': true }
  if (name === 'facebook') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z" />
      </svg>
    )
  }
  if (name === 'instagram') {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5h.01" />
      </svg>
    )
  }
  // discord
  return (
    <svg {...common} fill="currentColor">
      <path d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.1.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

export default function About() {
  useEffect(() => {
    document.title = 'เกี่ยวกับเรา | BoardGame Catalog'
  }, [])

  return (
    <div className="bg-[#fff8f0]">
      <div className="mx-auto max-w-6xl space-y-14 px-6 pb-16 pt-6">
        {/* ---------- แบนเนอร์ + จุดเริ่มต้น (รูปกล่องเกมลอยทับระหว่างสองส่วน) ---------- */}
        <div className="relative">
          <section
            className="relative overflow-hidden rounded-3xl px-8 py-10 shadow-lg md:min-h-[240px] md:px-14 md:py-14"
            style={{ background: NAVY_GRAD }}
          >
            {/* แสงตกแต่งพื้นหลัง */}
            <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full bg-orange-500/25 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" aria-hidden="true" />

            {/* ชื่อหัวข้อกับคำบรรยายอยู่คนละบรรทัด */}
            <div className="relative flex flex-col items-start gap-3">
              <h1 className="relative text-5xl font-extrabold leading-tight text-white md:text-6xl">
                เกี่ยวกับ<span className="text-brand">เรา</span>
                <svg viewBox="0 0 40 40" className="absolute -right-10 -top-2 h-9 w-9" fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <path d="M20 4v9M6 12l8 5M34 12l-8 5" />
                </svg>
              </h1>
              <p className="w-fit border-b-[3px] border-brand pb-1.5 text-lg font-semibold text-white md:text-xl">
                พื้นที่สำหรับคนรักบอร์ดเกม
              </p>
            </div>
          </section>

          <Pic
            src={IMG.boxes}
            fallback="🎲"
            alt="กล่องบอร์ดเกม Catan, Splendor และ Ticket to Ride พร้อมลูกเต๋า"
            className="relative z-10 mx-auto mt-6 w-3/4 max-w-md drop-shadow-2xl md:absolute md:-right-2 md:-top-4 md:mt-0 md:w-[55%] md:max-w-none"
          />

          <section className="px-2 pt-8 md:min-h-[140px] md:w-1/2 md:pr-8">
            <Heading>
              จุดเริ่มต้นของ <span className="text-brand">BoardGame Catalog</span>
            </Heading>
            <p className="mt-5 max-w-lg leading-relaxed text-slate-600">
              เราเริ่มต้นจากความรักในบอร์ดเกม และอยากให้ทุกคนค้นหาเกมที่ชอบได้ง่ายขึ้น จึงเกิดเป็นเว็บไซต์ BoardGame Catalog
              เพื่อเป็นแหล่งรวมข้อมูลบอร์ดเกมหลากหลายประเภท พร้อมรีวิวและคำแนะนำที่เข้าใจง่าย
            </p>
          </section>
        </div>

        {/* ---------- วิสัยทัศน์ & ภารกิจ ---------- */}
        <section className="grid gap-5 md:grid-cols-2">
          {VISION_MISSION.map((c) => (
            <div key={c.title} className="flex items-center gap-5 rounded-3xl bg-orange-100/70 p-6 shadow-sm ring-1 ring-orange-200/60">
              <Pic src={c.img} fallback={c.emoji} className="h-20 w-20 shrink-0 rounded-2xl object-contain" />
              <div>
                <h3 className="text-lg font-extrabold text-navy">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{c.text}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ---------- สิ่งที่เว็บนี้มอบให้ ---------- */}
        <section>
          <ul className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
                <Pic src={f.img} fallback={f.emoji} className="mx-auto h-24 w-24 rounded-2xl object-contain" />
                <h3 className="mt-4 font-bold text-navy">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- ติดต่อเรา ---------- */}
        <section
          className="flex flex-col items-center gap-6 rounded-3xl px-8 py-8 text-center shadow-md md:flex-row md:justify-between md:text-left"
          style={{ background: NAVY_GRAD }}
        >
          <div>
            <h2 className="text-xl font-extrabold text-white">ติดต่อเรา</h2>
            <a href={`mailto:${CONTACT.email}`} className="mt-2 flex items-center justify-center gap-2 text-sm text-white/90 hover:text-white md:justify-start">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
              {CONTACT.email}
            </a>
          </div>

          <ul className="flex items-center gap-3">
            {CONTACT.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-11 w-11 place-items-center rounded-full text-white ring-1 ring-white/30 transition hover:bg-white/15"
                >
                  <SocialIcon name={s.icon} />
                </a>
              </li>
            ))}
          </ul>

          <Link
            to="/categories"
            className="rounded-full bg-brand px-8 py-3.5 text-lg font-bold text-white shadow-lg transition hover:bg-brand-dark"
          >
            ค้นหาบอร์ดเกมเลย
          </Link>
        </section>
      </div>
    </div>
  )
}

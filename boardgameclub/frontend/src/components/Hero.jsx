import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Hero() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    navigate(`/games?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <section className="overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-navy via-[#1a2f6b] to-[#2a2a6e] text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-14 pt-8 md:grid-cols-2 md:pb-20">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            ค้นพบโลกของ
            <br />
            <span className="text-brand">บอร์ดเกม</span>ได้ที่นี่!
          </h1>
          <p className="mt-5 max-w-md text-white/85">
            รวมรายชื่อบอร์ดเกมมากมาย พร้อมรายละเอียด วิธีเล่น จำนวนผู้เล่น และเวลาที่ใช้
          </p>

          <form onSubmit={onSubmit} role="search"
                className="mt-8 flex max-w-md items-center rounded-full bg-white p-1.5 pl-5 text-slate-500 shadow-lg">
            <label htmlFor="hero-search" className="sr-only">ค้นหาบอร์ดเกม</label>
            <input id="hero-search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
                   placeholder="ค้นหาชื่อเกม, หมวดหมู่ หรือคำสำคัญ..."
                   className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
            <button type="submit" aria-label="ค้นหา"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"
                   strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </form>
        </div>

        {/* ที่ใส่ภาพ: ถ้ามีรูปจริง วางไว้ที่ public/hero.png แล้วแทนที่ div นี้ด้วย
            <img src="/hero.png" alt="" className="w-full" /> */}
        <div className="relative mx-auto hidden h-72 w-full max-w-md md:block" aria-hidden="true">
          <div className="absolute inset-x-4 bottom-0 h-40 rotate-[-6deg] rounded-3xl bg-gradient-to-br from-green-300 to-yellow-300 shadow-2xl" />
          <span className="absolute left-2 top-4 text-7xl">🎲</span>
          <span className="absolute right-6 top-0 text-8xl">🏰</span>
          <span className="absolute bottom-10 left-16 text-7xl">♟️</span>
          <span className="absolute bottom-6 right-20 text-7xl">🃏</span>
        </div>
      </div>
    </section>
  )
}
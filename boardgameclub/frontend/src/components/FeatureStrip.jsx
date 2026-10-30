import { Link } from 'react-router-dom'

const features = [
  { to: '/games', icon: '🎲', iconBg: 'bg-orange-100', title: 'เกมทั้งหมด', desc: '100 เกม' },
  { to: '/games?sort=popular', icon: '⭐', iconBg: 'bg-yellow-100', title: 'เกมยอดนิยม', desc: 'ดูเกมที่ได้รับความนิยม' },
  { to: '/games?sort=recommended', icon: '👥', iconBg: 'bg-blue-100', title: 'แนะนำสำหรับคุณ', desc: 'เลือกเกมที่เหมาะกับสไตล์ของคุณ' },
  { to: '/games?saved=1', icon: '❤️', iconBg: 'bg-rose-100', title: 'รายการโปรด', desc: 'เกมที่คุณชอบ' },
]

export default function FeatureStrip() {
  return (
    <section className="mx-auto max-w-7xl px-6">
      <ul className="grid grid-cols-1 gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-slate-200">
        {features.map((f) => (
          <li key={f.title} className="lg:px-6 lg:first:pl-0">
            <Link to={f.to} className="group flex items-center gap-4 rounded-xl p-2 transition hover:bg-white">
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-2xl ${f.iconBg}`}>
                {f.icon}
              </span>
              <span>
                <span className="block font-semibold text-navy">{f.title}</span>
                <span className="block text-sm text-slate-500">{f.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
import { Link } from 'react-router-dom'
import { categories } from '../data/categories.js'

export default function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-16">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy">หมวดหมู่บอร์ดเกม</h2>
        <Link to="/categories" className="text-sm font-medium text-navy hover:text-brand-dark">
          ดูทั้งหมด
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {categories.map((c, i) => (
          <li key={c.slug}>
            <Link to={`/games?category=${c.slug}`}
                  className={`group relative flex h-full min-h-44 flex-col justify-end rounded-2xl p-4 transition hover:-translate-y-1 hover:shadow-lg ${c.bg}`}>
              <span className={`absolute left-4 top-3 text-xl font-semibold ${c.num}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="absolute right-3 top-3 text-5xl" aria-hidden="true">{c.icon}</span>
              <span className="font-semibold leading-snug text-slate-800">{c.th}</span>
              <span className="mt-1 text-xs text-slate-500">{c.en}</span>
              <span className="mt-2 text-sm font-medium text-slate-700">{c.count} เกม</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
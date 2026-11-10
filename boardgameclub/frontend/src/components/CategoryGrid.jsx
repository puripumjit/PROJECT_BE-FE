import { Link } from 'react-router-dom'
import { categories } from '../data/categories'

export default function CategoryGrid() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      {/* หัวข้อ */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">หมวดหมู่บอร์ดเกม</h2>
        <Link to="/games" className="font-semibold hover:underline">
          ดูทั้งหมด
        </Link>
      </div>

      {/* กริดการ์ด */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((cat, i) => (
          <Link
            key={cat.slug}
            to={`/games?category=${cat.slug}`}
            className={`relative flex flex-col justify-between min-h-[220px] rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-lg ${cat.bg}`}
          >
            {/* เลขลำดับ */}
            <span className={`text-xl font-bold ${cat.num}`}>
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* ไอคอน: ใช้รูป (img) ถ้ามี ไม่งั้นใช้อีโมจิ (icon) */}
            {cat.img ? (
              <img
                src={cat.img}
                alt={cat.en}
                className="absolute top-3 right-3 w-16 h-16 object-contain"
              />
            ) : (
              <span className="absolute top-3 right-3 text-5xl leading-none">
                {cat.icon}
              </span>
            )}

            {/* ข้อความด้านล่าง */}
            <div>
              <h3 className="text-lg font-bold leading-snug">{cat.th}</h3>
              <p className="text-sm text-gray-500">{cat.en}</p>
              <p className="mt-2 font-semibold">{cat.count} เกม</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
import { useEffect, useState } from 'react'

const COVER_EXTS = ['jpg', 'png', 'webp']
const GRADIENTS = [
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-700',
  'from-sky-400 to-indigo-600',
  'from-rose-400 to-red-700',
  'from-violet-400 to-purple-700',
  'from-lime-400 to-green-700',
]

// className ใช้กำหนดขนาด เช่น 'aspect-square w-full' หรือ 'h-24 w-24'
export default function Cover({ game, className = 'aspect-square w-full', showBadge = true }) {
  const [i, setI] = useState(0)
  useEffect(() => setI(0), [game.slug])

  const sources = [
    game.cover_url,
    ...(game.slug ? COVER_EXTS.map((ext) => `/covers/${game.slug}.${ext}`) : []),
  ].filter(Boolean)
  const src = sources[i]

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl ${className}`}>
      {src ? (
        <img
          src={src}
          alt={game.name}
          loading="lazy"
          onError={() => setI((n) => n + 1)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={`grid h-full w-full place-items-center bg-gradient-to-br text-4xl font-bold text-white/90 ${
            GRADIENTS[(game.id ?? 0) % GRADIENTS.length]
          }`}
          aria-hidden="true"
        >
          {game.name?.slice(0, 2)}
        </div>
      )}
      {showBadge && game.is_recommended && (
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-brand-dark">
          แนะนำ
        </span>
      )}
    </div>
  )
}
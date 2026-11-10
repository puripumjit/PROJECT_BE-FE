// ตัวหมาก Meeple แบบ SVG (เปลี่ยนสีได้ผ่าน prop color)
export default function Meeple({ color = "#2f6fd6", size = 90, className = "" }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="M50 8c-9 0-15 6-15 14 0 4 1.5 7 4 9.5C30 36 18 42 10 52c-3 4-1 9 4 9h18c-2 8-6 16-11 24-2 4 0 8 5 8h50c5 0 7-4 5-8-5-8-9-16-11-24h18c5 0 7-5 4-9-8-10-20-16-29-20.500 2.500-2.500 4-5.500 4-9.500 0-8-6-14-15-14z"
        fill={color}
        stroke="rgba(0,0,0,.18)"
        strokeWidth="2"
      />
      <ellipse cx="42" cy="20" rx="6" ry="4" fill="rgba(255,255,255,.35)" />
    </svg>
  );
}

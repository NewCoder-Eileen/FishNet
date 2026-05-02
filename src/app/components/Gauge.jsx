// Reusable half-circle gauge — 40 ticks across a 180° arc, the first
// `value%`-worth tinted with `color` and the rest neutral.
export default function Gauge({
  value = 0,
  color = '#ef4d23',
  showLabels = false,
  min = '0',
  max = '100',
}) {
  const cx = 100
  const cy = 100
  const r  = 80
  const innerR = r - 10
  const totalTicks  = 40
  const activeTicks = Math.round((value / 100) * totalTicks)

  const ticks = []
  for (let i = 0; i < totalTicks; i++) {
    const t = i / (totalTicks - 1)
    const angle = Math.PI + t * Math.PI       // π → 2π (left → right across the top)
    const x1 = cx + Math.cos(angle) * innerR
    const y1 = cy + Math.sin(angle) * innerR
    const x2 = cx + Math.cos(angle) * r
    const y2 = cy + Math.sin(angle) * r
    ticks.push(
      <line
        key={i}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={i < activeTicks ? color : '#d4d4d8'}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    )
  }

  return (
    <div className="w-full flex flex-col items-center" style={{ maxWidth: 260 }}>
      <svg viewBox="0 0 200 120" className="w-full h-auto">
        {ticks}
        <text
          x={cx}
          y={105}
          textAnchor="middle"
          fontSize="22"
          fontWeight="600"
          fill="#0b0f1a"
        >
          {value}%
        </text>
      </svg>
      {showLabels && (
        <div className="w-full flex justify-between text-[11px] text-neutral-500 -mt-2">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}

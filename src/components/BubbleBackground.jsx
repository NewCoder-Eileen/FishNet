import { useMemo } from 'react'

export default function BubbleBackground({ count = 14 }) {
  const bubbles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    size:  10 + Math.random() * 34,
    left:  3  + Math.random() * 94,
    delay: Math.random() * 10,
    dur:   7  + Math.random() * 9,
    drift: (Math.random() - 0.5) * 40,
  })), [count])

  return (
    <div className="bg-bubbles" aria-hidden>
      {bubbles.map(b => (
        <div
          key={b.id}
          className="bg-bubble"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
            '--drift': `${b.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

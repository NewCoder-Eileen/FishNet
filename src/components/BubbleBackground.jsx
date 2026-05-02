import { useMemo } from 'react'

export default function BubbleBackground({ count = 14 }) {
  const bubbles = useMemo(() => Array.from({ length: count }, (_, i) => {
    const size = 8 + Math.random() * 32
    return {
      id: i,
      size,
      left:  3 + Math.random() * 94,
      delay: Math.random() * 16,
      // 18–34s; larger bubbles biased a bit slower
      dur:   18 + Math.random() * 12 + (size / 40) * 4,
      drift: (Math.random() - 0.5) * 70,
      wobble: 12 + Math.random() * 20,
    }
  }), [count])

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
            '--drift':  `${b.drift}px`,
            '--wobble': `${b.wobble}px`,
          }}
        />
      ))}
    </div>
  )
}

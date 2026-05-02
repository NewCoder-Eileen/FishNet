import { useMemo } from 'react'
import jellyfishPink from '../../assets/jellyfish-pink.png'
import jellyfishBlue from '../../assets/jellyfish-blue.png'

const JELLY_VARIANTS = [jellyfishPink, jellyfishBlue]

// Slow drifting jellyfish behind the hero. Uses the existing `.bg-jellyfish`
// animation from App.css so motion stays consistent with the original Home.
export default function JellyfishField({ count = 6 }) {
  const jellies = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id:      i,
    src:     JELLY_VARIANTS[Math.floor(Math.random() * JELLY_VARIANTS.length)],
    left:    5  + Math.random() * 88,
    bottom: -25 + Math.random() * 30,
    size:   80  + Math.random() * 110,
    delay:       Math.random() * 20,
    dur:    26  + Math.random() * 18,
    drift:  (Math.random() - 0.5) * 110,
    rotate: (Math.random() - 0.5) * 20,
    opacity: 0.55 + Math.random() * 0.3,
  })), [count])

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 2 }}
      aria-hidden
    >
      {jellies.map(j => (
        <img
          key={j.id}
          src={j.src}
          className="bg-jellyfish"
          style={{
            left: `${j.left}%`,
            bottom: `${j.bottom}%`,
            width: j.size,
            '--jdrift':  `${j.drift}px`,
            '--jrotate': `${j.rotate}deg`,
            '--jopacity': j.opacity,
            animationDuration: `${j.dur}s`,
            animationDelay:    `${j.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

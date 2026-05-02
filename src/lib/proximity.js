// Jaccard similarity: |A ∩ B| / |A ∪ B|. Returns 0 when both sets empty.
function jaccard(a, b) {
  const A = new Set(a || [])
  const B = new Set(b || [])
  if (A.size === 0 && B.size === 0) return 0
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  const union = A.size + B.size - inter
  return union === 0 ? 0 : inter / union
}

// Count of friends both have in common, normalized so 5+ mutuals = 1.0
function mutualScore(a, b) {
  const A = new Set(a || [])
  const B = new Set(b || [])
  let count = 0
  for (const x of A) if (B.has(x)) count++
  return Math.min(count / 5, 1)
}

export const WEIGHTS = {
  interests: 0.5,
  goals:     0.3,
  mutuals:   0.2,
}

// Score in [0, 1]. Higher = more similar.
export function proximityScore(me, other) {
  const interests = jaccard(me.interests, other.interests)
  const goals     = jaccard(me.goals,     other.goals)
  const mutuals   = mutualScore(me.connections, other.connections)
  return (
    interests * WEIGHTS.interests +
    goals     * WEIGHTS.goals +
    mutuals   * WEIGHTS.mutuals
  )
}

// Same calculation, but returns the breakdown for debugging / UI.
export function proximityBreakdown(me, other) {
  return {
    interests: jaccard(me.interests, other.interests),
    goals:     jaccard(me.goals,     other.goals),
    mutuals:   mutualScore(me.connections, other.connections),
  }
}

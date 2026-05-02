import { getSession } from './auth'

// Legacy single-key path. New code writes per-user keys so demo data and
// each real account's edits stay isolated from one another.
export const PROFILE_KEY = 'fishnet_profile'

function profileKeyFor(username) {
  return username ? `fishnet_profile_${username}` : PROFILE_KEY
}

// Sample profile pre-loaded on first demo login (won't overwrite an existing one).
export const DEMO_PROFILE = {
  name: 'Demo Fish',
  bio:  'Friendly demo profile for showing off FishNet.',
  socials: {
    email:    'demo@fishnet.app',
    github:   'https://github.com/anthropics',
    linkedin: 'https://linkedin.com/in/example',
    twitter:  'https://x.com/example',
    website:  'https://fishnet.app',
  },
  customLinks: [
    { label: 'Portfolio', url: 'https://example.com' },
  ],
  interests: ['hackathons', 'design', 'open source', 'coffee'],
  goals:     ['cofounder', 'mentor', 'collaborators'],
  connections: [],
  resume:    'https://example.com/resume.pdf',
  spotifyPlaylist: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
  fish: { styleId: 'clownfish' },
}

// Seed the demo user's profile only — never the global key. This keeps the
// canned demo data scoped to the `demo` account so it can't leak into a real
// user's profile.
export function seedDemoProfileIfEmpty() {
  const key = profileKeyFor('demo')
  if (localStorage.getItem(key)) return
  localStorage.setItem(key, JSON.stringify(DEMO_PROFILE))
}

export const EMPTY_PROFILE = {
  name: '',
  bio: '',
  socials: {},
  customLinks: [],
  interests: [],
  goals: [],
  connections: [],
  resume: '',
  spotifyPlaylist: '',
  fish: { styleId: 'clownfish' },
}

export function loadProfile() {
  const session  = getSession()
  const username = session?.username
  const key      = profileKeyFor(username)

  let stored = null
  try { stored = JSON.parse(localStorage.getItem(key) || 'null') } catch {}

  // One-time migration: if a real (non-demo) user has no per-user profile yet
  // but a legacy global profile exists, adopt it — unless that legacy profile
  // is just the seeded demo template, which would leak demo data.
  if (!stored && username && username !== 'demo') {
    try {
      const legacy = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
      const looksLikeDemoSeed =
        legacy && legacy.name === DEMO_PROFILE.name && legacy.bio === DEMO_PROFILE.bio
      if (legacy && !looksLikeDemoSeed) {
        localStorage.setItem(key, JSON.stringify(legacy))
        stored = legacy
      }
    } catch {}
  }

  return { ...EMPTY_PROFILE, ...(stored || {}) }
}

export function saveProfile(profile) {
  const session = getSession()
  localStorage.setItem(profileKeyFor(session?.username), JSON.stringify(profile))
}

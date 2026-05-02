export const PROFILE_KEY = 'fishnet_profile'

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

export function seedDemoProfileIfEmpty() {
  if (localStorage.getItem(PROFILE_KEY)) return
  localStorage.setItem(PROFILE_KEY, JSON.stringify(DEMO_PROFILE))
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
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
    return { ...EMPTY_PROFILE, ...(stored || {}) }
  } catch {
    return { ...EMPTY_PROFILE }
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

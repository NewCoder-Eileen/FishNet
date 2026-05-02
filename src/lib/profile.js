import { db } from './firebase'
import { ref as dbRef, get, set, onValue } from 'firebase/database'
import { getSession } from './auth'

function encodeKey(k) {
  return (k || '').toLowerCase().replace(/[.#$[\]/]/g, '_')
}

const profilesRoot      = ()    => dbRef(db, 'profiles')
const profilePathByName = (u)   => dbRef(db, `profiles/${encodeKey(u)}`)

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

export async function loadProfile() {
  const session = getSession()
  const username = session?.username
  if (!username) return { ...EMPTY_PROFILE }
  const snap = await get(profilePathByName(username))
  return { ...EMPTY_PROFILE, ...(snap.exists() ? (snap.val() || {}) : {}) }
}

export async function loadProfileFor(username) {
  if (!username) return null
  const snap = await get(profilePathByName(username))
  return snap.exists() ? snap.val() : null
}

export async function saveProfile(profile) {
  const session = getSession()
  if (!session?.username) return
  await set(profilePathByName(session.username), profile)
}

export async function seedDemoProfileIfEmpty() {
  const snap = await get(profilePathByName('demo'))
  if (!snap.exists()) await set(profilePathByName('demo'), DEMO_PROFILE)
}

export function subscribeProfiles(onChange) {
  const r = profilesRoot()
  return onValue(r, (snap) => onChange(snap.exists() ? (snap.val() || {}) : {}))
}

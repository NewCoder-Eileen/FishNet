export const PROFILE_KEY = 'fishnet_profile'

export const EMPTY_PROFILE = {
  name: '',
  bio: '',
  socials: {},
  customLinks: [],
  interests: [],
  goals: [],
  connections: [],
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

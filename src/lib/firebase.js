import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// ── Setup (do this once) ────────────────────────────────────────────────────
// 1. Go to https://console.firebase.google.com
// 2. Create a project → Add a web app → copy the config values below
// 3. In the console: Build → Realtime Database → Create database
//    → choose a region → Start in TEST MODE
// ───────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyCCUeSckyAt51woRNvhF0khHoEZfS180Is',
  authDomain:        'fishnet-72781.firebaseapp.com',
  projectId:         'fishnet-72781',
  storageBucket:     'fishnet-72781.firebasestorage.app',
  messagingSenderId: '439845806007',
  appId:             '1:439845806007:web:789546cf9ae5e0e75fd232',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

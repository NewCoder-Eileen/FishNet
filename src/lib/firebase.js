import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// ── Setup (do this once) ────────────────────────────────────────────────────
// 1. Go to https://console.firebase.google.com
// 2. Create a project → Add a web app → copy the config values below
// 3. In the console: Build → Realtime Database → Create database
//    → choose a region → Start in TEST MODE
// ───────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'PASTE_HERE',
  authDomain:        'PASTE_HERE',
  databaseURL:       'PASTE_HERE',
  projectId:         'PASTE_HERE',
  storageBucket:     'PASTE_HERE',
  messagingSenderId: 'PASTE_HERE',
  appId:             'PASTE_HERE',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

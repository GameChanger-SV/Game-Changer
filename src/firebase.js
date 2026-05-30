import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCxUt5wfjeffYOS00BD_VsJbfcJC148EvM",
  authDomain: "gc-wro-judging-2026.firebaseapp.com",
  projectId: "gc-wro-judging-2026",
  storageBucket: "gc-wro-judging-2026.firebasestorage.app",
  messagingSenderId: "977245403814",
  appId: "1:977245403814:web:baf09a63e12ba863299267",
  measurementId: "G-S3CH3TJ612"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app

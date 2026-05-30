import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  getAuth,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'
import { auth, db } from '../firebase'
import app from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        setProfile(snap.exists() ? snap.data() : null)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)

  const logout = () => signOut(auth)

  // Crea un juez usando una instancia secundaria de Firebase
  // para no cerrar la sesión del admin
  const createJudge = async ({ email, password, name, category, judgeId }) => {
    // Usa una app secundaria temporal para no desloguear al admin
    const secondaryAppName = 'secondary-' + Date.now()
    const secondaryApp = initializeApp(app.options, secondaryAppName)
    const secondaryAuth = getAuth(secondaryApp)

    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email,
        name,
        role: 'judge',
        category,
        judgeId,
        createdAt: new Date().toISOString(),
      })
      await signOut(secondaryAuth)
      return cred.user
    } finally {
      // Eliminar la app secundaria para no acumular instancias
      await secondaryApp.delete()
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, createJudge }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

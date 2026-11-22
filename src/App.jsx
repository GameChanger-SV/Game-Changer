import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import AdminDashboard from './components/admin/AdminDashboard'
import JudgeDashboard from './components/judge/JudgeDashboard'
import ModuleSelector from './components/ModuleSelector'
import GCAdminDashboard from './components/gcfest/GCAdminDashboard'

// Recordar la competencia elegida mientras la pestaña siga abierta
const MODULE_KEY = 'admin_module'
function readModule() {
  try { return sessionStorage.getItem(MODULE_KEY) } catch { return null }
}
function writeModule(value) {
  try {
    if (value) sessionStorage.setItem(MODULE_KEY, value)
    else sessionStorage.removeItem(MODULE_KEY)
  } catch { /* sin almacenamiento: solo se pierde al recargar */ }
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  const [adminModule, setAdminModule] = useState(readModule)

  const chooseModule = (value) => { writeModule(value); setAdminModule(value) }

  // Al cerrar sesión, el próximo ingreso vuelve a mostrar los recuadros
  useEffect(() => { if (!loading && !user) chooseModule(null) }, [user, loading])

  const spinner = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-dark-500 border-t-brand-orange rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Cargando...</p>
      </div>
    </div>
  )

  if (loading) return spinner
  if (!user) return <Login />
  if (!profile) return spinner  // usuario autenticado pero perfil aún cargando

  if (profile.role === 'admin') {
    const back = () => chooseModule(null)
    if (adminModule === 'wro')    return <AdminDashboard onSwitchModule={back} />
    if (adminModule === 'gcfest') return <GCAdminDashboard onSwitchModule={back} />
    return <ModuleSelector onSelect={chooseModule} />
  }
  if (profile.role === 'judge') return <JudgeDashboard />

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Cuenta sin rol asignado. Contacta al administrador.
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

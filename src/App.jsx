import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import AdminDashboard from './components/admin/AdminDashboard'
import JudgeDashboard from './components/judge/JudgeDashboard'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-dark-500 border-t-brand-orange rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  if (profile?.role === 'admin') return <AdminDashboard />
  if (profile?.role === 'judge') return <JudgeDashboard />

  // Sin perfil asignado
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

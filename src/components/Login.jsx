import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden relative">

      {/* ── Photo collage background (left side) ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/60 via-dark-950/30 to-dark-950/80 z-10" />

        {/* Three photos staggered */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 flex gap-2 p-4"
        >
          {/* Column 1 — tall */}
          <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="/photos/photo1.png"
              alt="Competencia WRO"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Column 2 — two stacked */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/photos/photo2.png"
                alt="Equipos WRO"
                className="w-full h-full object-cover"
                style={{ objectPosition: '50% 20%' }}
              />
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/photos/photo3.png"
                alt="Jueces WRO"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </motion.div>

        {/* Bottom text over photos */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-10 bg-gradient-to-t from-dark-950/90 to-transparent">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Game Changer Robotics</p>
            <h2 className="text-white text-3xl font-extrabold leading-tight">
              Liga Nacional<br />de Robótica <span className="text-brand-orange">2026</span>
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Sistema de evaluación oficial · WRO El Salvador
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right side: login form ── */}
      <div className="w-full lg:w-[520px] flex-shrink-0 flex flex-col items-center justify-center p-8 bg-dark-950 relative">

        {/* Subtle orbs */}
        <div className="absolute top-10 right-10 w-48 h-48 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-64 h-64 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-orange/10 border border-brand-orange/30 mb-5 glow-orange"
            >
              <img src="/gc-logo.png" alt="GC" className="w-10 h-10 object-contain"
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
              />
              <span className="text-brand-orange font-extrabold text-xl hidden items-center justify-center">GC</span>
            </motion.div>

            <h1 className="text-2xl font-extrabold text-white leading-tight">
              Liga Nacional de<br />
              <span className="text-brand-orange">Robótica</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Game Changer · WRO 2026</p>

            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="badge-elementary text-xs">Elementary</span>
              <span className="badge-junior text-xs">Junior</span>
              <span className="badge-senior text-xs">Senior</span>
            </div>
          </div>

          {/* Card */}
          <div className="card">
            <h2 className="text-lg font-bold mb-5 text-white">Iniciar sesión</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">Correo electrónico</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="juez@ejemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><LogIn size={18} /> Entrar</>
                )}
              </motion.button>
            </form>
          </div>

          <p className="text-center text-gray-600 text-xs mt-6">
            Game Changer Robotics · WRO El Salvador 2026
          </p>
        </motion.div>
      </div>
    </div>
  )
}

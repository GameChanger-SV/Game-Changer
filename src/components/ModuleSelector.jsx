import { motion } from 'framer-motion'
import { LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { GC_PURPLE } from './gcfest/gcScoringData'

// Pantalla de entrada del administrador: elegir entre WRO Practices 2026 y GC Fest
const MODULES = [
  {
    id: 'wro',
    title: 'WRO Practices 2026',
    subtitle: 'RoboMission · RoboStarter',
    logo: '/logos/wro-2026.png',
    accent: 'border-brand-orange/40 hover:border-brand-orange',
    textColor: 'text-brand-orange',
  },
  {
    id: 'gcfest',
    title: 'GC Fest',
    subtitle: 'Elementary · Junior · Senior',
    logo: '/logos/gcfest-2026.png',
    accent: 'border-senior/40 hover:border-senior',
    textColor: 'text-senior',
  },
]

export default function ModuleSelector({ onSelect }) {
  const { profile, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 grid-bg">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-white">Selecciona una competencia</h1>
        <p className="text-gray-400 mt-2">Hola, {profile?.name || 'Administrador'}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-3xl">
        {MODULES.map((m, i) => (
          <motion.button
            key={m.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(m.id)}
            className={`card ${m.accent} transition-colors text-center flex flex-col items-center gap-4 py-8`}
          >
            <div className="h-44 flex items-center justify-center">
              <img src={m.logo} alt={m.title} className="max-h-44 max-w-full object-contain" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{m.title}</p>
              <p className="text-sm text-gray-400 mt-1">{m.subtitle}</p>
              {m.id === 'gcfest' && (
                <p className="text-sm font-semibold mt-2" style={{ color: GC_PURPLE }}>
                  Rescate Patrimonial en Joya de Cerén
                </p>
              )}
            </div>
            <span className={`flex items-center gap-1 text-sm font-medium ${m.textColor}`}>
              Entrar <ChevronRight size={16} />
            </span>
          </motion.button>
        ))}
      </div>

      <button onClick={logout}
        className="mt-10 flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  )
}

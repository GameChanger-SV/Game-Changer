import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Trophy, LogOut, ChevronRight, LayoutDashboard, UserPlus, Flag, BarChart2, Medal } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import JudgeManagement from './JudgeManagement'
import TeamManagement from './TeamManagement'
import ResultsView from './ResultsView'
import RankingView from './RankingView'

const NAV = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'judges', label: 'Jueces', icon: Users },
  { id: 'teams', label: 'Equipos', icon: Trophy },
  { id: 'results', label: 'Resultados', icon: BarChart2 },
  { id: 'ranking', label: 'Ranking', icon: Medal },
]

export default function AdminDashboard() {
  const { profile, logout } = useAuth()
  const [tab, setTab] = useState('overview')

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-900 border-r border-dark-600 flex flex-col p-4 fixed h-full z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="w-9 h-9 rounded-xl bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center">
            <Flag size={18} className="text-brand-orange" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">WRO Judging</p>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === id
                  ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/20'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-dark-600 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 p-8">
        <AnimatePresence mode="wait">
          {tab === 'overview' && <OverviewTab key="overview" setTab={setTab} />}
          {tab === 'judges' && <JudgeManagement key="judges" />}
          {tab === 'teams' && <TeamManagement key="teams" />}
          {tab === 'results' && <ResultsView key="results" />}
          {tab === 'ranking' && <RankingView key="ranking" />}
        </AnimatePresence>
      </main>
    </div>
  )
}

function OverviewTab({ setTab }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Panel de Administración</h1>
        <p className="text-gray-400 mt-1">WRO RoboMission 2026 – Game Changer Robotics</p>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { cat: 'elementary', label: 'Elementary', ages: '8–12 años', color: 'elementary', max: 255 },
          { cat: 'junior', label: 'Junior', ages: '11–15 años', color: 'junior', max: 230 },
          { cat: 'senior', label: 'Senior', ages: '14–22 años', color: 'senior', max: 233 },
        ].map(({ cat, label, ages, color, max }) => (
          <motion.div
            key={cat}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`card border-${color}/30 bg-gradient-to-br from-${color}/10 to-transparent cursor-pointer`}
            onClick={() => setTab('teams')}
          >
            <span className={`badge-${color} mb-3 inline-block`}>{label}</span>
            <p className="text-2xl font-extrabold text-white">{ages}</p>
            <p className="text-gray-400 text-sm mt-1">Máx. {max} puntos / ronda</p>
            <div className={`mt-3 text-${color} flex items-center gap-1 text-sm font-medium`}>
              Ver equipos <ChevronRight size={16} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setTab('judges')}
          className="card-hover flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
            <UserPlus size={24} className="text-brand-orange" />
          </div>
          <div>
            <p className="font-semibold text-white">Gestionar Jueces</p>
            <p className="text-sm text-gray-400">Crear y administrar cuentas de jueces</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setTab('teams')}
          className="card-hover flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-cyan/15 flex items-center justify-center shrink-0">
            <Trophy size={24} className="text-brand-cyan" />
          </div>
          <div>
            <p className="font-semibold text-white">Gestionar Equipos</p>
            <p className="text-sm text-gray-400">Registrar equipos y asignar a jueces</p>
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}

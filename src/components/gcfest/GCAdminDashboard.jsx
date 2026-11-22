import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Trophy, LogOut, ChevronRight, LayoutDashboard, UserPlus, BarChart2, Medal, Building2, Star, Calendar, ArrowLeftRight } from 'lucide-react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import InstitutionManagement from '../admin/InstitutionManagement'
import EventManagement from '../admin/EventManagement'
import GCJudgeManagement from './GCJudgeManagement'
import GCTeamManagement from './GCTeamManagement'
import GCResultsView from './GCResultsView'
import GCRankingView from './GCRankingView'
import { GC_CATEGORIES, GC_CAT_CONFIG, GC_TEAMS_COL, GC_SCORES_COL, GC_PURPLE, rankGCTeams } from './gcScoringData'

const NAV_GC = [
  { id: 'gc_overview', label: 'Resumen',          icon: LayoutDashboard },
  { id: 'gc_judges',   label: 'Jueces GC Fest',    icon: Users },
  { id: 'gc_teams',    label: 'Equipos GC Fest',   icon: Trophy },
  { id: 'gc_results',  label: 'Resultados GC Fest', icon: BarChart2 },
  { id: 'gc_ranking',  label: 'Ranking GC Fest',   icon: Medal },
]

// Eventos e Instituciones son compartidos con WRO Practices
const NAV_SHARED = [
  { id: 'events',       label: 'Eventos',       icon: Calendar  },
  { id: 'institutions', label: 'Instituciones', icon: Building2 },
]

export default function GCAdminDashboard({ onSwitchModule }) {
  const { profile, logout } = useAuth()
  const [tab, setTab] = useState('gc_overview')
  const [initEventId, setInitEventId] = useState(null)

  const navButton = ({ id, label, icon: Icon }, activeClass) => (
    <button key={id} onClick={() => setTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        tab === id ? activeClass : 'text-gray-400 hover:text-white hover:bg-dark-700'
      }`}>
      <Icon size={18} />
      {label}
    </button>
  )

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-900 border-r border-dark-600 flex flex-col p-4 fixed h-full z-10 overflow-y-auto">
        <div className="flex items-center gap-3 px-2 py-4 mb-4">
          <img src="/logos/gcfest-2026.png" alt="GC Fest" className="w-10 h-10 object-contain" />
          <div>
            <p className="font-bold text-white text-sm leading-tight">GC Fest</p>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5">
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 pt-1 pb-1.5">GC Fest</p>
          {NAV_GC.map(item => navButton(item, 'bg-senior/15 text-senior border border-senior/20'))}

          <div className="border-t border-dark-600 mx-1 my-3" />
          {NAV_SHARED.map(item => navButton(item, 'bg-dark-600 text-white border border-dark-500'))}
        </nav>

        <div className="border-t border-dark-600 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-senior/20 flex items-center justify-center text-senior font-bold text-sm">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
            </div>
          </div>
          <button onClick={onSwitchModule}
            className="w-full flex items-center gap-2 px-3 py-2 mb-1 text-sm text-gray-400 hover:text-white hover:bg-dark-700 rounded-xl transition-all">
            <ArrowLeftRight size={16} /> Cambiar competencia
          </button>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">
        <AnimatePresence mode="wait">
          {tab === 'gc_overview'  && <GCOverview key="gc_overview" setTab={setTab} />}
          {tab === 'gc_judges'    && <GCJudgeManagement key="gc_judges" />}
          {tab === 'gc_teams'     && <GCTeamManagement key="gc_teams" />}
          {tab === 'gc_results'   && <GCResultsView key="gc_results" initEventId={initEventId} />}
          {tab === 'gc_ranking'   && <GCRankingView key="gc_ranking" />}
          {tab === 'institutions' && <InstitutionManagement key="institutions" />}
          {tab === 'events'       && <EventManagement key="events" onView={(evId) => { setInitEventId(evId); setTab('gc_results') }} />}
        </AnimatePresence>
      </main>
    </div>
  )
}

// ─── Resumen GC Fest ───────────────────────────────────────────────────────

function GCOverview({ setTab }) {
  const [teams, setTeams]   = useState([])
  const [scores, setScores] = useState([])
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('all')

  useEffect(() => {
    const u1 = onSnapshot(collection(db, GC_TEAMS_COL),  snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, GC_SCORES_COL), snap => setScores(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u3 = onSnapshot(collection(db, 'events'), snap => {
      const evs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setEvents(evs)
      const active = evs.find(e => e.active)
      if (active) setSelectedEventId(prev => prev === 'all' ? active.id : prev)
    })
    return () => { u1(); u2(); u3() }
  }, [])

  const filteredScores = selectedEventId === 'all'
    ? scores
    : scores.filter(s => s.eventId === selectedEventId)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div className="mb-6 flex items-center gap-4">
        <img src="/logos/gcfest-2026.png" alt="GC Fest" className="w-20 h-20 object-contain" />
        <div>
          <h1 className="text-3xl font-extrabold text-white">Panel GC Fest</h1>
          <p className="text-lg font-bold" style={{ color: GC_PURPLE }}>Rescate Patrimonial en Joya de Cerén</p>
        </div>
      </div>

      {/* Event selector */}
      {events.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Calendar size={14} className="text-gray-500 shrink-0" />
          <span className="text-xs text-gray-500">Evento:</span>
          {[{ id: 'all', name: 'Todos', date: '' }, ...events].map(ev => (
            <button key={ev.id} onClick={() => setSelectedEventId(ev.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedEventId === ev.id
                  ? ev.active ? 'bg-brand-orange/20 border-brand-orange text-brand-orange' : 'bg-dark-600 border-dark-400 text-white'
                  : 'border-dark-500 text-gray-400 hover:text-white hover:border-dark-400'
              }`}>
              {ev.name}{ev.active && <span className="ml-1 text-brand-orange">●</span>}
            </button>
          ))}
        </div>
      )}

      {/* Top 3 per category (suma de rondas, desempate por tiempo total) */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {GC_CATEGORIES.map(cat => {
          const top3 = rankGCTeams(teams.filter(t => t.category === cat), filteredScores)
            .filter(r => r.total !== null).slice(0, 3)
          return (
            <motion.div key={cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`card border-${cat}/30 bg-gradient-to-br from-${cat}/10 to-transparent`}>
              <div className="flex items-center gap-2 mb-4">
                <Star size={14} className={`text-${cat}`} />
                <span className={`badge-${cat} text-xs`}>{GC_CAT_CONFIG[cat].label}</span>
              </div>
              {top3.length === 0 ? (
                <p className="text-gray-600 text-sm">Sin puntajes aún</p>
              ) : (
                <div className="space-y-3">
                  {top3.map(({ team, total, totalTime }, i) => (
                    <div key={team.id} className={`flex items-center gap-2 ${i === 0 ? '' : 'opacity-75'}`}>
                      <span className="text-base shrink-0">{medals[i]}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${i === 0 ? 'text-white' : 'text-gray-300'}`}>{team.name}</p>
                        {team.school && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Building2 size={10} className="text-gray-600 shrink-0" />
                            <p className="text-xs text-gray-500 truncate">{team.school}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-mono font-bold text-sm text-${cat}`}>{total}</p>
                        <p className="text-xs text-gray-600">{totalTime !== null ? `⏱ ${totalTime}s` : 'tiempo incompleto'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {GC_CATEGORIES.map(cat => (
          <motion.div key={cat} whileHover={{ y: -4, scale: 1.01 }}
            className={`card border-${cat}/30 bg-gradient-to-br from-${cat}/10 to-transparent cursor-pointer`}
            onClick={() => setTab('gc_teams')}>
            <span className={`badge-${cat} mb-3 inline-block`}>{GC_CAT_CONFIG[cat].label}</span>
            <p className="text-lg font-extrabold leading-tight" style={{ color: GC_PURPLE }}>{GC_CAT_CONFIG[cat].theme}</p>
            <p className="text-gray-400 text-sm mt-1">Máx. {GC_CAT_CONFIG[cat].max} puntos / ronda</p>
            <div className={`mt-3 text-${cat} flex items-center gap-1 text-sm font-medium`}>
              Ver equipos <ChevronRight size={16} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={() => setTab('gc_judges')} className="card-hover flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-senior/15 flex items-center justify-center shrink-0">
            <UserPlus size={24} className="text-senior" />
          </div>
          <div>
            <p className="font-semibold text-white">Gestionar Jueces GC Fest</p>
            <p className="text-sm text-gray-400">Crear y administrar cuentas de jueces</p>
          </div>
        </motion.button>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={() => setTab('gc_teams')} className="card-hover flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-brand-cyan/15 flex items-center justify-center shrink-0">
            <Trophy size={24} className="text-brand-cyan" />
          </div>
          <div>
            <p className="font-semibold text-white">Gestionar Equipos GC Fest</p>
            <p className="text-sm text-gray-400">Registrar equipos y asignar a jueces</p>
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}

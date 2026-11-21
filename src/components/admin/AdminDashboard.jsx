import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Trophy, LogOut, ChevronRight, LayoutDashboard, UserPlus, Flag, BarChart2, Medal, Building2, Star, Swords, Calendar, ArrowLeftRight } from 'lucide-react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import JudgeManagement from './JudgeManagement'
import TeamManagement from './TeamManagement'
import ResultsView from './ResultsView'
import RankingView from './RankingView'
import InstitutionManagement from './InstitutionManagement'
import EventManagement from './EventManagement'
import RSResumenView from './rs/RSResumenView'
import RSJudgeManagement from './rs/RSJudgeManagement'
import RSTeamManagement from './rs/RSTeamManagement'
import RSResultsView from './rs/RSResultsView'
import RSRankingView from './rs/RSRankingView'

const NAV_RM = [
  { id: 'overview',  label: 'Resumen',       icon: LayoutDashboard },
  { id: 'judges',    label: 'Jueces RM',      icon: Users },
  { id: 'teams',     label: 'Equipos RM',     icon: Trophy },
  { id: 'results',   label: 'Resultados RM',  icon: BarChart2 },
  { id: 'ranking',   label: 'Ranking RM',     icon: Medal },
]

const NAV_RS = [
  { id: 'rs_overview', label: 'Resumen RS',      icon: LayoutDashboard },
  { id: 'rs_judges',   label: 'Jueces RS',        icon: Users },
  { id: 'rs_teams',    label: 'Equipos RS',       icon: Swords },
  { id: 'rs_results',  label: 'Resultados RS',    icon: BarChart2 },
  { id: 'rs_ranking',  label: 'Ranking RS',       icon: Medal },
]

export default function AdminDashboard({ onSwitchModule }) {
  const { profile, logout } = useAuth()
  const [tab, setTab] = useState('overview')
  const [initEventId, setInitEventId] = useState(null)

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-900 border-r border-dark-600 flex flex-col p-4 fixed h-full z-10 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-4 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center">
            <Flag size={18} className="text-brand-orange" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">WRO Judging</p>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {/* ── RoboMission ── */}
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 pt-1 pb-1.5">RoboMission</p>
          {NAV_RM.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === id
                  ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/20'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}>
              <Icon size={18} />
              {label}
            </button>
          ))}

          {/* ── RoboStarter ── */}
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 pt-4 pb-1.5">RoboStarter</p>
          {NAV_RS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === id
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}>
              <Icon size={18} />
              {label}
            </button>
          ))}

          {/* ── Separador + sección global ── */}
          <div className="border-t border-dark-600 mx-1 my-3" />
          {[
            { id: 'events',       label: 'Eventos',       icon: Calendar  },
            { id: 'institutions', label: 'Instituciones', icon: Building2 },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === id
                  ? 'bg-dark-600 text-white border border-dark-500'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-dark-600 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-sm">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
            </div>
          </div>
          {onSwitchModule && (
            <button onClick={onSwitchModule}
              className="w-full flex items-center gap-2 px-3 py-2 mb-1 text-sm text-gray-400 hover:text-white hover:bg-dark-700 rounded-xl transition-all">
              <ArrowLeftRight size={16} /> Cambiar competencia
            </button>
          )}
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 p-8">
        <AnimatePresence mode="wait">
          {tab === 'overview'      && <OverviewTab key="overview" setTab={setTab} />}
          {tab === 'judges'        && <JudgeManagement key="judges" />}
          {tab === 'teams'         && <TeamManagement key="teams" />}
          {tab === 'results'       && <ResultsView key="results" initEventId={initEventId} />}
          {tab === 'ranking'       && <RankingView key="ranking" initEventId={initEventId} />}
          {tab === 'institutions'  && <InstitutionManagement key="institutions" />}
          {tab === 'events'        && <EventManagement key="events" onView={(evId, module) => { setInitEventId(evId); setTab(module === 'rs' ? 'rs_results' : 'results') }} />}
          {tab === 'rs_overview'   && <RSResumenView key="rs_overview" setTab={setTab} />}
          {tab === 'rs_judges'     && <RSJudgeManagement key="rs_judges" />}
          {tab === 'rs_teams'      && <RSTeamManagement key="rs_teams" />}
          {tab === 'rs_results'    && <RSResultsView key="rs_results" initEventId={initEventId} />}
          {tab === 'rs_ranking'    && <RSRankingView key="rs_ranking" />}
        </AnimatePresence>
      </main>
    </div>
  )
}

// ─── Overview RM ────────────────────────────────────────────────────────────

function OverviewTab({ setTab }) {
  const [teams, setTeams]           = useState([])
  const [scores, setScores]         = useState([])
  const [events, setEvents]         = useState([])
  const [selectedEventId, setSelectedEventId] = useState('all')

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'teams'),  snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, 'scores'), snap => setScores(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
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

  const topTeams = {}
  for (const cat of ['elementary', 'junior', 'senior']) {
    const catTeams = teams.filter(t => t.category === cat)
    const ranked = catTeams.map(team => {
      const teamScores = filteredScores.filter(s => s.teamId === team.id)
      const sum  = teamScores.length ? teamScores.reduce((acc, s) => acc + (s.total ?? 0), 0) : null
      const best = teamScores.length ? Math.max(...teamScores.map(s => s.total ?? 0)) : null
      return { team, sum, best }
    }).filter(r => r.sum !== null).sort((a, b) => b.sum - a.sum).slice(0, 3)
    topTeams[cat] = ranked
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white">Panel de Administración</h1>
        <p className="text-gray-400 mt-1">WRO RoboMission 2026 – Game Changer Robotics</p>
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

      {/* Top 3 per category */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { cat: 'elementary', label: 'Elementary', color: 'elementary' },
          { cat: 'junior',     label: 'Junior',     color: 'junior'     },
          { cat: 'senior',     label: 'Senior',     color: 'senior'     },
        ].map(({ cat, label, color }) => {
          const top3 = topTeams[cat] || []
          const medals = ['🥇', '🥈', '🥉']
          return (
            <motion.div key={cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`card border-${color}/30 bg-gradient-to-br from-${color}/10 to-transparent`}>
              <div className="flex items-center gap-2 mb-4">
                <Star size={14} className={`text-${color}`} />
                <span className={`badge-${color} text-xs`}>{label}</span>
              </div>
              {top3.length === 0 ? (
                <p className="text-gray-600 text-sm">Sin puntajes aún</p>
              ) : (
                <div className="space-y-3">
                  {top3.map(({ team, sum, best }, i) => (
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
                        <p className={`font-mono font-bold text-sm text-${color}`}>{sum}</p>
                        <p className="text-xs text-gray-600">mejor: {best}</p>
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
        {[
          { cat: 'elementary', label: 'Elementary', ages: '8–12 años',  color: 'elementary', max: 255 },
          { cat: 'junior',     label: 'Junior',     ages: '11–15 años', color: 'junior',     max: 230 },
          { cat: 'senior',     label: 'Senior',     ages: '14–22 años', color: 'senior',     max: 233 },
        ].map(({ cat, label, ages, color, max }) => (
          <motion.div key={cat} whileHover={{ y: -4, scale: 1.01 }}
            className={`card border-${color}/30 bg-gradient-to-br from-${color}/10 to-transparent cursor-pointer`}
            onClick={() => setTab('teams')}>
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
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={() => setTab('judges')} className="card-hover flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
            <UserPlus size={24} className="text-brand-orange" />
          </div>
          <div>
            <p className="font-semibold text-white">Gestionar Jueces RM</p>
            <p className="text-sm text-gray-400">Crear y administrar cuentas de jueces</p>
          </div>
        </motion.button>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={() => setTab('teams')} className="card-hover flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-brand-cyan/15 flex items-center justify-center shrink-0">
            <Trophy size={24} className="text-brand-cyan" />
          </div>
          <div>
            <p className="font-semibold text-white">Gestionar Equipos RM</p>
            <p className="text-sm text-gray-400">Registrar equipos y asignar a jueces</p>
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../../firebase'
import { Swords, Users, BarChart2, Medal, UserCheck, AlertCircle, Calendar } from 'lucide-react'

const CATS = [
  { value: 'elementary', label: 'Kids Elementary', judgesCat: 'rs_elementary',
    cc: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', bar: 'bg-green-500' } },
  { value: 'junior',     label: 'Kids Junior',     judgesCat: 'rs_junior',
    cc: { bg: 'bg-lime-500/10',  border: 'border-lime-500/30',  text: 'text-lime-400',  bar: 'bg-lime-500'  } },
]
const ROUNDS    = [1, 2, 3]
const TOTAL_MAX = 300
const MEDALS    = ['🥇', '🥈', '🥉']

export default function RSResumenView({ setTab }) {
  const [teams, setTeams]   = useState([])
  const [scores, setScores] = useState([])
  const [judges, setJudges] = useState([])
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('all')

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'rs_teams'),  s => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, 'rs_scores'), s => setScores(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u3 = onSnapshot(collection(db, 'users'),     s =>
      setJudges(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.role === 'judge' && u.category?.startsWith('rs_')))
    )
    const u4 = onSnapshot(collection(db, 'events'), s => {
      const evs = s.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setEvents(evs)
      const active = evs.find(e => e.active)
      if (active) setSelectedEventId(prev => prev === 'all' ? active.id : prev)
    })
    return () => { u1(); u2(); u3(); u4() }
  }, [])

  const filteredScores = selectedEventId === 'all'
    ? scores
    : scores.filter(s => s.eventId === selectedEventId)

  // Top 3 por categoría (mejor ronda individual)
  const topByCat = {}
  for (const cat of CATS) {
    const catTeams = teams.filter(t => t.category === cat.value)
    topByCat[cat.value] = catTeams.map(team => {
      const ts    = filteredScores.filter(s => s.teamId === team.id)
      const valid = ROUNDS.map(r => ts.find(s => s.round === r)?.total ?? null).filter(v => v !== null)
      return { team, best: valid.length ? Math.max(...valid) : null }
    }).filter(r => r.best !== null).sort((a, b) => b.best - a.best).slice(0, 3)
  }

  // Estadísticas globales
  const totalTeams     = teams.length
  const totalScores    = filteredScores.length
  const finalizedCount = filteredScores.filter(s => s.finalized).length
  const teamsWithScore = new Set(filteredScores.map(s => s.teamId)).size
  const teamsNoJudge   = teams.filter(t => !t.assignedJudgeId).length

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div className="flex items-center gap-3 mb-5">
        <Swords size={22} className="text-sky-400" />
        <div>
          <h1 className="text-3xl font-extrabold text-white">Resumen RoboStarter</h1>
          <p className="text-gray-400 text-sm mt-0.5">Kids Elementary · Kids Junior</p>
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
                  ? ev.active ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-dark-600 border-dark-400 text-white'
                  : 'border-dark-500 text-gray-400 hover:text-white hover:border-dark-400'
              }`}>
              {ev.name}{ev.active && <span className="ml-1 text-sky-400">●</span>}
            </button>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Equipos',         value: totalTeams,     icon: Users,      color: 'text-sky-400',   bg: 'bg-sky-500/10',   tab: 'rs_teams' },
          { label: 'Jueces RS',       value: judges.length,  icon: UserCheck,  color: 'text-green-400', bg: 'bg-green-500/10', tab: 'rs_judges' },
          { label: 'Rondas ingresadas', value: totalScores,  icon: BarChart2,  color: 'text-purple-400',bg: 'bg-purple-500/10',tab: 'rs_results' },
          { label: 'Rondas finalizadas',value: finalizedCount,icon: Medal,     color: 'text-yellow-400',bg: 'bg-yellow-500/10', tab: null },
        ].map(({ label, value, icon: Icon, color, bg, tab }) => (
          <motion.div key={label} whileHover={tab ? { y: -2 } : undefined}
            onClick={() => tab && setTab(tab)}
            className={`card flex items-center gap-3 ${tab ? 'cursor-pointer hover:border-dark-400' : ''}`}>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alerta si hay equipos sin juez */}
      {teamsNoJudge > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-xl mb-6 text-sm cursor-pointer"
          onClick={() => setTab('rs_teams')}>
          <AlertCircle size={16} className="shrink-0" />
          <span><strong>{teamsNoJudge}</strong> equipo{teamsNoJudge > 1 ? 's' : ''} sin juez asignado. Ir a Equipos RS →</span>
        </motion.div>
      )}

      {/* Top 3 por categoría */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-7">
        {CATS.map(cat => {
          const top3 = topByCat[cat.value] || []
          const { cc } = cat
          const catTeams = teams.filter(t => t.category === cat.value)
          return (
            <div key={cat.value} className={`card border ${cc.border} ${cc.bg}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${cc.border} ${cc.bg} ${cc.text}`}>{cat.label}</span>
                  <span className="text-xs text-gray-500">{catTeams.length} equipo{catTeams.length !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-xs text-gray-600">{judges.filter(j => j.category === cat.judgesCat).length} jueces</span>
              </div>

              {top3.length === 0 ? (
                <p className="text-sm text-gray-600 py-2">Sin puntajes aún</p>
              ) : (
                <div className="space-y-3">
                  {top3.map(({ team, best }, i) => (
                    <div key={team.id} className="flex items-center gap-2">
                      <span className="text-base shrink-0 w-6">{MEDALS[i]}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${i === 0 ? 'text-white' : 'text-gray-300'}`}>{team.name}</p>
                        {team.institution && <p className="text-xs text-gray-500 truncate">{team.institution}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-mono font-bold text-sm ${cc.text}`}>{best}</p>
                        <p className="text-xs text-gray-600">/ {TOTAL_MAX}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progreso de puntajes */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart2 size={16} className="text-sky-400" /> Progreso de rondas
        </h3>
        <div className="space-y-4">
          {CATS.map(cat => {
            const catTeams = teams.filter(t => t.category === cat.value)
            const total    = catTeams.length * 3  // 3 rondas por equipo
            const done     = filteredScores.filter(s => catTeams.some(t => t.id === s.teamId)).length
            const pct      = total > 0 ? Math.round((done / total) * 100) : 0
            const { cc }   = cat
            return (
              <div key={cat.value}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-sm font-medium ${cc.text}`}>{cat.label}</span>
                  <span className="text-xs text-gray-500">{done} / {total} rondas ({pct}%)</span>
                </div>
                <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div className={`h-full ${cc.bar} rounded-full`}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
                </div>
              </div>
            )
          })}
        </div>
        {totalTeams > 0 && (
          <p className="text-xs text-gray-600 mt-4 pt-4 border-t border-dark-600">
            {teamsWithScore} de {totalTeams} equipos con al menos 1 ronda ingresada
          </p>
        )}
      </div>
    </motion.div>
  )
}

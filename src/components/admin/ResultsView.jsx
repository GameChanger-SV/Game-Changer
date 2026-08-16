import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { Trophy, Download, ChevronDown, ChevronUp, ShieldCheck, LockOpen, Loader2, Trash2, Calendar } from 'lucide-react'

const CATEGORIES = ['elementary', 'junior', 'senior']
const ROUNDS = [1, 2, 3]

const CAT_LABEL = { elementary: 'Elementary', junior: 'Junior', senior: 'Senior' }

export default function ResultsView({ initEventId = null }) {
  const [scores, setScores]       = useState([])
  const [teams, setTeams]         = useState([])
  const [events, setEvents]       = useState([])
  const [selectedEventId, setSelectedEventId] = useState(initEventId || 'all')
  const [activeCat, setActiveCat] = useState('elementary')
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [unlocking, setUnlocking] = useState(null)
  const [resetting, setResetting]  = useState(null)

  const handleUnlock = async (e, scoreDocId) => {
    e.stopPropagation()
    if (!confirm('¿Permitir que el juez reenvíe este puntaje?')) return
    setUnlocking(scoreDocId)
    try {
      await updateDoc(doc(db, 'scores', scoreDocId), { finalized: false })
    } finally {
      setUnlocking(null)
    }
  }

  const handleReset = async (e, scoreDocId, teamName, round) => {
    e.stopPropagation()
    if (!confirm(`¿Restablecer Ronda ${round} de "${teamName}"? Esto borrará el puntaje permanentemente.`)) return
    setResetting(scoreDocId)
    try {
      await deleteDoc(doc(db, 'scores', scoreDocId))
    } finally {
      setResetting(null)
    }
  }

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'scores'), snap =>
      setScores(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const u2 = onSnapshot(collection(db, 'teams'), snap =>
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const u3 = onSnapshot(collection(db, 'events'), snap => {
      const evs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setEvents(evs)
      // Auto-select active event on first load
      const active = evs.find(e => e.active)
      if (active) setSelectedEventId(prev => (prev === 'all' && !initEventId) ? active.id : prev)
    })
    return () => { u1(); u2(); u3() }
  }, [])

  // Filter scores by selected event
  const filteredScores = selectedEventId === 'all'
    ? scores
    : scores.filter(s => s.eventId === selectedEventId)

  // Filter teams by category
  const catTeams = teams.filter(t => t.category === activeCat)

  // Build team-score matrix
  const teamRows = catTeams.map(team => {
    const roundScores = ROUNDS.map(r => {
      const s = filteredScores.find(sc => sc.teamId === team.id && sc.round === r)
      return s ? s.total : null
    })
    const validScores = roundScores.filter(s => s !== null)
    const best = validScores.length > 0 ? Math.max(...validScores) : null
    return { team, roundScores, best }
  }).sort((a, b) => {
    if (a.best === null && b.best === null) return 0
    if (a.best === null) return 1
    if (b.best === null) return -1
    return b.best - a.best
  })

  const handleExport = () => {
    const rows = [['Posición', 'Equipo', 'Número', 'Escuela', 'Ciudad', 'Ronda 1', 'Ronda 2', 'Ronda 3', 'Mejor Puntaje']]
    teamRows.forEach((row, i) => {
      rows.push([
        row.best !== null ? i + 1 : '-',
        row.team.name,
        row.team.number || '',
        row.team.school || '',
        row.team.city || '',
        row.roundScores[0] ?? '',
        row.roundScores[1] ?? '',
        row.roundScores[2] ?? '',
        row.best ?? '',
      ])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resultados-${activeCat}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Resultados RM</h1>
          <p className="text-gray-400 mt-1">Puntajes por equipo y ronda</p>
        </div>
        <button onClick={handleExport} className="btn-ghost flex items-center gap-2 text-sm">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Event selector */}
      {events.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <Calendar size={14} className="text-gray-500 shrink-0" />
          <span className="text-xs text-gray-500">Evento:</span>
          {[{ id: 'all', name: 'Todos', date: '' }, ...events].map(ev => (
            <button key={ev.id} onClick={() => setSelectedEventId(ev.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedEventId === ev.id
                  ? ev.active ? 'bg-brand-orange/20 border-brand-orange text-brand-orange' : 'bg-dark-600 border-dark-400 text-white'
                  : 'border-dark-500 text-gray-400 hover:text-white hover:border-dark-400'
              }`}>
              {ev.name}
              {ev.active && <span className="ml-1 text-brand-orange">●</span>}
            </button>
          ))}
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              activeCat === cat
                ? `bg-${cat}/20 border-${cat} text-${cat}`
                : 'border-dark-500 text-gray-400 hover:text-white hover:border-dark-400'
            }`}
          >
            {CAT_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Results table */}
      {teamRows.length === 0 ? (
        <div className="card text-center py-16">
          <Trophy size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No hay equipos en {CAT_LABEL[activeCat]} aún.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 w-10">#</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Equipo</th>
                {ROUNDS.map(r => (
                  <th key={r} className="text-center text-xs text-gray-500 font-medium px-4 py-3 w-24">Ronda {r}</th>
                ))}
                <th className="text-center text-xs text-gray-500 font-medium px-4 py-3 w-28">Mejor</th>
                <th className="w-8 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {teamRows.map(({ team, roundScores, best }, idx) => (
                <>
                  <tr
                    key={team.id}
                    onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                    className="border-b border-dark-700 hover:bg-dark-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className={`text-sm font-bold font-mono ${
                        best !== null
                          ? idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : `text-${activeCat}`
                          : 'text-gray-600'
                      }`}>
                        {best !== null ? idx + 1 : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white text-sm">{team.name}</p>
                      <p className="text-xs text-gray-500">{team.school} {team.city && `· ${team.city}`}</p>
                    </td>
                    {roundScores.map((score, i) => (
                      <td key={i} className="text-center px-4 py-3">
                        {score !== null ? (
                          <span className={`font-mono font-bold text-sm text-${activeCat}`}>{score}</span>
                        ) : (
                          <span className="text-gray-600 text-sm">—</span>
                        )}
                      </td>
                    ))}
                    <td className="text-center px-4 py-3">
                      {best !== null ? (
                        <span className={`font-mono font-extrabold text-base text-${activeCat}`}>{best}</span>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {expandedTeam === team.id
                        ? <ChevronUp size={14} className="text-gray-500" />
                        : <ChevronDown size={14} className="text-gray-500" />
                      }
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  <AnimatePresence>
                    {expandedTeam === team.id && (
                      <tr key={`${team.id}-detail`}>
                        <td colSpan={7} className="bg-dark-800 border-b border-dark-600 px-5 py-4">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="grid grid-cols-3 gap-3">
                              {ROUNDS.map(r => {
                                const sc      = filteredScores.find(s => s.teamId === team.id && s.round === r)
                                const isFinalized = sc?.finalized === true
                                const docId   = sc?.id
                                return (
                                  <div key={r} className={`rounded-xl border p-3 ${sc ? `border-${activeCat}/30 bg-${activeCat}/5` : 'border-dark-600 bg-dark-700'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs text-gray-500 font-medium">Ronda {r}</p>
                                      {isFinalized && (
                                        <div className="flex items-center gap-1">
                                          <ShieldCheck size={11} className="text-green-400" />
                                          <span className="text-xs text-green-400">Finalizado</span>
                                        </div>
                                      )}
                                    </div>
                                    {sc ? (
                                      <>
                                        <p className={`font-mono font-extrabold text-xl text-${activeCat}`}>{sc.total} pts</p>
                                        {sc.seconds && <p className="text-xs text-gray-500 mt-1">⏱ {sc.seconds}s</p>}
                                        <p className="text-xs text-gray-600 mt-1">{new Date(sc.savedAt).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}</p>
                                        {sc.judgeName && <p className="text-xs text-gray-500 mt-1">👤 {sc.judgeName}</p>}
                                        <div className="mt-2 flex gap-1.5 flex-wrap">
                                          {isFinalized && (
                                            <button
                                              onClick={e => handleUnlock(e, docId)}
                                              disabled={unlocking === docId}
                                              className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 px-2 py-1 rounded-lg transition-all disabled:opacity-50"
                                            >
                                              {unlocking === docId ? <Loader2 size={11} className="animate-spin" /> : <LockOpen size={11} />}
                                              Permitir reenvío
                                            </button>
                                          )}
                                          <button
                                            onClick={e => handleReset(e, docId, team.name, r)}
                                            disabled={resetting === docId}
                                            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-all disabled:opacity-50"
                                          >
                                            {resetting === docId ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                            Restablecer
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <p className="text-sm text-gray-600">Sin puntaje</p>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            {team.members?.filter(Boolean).length > 0 && (
                              <p className="text-xs text-gray-500 mt-3">Integrantes: {team.members.filter(Boolean).join(', ')}</p>
                            )}
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

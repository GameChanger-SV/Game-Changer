import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { BarChart2, LockOpen, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

const CATS = [
  { value: 'elementary', label: 'Kids Elementary', cc: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', bar: 'bg-green-500' } },
  { value: 'junior',     label: 'Kids Junior',     cc: { bg: 'bg-lime-500/10',  border: 'border-lime-500/30',  text: 'text-lime-400',  bar: 'bg-lime-500'  } },
]
const ROUNDS    = [1, 2, 3]
const TOTAL_MAX = 300  // 200 misión + 100 doc
const DOC_RUBRIC = [
  { id: 'robot_design', label: 'Diseño del robot' },
  { id: 'programming',  label: 'Programación' },
  { id: 'testing',      label: 'Pruebas y ajustes' },
  { id: 'presentation', label: 'Presentación' },
  { id: 'teamwork',     label: 'Trabajo en equipo' },
]

export default function RSResultsView() {
  const [teams, setTeams]       = useState([])
  const [scores, setScores]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [catTab, setCatTab]     = useState('elementary')
  const [expanded, setExpanded] = useState(null)
  const [unlocking, setUnlocking] = useState(null)
  const [resetting, setResetting] = useState(null)

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'rs_teams'),  s => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, 'rs_scores'), s => {
      setScores(s.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => { u1(); u2() }
  }, [])

  const cat = CATS.find(c => c.value === catTab)
  const cc  = cat?.cc || CATS[0].cc

  const catTeams = teams
    .filter(t => t.category === catTab)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  const getScore = (teamId, round) => scores.find(s => s.id === `${teamId}_r${round}`) || null

  const handleUnlock = async (e, scoreId) => {
    e.stopPropagation()
    if (!confirm('¿Reabrir esta ronda para edición?')) return
    setUnlocking(scoreId)
    try { await updateDoc(doc(db, 'rs_scores', scoreId), { finalized: false }) }
    finally { setUnlocking(null) }
  }

  const handleReset = async (e, scoreId, teamName, round) => {
    e.stopPropagation()
    if (!confirm(`¿Restablecer Ronda ${round} de "${teamName}"? Borrará el puntaje permanentemente.`)) return
    setResetting(scoreId)
    try { await deleteDoc(doc(db, 'rs_scores', scoreId)) }
    finally { setResetting(null) }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 size={22} className="text-green-400" />
        <h1 className="text-3xl font-extrabold text-white">Resultados RoboStarter</h1>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 bg-dark-700 p-1 rounded-xl mb-5 w-fit">
        {CATS.map(c => (
          <button key={c.value} onClick={() => { setCatTab(c.value); setExpanded(null) }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              catTab === c.value ? `bg-dark-600 ${c.cc.text}` : 'text-gray-500 hover:text-gray-300'
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-dark-500 border-t-green-500 rounded-full animate-spin" />
        </div>
      ) : catTeams.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-sm">Sin equipos en {cat?.label}.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 w-8">#</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Equipo</th>
                {ROUNDS.map(r => (
                  <th key={r} className="text-center text-xs text-gray-500 font-medium px-3 py-3 w-20 hidden sm:table-cell">R{r}</th>
                ))}
                <th className="text-center text-xs text-gray-500 font-medium px-4 py-3 w-20">Mejor</th>
                <th className="w-8 px-2" />
              </tr>
            </thead>
            <tbody>
              {catTeams
                .map(team => {
                  const roundScores = ROUNDS.map(r => getScore(team.id, r))
                  const totals = roundScores.map(s => s?.total ?? null)
                  const valid  = totals.filter(t => t !== null)
                  const best   = valid.length > 0 ? Math.max(...valid) : null
                  return { team, roundScores, totals, best }
                })
                .sort((a, b) => {
                  if (a.best === null && b.best === null) return 0
                  if (a.best === null) return 1
                  if (b.best === null) return -1
                  return b.best - a.best
                })
                .map(({ team, roundScores, totals, best }, idx) => (
                  <>
                    <tr key={team.id}
                      onClick={() => setExpanded(expanded === team.id ? null : team.id)}
                      className="border-b border-dark-700 hover:bg-dark-700/50 cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold font-mono ${
                          best !== null
                            ? idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : cc.text
                            : 'text-gray-600'
                        }`}>{best !== null ? idx + 1 : '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white text-sm">{team.name}</p>
                        {team.institution && <p className="text-xs text-gray-500">{team.institution}</p>}
                      </td>
                      {totals.map((score, i) => (
                        <td key={i} className="text-center px-3 py-3 hidden sm:table-cell">
                          {score !== null
                            ? <span className={`font-mono font-bold text-sm ${cc.text}`}>{score}</span>
                            : <span className="text-gray-600 text-sm">—</span>}
                        </td>
                      ))}
                      <td className="text-center px-4 py-3">
                        {best !== null
                          ? <span className={`font-mono font-extrabold text-base ${cc.text}`}>{best}</span>
                          : <span className="text-gray-600 text-sm">—</span>}
                      </td>
                      <td className="px-2 py-3">
                        {expanded === team.id ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expanded === team.id && (
                        <tr key={`${team.id}-detail`}>
                          <td colSpan={7} className="bg-dark-800 border-b border-dark-600 px-4 py-4">
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                              <div className="grid grid-cols-3 gap-3">
                                {ROUNDS.map((r, ri) => {
                                  const sc = roundScores[ri]
                                  const scoreId = `${team.id}_r${r}`
                                  return (
                                    <div key={r} className={`rounded-xl border p-3 ${sc ? `${cc.border} ${cc.bg}` : 'border-dark-600 bg-dark-700'}`}>
                                      <p className="text-xs text-gray-500 font-medium mb-2">Ronda {r}</p>
                                      {sc ? (
                                        <>
                                          <p className={`font-mono font-extrabold text-xl ${cc.text}`}>{sc.total} pts</p>
                                          <p className="text-xs text-gray-600 mt-0.5">Misión: {sc.missionScore} · Doc: {sc.docTotal}</p>
                                          {sc.finalized && <p className="text-xs text-green-400 mt-1 font-semibold">✓ Finalizado</p>}
                                          {/* Rubric detail */}
                                          {sc.docScores && (
                                            <div className="mt-2 space-y-0.5">
                                              {DOC_RUBRIC.map(c => (
                                                <div key={c.id} className="flex justify-between text-xs">
                                                  <span className="text-gray-600 truncate">{c.label}</span>
                                                  <span className={cc.text}>{sc.docScores[c.id] ?? 0}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          <div className="flex gap-1.5 flex-wrap mt-2">
                                            {sc.finalized && (
                                              <button onClick={e => handleUnlock(e, scoreId)} disabled={unlocking === scoreId}
                                                className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 px-2 py-1 rounded-lg transition-all disabled:opacity-50">
                                                {unlocking === scoreId ? <Loader2 size={10} className="animate-spin" /> : <LockOpen size={10} />}
                                                Reabrir
                                              </button>
                                            )}
                                            <button onClick={e => handleReset(e, scoreId, team.name, r)} disabled={resetting === scoreId}
                                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-lg transition-all disabled:opacity-50">
                                              {resetting === scoreId ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
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

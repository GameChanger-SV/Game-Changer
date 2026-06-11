import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../../firebase'
import { Trophy, Download, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORIES = ['elementary', 'junior', 'senior']
const ROUNDS = [1, 2, 3]

const CAT_LABEL = { elementary: 'Elementary', junior: 'Junior', senior: 'Senior' }

export default function ResultsView() {
  const [scores, setScores] = useState([])
  const [teams, setTeams] = useState([])
  const [activeCat, setActiveCat] = useState('elementary')
  const [expandedTeam, setExpandedTeam] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'scores'), snap => {
      setScores(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsubTeams = onSnapshot(collection(db, 'teams'), snap => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { unsub(); unsubTeams() }
  }, [])

  // Filter teams by category
  const catTeams = teams.filter(t => t.category === activeCat)

  // Build team-score matrix
  const teamRows = catTeams.map(team => {
    const roundScores = ROUNDS.map(r => {
      const s = scores.find(sc => sc.teamId === team.id && sc.round === r)
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Resultados</h1>
          <p className="text-gray-400 mt-1">Puntajes por equipo y ronda</p>
        </div>
        <button onClick={handleExport} className="btn-ghost flex items-center gap-2 text-sm">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

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
                                const sc = scores.find(s => s.teamId === team.id && s.round === r)
                                return (
                                  <div key={r} className={`rounded-xl border p-3 ${sc ? `border-${activeCat}/30 bg-${activeCat}/5` : 'border-dark-600 bg-dark-700'}`}>
                                    <p className="text-xs text-gray-500 mb-2 font-medium">Ronda {r}</p>
                                    {sc ? (
                                      <>
                                        <p className={`font-mono font-extrabold text-xl text-${activeCat}`}>{sc.total} pts</p>
                                        {sc.seconds && <p className="text-xs text-gray-500 mt-1">⏱ {sc.seconds}s</p>}
                                        <p className="text-xs text-gray-600 mt-1">{new Date(sc.savedAt).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}</p>
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

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { Medal, Trophy } from 'lucide-react'

const CATEGORIES = ['elementary', 'junior', 'senior']
const CAT_LABEL = { elementary: 'Elementary', junior: 'Junior', senior: 'Senior' }
const CAT_AGES = { elementary: '8–12 años', junior: '11–15 años', senior: '14–22 años' }
const CAT_MAX = { elementary: 255, junior: 230, senior: 233 }

function MedalIcon({ pos }) {
  if (pos === 1) return <span style={{ fontSize: 20 }}>🥇</span>
  if (pos === 2) return <span style={{ fontSize: 20 }}>🥈</span>
  if (pos === 3) return <span style={{ fontSize: 20 }}>🥉</span>
  return <span className="text-sm font-bold text-gray-500 font-mono w-6 text-center inline-block">{pos}</span>
}

function CategoryRanking({ cat, teams, scores }) {
  const catTeams = teams.filter(t => t.category === cat)
  const max = CAT_MAX[cat]

  const ranked = catTeams.map(team => {
    const teamScores = scores.filter(s => s.teamId === team.id)
    const best = teamScores.length > 0 ? Math.max(...teamScores.map(s => s.total)) : null
    const total = teamScores.length > 0 ? teamScores.reduce((s, sc) => s + (sc.total ?? 0), 0) : null
    const roundMap = {}
    teamScores.forEach(s => { roundMap[s.round] = s.total })
    return { team, best, total, roundMap, scoredRounds: teamScores.length }
  }).sort((a, b) => {
    if (a.total === null && b.total === null) return 0
    if (a.total === null) return 1
    if (b.total === null) return -1
    return b.total - a.total
  })

  const scoredTeams = ranked.filter(r => r.best !== null)
  const pendingTeams = ranked.filter(r => r.best === null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Category header */}
      <div className={`flex items-center gap-3 mb-4`}>
        <div className={`h-1 w-8 rounded-full bg-${cat}`} />
        <h2 className="text-lg font-bold text-white">{CAT_LABEL[cat]}</h2>
        <span className="text-gray-500 text-sm">{CAT_AGES[cat]}</span>
        <span className={`ml-auto badge-${cat}`}>{scoredTeams.length} / {ranked.length} calificados</span>
      </div>

      {ranked.length === 0 ? (
        <div className="card text-center py-8 text-gray-500 text-sm">Sin equipos registrados</div>
      ) : (
        <div className="space-y-2">
          {/* Scored teams */}
          {scoredTeams.map(({ team, best, total, roundMap, scoredRounds }, idx) => {
            const maxTotal = max * 3
            const pct = Math.round((total / maxTotal) * 100)
            const pos = idx + 1
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`card-hover flex items-center gap-4 ${pos <= 3 ? `border-${cat}/30` : ''}`}
              >
                {/* Position */}
                <div className="w-8 flex items-center justify-center shrink-0">
                  <MedalIcon pos={pos} />
                </div>

                {/* Team avatar */}
                <div className={`w-10 h-10 rounded-xl bg-${cat}/15 flex items-center justify-center font-bold text-sm text-${cat} shrink-0`}>
                  {team.number || team.name?.[0]?.toUpperCase()}
                </div>

                {/* Team info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{team.name}</p>
                  <p className="text-xs text-gray-500 truncate">{team.school} {team.city && `· ${team.city}`}</p>
                  {/* Score bar */}
                  <div className="mt-1.5 h-1.5 bg-dark-600 rounded-full w-full max-w-[200px]">
                    <motion.div
                      className={`h-full bg-${cat} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.04 }}
                    />
                  </div>
                </div>

                {/* Round scores */}
                <div className="flex gap-1 shrink-0">
                  {[1, 2, 3].map(r => (
                    <div key={r} className={`text-center w-12 py-1 rounded-lg text-xs ${
                      roundMap[r] !== undefined
                        ? roundMap[r] === best
                          ? `bg-${cat}/20 text-${cat} font-bold`
                          : 'bg-dark-600 text-gray-400'
                        : 'bg-dark-700 text-gray-700'
                    }`}>
                      {roundMap[r] !== undefined ? roundMap[r] : '—'}
                    </div>
                  ))}
                </div>

                {/* Scores */}
                <div className="text-right shrink-0 min-w-[90px]">
                  <p className={`font-mono font-extrabold text-xl text-${cat}`}>{total}</p>
                  <p className="text-xs text-gray-500">suma · {pct}%</p>
                  <p className="text-xs text-gray-600 mt-0.5">mejor: <span className={`text-${cat} font-semibold`}>{best}</span></p>
                </div>
              </motion.div>
            )
          })}

          {/* Pending teams */}
          {pendingTeams.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-gray-600 mb-2 px-2">Sin puntaje registrado</p>
              {pendingTeams.map(({ team }) => (
                <div key={team.id} className="flex items-center gap-4 px-4 py-2.5 rounded-xl opacity-40">
                  <div className="w-8 flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-mono">—</span>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-dark-600 flex items-center justify-center font-bold text-sm text-gray-500 shrink-0`}>
                    {team.number || team.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-400 text-sm truncate">{team.name}</p>
                    <p className="text-xs text-gray-600 truncate">{team.school}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function RankingView() {
  const [scores, setScores] = useState([])
  const [teams, setTeams] = useState([])

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'scores'), snap => {
      setScores(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsub2 = onSnapshot(collection(db, 'teams'), snap => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { unsub1(); unsub2() }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Ranking</h1>
        <p className="text-gray-400 mt-1">Clasificación por suma de 3 rondas · Actualización en tiempo real</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {CATEGORIES.map(cat => {
          const catTeams = teams.filter(t => t.category === cat)
          const catScores = scores.filter(s => catTeams.some(t => t.id === s.teamId))
          const teamsWithScore = new Set(catScores.map(s => s.teamId)).size
          return (
            <div key={cat} className={`card border-${cat}/20 bg-${cat}/5`}>
              <span className={`badge-${cat} mb-2 inline-block`}>{CAT_LABEL[cat]}</span>
              <p className={`text-2xl font-extrabold text-${cat}`}>{teamsWithScore}<span className="text-gray-500 text-base font-normal"> / {catTeams.length}</span></p>
              <p className="text-xs text-gray-500 mt-1">equipos calificados</p>
            </div>
          )
        })}
      </div>

      {/* Round legend */}
      <div className="flex items-center gap-2 mb-6 text-xs text-gray-500">
        <div className="w-3 h-3 rounded bg-dark-400" /> Ronda sin puntaje
        <div className="w-3 h-3 rounded bg-dark-600 ml-2" /> Puntaje registrado
        <div className="w-3 h-3 rounded bg-elementary ml-2 opacity-60" /> Mejor ronda (resaltada)
      </div>

      {CATEGORIES.map(cat => (
        <CategoryRanking key={cat} cat={cat} teams={teams} scores={scores} />
      ))}
    </motion.div>
  )
}

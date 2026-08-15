import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../../firebase'
import { Medal } from 'lucide-react'

const CATS = [
  { value: 'elementary', label: 'Kids Elementary', cc: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', bar: 'bg-green-500' } },
  { value: 'junior',     label: 'Kids Junior',     cc: { bg: 'bg-lime-500/10',  border: 'border-lime-500/30',  text: 'text-lime-400',  bar: 'bg-lime-500'  } },
]
const ROUNDS    = [1, 2, 3]
const TOTAL_MAX = 300
const MEDALS    = ['🥇', '🥈', '🥉']

function useRankingData() {
  const [teams, setTeams]   = useState([])
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'rs_teams'),  s => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, 'rs_scores'), s => {
      setScores(s.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => { u1(); u2() }
  }, [])

  const byCategory = {}
  for (const cat of CATS.map(c => c.value)) {
    const catTeams = teams.filter(t => t.category === cat)
    byCategory[cat] = catTeams.map(team => {
      const ts  = scores.filter(s => s.teamId === team.id)
      const bests = ROUNDS.map(r => ts.find(s => s.id === `${team.id}_r${r}`)?.total ?? null)
      const valid  = bests.filter(v => v !== null)
      const best   = valid.length > 0 ? Math.max(...valid) : null
      const sum    = valid.reduce((a, v) => a + v, 0)
      return { team, bests, best, sum }
    })
    .filter(r => r.best !== null)
    .sort((a, b) => b.best - a.best || b.sum - a.sum)
  }

  return { byCategory, loading }
}

export default function RSRankingView() {
  const { byCategory, loading } = useRankingData()
  const [catTab, setCatTab] = useState('elementary')
  const cat  = CATS.find(c => c.value === catTab)
  const cc   = cat?.cc || CATS[0].cc
  const ranked = byCategory[catTab] || []

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div className="flex items-center gap-3 mb-6">
        <Medal size={22} className="text-green-400" />
        <div>
          <h1 className="text-3xl font-extrabold text-white">Ranking RoboStarter</h1>
          <p className="text-gray-400 text-sm mt-0.5">Clasificación: mejor ronda individual</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 bg-dark-700 p-1 rounded-xl mb-5 w-fit">
        {CATS.map(c => (
          <button key={c.value} onClick={() => setCatTab(c.value)}
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
      ) : ranked.length === 0 ? (
        <div className="card text-center py-12">
          <Medal size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Sin puntajes para {cat?.label} aún.</p>
        </div>
      ) : (
        <>
          {/* Podium top 3 */}
          {ranked.length >= 2 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {ranked.slice(0, 3).map(({ team, best, sum }, i) => (
                <motion.div key={team.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`card text-center ${i === 0 ? 'border-yellow-500/30 bg-yellow-500/5' : `${cc.border} ${cc.bg}`}`}>
                  <div className="text-2xl mb-2">{MEDALS[i]}</div>
                  <p className={`font-extrabold text-sm ${i === 0 ? 'text-yellow-400' : cc.text}`}>{team.name}</p>
                  {team.institution && <p className="text-xs text-gray-500 mt-0.5 truncate">{team.institution}</p>}
                  <p className={`font-mono font-bold text-2xl mt-2 ${i === 0 ? 'text-yellow-400' : cc.text}`}>{best}</p>
                  <p className="text-xs text-gray-500">/ {TOTAL_MAX} pts</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Full ranking table */}
          <div className="card p-0 overflow-hidden">
            <div className="hidden sm:grid grid-cols-[40px_1fr_80px_80px_80px_80px] gap-3 px-4 py-3 border-b border-dark-600 text-xs text-gray-500 font-medium">
              <span>#</span>
              <span>Equipo</span>
              {ROUNDS.map(r => <span key={r} className="text-center">R{r}</span>)}
              <span className="text-center">Mejor</span>
            </div>

            {ranked.map(({ team, bests, best }, idx) => {
              const pct = Math.round((best / TOTAL_MAX) * 100)
              return (
                <motion.div key={team.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className="border-b border-dark-700 last:border-0 px-4 py-3">
                  {/* Desktop */}
                  <div className="hidden sm:grid grid-cols-[40px_1fr_80px_80px_80px_80px] gap-3 items-center">
                    <span className={`font-mono font-bold text-sm ${
                      idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-gray-500'
                    }`}>{idx < 3 ? MEDALS[idx] : idx + 1}</span>
                    <div>
                      <p className="font-semibold text-white text-sm">{team.name}</p>
                      {team.institution && <p className="text-xs text-gray-500">{team.institution}</p>}
                    </div>
                    {bests.map((score, i) => (
                      <span key={i} className={`text-center font-mono text-sm ${score !== null ? cc.text + ' font-bold' : 'text-gray-600'}`}>
                        {score ?? '—'}
                      </span>
                    ))}
                    <span className={`text-center font-mono font-extrabold text-base ${cc.text}`}>{best}</span>
                  </div>

                  {/* Mobile */}
                  <div className="sm:hidden">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`font-mono font-bold text-lg w-6 shrink-0 ${
                        idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-gray-500'
                      }`}>{idx < 3 ? MEDALS[idx] : idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{team.name}</p>
                        {team.institution && <p className="text-xs text-gray-500">{team.institution}</p>}
                      </div>
                      <span className={`font-mono font-extrabold text-lg ${cc.text}`}>{best}</span>
                    </div>
                    <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                      <motion.div className={`h-full ${cc.bar} rounded-full`}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: idx * 0.05 }} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </>
      )}
    </motion.div>
  )
}

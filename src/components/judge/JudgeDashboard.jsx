import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Trophy, ChevronRight, Bot, ArrowLeft, BookOpen, ExternalLink, Search, X, CheckCircle2, BarChart2 } from 'lucide-react'
import { collection, getDocs, getDoc, query, where, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import ScoreSheet from './scoring/ScoreSheet'
import {
  ELEMENTARY_MISSIONS, ELEMENTARY_MAX,
  JUNIOR_MISSIONS, JUNIOR_MAX,
  SENIOR_MISSIONS, SENIOR_MAX
} from './scoring/scoringData'

const CAT_CONFIG = {
  elementary: {
    missions: ELEMENTARY_MISSIONS, max: ELEMENTARY_MAX,
    color: 'elementary', label: 'Elementary', ages: '8–12 años',
    theme: 'from-elementary/20 to-transparent',
    rulesUrl: 'https://drive.google.com/file/d/1C-9FSgemEzuhrBjE06a5HPjsGlhB-Sb1/view',
    trackUrl: 'https://drive.google.com/file/d/1S3ffqSFwAsZDG8SrRw5Q4IF6Yc2_cN9h/view',
    elementsUrl: 'https://drive.google.com/file/d/1oyjsJ1k4etNmFuxiyb2wKp_n_FyGsuxc/view',
    videoUrl: 'https://youtu.be/J-gyMW91qsQ',
    theme_desc: '🎵 Festival de Música',
  },
  junior: {
    missions: JUNIOR_MISSIONS, max: JUNIOR_MAX,
    color: 'junior', label: 'Junior', ages: '11–15 años',
    theme: 'from-junior/20 to-transparent',
    rulesUrl: 'https://drive.google.com/file/d/1Pc5LmF-ubwu7pvzcvAxlWLJlqchDI5kY/view',
    trackUrl: 'https://drive.google.com/file/d/1P8MhsG1ofaZdjdEYd7mzztj8EJ3h7yBc/view',
    elementsUrl: 'https://drive.google.com/file/d/1-VxWA0K-kiFJ714ArLObuyw66-YW7UTc/view',
    videoUrl: 'https://youtu.be/Ks2DLT8AyHA',
    theme_desc: '🏰 Patrimonio Histórico',
  },
  senior: {
    missions: SENIOR_MISSIONS, max: SENIOR_MAX,
    color: 'senior', label: 'Senior', ages: '14–22 años',
    theme: 'from-senior/20 to-transparent',
    rulesUrl: 'https://drive.google.com/file/d/1o_Xi_eLACKXUOCqZ5SzKwWG6TsFp7h2z/view',
    trackUrl: 'https://drive.google.com/file/d/1jANShezkNJAnseZCoUEjgEqlsG5Jh4dr/view',
    elementsUrl: 'https://drive.google.com/file/d/1ClM8h_IUYh6dsOtAAZ4X8NQyBY1y0TT4/view',
    videoUrl: 'https://youtu.be/kYOWCv24Tjg',
    theme_desc: '🏗️ Construcción Urbana',
  },
}

const ROUNDS = [1, 2, 3]

export default function JudgeDashboard() {
  const { user, profile, logout } = useAuth()
  const [teams, setTeams] = useState([])
  const [selected, setSelected] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [search, setSearch] = useState('')

  const cat = profile?.category
  const config = CAT_CONFIG[cat] || CAT_CONFIG.elementary

  const filteredTeams = search
    ? teams.filter(t => {
        const q = search.toLowerCase()
        return (
          t.name?.toLowerCase().includes(q) ||
          t.number?.toLowerCase().includes(q) ||
          t.school?.toLowerCase().includes(q) ||
          t.city?.toLowerCase().includes(q) ||
          t.members?.some(m => m?.toLowerCase().includes(q))
        )
      })
    : teams

  useEffect(() => {
    if (!user || !profile) return
    const uid = user.uid
    const q = query(collection(db, 'teams'), where('assignedJudgeId', '==', uid))
    getDocs(q).then(snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [user, profile])

  if (selected) {
    return (
      <TeamScoring
        team={selected}
        config={config}
        cat={cat}
        judgeUid={user.uid}
        profile={profile}
        onBack={() => setSelected(null)}
        onLogout={logout}
      />
    )
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-${config.color}/20 border border-${config.color}/30 flex items-center justify-center`}>
            <Bot size={22} className={`text-${config.color}`} />
          </div>
          <div>
            <p className={`badge-${config.color} inline-block mb-1`}>{config.label}</p>
            <p className="text-lg font-bold text-white leading-tight">Panel de Juez</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setInfoOpen(true)}
            className="btn-ghost flex items-center gap-2 text-sm py-2 px-4"
          >
            <BookOpen size={16} /> Recursos
          </button>
          <button onClick={logout} className="text-gray-400 hover:text-red-400 transition-colors p-2">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Judge info */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card bg-gradient-to-r ${config.theme} border-${config.color}/30 mb-6`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-${config.color}/20 flex items-center justify-center font-extrabold text-xl text-${config.color}`}>
            {profile?.name?.[0]?.toUpperCase() || 'J'}
          </div>
          <div>
            <p className="text-xl font-bold text-white">{profile?.name}</p>
            <p className="text-sm text-gray-400">{profile?.email}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              {config.label} · {config.ages} · {config.theme_desc}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Teams */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-white">Equipos asignados</h2>
        <span className={`text-${config.color} text-sm font-medium`}>{filteredTeams.length} de {teams.length}</span>
      </div>

      {/* Search */}
      {teams.length > 0 && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            className="input-field pl-9 py-2 text-sm"
            placeholder="Buscar equipo por nombre, número, escuela..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {teams.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No tienes equipos asignados aún.</p>
          <p className="text-gray-500 text-sm mt-1">El administrador te asignará los equipos pronto.</p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="card text-center py-8">
          <Search size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Sin resultados para "<span className={`text-${config.color}`}>{search}</span>"</p>
          <button onClick={() => setSearch('')} className="btn-ghost mt-3 text-sm py-1.5 px-4">Limpiar</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTeams.map((team, i) => (
            <motion.button
              key={team.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(team)}
              className={`card-hover w-full text-left border-${config.color}/20`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-${config.color}/15 flex items-center justify-center font-bold text-lg text-${config.color} shrink-0`}>
                  {team.number || team.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-base">{team.name}</p>
                  <p className="text-sm text-gray-400 truncate">
                    {team.members?.filter(Boolean).join(' · ') || 'Sin integrantes'}
                  </p>
                  {team.school && <p className="text-xs text-gray-500 mt-0.5">{team.school} · {team.city}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500 mb-1">3 rondas</p>
                  <ChevronRight size={18} className={`text-${config.color}`} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Resources modal */}
      <AnimatePresence>
        {infoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setInfoOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="card w-full max-w-sm"
            >
              <h3 className="font-bold text-white mb-4">Recursos – {config.label}</h3>
              <div className="space-y-2">
                {[
                  { label: '📋 Reglamento', url: config.rulesUrl },
                  { label: '🗺️ Pista', url: config.trackUrl },
                  { label: '🧩 Elementos de pista', url: config.elementsUrl },
                  { label: '▶️ Video explicativo', url: config.videoUrl },
                ].map(({ label, url }) => (
                  <a key={label} href={url} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between px-4 py-3 bg-dark-600 hover:bg-dark-500 rounded-xl text-sm text-gray-300 hover:text-white transition-all group"
                  >
                    {label}
                    <ExternalLink size={14} className="text-gray-500 group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
              <button onClick={() => setInfoOpen(false)} className="btn-ghost w-full mt-4 py-2 text-sm">Cerrar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TeamScoring({ team, config, cat, judgeUid, profile, onBack, onLogout }) {
  const [round, setRound] = useState(1)
  const [savedTotals, setSavedTotals] = useState({})   // { 1: 220, 2: 185, 3: 200 }
  const [showSummary, setShowSummary] = useState(false)

  // Load saved totals for all 3 rounds (for summary and completion indicator)
  useEffect(() => {
    const fetchTotals = async () => {
      const rounds = await Promise.all(
        ROUNDS.map(r => getDoc(doc(db, 'scores', `${team.id}_round${r}`)))
      )
      const totals = {}
      rounds.forEach((snap, i) => {
        if (snap.exists()) totals[i + 1] = snap.data().total ?? null
      })
      setSavedTotals(totals)
    }
    fetchTotals()
  }, [team.id])

  const allSaved = ROUNDS.every(r => savedTotals[r] !== undefined)

  const CAT_TEXT = { elementary: 'text-dark-900', junior: 'text-white', senior: 'text-white' }

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-lg truncate">{team.name}</p>
          <p className="text-sm text-gray-400 truncate">
            {team.members?.filter(Boolean).join(' · ')}
            {team.school && ` · ${team.school}`}
          </p>
        </div>
        <button onClick={onLogout} className="text-gray-500 hover:text-red-400 transition-colors p-2">
          <LogOut size={16} />
        </button>
      </div>

      {/* Team info card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card border-${config.color}/20 mb-6`}
      >
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Número de equipo</p>
            <p className={`font-bold font-mono text-${config.color}`}>{team.number || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Categoría</p>
            <span className={`badge-${config.color}`}>{config.label}</span>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Coach</p>
            <p className="text-white font-medium">{team.coach || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Ciudad</p>
            <p className="text-gray-300">{team.city || '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500 text-xs mb-0.5">Integrantes</p>
            <p className="text-white">{team.members?.filter(Boolean).join(', ') || '—'}</p>
          </div>
        </div>
      </motion.div>

      {/* Round tabs + summary toggle */}
      <div className="flex gap-2 mb-5">
        {ROUNDS.map(r => {
          const hasSaved = savedTotals[r] !== undefined
          const isActive = !showSummary && round === r
          return (
            <button
              key={r}
              onClick={() => { setRound(r); setShowSummary(false) }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                isActive
                  ? `bg-${config.color} ${CAT_TEXT[cat]} shadow-lg`
                  : 'bg-dark-700 text-gray-400 hover:text-white border border-dark-500'
              }`}
            >
              {hasSaved && <CheckCircle2 size={11} className={isActive ? 'opacity-70' : 'text-green-500'} />}
              Ronda {r}
            </button>
          )
        })}
        {allSaved && (
          <button
            onClick={() => setShowSummary(true)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 ${
              showSummary
                ? `bg-${config.color} ${CAT_TEXT[cat]} shadow-lg`
                : 'bg-dark-700 text-gray-400 hover:text-white border border-dark-500'
            }`}
          >
            <BarChart2 size={14} /> Resumen
          </button>
        )}
      </div>

      {/* ── SUMMARY VIEW ── */}
      <AnimatePresence mode="wait">
        {showSummary ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            <div className="card">
              <h3 className={`font-bold text-${config.color} mb-4 flex items-center gap-2`}>
                <BarChart2 size={18} /> Resumen de puntuación – {team.name}
              </h3>
              <div className="space-y-3">
                {ROUNDS.map(r => {
                  const total = savedTotals[r] ?? 0
                  const pct   = Math.round((total / config.max) * 100)
                  return (
                    <div key={r}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">Ronda {r}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-${config.color}`}>{total}</span>
                          <span className="text-gray-500 text-xs">/ {config.max}</span>
                          <span className="text-gray-400 text-xs w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-${config.color} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, delay: r * 0.1 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className={`mt-5 pt-4 border-t border-dark-600 flex justify-between items-center`}>
                <span className="text-gray-400 font-medium">Mejor ronda</span>
                <span className={`font-mono font-extrabold text-2xl text-${config.color}`}>
                  {Math.max(...ROUNDS.map(r => savedTotals[r] ?? 0))}
                  <span className="text-sm text-gray-500 font-normal ml-1">pts</span>
                </span>
              </div>
            </div>
            <p className="text-center text-xs text-gray-600">Las 3 rondas han sido registradas correctamente.</p>
          </motion.div>
        ) : (
          /* ── SCORE SHEET ── */
          <motion.div
            key={round}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ScoreSheet
              team={team}
              category={cat}
              round={round}
              missions={config.missions}
              maxScore={config.max}
              judgeUid={judgeUid}

            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

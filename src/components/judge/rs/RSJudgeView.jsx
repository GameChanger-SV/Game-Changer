// RoboStarter — Panel de Juez
// Misión (0–200 pts) + Rúbrica de Documentación (5 criterios × 20 pts = 100 pts)
// 3 rondas. Ranking por mejor ronda individual.

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut, Search, X, ArrowLeft, Save, CheckCircle,
  Lock, Info, BarChart2, CheckCircle2, Users
} from 'lucide-react'
import {
  collection, onSnapshot, doc, getDoc, setDoc, serverTimestamp, query, where
} from 'firebase/firestore'
import { db } from '../../../firebase'
import { useAuth } from '../../../contexts/AuthContext'

// ─── Config ──────────────────────────────────────────────────────────────────
const CAT_META = {
  elementary: { label: 'Kids Elementary', ages: '5–7 años',
    cc: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', bar: 'bg-green-500' } },
  junior:     { label: 'Kids Junior',     ages: '7–10 años',
    cc: { bg: 'bg-lime-500/10',  border: 'border-lime-500/30',  text: 'text-lime-400',  bar: 'bg-lime-500'  } },
}
const ROUNDS      = [1, 2, 3]
const MISSION_MAX = 200
const DOC_RUBRIC  = [
  { id: 'robot_design', label: 'Diseño del robot',   maxPts: 20, hint: 'Cómo construyeron su robot' },
  { id: 'programming',  label: 'Programación',        maxPts: 20, hint: 'Lógica del software utilizado' },
  { id: 'testing',      label: 'Pruebas y ajustes',   maxPts: 20, hint: 'Proceso de prueba y mejoras' },
  { id: 'presentation', label: 'Presentación',        maxPts: 20, hint: 'Claridad y calidad oral' },
  { id: 'teamwork',     label: 'Trabajo en equipo',   maxPts: 20, hint: 'Colaboración y roles' },
]
const DOC_MAX   = DOC_RUBRIC.reduce((s, c) => s + c.maxPts, 0) // 100
const TOTAL_MAX = MISSION_MAX + DOC_MAX                         // 300

// ─── Score sheet for one round ───────────────────────────────────────────────
function ScoreSheet({ team, category, round, judgeUid, judgeName, eventId, onSaved }) {
  const cc = CAT_META[category]?.cc || CAT_META.elementary.cc
  // Include eventId in doc ID so each event has independent scores
  const scoreId = eventId ? `${team.id}_r${round}_${eventId}` : `${team.id}_r${round}`

  const [tab, setTab]               = useState('mission')
  const [missionScore, setMission]  = useState(0)
  const [docScores, setDocScores]   = useState({})
  const [finalized, setFin]         = useState(false)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)
  const [openHint, setOpenHint]     = useState(null)

  useEffect(() => {
    setLoading(true); setTab('mission'); setMission(0); setDocScores({}); setFin(false); setOpenHint(null)
    getDoc(doc(db, 'rs_scores', scoreId)).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setMission(d.missionScore ?? 0)
        setDocScores(d.docScores || {})
        setFin(d.finalized || false)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [scoreId])

  const docTotal   = DOC_RUBRIC.reduce((a, c) => a + (docScores[c.id] ?? 0), 0)
  const grandTotal = missionScore + docTotal

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000) }

  const buildPayload = (fin) => ({
    teamId: team.id, teamName: team.name, category, round,
    judgeUid, judgeName,
    missionScore, docScores, docTotal, total: grandTotal,
    finalized: fin, savedAt: serverTimestamp(),
    ...(eventId ? { eventId } : {}),
  })

  const save = async (finalize = false) => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'rs_scores', scoreId), buildPayload(finalize))
      if (finalize) { setFin(true); showToast('success', '¡Ronda finalizada!') }
      else showToast('success', 'Guardado.')
      onSaved?.()
    } catch (err) {
      console.error('Error saving RS score:', err)
      showToast('error', 'Error al guardar. Verifica tu conexión.')
    }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className={`w-8 h-8 border-3 border-dark-500 border-t-green-500 rounded-full animate-spin`} />
    </div>
  )

  return (
    <div className="space-y-4">
      {finalized && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30">
          <Lock size={16} className="text-green-400 shrink-0" />
          <div>
            <p className="font-bold text-green-400 text-sm">Ronda finalizada</p>
            <p className="text-xs text-gray-500">Contacta al administrador para hacer cambios.</p>
          </div>
        </div>
      )}

      {/* Total summary */}
      <div className={`card ${cc.bg} border ${cc.border}`}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total · Ronda {round}</p>
            <p className={`font-mono font-extrabold text-3xl ${cc.text}`}>{grandTotal} <span className="text-sm text-gray-500 font-normal">/ {TOTAL_MAX}</span></p>
          </div>
          <div className="text-right text-xs text-gray-500 space-y-0.5">
            <p>Misión: <span className={cc.text}>{missionScore}</span> / {MISSION_MAX}</p>
            <p>Doc: <span className={cc.text}>{docTotal}</span> / {DOC_MAX}</p>
          </div>
        </div>
      </div>

      {/* Mission / Doc tabs */}
      <div className="flex gap-2 bg-dark-700 p-1 rounded-xl">
        {[['mission', '🎯 Misión'], ['doc', '📄 Documentación']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === id ? 'bg-dark-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'mission' ? (
          <motion.div key="mission" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
            <div className={`card ${cc.bg} border ${cc.border}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Puntaje en tapete — Ronda {round}</p>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => !finalized && setMission(v => Math.max(0, v - 5))} disabled={finalized}
                  className="w-10 h-10 rounded-xl bg-dark-600 border border-dark-500 text-gray-300 font-bold text-xl flex items-center justify-center disabled:opacity-40">−</button>
                <input type="number" min={0} max={MISSION_MAX} value={missionScore} disabled={finalized}
                  onChange={e => !finalized && setMission(Math.min(MISSION_MAX, Math.max(0, Number(e.target.value))))}
                  className={`w-28 text-center font-mono font-extrabold text-3xl bg-transparent border-b-2 ${cc.border} ${cc.text} focus:outline-none disabled:opacity-60`} />
                <button type="button" onClick={() => !finalized && setMission(v => Math.min(MISSION_MAX, v + 5))} disabled={finalized}
                  className="w-10 h-10 rounded-xl bg-dark-600 border border-dark-500 text-gray-300 font-bold text-xl flex items-center justify-center disabled:opacity-40">+</button>
                <span className="text-gray-500 text-sm">/ {MISSION_MAX}</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">Puntos obtenidos por el equipo en el tapete de competencia.</p>
          </motion.div>
        ) : (
          <motion.div key="doc" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-3">
            {/* Doc total bar */}
            <div className={`card ${cc.bg} border ${cc.border}`}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Documentación total</p>
                <span className={`font-mono font-bold ${cc.text}`}>{docTotal} / {DOC_MAX}</span>
              </div>
              <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                <motion.div className={`h-full ${cc.bar} rounded-full`} style={{ width: `${(docTotal / DOC_MAX) * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>
            {/* Criteria */}
            {DOC_RUBRIC.map(criterion => {
              const val = docScores[criterion.id] ?? 0
              const hintOpen = openHint === criterion.id
              return (
                <div key={criterion.id} className="card">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white">{criterion.label}</p>
                        <button type="button"
                          onClick={() => setOpenHint(h => h === criterion.id ? null : criterion.id)}
                          className="text-gray-600 hover:text-gray-400">
                          <Info size={13} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">máx. {criterion.maxPts} pts</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" disabled={finalized}
                        onClick={() => !finalized && setDocScores(s => ({ ...s, [criterion.id]: Math.max(0, (s[criterion.id] ?? 0) - 1) }))}
                        className="w-8 h-8 rounded-lg bg-dark-600 border border-dark-500 text-gray-300 font-bold flex items-center justify-center disabled:opacity-40">−</button>
                      <span className={`w-8 text-center font-mono font-bold text-xl ${cc.text}`}>{val}</span>
                      <button type="button" disabled={finalized}
                        onClick={() => !finalized && setDocScores(s => ({ ...s, [criterion.id]: Math.min(criterion.maxPts, (s[criterion.id] ?? 0) + 1) }))}
                        className="w-8 h-8 rounded-lg bg-dark-600 border border-dark-500 text-gray-300 font-bold flex items-center justify-center disabled:opacity-40">+</button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {hintOpen && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="text-xs text-gray-500 italic overflow-hidden mb-1">
                        {criterion.hint}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                    <motion.div className={`h-full ${cc.bar} rounded-full`}
                      style={{ width: `${(val / criterion.maxPts) * 100}%` }} transition={{ duration: 0.2 }} />
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {!finalized && (
        <div className="flex gap-3">
          <button onClick={() => save(false)} disabled={saving}
            className="btn-ghost flex-1 flex items-center justify-center gap-2 py-2.5">
            {saving ? <span className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
              : <><Save size={16} /> Guardar borrador</>}
          </button>
          <button onClick={() => save(true)} disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><CheckCircle size={16} /> Enviar</>}
          </button>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                : 'bg-red-500/20 border border-red-500/40 text-red-300'
            }`}>
            {toast.type === 'success' && <CheckCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Team scoring wrapper (rounds + summary) ─────────────────────────────────
function TeamScoring({ team, category, judgeUid, judgeName, eventId, onBack, onLogout }) {
  const meta = CAT_META[category] || CAT_META.elementary
  const cc   = meta.cc
  const [round, setRound]         = useState(1)
  const [savedTotals, setSavedTotals] = useState({})
  const [showSummary, setShowSummary] = useState(false)

  const scoreDocId = (r) => eventId ? `${team.id}_r${r}_${eventId}` : `${team.id}_r${r}`

  const loadTotals = () => {
    Promise.all(ROUNDS.map(r => getDoc(doc(db, 'rs_scores', scoreDocId(r))))).then(snaps => {
      const d = {}
      snaps.forEach((snap, i) => { if (snap.exists()) d[i + 1] = snap.data() })
      setSavedTotals(d)
    })
  }

  useEffect(() => { loadTotals() }, [team.id, eventId])

  const allSaved = ROUNDS.every(r => savedTotals[r] !== undefined)

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 mt-2">
        <button onClick={onBack} className="btn-ghost p-2 py-1.5"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-lg truncate">{team.name}</p>
          <p className="text-xs text-gray-400 truncate">
            {[team.member1, team.member2, team.member3].filter(Boolean).join(' · ')}
            {team.institution && ` · ${team.institution}`}
          </p>
        </div>
        <button onClick={onLogout} className="text-gray-500 hover:text-red-400 transition-colors p-2"><LogOut size={16} /></button>
      </div>

      {/* Round tabs */}
      <div className="flex gap-2 mb-5">
        {ROUNDS.map(r => {
          const saved  = !!savedTotals[r]
          const active = !showSummary && round === r
          return (
            <button key={r} onClick={() => { setRound(r); setShowSummary(false) }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                active
                  ? `${cc.bg} border ${cc.border} ${cc.text}`
                  : 'bg-dark-700 text-gray-400 hover:text-white border border-dark-500'
              }`}>
              {saved && <CheckCircle2 size={11} className={active ? cc.text : 'text-green-500'} />}
              Ronda {r}
            </button>
          )
        })}
        {allSaved && (
          <button onClick={() => setShowSummary(true)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 ${
              showSummary ? `${cc.bg} border ${cc.border} ${cc.text}` : 'bg-dark-700 text-gray-400 hover:text-white border border-dark-500'
            }`}>
            <BarChart2 size={14} /> Resumen
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showSummary ? (
          <motion.div key="summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <div className="card">
              <h3 className={`font-bold ${cc.text} mb-4 flex items-center gap-2`}>
                <BarChart2 size={18} /> Resumen — {team.name}
              </h3>
              <div className="space-y-4">
                {ROUNDS.map(r => {
                  const d = savedTotals[r]
                  if (!d) return null
                  const pct = Math.round((d.total / TOTAL_MAX) * 100)
                  return (
                    <div key={r}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-white">Ronda {r}</span>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>Misión: <span className={cc.text}>{d.missionScore}</span></span>
                          <span>Doc: <span className={cc.text}>{d.docTotal}</span></span>
                          <span className={`font-bold ${cc.text} text-sm`}>{d.total} pts</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <motion.div className={`h-full ${cc.bar} rounded-full`}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: r * 0.1 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-5 pt-4 border-t border-dark-600 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Mejor ronda</span>
                  <span className={`font-mono font-extrabold text-xl ${cc.text}`}>{Math.max(...ROUNDS.map(r => savedTotals[r]?.total ?? 0))} pts</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mejor misión</span><span className={cc.text}>{Math.max(...ROUNDS.map(r => savedTotals[r]?.missionScore ?? 0))}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mejor doc</span><span className={cc.text}>{Math.max(...ROUNDS.map(r => savedTotals[r]?.docTotal ?? 0))}</span>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-600">Las {ROUNDS.length} rondas han sido registradas.</p>
          </motion.div>
        ) : (
          <motion.div key={round} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <ScoreSheet
              team={team} category={category} round={round}
              judgeUid={judgeUid} judgeName={judgeName}
              eventId={eventId}
              onSaved={loadTotals}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main judge dashboard ─────────────────────────────────────────────────────
export default function RSJudgeView({ category, eventId = null }) {
  const { user, profile, logout } = useAuth()
  const meta = CAT_META[category] || CAT_META.elementary
  const cc   = meta.cc

  const [teams, setTeams]   = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    // Load teams assigned to this judge in this category
    const q = query(
      collection(db, 'rs_teams'),
      where('assignedJudgeId', '==', user.uid)
    )
    const unsub = onSnapshot(q, snap =>
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.category === category))
    )
    return unsub
  }, [user, category])

  const filtered = search
    ? teams.filter(t => [t.name, t.number, t.institution].some(v => v?.toLowerCase().includes(search.toLowerCase())))
    : teams

  if (selected) {
    return (
      <TeamScoring
        team={selected} category={category}
        judgeUid={user.uid} judgeName={profile?.name || user.email}
        eventId={eventId}
        onBack={() => setSelected(null)} onLogout={logout}
      />
    )
  }

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${cc.bg} border ${cc.border} flex items-center justify-center`}>
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <p className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cc.bg} ${cc.border} ${cc.text} inline-block mb-1`}>
              {meta.label} · {meta.ages}
            </p>
            <p className="text-lg font-bold text-white leading-tight">RoboStarter — Panel de Juez</p>
          </div>
        </div>
        <button onClick={logout} className="text-gray-400 hover:text-red-400 transition-colors p-2"><LogOut size={18} /></button>
      </div>

      {/* Judge info */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className={`card ${cc.bg} border ${cc.border} mb-6`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${cc.bg} flex items-center justify-center font-extrabold text-xl ${cc.text}`}>
            {profile?.name?.[0]?.toUpperCase() || 'J'}
          </div>
          <div>
            <p className="text-xl font-bold text-white">{profile?.name}</p>
            <p className="text-sm text-gray-400">{profile?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-white">Equipos asignados</h2>
        <span className={`text-sm font-medium ${cc.text}`}>{filtered.length} de {teams.length}</span>
      </div>

      {teams.length > 0 && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input className="input-field pl-9 py-2 text-sm" placeholder="Buscar equipo..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={14} /></button>}
        </div>
      )}

      {teams.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No tienes equipos asignados aún.</p>
          <p className="text-gray-500 text-sm mt-1">El administrador te asignará equipos pronto.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400 text-sm">Sin resultados para "{search}"</p>
          <button onClick={() => setSearch('')} className="btn-ghost mt-3 text-sm py-1.5 px-4">Limpiar</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((team, i) => (
            <motion.button key={team.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(team)}
              className={`card-hover w-full text-left border-${cc.border.replace('border-', '')}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${cc.bg} flex items-center justify-center font-bold text-lg ${cc.text} shrink-0`}>
                  {team.number || team.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-base">{team.name}</p>
                  <p className="text-sm text-gray-400 truncate">
                    {[team.member1, team.member2, team.member3].filter(Boolean).join(' · ') || 'Sin integrantes'}
                  </p>
                  {team.institution && <p className="text-xs text-gray-500 mt-0.5">{team.institution}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500 mb-1">3 rondas</p>
                  <span className={`text-lg ${cc.text}`}>›</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}

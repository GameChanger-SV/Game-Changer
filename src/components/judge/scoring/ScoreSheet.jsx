import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, CheckCircle, ChevronUp, ChevronDown, RotateCcw, Clock, AlertCircle } from 'lucide-react'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase'

const CAT_COLORS = {
  elementary: { primary: '#F59E0B', class: 'elementary', ring: 'ring-elementary', border: 'border-elementary/30', bg: 'bg-elementary' },
  junior: { primary: '#3B82F6', class: 'junior', ring: 'ring-junior', border: 'border-junior/30', bg: 'bg-junior' },
  senior: { primary: '#8B5CF6', class: 'senior', ring: 'ring-senior', border: 'border-senior/30', bg: 'bg-senior' },
}

function CounterInput({ value, onChange, min = 0, max, color }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded-lg bg-dark-600 hover:bg-dark-500 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-90"
        disabled={value <= min}
      >
        <ChevronDown size={14} />
      </button>
      <span className={`w-10 text-center font-mono font-bold text-sm ${value > 0 ? `text-${color}` : 'text-gray-500'}`}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 rounded-lg bg-dark-600 hover:bg-dark-500 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-90"
        disabled={value >= max}
      >
        <ChevronUp size={14} />
      </button>
    </div>
  )
}

function ToggleInput({ value, onChange, color }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value ? 0 : 1)}
      className={`w-10 h-6 rounded-full transition-all duration-300 relative ${
        value ? `bg-${color}` : 'bg-dark-600'
      }`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
        value ? 'left-5' : 'left-1'
      }`} />
    </button>
  )
}

export default function ScoreSheet({ team, category, round, missions, maxScore, judgeUid, readOnly = false }) {
  const colorKey = CAT_COLORS[category]
  const docId = `${team.id}_round${round}`
  const [scores, setScores] = useState({})
  const [seconds, setSeconds] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Build bidirectional mutual map and max map from missions
  const { mutualMap, itemMaxMap } = useCallback(() => {
    const mutualMap = {}
    const itemMaxMap = {}
    missions.forEach(m => m.items.forEach(item => {
      itemMaxMap[item.id] = item.max
      if (item.mutualWith) {
        mutualMap[item.id] = item.mutualWith
        mutualMap[item.mutualWith] = item.id
      }
    }))
    return { mutualMap, itemMaxMap }
  }, [missions])()

  // Change handler that enforces mutual exclusion / shared-max constraint
  const handleChange = useCallback((itemId, newValue) => {
    setScores(s => {
      const next = { ...s, [itemId]: newValue }
      const partnerId = mutualMap[itemId]
      if (partnerId !== undefined && newValue > 0) {
        const sharedMax = itemMaxMap[itemId]
        next[partnerId] = Math.max(0, Math.min(s[partnerId] || 0, sharedMax - newValue))
      }
      return next
    })
    setSaved(false)
  }, [mutualMap, itemMaxMap])

  // Initialize all items to 0
  useEffect(() => {
    const init = {}
    missions.forEach(m => m.items.forEach(item => { init[item.id] = 0 }))
    setScores(init)
    setSeconds('')
    setSaved(false)

    // Load existing scores
    getDoc(doc(db, 'scores', docId)).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        setScores(data.scores || init)
        setSeconds(data.seconds || '')
        setSaved(true)
      }
    })
  }, [docId, team.id, round])

  const computeTotal = useCallback(() => {
    let total = 0
    missions.forEach(mission => {
      mission.items.forEach(item => {
        const val = scores[item.id] || 0
        total += val * item.perItem
      })
    })
    return Math.min(total, maxScore)
  }, [scores, missions, maxScore])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'scores', docId), {
        teamId: team.id,
        teamName: team.name,
        category,
        round,
        judgeUid,
        scores,
        total: computeTotal(),
        seconds: seconds || null,
        savedAt: new Date().toISOString(),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!confirm('¿Reiniciar todos los puntajes de esta ronda?')) return
    const init = {}
    missions.forEach(m => m.items.forEach(item => { init[item.id] = 0 }))
    setScores(init)
    setSeconds('')
    setSaved(false)
  }

  const total = computeTotal()
  const pct = Math.round((total / maxScore) * 100)

  return (
    <div className="space-y-4">
      {/* Score summary bar */}
      <div className={`card border-${colorKey.class}/30 bg-gradient-to-r from-${colorKey.class}/10 to-transparent`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-400 font-medium">Puntaje total – Ronda {round}</p>
            <p className={`text-4xl font-extrabold font-mono text-${colorKey.class}`}>
              {total}
              <span className="text-lg text-gray-500 font-normal ml-1">/ {maxScore}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{pct}%</p>
            <p className="text-sm text-gray-500">rendimiento</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${colorKey.bg} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Missions */}
      <div className="space-y-3">
        {missions.map((mission, mIdx) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: mIdx * 0.06 }}
            className="card"
          >
            <h3 className={`font-bold text-${colorKey.class} mb-1`}>{mission.title}</h3>
            <p className="text-xs text-gray-500 mb-4">{mission.description}</p>

            <div className="space-y-3">
              {mission.items.map(item => {
                const val = scores[item.id] || 0
                const pts = val * item.perItem
                const isToggle = !item.count && item.max === 1

                return (
                  <div key={item.id} className="flex items-center gap-3">
                    {readOnly ? (
                      <span className={`font-mono text-sm font-bold w-7 text-right ${val > 0 ? `text-${colorKey.class}` : 'text-gray-600'}`}>{val}</span>
                    ) : isToggle ? (
                      <ToggleInput value={val} onChange={v => handleChange(item.id, v)} color={colorKey.class} />
                    ) : (
                      <CounterInput
                        value={val}
                        onChange={v => handleChange(item.id, v)}
                        max={item.max}
                        color={colorKey.class}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 leading-tight">{item.label}</p>
                      {item.note && <p className="text-xs text-yellow-500/70 mt-0.5">{item.note}</p>}
                    </div>
                    <div className="text-right shrink-0 min-w-[80px]">
                      <span className={`font-mono text-sm font-bold ${pts > 0 ? `text-${colorKey.class}` : 'text-gray-600'}`}>
                        {pts > 0 ? `+${pts}` : '0'} pts
                      </span>
                      {item.totalMax && (
                        <p className="text-xs text-gray-600">máx {item.totalMax}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Mission subtotal */}
            <div className={`mt-3 pt-3 border-t border-dark-600 flex justify-between items-center`}>
              <span className="text-xs text-gray-500">Subtotal misión</span>
              <span className={`font-mono font-bold text-sm text-${colorKey.class}`}>
                {mission.items.reduce((s, item) => s + (scores[item.id] || 0) * item.perItem, 0)} pts
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Time + Save */}
      {!readOnly && (
        <div className="card flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Clock size={18} className="text-gray-500 shrink-0" />
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Tiempo (segundos)</label>
              <input
                type="number"
                className="input-field py-2 text-sm"
                placeholder="Ej: 120"
                value={seconds}
                onChange={e => { setSeconds(e.target.value); setSaved(false) }}
                min={0}
                max={180}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="btn-ghost px-3 py-2 flex items-center gap-1 text-sm">
              <RotateCcw size={15} />
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-5 py-2 text-sm"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saved ? (
                <><CheckCircle size={16} /> Guardado</>
              ) : (
                <><Save size={16} /> Guardar</>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}

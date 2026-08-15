import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Plus, CheckCircle, X, AlertCircle,
  Loader2, Archive, Radio, ChevronDown, ChevronUp
} from 'lucide-react'
import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, writeBatch, getDocs, query, where
} from 'firebase/firestore'
import { db } from '../../firebase'

const EMPTY_FORM = { name: '', date: '' }

export default function EventManagement() {
  const [events, setEvents]     = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [activating, setActivating] = useState(null)
  const [migrating, setMigrating]   = useState(null)
  const [msg, setMsg]           = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    return onSnapshot(collection(db, 'events'), snap =>
      setEvents(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      )
    )
  }, [])

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 5000)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.date) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'events'), {
        name: form.name.trim(),
        date: form.date,
        active: false,
        createdAt: serverTimestamp(),
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
      showMsg('success', `Evento "${form.name.trim()}" creado.`)
    } catch (err) {
      showMsg('error', err.message)
    } finally { setSaving(false) }
  }

  const handleSetActive = async (event) => {
    if (event.active) return
    if (!confirm(`¿Activar "${event.name}" como evento actual? Los puntajes nuevos quedarán asociados a este evento.`)) return
    setActivating(event.id)
    try {
      const batch = writeBatch(db)
      // Deactivate all
      events.forEach(ev => {
        batch.update(doc(db, 'events', ev.id), { active: false })
      })
      // Activate selected
      batch.update(doc(db, 'events', event.id), { active: true })
      await batch.commit()
      showMsg('success', `"${event.name}" es ahora el evento activo.`)
    } catch (err) {
      showMsg('error', err.message)
    } finally { setActivating(null) }
  }

  /**
   * Asigna todos los puntajes sin eventId a este evento.
   * Útil para migrar puntajes de antes de implementar el sistema de eventos.
   */
  const handleMigrate = async (event) => {
    if (!confirm(
      `¿Asignar todos los puntajes SIN evento a "${event.name}"?\n\n` +
      `Esto afectará los puntajes de RoboMission (scores) y RoboStarter (rs_scores) que no tienen evento asignado todavía.`
    )) return

    setMigrating(event.id)
    try {
      // Fetch all scores & rs_scores
      const [rmSnap, rsSnap] = await Promise.all([
        getDocs(collection(db, 'scores')),
        getDocs(collection(db, 'rs_scores')),
      ])

      const rmOrphans = rmSnap.docs.filter(d => !d.data().eventId)
      const rsOrphans = rsSnap.docs.filter(d => !d.data().eventId)
      const total     = rmOrphans.length + rsOrphans.length

      if (total === 0) {
        showMsg('success', 'No hay puntajes sin evento. Todo ya está asignado.')
        return
      }

      // Batch in chunks of 500 (Firestore limit)
      const allOps = [
        ...rmOrphans.map(d => ({ col: 'scores',    id: d.id })),
        ...rsOrphans.map(d => ({ col: 'rs_scores', id: d.id })),
      ]

      for (let i = 0; i < allOps.length; i += 400) {
        const chunk = allOps.slice(i, i + 400)
        const batch = writeBatch(db)
        chunk.forEach(({ col, id }) => {
          batch.update(doc(db, col, id), { eventId: event.id })
        })
        await batch.commit()
      }

      showMsg('success', `${total} puntaje(s) asignados a "${event.name}" exitosamente.`)
    } catch (err) {
      showMsg('error', 'Error al migrar: ' + err.message)
    } finally { setMigrating(null) }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Eventos / Competencias</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Cada evento guarda su propio historial de puntajes
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2 py-2">
          <Plus size={16} /> Nuevo evento
        </button>
      </div>

      {/* Message */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-5 ${
              msg.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {msg.text}
            <button onClick={() => setMsg(null)} className="ml-auto"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5">
            <form onSubmit={handleCreate} className="card border-brand-orange/20 bg-brand-orange/5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-brand-orange" /> Crear nuevo evento
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nombre del evento *</label>
                  <input className="input-field text-sm py-2"
                    placeholder="Ej: Competencia Nacional 2026"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Fecha *</label>
                  <input type="date" className="input-field text-sm py-2"
                    value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                  className="btn-ghost text-sm py-2 flex-1">Cancelar</button>
                <button type="submit" disabled={saving}
                  className="btn-primary text-sm py-2 flex-1 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Crear evento</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events list */}
      {events.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay eventos creados aún.</p>
          <p className="text-gray-600 text-xs mt-1">Crea un evento para organizar los puntajes por fecha de competencia.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ev => {
            const dateStr = ev.date
              ? new Date(ev.date + 'T12:00:00').toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })
              : '—'
            const isExpanded = expandedId === ev.id
            return (
              <div key={ev.id} className={`card border transition-colors ${
                ev.active ? 'border-brand-orange/30 bg-brand-orange/5' : 'border-dark-500'
              }`}>
                <div className="flex items-center gap-3">
                  {/* Active indicator */}
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${ev.active ? 'bg-brand-orange animate-pulse' : 'bg-dark-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white text-sm">{ev.name}</p>
                      {ev.active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 font-semibold">
                          Activo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Calendar size={10} /> {dateStr}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!ev.active && (
                      <button onClick={() => handleSetActive(ev)} disabled={!!activating}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-orange bg-dark-600 hover:bg-brand-orange/10 border border-dark-500 hover:border-brand-orange/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                        {activating === ev.id ? <Loader2 size={11} className="animate-spin" /> : <Radio size={11} />}
                        Activar
                      </button>
                    )}
                    <button onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                      className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded: migration action */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-4 pt-4 border-t border-dark-600">
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-700 border border-dark-500">
                          <Archive size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">Asignar puntajes sin evento</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Si tienes puntajes de antes de implementar el sistema de eventos, este botón los asigna todos a este evento. Útil para migrar datos históricos.
                            </p>
                          </div>
                          <button onClick={() => handleMigrate(ev)} disabled={!!migrating}
                            className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 shrink-0 whitespace-nowrap">
                            {migrating === ev.id ? <Loader2 size={11} className="animate-spin" /> : <Archive size={11} />}
                            Migrar puntajes
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* Info footer */}
      {events.length > 0 && (
        <p className="text-xs text-gray-600 mt-5 text-center">
          El evento <span className="text-brand-orange">activo</span> es donde se guardan los nuevos puntajes.
          Cambia el evento activo antes de empezar una nueva competencia.
        </p>
      )}
    </motion.div>
  )
}

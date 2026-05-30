import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, Trash2, X, CheckCircle, AlertCircle, Trophy, UserCheck, ChevronDown } from 'lucide-react'
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'

const CATEGORIES = ['elementary', 'junior', 'senior']

export default function TeamManagement() {
  const [teams, setTeams] = useState([])
  const [judges, setJudges] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const [form, setForm] = useState({
    name: '', number: '', category: 'elementary',
    coach: '', members: ['', ''],
    school: '', city: '', assignedJudgeId: ''
  })

  const fetchData = async () => {
    const [teamsSnap, judgesSnap] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getDocs(query(collection(db, 'users'), where('role', '==', 'judge')))
    ])
    setTeams(teamsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setJudges(judgesSnap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const members = form.members.filter(m => m.trim())
      await addDoc(collection(db, 'teams'), {
        ...form,
        members,
        createdAt: new Date().toISOString(),
      })
      setMsg({ type: 'success', text: `Equipo "${form.name}" registrado.` })
      setForm({ name: '', number: '', category: 'elementary', coach: '', members: ['', ''], school: '', city: '', assignedJudgeId: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (teamId, judgeId) => {
    await updateDoc(doc(db, 'teams', teamId), { assignedJudgeId: judgeId })
    fetchData()
  }

  const handleDelete = async (teamId) => {
    if (!confirm('¿Eliminar este equipo?')) return
    await deleteDoc(doc(db, 'teams', teamId))
    fetchData()
  }

  const filtered = filterCat === 'all' ? teams : teams.filter(t => t.category === filterCat)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Equipos</h1>
          <p className="text-gray-400 mt-1">{teams.length} equipo(s) registrados</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <PlusCircle size={18} /> Nuevo Equipo
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterCat === cat
                ? cat === 'all' ? 'bg-brand-orange text-white'
                  : cat === 'elementary' ? 'bg-elementary text-dark-900'
                  : cat === 'junior' ? 'bg-junior text-white'
                  : 'bg-senior text-white'
                : 'bg-dark-700 text-gray-400 hover:text-white border border-dark-500'
            }`}
          >
            {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Message */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4 ${
              msg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {msg.text}
            <button onClick={() => setMsg(null)} className="ml-auto"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teams list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Trophy size={48} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No hay equipos registrados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((team, i) => {
            const assignedJudge = judges.find(j => j.uid === team.assignedJudgeId || j.id === team.assignedJudgeId)
            const catJudges = judges.filter(j => j.category === team.category)
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card-hover"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    team.category === 'elementary' ? 'bg-elementary/20 text-elementary' :
                    team.category === 'junior' ? 'bg-junior/20 text-junior' : 'bg-senior/20 text-senior'
                  }`}>
                    {team.number || '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{team.name}</p>
                      <span className={`badge-${team.category}`}>{team.category}</span>
                      {team.school && <span className="text-xs text-gray-500">{team.school}</span>}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {team.members?.filter(Boolean).join(', ') || 'Sin integrantes'} · Coach: {team.coach || '–'}
                    </p>
                  </div>

                  {/* Assign judge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <select
                        value={team.assignedJudgeId || ''}
                        onChange={e => handleAssign(team.id, e.target.value)}
                        className="bg-dark-600 border border-dark-500 text-sm text-gray-300 px-3 py-1.5 pr-8 rounded-lg outline-none appearance-none cursor-pointer hover:border-brand-orange/50 transition-colors"
                      >
                        <option value="">Sin juez asignado</option>
                        {catJudges.map(j => (
                          <option key={j.id} value={j.uid || j.id}>{j.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                    {assignedJudge && (
                      <UserCheck size={16} className="text-green-400" />
                    )}
                    <button onClick={() => handleDelete(team.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card w-full max-w-lg my-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Registrar Equipo</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">Nombre del equipo *</label>
                    <input className="input-field" placeholder="Ej: Team Robo" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">Número de equipo</label>
                    <input className="input-field" placeholder="Ej: 25001" value={form.number}
                      onChange={e => setForm(f => ({ ...f, number: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">Categoría *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat} type="button" onClick={() => setForm(f => ({ ...f, category: cat }))}
                        className={`py-2 px-3 rounded-xl text-sm font-semibold border transition-all ${
                          form.category === cat
                            ? cat === 'elementary' ? 'bg-elementary/20 border-elementary text-elementary'
                              : cat === 'junior' ? 'bg-junior/20 border-junior text-junior'
                              : 'bg-senior/20 border-senior text-senior'
                            : 'border-dark-500 text-gray-400 hover:border-dark-400'
                        }`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">Coach / Entrenador</label>
                  <input className="input-field" placeholder="Nombre del coach" value={form.coach}
                    onChange={e => setForm(f => ({ ...f, coach: e.target.value }))} />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">Institución / Escuela</label>
                  <input className="input-field" placeholder="Nombre de la escuela" value={form.school}
                    onChange={e => setForm(f => ({ ...f, school: e.target.value }))} />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">Ciudad / Estado</label>
                  <input className="input-field" placeholder="Ej: Ciudad de México" value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">
                    Integrantes (máx. 3)
                  </label>
                  <div className="space-y-2">
                    {[0, 1, 2].map(idx => (
                      <input key={idx} className="input-field" placeholder={`Integrante ${idx + 1}${idx < 2 ? ' *' : ' (opcional)'}`}
                        value={form.members[idx] || ''}
                        onChange={e => {
                          const newMembers = [...form.members]
                          newMembers[idx] = e.target.value
                          setForm(f => ({ ...f, members: newMembers }))
                        }}
                        required={idx < 2}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancelar</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><PlusCircle size={16} /> Registrar</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, Trash2, X, CheckCircle, AlertCircle, Trophy, UserCheck, ChevronDown, Pencil, Search, SlidersHorizontal, Building2 } from 'lucide-react'
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { GC_TEAMS_COL } from './gcScoringData'

const CATEGORIES = ['elementary', 'junior', 'senior']

export default function GCTeamManagement() {
  const [teams, setTeams] = useState([])
  const [judges, setJudges] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const [search, setSearch] = useState('')
  const [filterCoach, setFilterCoach] = useState('')
  const [filterSchool, setFilterSchool] = useState('')
  const [filterJudge, setFilterJudge] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [form, setForm] = useState({
    name: '', number: '', category: 'elementary',
    coach: '', members: ['', ''],
    school: '', city: '', assignedJudgeId: ''
  })

  const emptyForm = { name: '', number: '', category: 'elementary', coach: '', members: ['', ''], school: '', city: '', assignedJudgeId: '' }

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowForm(true) }
  const openEdit = (team) => {
    setForm({
      name: team.name || '',
      number: team.number || '',
      category: team.category || 'elementary',
      coach: team.coach || '',
      members: [team.members?.[0] || '', team.members?.[1] || '', team.members?.[2] || ''],
      school: team.school || '',
      city: team.city || '',
      assignedJudgeId: team.assignedJudgeId || '',
    })
    setEditingId(team.id)
    setShowForm(true)
  }

  const fetchData = async () => {
    const [teamsSnap, judgesSnap] = await Promise.all([
      getDocs(collection(db, GC_TEAMS_COL)),
      getDocs(query(collection(db, 'users'), where('role', '==', 'judge')))
    ])
    setTeams(teamsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setJudges(judgesSnap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'institutions'), snap => {
      setInstitutions(
        snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name))
      )
    })
    return unsub
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const members = form.members.filter(m => m.trim())
      if (editingId) {
        await updateDoc(doc(db, GC_TEAMS_COL, editingId), { ...form, members })
        setMsg({ type: 'success', text: `Equipo "${form.name}" actualizado.` })
      } else {
        await addDoc(collection(db, GC_TEAMS_COL), { ...form, members, createdAt: new Date().toISOString() })
        setMsg({ type: 'success', text: `Equipo "${form.name}" registrado.` })
      }
      setShowForm(false)
      setEditingId(null)
      fetchData()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (teamId, judgeId) => {
    await updateDoc(doc(db, GC_TEAMS_COL, teamId), { assignedJudgeId: judgeId })
    fetchData()
  }

  const handleDelete = async (teamId) => {
    if (!confirm('¿Eliminar este equipo?')) return
    await deleteDoc(doc(db, GC_TEAMS_COL, teamId))
    fetchData()
  }

  // Derived filter options
  const coachOptions = [...new Set(teams.map(t => t.coach).filter(Boolean))].sort()
  const schoolOptions = [...new Set(teams.map(t => t.school).filter(Boolean))].sort()
  const judgeOptions = judges.filter(j => teams.some(t => t.assignedJudgeId === j.id || t.assignedJudgeId === j.uid))

  const activeFilterCount = [filterCoach, filterSchool, filterJudge].filter(Boolean).length

  const filtered = teams.filter(t => {
    if (filterCat !== 'all' && t.category !== filterCat) return false
    if (filterCoach && t.coach !== filterCoach) return false
    if (filterSchool && t.school !== filterSchool) return false
    if (filterJudge && t.assignedJudgeId !== filterJudge) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        t.name?.toLowerCase().includes(q) ||
        t.number?.toLowerCase().includes(q) ||
        t.coach?.toLowerCase().includes(q) ||
        t.school?.toLowerCase().includes(q) ||
        t.city?.toLowerCase().includes(q) ||
        t.members?.some(m => m?.toLowerCase().includes(q))
      )
    }
    return true
  })

  const clearFilters = () => { setSearch(''); setFilterCat('all'); setFilterCoach(''); setFilterSchool(''); setFilterJudge('') }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Equipos GC Fest</h1>
          <p className="text-gray-400 mt-1">{filtered.length} de {teams.length} equipo(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <PlusCircle size={18} /> Nuevo Equipo
        </button>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            className="input-field pl-9 py-2 text-sm"
            placeholder="Buscar por nombre, número, coach, escuela, ciudad o integrante..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`btn-ghost flex items-center gap-2 px-4 py-2 text-sm relative ${showFilters ? 'text-brand-orange border-brand-orange/40' : ''}`}
        >
          <SlidersHorizontal size={15} /> Filtros
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-orange text-white text-xs flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 mb-3 flex-wrap">
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

      {/* Advanced filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="card grid grid-cols-3 gap-3 py-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Coach</label>
                <select
                  value={filterCoach}
                  onChange={e => setFilterCoach(e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  <option value="">Todos</option>
                  {coachOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Escuela</label>
                <select
                  value={filterSchool}
                  onChange={e => setFilterSchool(e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  <option value="">Todas</option>
                  {schoolOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Juez asignado</label>
                <select
                  value={filterJudge}
                  onChange={e => setFilterJudge(e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  <option value="">Todos</option>
                  {judgeOptions.map(j => <option key={j.id} value={j.uid || j.id}>{j.name}</option>)}
                </select>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-white mt-2 ml-1 transition-colors">
                Limpiar todos los filtros
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
            const catJudges = judges.filter(j => j.category === `gc_${team.category}`)
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
                    <button onClick={() => openEdit(team)} className="text-gray-600 hover:text-brand-orange transition-colors p-1">
                      <Pencil size={16} />
                    </button>
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
                <h2 className="text-xl font-bold">{editingId ? 'Editar Equipo' : 'Registrar Equipo'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium flex items-center gap-1.5">
                    <Building2 size={14} /> Institución
                  </label>
                  <select
                    className="input-field"
                    value={form.school}
                    onChange={e => {
                      const inst = institutions.find(i => i.name === e.target.value)
                      setForm(f => ({ ...f, school: e.target.value, city: inst?.city || f.city }))
                    }}
                  >
                    <option value="">— Seleccionar institución —</option>
                    {institutions.map(i => (
                      <option key={i.id} value={i.name}>{i.name}{i.city ? ` (${i.city})` : ''}</option>
                    ))}
                  </select>
                  {institutions.length === 0 && (
                    <p className="text-xs text-yellow-500 mt-1">No hay instituciones registradas. Agrégalas en la tab "Instituciones" primero.</p>
                  )}
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
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : editingId
                        ? <><Pencil size={16} /> Guardar cambios</>
                        : <><PlusCircle size={16} /> Registrar</>
                    }
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

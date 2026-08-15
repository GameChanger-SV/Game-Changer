import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, X, Save, Users, ChevronDown, UserCheck, Search, Building2
} from 'lucide-react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, where, query
} from 'firebase/firestore'
import { db } from '../../../firebase'

const CATS = [
  { value: 'elementary', label: 'Kids Elementary', ages: '5–7 años',  cc: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' } },
  { value: 'junior',     label: 'Kids Junior',     ages: '7–10 años', cc: { bg: 'bg-lime-500/10',  border: 'border-lime-500/30',  text: 'text-lime-400'  } },
]

const EMPTY_FORM = {
  name: '', number: '', institution: '', category: 'elementary',
  member1: '', member2: '', member3: '', coach: '',
}

// Dropdown para asignar juez — solo muestra jueces de la misma categoría que el equipo
function JudgeSelector({ team, judges }) {
  const [open, setOpen] = useState(false)
  const catInfo = CATS.find(c => c.value === team.category)
  const cc      = catInfo?.cc || CATS[0].cc

  // Filtrar por categoría: rs_elementary → elementary, rs_junior → junior
  const eligible = judges.filter(j => j.category === `rs_${team.category}`)
  const assigned = eligible.find(j => j.id === team.assignedJudgeId)
    || judges.find(j => j.id === team.assignedJudgeId) // fallback para mostrar aunque cambie categoría

  const assign = async (judgeId) => {
    await updateDoc(doc(db, 'rs_teams', team.id), { assignedJudgeId: judgeId || null })
    setOpen(false)
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dark-500 bg-dark-700 text-xs text-gray-300 hover:${cc.border} transition-all`}>
        <UserCheck size={12} className={assigned ? cc.text : 'text-gray-600'} />
        <span className="max-w-[100px] truncate">{assigned ? assigned.name : 'Sin juez'}</span>
        <ChevronDown size={11} className={`text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute z-30 top-full right-0 mt-1 bg-dark-700 border border-dark-500 rounded-xl shadow-2xl min-w-[180px] overflow-hidden">
            <p className={`px-3 py-1.5 text-xs font-semibold ${cc.text} border-b border-dark-600`}>
              Jueces {catInfo?.label}
            </p>
            <button onClick={() => assign(null)}
              className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-dark-600 hover:text-white transition-all">
              Sin juez
            </button>
            {eligible.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-600 italic">No hay jueces para esta categoría</p>
            ) : eligible.map(j => (
              <button key={j.id} onClick={() => assign(j.id)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-dark-600 transition-all truncate ${
                  j.id === team.assignedJudgeId ? `${cc.text} bg-green-500/5` : 'text-gray-300'
                }`}>
                {j.name}
                {j.judgeId && <span className="text-gray-600 ml-1">#{j.judgeId}</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function RSTeamManagement() {
  const [teams, setTeams]           = useState([])
  const [judges, setJudges]         = useState([])
  const [institutions, setInstitutions] = useState([])
  const [catFilter, setCatFilter]   = useState('all')
  const [search, setSearch]         = useState('')
  const [form, setForm]             = useState(EMPTY_FORM)
  const [editing, setEditing]       = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(null)

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'rs_teams'), snap =>
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.name || '').localeCompare(b.name || '')))
    )
    // RS judges (rs_elementary / rs_junior)
    const q = query(collection(db, 'users'), where('role', '==', 'judge'))
    const u2 = onSnapshot(q, snap =>
      setJudges(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.category?.startsWith('rs_')))
    )
    // Institutions
    const u3 = onSnapshot(collection(db, 'institutions'), snap =>
      setInstitutions(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)))
    )
    return () => { u1(); u2(); u3() }
  }, [])

  const openCreate = () => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true) }
  const openEdit = (team) => {
    setForm({
      name: team.name || '', number: team.number || '',
      institution: team.institution || '', category: team.category || 'elementary',
      member1: team.member1 || '', member2: team.member2 || '',
      member3: team.member3 || '', coach: team.coach || '',
    })
    setEditing(team.id); setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, updatedAt: serverTimestamp() }
      if (editing) {
        await updateDoc(doc(db, 'rs_teams', editing), payload)
      } else {
        await addDoc(collection(db, 'rs_teams'), { ...payload, createdAt: serverTimestamp() })
      }
      closeForm()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este equipo?')) return
    setDeleting(id)
    await deleteDoc(doc(db, 'rs_teams', id))
    setDeleting(null)
  }

  const filtered = teams
    .filter(t => catFilter === 'all' || t.category === catFilter)
    .filter(t => !search || [t.name, t.number, t.institution, t.coach].some(v => v?.toLowerCase().includes(search.toLowerCase())))

  const field = (label, name, placeholder, required = false) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input className="input-field text-sm py-2" placeholder={placeholder}
        value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        required={required} />
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Equipos RoboStarter</h1>
          <p className="text-gray-400 mt-1 text-sm">Kids Elementary · Kids Junior</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2">
          <Plus size={16} /> Agregar equipo
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-2 bg-dark-700 p-1 rounded-xl">
          {[{ value: 'all', label: 'Todos' }, ...CATS].map(c => (
            <button key={c.value} onClick={() => setCatFilter(c.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                catFilter === c.value ? 'bg-dark-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input className="input-field pl-9 py-2 text-sm" placeholder="Buscar por nombre, número, institución..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={14} /></button>}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{search ? 'Sin resultados.' : 'No hay equipos registrados.'}</p>
          {!search && <button onClick={openCreate} className="btn-primary mt-4 py-2 px-4 text-sm">Agregar primer equipo</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((team, i) => {
            const catInfo = CATS.find(c => c.value === team.category)
            const cc = catInfo?.cc || CATS[0].cc
            return (
              <motion.div key={team.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }} className="card flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${cc.bg} border ${cc.border} flex items-center justify-center font-bold ${cc.text} text-sm shrink-0`}>
                  {team.number || team.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm">{team.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${cc.bg} border ${cc.border} ${cc.text}`}>{catInfo?.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {[team.member1, team.member2, team.member3].filter(Boolean).join(' · ') || 'Sin integrantes'}
                  </p>
                  {team.institution && (
                    <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                      <Building2 size={10} className="shrink-0" />{team.institution}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <JudgeSelector team={team} judges={judges} />
                  <button onClick={() => openEdit(team)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-all">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(team.id)} disabled={deleting === team.id}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && closeForm()}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white text-lg">{editing ? 'Editar equipo' : 'Nuevo equipo RS'}</h3>
                <button onClick={closeForm} className="text-gray-500 hover:text-white"><X size={18} /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                {/* Category selector */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Categoría</label>
                  <div className="flex gap-2">
                    {CATS.map(c => (
                      <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, category: c.value }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          form.category === c.value ? `${c.cc.bg} ${c.cc.border} ${c.cc.text}` : 'border-dark-500 text-gray-500 hover:text-gray-300'
                        }`}>
                        {c.label}
                        <span className="block text-gray-500 font-normal">{c.ages}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {field('Nombre del equipo *', 'name', 'Ej: RoboKids', true)}
                  {field('Número', 'number', 'Ej: 01')}
                </div>

                {/* Institution — select from list */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <Building2 size={12} /> Institución
                  </label>
                  <select
                    className="input-field text-sm py-2"
                    value={form.institution}
                    onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                  >
                    <option value="">— Seleccionar institución —</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.name}>
                        {inst.name}{inst.city ? ` (${inst.city})` : ''}
                      </option>
                    ))}
                  </select>
                  {institutions.length === 0 && (
                    <p className="text-xs text-yellow-500 mt-1">
                      No hay instituciones registradas. Agrégalas en la tab "Instituciones" primero.
                    </p>
                  )}
                  {/* Fallback: allow typing if not in list */}
                  {form.institution && !institutions.find(i => i.name === form.institution) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Institución personalizada: <span className="text-white">{form.institution}</span>
                    </p>
                  )}
                </div>

                {/* Members */}
                <div className="pt-1">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Integrantes</p>
                  <div className="space-y-2">
                    {field('Integrante 1 *', 'member1', 'Nombre completo', true)}
                    {field('Integrante 2', 'member2', 'Nombre completo')}
                    {field('Integrante 3', 'member3', 'Opcional')}
                  </div>
                </div>

                {field('Coach / Entrenador', 'coach', 'Nombre del coach')}

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={closeForm} className="btn-ghost flex-1 py-2 text-sm">Cancelar</button>
                  <button type="submit" disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-2 text-sm">
                    {saving
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Save size={15} /> {editing ? 'Guardar cambios' : 'Crear equipo'}</>}
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

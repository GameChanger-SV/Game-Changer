import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Trash2, Eye, EyeOff, X, CheckCircle, AlertCircle, Users, Pencil, Search } from 'lucide-react'
import { collection, deleteDoc, doc, query, where, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'

const CATEGORIES = [
  { value: 'elementary', label: 'Elementary' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
]

const emptyForm = { name: '', email: '', password: '', category: 'elementary', judgeId: '' }

export default function JudgeManagement() {
  const { createJudge } = useAuth()
  const [judges, setJudges] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showPass, setShowPass] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'judge'))
    const unsub = onSnapshot(q, snap => {
      setJudges(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, err => console.error('fetchJudges error:', err))
    return unsub
  }, [])

  const filtered = judges.filter(j => {
    if (filterCat !== 'all' && j.category !== filterCat) return false
    if (search) {
      const q = search.toLowerCase()
      return j.name?.toLowerCase().includes(q) || j.email?.toLowerCase().includes(q) || j.judgeId?.toLowerCase().includes(q)
    }
    return true
  })

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowPass(false); setShowForm(true) }
  const openEdit = (j) => {
    setForm({ name: j.name || '', email: j.email || '', password: '', category: j.category || 'elementary', judgeId: j.judgeId || '' })
    setEditingId(j.id)
    setShowPass(false)
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      if (editingId) {
        // Solo actualiza campos Firestore (nombre, categoría, ID)
        await updateDoc(doc(db, 'users', editingId), {
          name: form.name,
          category: form.category,
          judgeId: form.judgeId,
        })
        setMsg({ type: 'success', text: `Juez "${form.name}" actualizado.` })
      } else {
        await createJudge(form)
        setMsg({ type: 'success', text: `Juez "${form.name}" creado exitosamente.` })
      }
      closeForm()
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error al guardar.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (judgeId) => {
    if (!confirm('¿Eliminar este juez?')) return
    await deleteDoc(doc(db, 'users', judgeId))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Jueces</h1>
          <p className="text-gray-400 mt-1">{filtered.length} de {judges.length} juez(ces)</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openCreate} className="btn-primary flex items-center gap-2">
          <UserPlus size={18} /> Nuevo Juez
        </motion.button>
      </div>

      {/* Search + category filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            className="input-field pl-9 py-2 text-sm"
            placeholder="Buscar por nombre, email o ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {['all', 'elementary', 'junior', 'senior'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterCat === cat
                  ? cat === 'all' ? 'bg-brand-orange text-white border-brand-orange'
                    : cat === 'elementary' ? 'bg-elementary/20 border-elementary text-elementary'
                    : cat === 'junior' ? 'bg-junior/20 border-junior text-junior'
                    : 'bg-senior/20 border-senior text-senior'
                  : 'border-dark-500 text-gray-400 hover:text-white hover:border-dark-400'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-5 ${
              msg.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {msg.text}
            <button onClick={() => setMsg(null)} className="ml-auto"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Judges list */}
      {judges.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={48} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No hay jueces registrados aún.</p>
          <button onClick={openCreate} className="btn-ghost mt-4 inline-flex items-center gap-2">
            <UserPlus size={16} /> Crear el primero
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10">
          <Search size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Sin resultados para los filtros aplicados.</p>
          <button onClick={() => { setSearch(''); setFilterCat('all') }} className="btn-ghost mt-3 text-sm py-1.5 px-4">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((j, i) => (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card-hover flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                j.category === 'elementary' ? 'bg-elementary/20 text-elementary' :
                j.category === 'junior' ? 'bg-junior/20 text-junior' : 'bg-senior/20 text-senior'
              }`}>
                {j.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{j.name}</p>
                <p className="text-sm text-gray-400 truncate">{j.email}</p>
              </div>
              <span className={`badge-${j.category} shrink-0`}>{j.category}</span>
              {j.judgeId && (
                <span className="text-xs text-gray-500 font-mono bg-dark-600 px-2 py-1 rounded-lg shrink-0">
                  #{j.judgeId}
                </span>
              )}
              <button onClick={() => openEdit(j)} className="text-gray-600 hover:text-brand-orange transition-colors shrink-0 p-1">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(j.id)} className="text-gray-600 hover:text-red-400 transition-colors shrink-0 p-1">
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && closeForm()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editingId ? 'Editar Juez' : 'Crear Juez'}</h2>
                <button onClick={closeForm} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">Nombre completo</label>
                  <input
                    className="input-field"
                    placeholder="Ej: María García"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">ID de Juez (opcional)</label>
                  <input
                    className="input-field"
                    placeholder="Ej: J01"
                    value={form.judgeId}
                    onChange={e => setForm(f => ({ ...f, judgeId: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">Categoría</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(({ value, label }) => (
                      <button key={value} type="button" onClick={() => setForm(f => ({ ...f, category: value }))}
                        className={`py-2 px-3 rounded-xl text-sm font-semibold border transition-all ${
                          form.category === value
                            ? value === 'elementary' ? 'bg-elementary/20 border-elementary text-elementary'
                              : value === 'junior' ? 'bg-junior/20 border-junior text-junior'
                              : 'bg-senior/20 border-senior text-senior'
                            : 'border-dark-500 text-gray-400 hover:border-dark-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email y contraseña solo al crear */}
                {!editingId && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5 font-medium">Correo electrónico</label>
                      <input
                        type="email" className="input-field" placeholder="juez@ejemplo.com"
                        value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5 font-medium">Contraseña temporal</label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'} className="input-field pr-12"
                          placeholder="Mínimo 6 caracteres" value={form.password}
                          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6}
                        />
                        <button type="button" onClick={() => setShowPass(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {editingId && (
                  <p className="text-xs text-gray-500 bg-dark-700 rounded-xl px-3 py-2">
                    El correo y contraseña no se pueden cambiar desde aquí. Para resetear la contraseña usa la consola de Firebase.
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeForm} className="btn-ghost flex-1">Cancelar</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : editingId
                        ? <><Pencil size={16} /> Guardar cambios</>
                        : <><UserPlus size={16} /> Crear</>
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

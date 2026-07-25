import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { Building2, Plus, Trash2, Pencil, Check, X, Loader2, Search } from 'lucide-react'

export default function InstitutionManagement() {
  const [institutions, setInstitutions] = useState([])
  const [search, setSearch]             = useState('')
  const [adding, setAdding]             = useState(false)
  const [newName, setNewName]           = useState('')
  const [newCity, setNewCity]           = useState('')
  const [saving, setSaving]             = useState(false)
  const [editId, setEditId]             = useState(null)
  const [editName, setEditName]         = useState('')
  const [editCity, setEditCity]         = useState('')
  const [deleting, setDeleting]         = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'institutions'), snap => {
      setInstitutions(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
    })
    return unsub
  }, [])

  const filtered = search
    ? institutions.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.city?.toLowerCase().includes(search.toLowerCase())
      )
    : institutions

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'institutions'), {
        name: newName.trim(),
        city: newCity.trim(),
        createdAt: new Date().toISOString(),
      })
      setNewName('')
      setNewCity('')
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (id) => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'institutions', id), {
        name: editName.trim(),
        city: editCity.trim(),
      })
      setEditId(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta institución? Los equipos que la tenían asignada mantendrán el nombre guardado.')) return
    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'institutions', id))
    } finally {
      setDeleting(null)
    }
  }

  const startEdit = (inst) => {
    setEditId(inst.id)
    setEditName(inst.name)
    setEditCity(inst.city || '')
    setAdding(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Instituciones</h1>
          <p className="text-gray-400 mt-1">{institutions.length} registradas</p>
        </div>
        <button
          onClick={() => { setAdding(true); setEditId(null) }}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
        >
          <Plus size={16} /> Nueva institución
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card mb-6 border-brand-orange/30"
          >
            <p className="font-semibold text-white mb-4">Nueva institución</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                <input
                  className="input-field py-2 text-sm"
                  placeholder="Ej: Colegio García Flamenco"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ciudad</label>
                <input
                  className="input-field py-2 text-sm"
                  placeholder="Ej: San Salvador"
                  value={newCity}
                  onChange={e => setNewCity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving || !newName.trim()}
                className="btn-primary flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Guardar
              </button>
              <button onClick={() => setAdding(false)} className="btn-ghost text-sm px-4 py-2">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      {institutions.length > 0 && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            className="input-field pl-9 py-2 text-sm"
            placeholder="Buscar por nombre o ciudad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* List */}
      {institutions.length === 0 ? (
        <div className="card text-center py-16">
          <Building2 size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No hay instituciones registradas.</p>
          <p className="text-gray-500 text-sm mt-1">Agrega la primera para poder asignarla a los equipos.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Institución</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 w-48">Ciudad</th>
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((inst, i) => (
                <tr key={inst.id} className="border-b border-dark-700 last:border-0 hover:bg-dark-700/30 transition-colors">
                  <td className="px-5 py-3">
                    {editId === inst.id ? (
                      <input
                        className="input-field py-1.5 text-sm w-full"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-orange/15 flex items-center justify-center shrink-0">
                          <Building2 size={14} className="text-brand-orange" />
                        </div>
                        <p className="font-medium text-white text-sm">{inst.name}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editId === inst.id ? (
                      <input
                        className="input-field py-1.5 text-sm w-full"
                        value={editCity}
                        onChange={e => setEditCity(e.target.value)}
                        placeholder="Ciudad"
                        onKeyDown={e => e.key === 'Enter' && handleEdit(inst.id)}
                      />
                    ) : (
                      <p className="text-sm text-gray-400">{inst.city || '—'}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {editId === inst.id ? (
                        <>
                          <button
                            onClick={() => handleEdit(inst.id)}
                            disabled={saving}
                            className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/15 transition-all disabled:opacity-50"
                          >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                          <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-gray-500 hover:bg-dark-600 transition-all">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(inst)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-dark-600 transition-all">
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(inst.id)}
                            disabled={deleting === inst.id}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                          >
                            {deleting === inst.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Returns the currently active event object { id, name, date, active, ... }
 * Returns null if no active event exists.
 * Returns undefined while loading.
 */
export function useActiveEvent() {
  const [activeEvent, setActiveEvent] = useState(undefined)

  useEffect(() => {
    const q = query(collection(db, 'events'), where('active', '==', true))
    return onSnapshot(q, snap => {
      setActiveEvent(snap.docs[0] ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null)
    })
  }, [])

  return activeEvent
}

// Hojas de puntuación GC Fest 2026 (Game Changer · Liga Nacional de Robótica)
// Fuente: Rubrica_<Categoría>_GCFest_2026_CORREGIDA.pdf (hojas corregidas por la organización).
// Mismo formato que scoringData.js de RoboMission para reutilizar ScoreSheet.
//
//   count:      true = contador (varios objetos), false = interruptor sí/no
//   max:        cuántos objetos pueden puntuar en esa fila
//   perItem:    puntos por objeto
//   totalMax:   máximo de la fila (solo informativo en pantalla)
//   mutualWith: fila "completamente" vs "parcialmente" — un objeto solo puntúa en una de las dos

// ─── ELEMENTARY — Rescate Patrimonial en Joya de Cerén ──────────────────────
// Hoja corregida: máximo 295 (8 artefactos, 8 cubos, 4 barreras, estacionamiento 30)
export const GC_ELEMENTARY_MISSIONS = [
  {
    id: 'm1',
    title: '1. Preparación de los espacios',
    description: 'Artefactos y cubos dentro de la zona objetivo de su color.',
    items: [
      { id: 'm1_a', label: 'Artefacto (rojo, amarillo, azul o verde) completamente dentro de su zona objetivo', count: true, max: 8, perItem: 10, totalMax: 80 },
      { id: 'm1_b', label: 'Cubo completamente dentro de la zona objetivo de su color', count: true, max: 8, perItem: 5, totalMax: 40 },
    ]
  },
  {
    id: 'm2',
    title: '2. Preparación de los talleres',
    description: 'Herramientas dentro de su zona objetivo.',
    items: [
      { id: 'm2_a', label: 'Herramienta completamente dentro de su zona objetivo', count: true, max: 3, perItem: 10, totalMax: 30 },
      { id: 'm2_b', label: 'Herramienta parcialmente dentro de su zona objetivo', count: true, max: 3, perItem: 5, totalMax: null, mutualWith: 'm2_a', note: 'Cada herramienta puntúa en una sola fila' },
    ]
  },
  {
    id: 'm3',
    title: '3. Mosaico de la celebración',
    description: 'Pelota dentro del mosaico y la barrera que la sostenía permanece en su posición inicial.',
    items: [
      { id: 'm3_a', label: 'Pelota completamente dentro del mosaico y barrera sin derribar ni desplazar', count: true, max: 4, perItem: 15, totalMax: 60 },
      { id: 'm3_b', label: 'Pelota parcialmente dentro del mosaico y barrera sin derribar ni desplazar', count: true, max: 4, perItem: 5, totalMax: null, mutualWith: 'm3_a', note: 'Cada pelota puntúa en una sola fila' },
    ]
  },
  {
    id: 'm4',
    title: '4. Estacionamiento final',
    description: 'El robot termina en el cuadrado blanco de Aramco.',
    items: [
      { id: 'm4_a', label: 'El robot se detiene completamente dentro de la zona de estacionamiento (cuadrado blanco de Aramco)', count: false, max: 1, perItem: 30, totalMax: 30 },
    ]
  },
  {
    id: 'm5',
    title: '5. Bonus – Protección de barreras',
    description: 'Perico en su zona objetivo.',
    items: [
      { id: 'm5_a', label: 'El perico llegó a la zona objetivo, permanece completamente dentro y se mantiene de pie', count: false, max: 1, perItem: 15, totalMax: 15 },
    ]
  },
  {
    id: 'm6',
    title: '6. Puntos extras',
    description: 'Barreras sin mover.',
    items: [
      { id: 'm6_a', label: 'Barrera en su posición inicial, sin ser derribada ni desplazada significativamente', count: true, max: 4, perItem: 10, totalMax: 40 },
    ]
  },
]

export const GC_ELEMENTARY_MAX = 295

// ─── JUNIOR — El Salvador Suena ─────────────────────────────────────────────
// Hoja corregida: máximo 245. La nota azul solo puntúa "completamente" (fila parcial = 3 notas).
export const GC_JUNIOR_MISSIONS = [
  {
    id: 'm1',
    title: '1. Ubicación del amplificador',
    description: 'Amplificador en su área objetivo.',
    items: [
      { id: 'm1_a', label: 'El amplificador está completamente en el área objetivo', count: false, max: 1, perItem: 10, totalMax: 10 },
    ]
  },
  {
    id: 'm2',
    title: '2. Expansión del sonido (altavoces)',
    description: 'Altavoces en las zonas objetivo exteriores.',
    items: [
      { id: 'm2_a', label: 'Altavoz completamente dentro de la zona objetivo exterior asignada', count: true, max: 2, perItem: 10, totalMax: 20 },
      { id: 'm2_b', label: 'Altavoz solo parcialmente dentro de la zona objetivo exterior', count: true, max: 2, perItem: 5, totalMax: null, mutualWith: 'm2_a', note: 'Cada altavoz puntúa en una sola fila' },
    ]
  },
  {
    id: 'm3',
    title: '3. Reubicación de instrumentos',
    description: 'Guitarra, piano y conga en la zona del camión.',
    items: [
      { id: 'm3_a', label: 'Instrumento (guitarra, piano o conga) completamente dentro de la zona del camión', count: true, max: 3, perItem: 25, totalMax: 75 },
      { id: 'm3_b', label: 'Instrumento solo parcialmente dentro de la zona del camión (o tocando la zona)', count: true, max: 3, perItem: 10, totalMax: null, mutualWith: 'm3_a', note: 'Cada instrumento puntúa en una sola fila' },
    ]
  },
  {
    id: 'm4',
    title: '4. Ubicación del micrófono',
    description: 'Micrófono en su área objetivo.',
    items: [
      { id: 'm4_a', label: 'El micrófono está completamente en el área objetivo', count: false, max: 1, perItem: 25, totalMax: 25 },
      { id: 'm4_b', label: 'El micrófono está parcialmente o tocando el área objetivo', count: false, max: 1, perItem: 10, totalMax: null, mutualWith: 'm4_a' },
    ]
  },
  {
    id: 'm5',
    title: '5. Recuperación de la clave de sol',
    description: 'Clave de sol en el recuadro celeste.',
    items: [
      { id: 'm5_a', label: 'La clave de sol está completamente en el recuadro celeste', count: false, max: 1, perItem: 15, totalMax: 15 },
      { id: 'm5_b', label: 'La clave de sol solo está parcialmente dentro del recuadro celeste', count: false, max: 1, perItem: 7, totalMax: null, mutualWith: 'm5_a' },
    ]
  },
  {
    id: 'm6',
    title: '6. Sintonía de notas musicales',
    description: 'Notas verde y roja en su casilla fija; las demás en cualquier posición objetivo restante.',
    items: [
      { id: 'm6_a', label: 'Nota verde y/o roja completamente dentro de su zona objetivo y en posición vertical', count: true, max: 2, perItem: 15, totalMax: 30 },
      { id: 'm6_b', label: 'Nota verde y/o roja parcialmente dentro de su zona objetivo o no vertical', count: true, max: 2, perItem: 5, totalMax: null, mutualWith: 'm6_a', note: 'Cada nota puntúa en una sola fila' },
      { id: 'm6_c', label: 'Nota (blanca, negra, azul o amarilla) completamente dentro de su área objetivo', count: true, max: 4, perItem: 10, totalMax: 40 },
      { id: 'm6_d', label: 'Nota (blanca, negra o amarilla) parcialmente dentro de su área objetivo', count: true, max: 3, perItem: 5, totalMax: null, mutualWith: 'm6_c', note: 'Cada nota puntúa en una sola fila' },
    ]
  },
  {
    id: 'm7',
    title: '7. Puntos extra y cierre del festival',
    description: 'Barreras intactas y estacionamiento final.',
    items: [
      { id: 'm7_a', label: 'Barrera de seguridad no dañada ni desplazada fuera de la zona', count: true, max: 2, perItem: 10, totalMax: 20 },
      { id: 'm7_b', label: 'El robot se detiene completamente dentro de la zona de estacionamiento final', count: false, max: 1, perItem: 10, totalMax: 10 },
      { id: 'm7_c', label: 'El robot se detiene solo parcialmente dentro de la zona de estacionamiento final', count: false, max: 1, perItem: 5, totalMax: null, mutualWith: 'm7_b' },
    ]
  },
]

export const GC_JUNIOR_MAX = 245

// ─── SENIOR — Rescate Patrimonial en Joya de Cerén ──────────────────────────
// Hoja corregida: máximo 215 (sin cambios respecto a la original).
export const GC_SENIOR_MISSIONS = [
  {
    id: 'm1',
    title: '1. Recuperación de artefactos',
    description: 'Artefactos en la zona objetivo de su color.',
    items: [
      { id: 'm1_a', label: 'Artefacto (rojo, amarillo, azul o verde) completamente dentro de su zona objetivo', count: true, max: 4, perItem: 10, totalMax: 40 },
      { id: 'm1_b', label: 'Artefacto (rojo, amarillo, azul o verde) parcialmente dentro de su zona objetivo', count: true, max: 4, perItem: 5, totalMax: null, mutualWith: 'm1_a', note: 'Cada artefacto puntúa en una sola fila' },
    ]
  },
  {
    id: 'm2',
    title: '2. Evacuación de visitantes',
    description: 'Visitantes en el área objetivo de su color.',
    items: [
      { id: 'm2_a', label: 'Visitante (rojo, verde, azul o negro) completamente dentro de su área objetivo', count: true, max: 4, perItem: 10, totalMax: 40 },
    ]
  },
  {
    id: 'm3',
    title: '3. Reubicación de las torres rojas',
    description: 'Torres rojas en el área objetivo roja (incluido el borde naranja), en posición vertical.',
    items: [
      { id: 'm3_a', label: 'Torre roja completamente dentro del área objetivo roja y en posición vertical', count: true, max: 2, perItem: 15, totalMax: 30 },
      { id: 'm3_b', label: 'Torre roja parcialmente dentro del área objetivo roja y en posición vertical', count: true, max: 2, perItem: 5, totalMax: null, mutualWith: 'm3_a', note: 'Cada torre puntúa en una sola fila' },
    ]
  },
  {
    id: 'm4',
    title: '4. Reubicación de las torres amarillas',
    description: 'Torres amarillas en el área objetivo amarilla (incluido el borde naranja), en posición vertical.',
    items: [
      { id: 'm4_a', label: 'Torre amarilla completamente dentro del área objetivo amarilla y en posición vertical', count: true, max: 2, perItem: 30, totalMax: 60 },
      { id: 'm4_b', label: 'Torre amarilla parcialmente dentro del área objetivo amarilla y en posición vertical', count: true, max: 2, perItem: 15, totalMax: null, mutualWith: 'm4_a', note: 'Cada torre puntúa en una sola fila' },
    ]
  },
  {
    id: 'm5',
    title: '5. Protección del perico',
    description: 'Perico en su zona objetivo y de pie.',
    items: [
      { id: 'm5_a', label: 'El perico llegó a la zona objetivo, permanece completamente dentro y se mantiene de pie', count: false, max: 1, perItem: 15, totalMax: 15 },
    ]
  },
  {
    id: 'm6',
    title: '6. Puntos extras',
    description: 'Barreras intactas y estacionamiento final.',
    items: [
      { id: 'm6_a', label: 'Barrera no derribada ni desplazada significativamente de su posición inicial', count: true, max: 2, perItem: 10, totalMax: 20 },
      { id: 'm6_b', label: 'El robot se detiene completamente dentro de la zona de estacionamiento final', count: false, max: 1, perItem: 10, totalMax: 10 },
    ]
  },
]

export const GC_SENIOR_MAX = 215

// ─── Configuración por categoría (usada por admin y juez) ───────────────────
export const GC_CATEGORIES = ['elementary', 'junior', 'senior']

export const GC_CAT_CONFIG = {
  elementary: { label: 'Elementary', theme: 'Rescate Patrimonial en Joya de Cerén', missions: GC_ELEMENTARY_MISSIONS, max: GC_ELEMENTARY_MAX },
  junior:     { label: 'Junior',     theme: 'El Salvador Suena',                    missions: GC_JUNIOR_MISSIONS,     max: GC_JUNIOR_MAX },
  senior:     { label: 'Senior',     theme: 'Rescate Patrimonial en Joya de Cerén', missions: GC_SENIOR_MISSIONS,     max: GC_SENIOR_MAX },
}

// Colecciones de Firestore propias de GC Fest (separadas de RoboMission/RoboStarter)
export const GC_TEAMS_COL  = 'gc_teams'
export const GC_SCORES_COL = 'gc_scores'

// Categoría del perfil del juez: gc_elementary | gc_junior | gc_senior
export const GC_JUDGE_PREFIX = 'gc_'

// Morado del nombre del reto. Es una versión más clara del morado de la portada
// del PDF (#7E3FB0) para que se lea bien sobre el fondo oscuro.
export const GC_PURPLE = '#A86ADB'

// Ranking: mejor ronda; desempate por menor tiempo en esa ronda
export function rankGCTeams(teams, scores) {
  const rows = teams.map(team => {
    const teamScores = scores.filter(s => s.teamId === team.id)
    const roundMap = {}
    teamScores.forEach(s => { roundMap[s.round] = s })
    if (teamScores.length === 0) return { team, best: null, bestTime: null, roundMap }
    // Mejor ronda = mayor puntaje; si empata dentro del equipo, la de menor tiempo
    const bestScore = [...teamScores].sort((a, b) => (b.total ?? 0) - (a.total ?? 0) || compareTime(a.seconds, b.seconds))[0]
    return { team, best: bestScore.total ?? 0, bestTime: toSeconds(bestScore.seconds), roundMap }
  })
  return rows.sort((a, b) => {
    if (a.best === null && b.best === null) return 0
    if (a.best === null) return 1
    if (b.best === null) return -1
    return b.best - a.best || compareTime(a.bestTime, b.bestTime)
  })
}

export function toSeconds(v) {
  const n = Number(v)
  return v === null || v === undefined || v === '' || Number.isNaN(n) ? null : n
}

// Menor tiempo primero; sin tiempo registrado va después de quien sí tiene
function compareTime(a, b) {
  const ta = toSeconds(a)
  const tb = toSeconds(b)
  if (ta === null && tb === null) return 0
  if (ta === null) return 1
  if (tb === null) return -1
  return ta - tb
}

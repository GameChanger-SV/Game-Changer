# WRO El Salvador — Sistema de Evaluación RoboMission 2026
**Game Changer Robotics**

Plataforma web para jueces de WRO El Salvador 2026, categoría RoboMission. Incluye panel de administración y tres interfaces de juez (Elementary, Junior y Senior) con puntuación en tiempo real.

---

## Funcionalidades

### Panel de Administrador
- Crear, editar y eliminar jueces (nombre, ID, categoría)
- Registrar, editar y eliminar equipos (integrantes, coach, escuela, ciudad)
- Asignar jueces a equipos por categoría
- Buscador y filtros avanzados (categoría, coach, escuela, juez asignado)
- Vista de **Resultados** — puntajes por equipo y ronda con exportación a CSV
- **Ranking** en tiempo real — clasificación por mejor puntaje de 3 rondas con medallas

### Panel de Juez
- Lista de equipos asignados con buscador
- Hoja de puntuación interactiva por ronda (3 rondas)
- Validación automática de reglas de exclusión mutua entre ítems de misión
- Registro de tiempo (segundos)
- Modal de recursos: reglamento, mapa de pista, elementos y video oficial
- Guardado automático en Firestore

### Categorías

| Categoría | Edades | Puntuación máxima | Temática |
|-----------|--------|-------------------|----------|
| Elementary | 8–12 años | 255 pts | 🎵 Festival de Música |
| Junior | 11–15 años | 230 pts | 🏰 Patrimonio Histórico |
| Senior | 14–19 años | 233 pts | 🏗️ Construcción Urbana |

---

## Infraestructura

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub (código)                       │
│              GameChanger-SV/Game-Changer                 │
│                         │                               │
│              push a main │                               │
│                         ▼                               │
│              GitHub Actions (CI/CD)                      │
│           npm ci → npm run build → deploy                │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────▼───────────────┐
          │      Firebase Hosting          │
          │  gc-wro-judging-2026.web.app  │
          │   (archivos estáticos/React)  │
          └───────────────┬───────────────┘
                          │
          ┌───────────────▼───────────────┐
          │         Firebase              │
          │  ┌─────────────────────────┐  │
          │  │  Authentication         │  │
          │  │  Email/Password         │  │
          │  └─────────────────────────┘  │
          │  ┌─────────────────────────┐  │
          │  │  Firestore Database     │  │
          │  │  /users   (jueces)      │  │
          │  │  /teams   (equipos)     │  │
          │  │  /scores  (puntajes)    │  │
          │  └─────────────────────────┘  │
          └───────────────────────────────┘
```

### Tecnologías
- **React + Vite** — frontend con animaciones (Framer Motion)
- **TailwindCSS** — estilos con tema personalizado
- **Firebase Authentication** — login con email/password, roles admin/juez
- **Cloud Firestore** — base de datos en tiempo real con reglas de seguridad
- **Firebase Hosting** — hosting de la app estática
- **GitHub Actions** — deploy automático en cada push a `main`

---

## Costos

Todo el proyecto corre en **planes gratuitos**. Para un evento con ~100 jueces, 1 admin y ~100 equipos el uso estimado es:

| Servicio | Límite gratuito | Uso estimado | Costo |
|----------|----------------|--------------|-------|
| Firestore reads | 50,000/día | ~500/día | $0 |
| Firestore writes | 20,000/día | ~300/día | $0 |
| Firebase Hosting | 360MB/día transferencia | ~50MB | $0 |
| Firebase Authentication | Ilimitado | 101 usuarios | $0 |
| GitHub Actions | 2,000 min/mes (privado) | ~2 min/deploy | $0 |

**Total: $0/mes** para el uso normal de una competencia de robótica local.

---

## Instalación local

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## Configuración de Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) y crea un proyecto
2. Agrega una app web → copia el objeto `firebaseConfig` en `src/firebase.js`
3. Habilita **Authentication → Email/Password**
4. Crea la base de datos en **Firestore** (modo producción)
5. En **Firestore → Reglas**, pega el contenido de `firestore.rules` y publica

### Crear la cuenta de administrador

1. **Authentication** → Add user → pon el email y contraseña del admin
2. Al iniciar sesión por primera vez, el sistema crea el perfil de admin automáticamente

A partir de ahí el admin puede crear jueces y equipos desde el panel web.

---

## Deploy automático

Cada `git push` a `main` dispara GitHub Actions que construye y despliega automáticamente.

Para el primer deploy manual:
```bash
npm run build
npx firebase deploy --only hosting
```

### Configuración requerida (una sola vez)

1. Crear una Service Account en [Google Cloud IAM](https://console.cloud.google.com/iam-admin/serviceaccounts) con rol **Firebase Hosting Admin**
2. Descargar el JSON de la key
3. Agregar como secret en GitHub → **Settings → Secrets → Actions** con el nombre `FIREBASE_SERVICE_ACCOUNT`

---

## Estructura del proyecto

```
wro-judging/
├── .github/workflows/
│   └── deploy.yml              — CI/CD: build + Firebase deploy
├── src/
│   ├── App.jsx                 — Enrutador principal (admin/juez/login)
│   ├── firebase.js             — Configuración Firebase (editar)
│   ├── contexts/
│   │   └── AuthContext.jsx     — Auth + perfil + createJudge
│   └── components/
│       ├── Login.jsx
│       ├── admin/
│       │   ├── AdminDashboard.jsx   — Layout + navegación
│       │   ├── JudgeManagement.jsx  — CRUD jueces + buscador + filtros
│       │   ├── TeamManagement.jsx   — CRUD equipos + buscador + filtros
│       │   ├── ResultsView.jsx      — Puntajes por equipo/ronda + CSV
│       │   └── RankingView.jsx      — Leaderboard en tiempo real
│       └── judge/
│           ├── JudgeDashboard.jsx   — Equipos asignados + buscador
│           └── scoring/
│               ├── ScoreSheet.jsx   — Hoja de puntuación interactiva
│               └── scoringData.js   — Misiones y puntos (3 categorías)
├── firestore.rules             — Reglas de seguridad Firestore
├── firebase.json               — Configuración Firebase Hosting
└── .firebaserc                 — Proyecto Firebase activo
```

---

*WRO El Salvador 2026 · Game Changer Robotics*

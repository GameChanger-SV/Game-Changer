# WRO RoboMission – Sistema de Evaluación 2026
**Game Changer Robotics**

Plataforma web para jueces de la categoría RoboMission de WRO Mexico 2026.  
Incluye panel de administrador y tres interfaces de juez: Elementary, Junior y Senior.

---

## Stack
- **React + Vite** — frontend rápido con animaciones (Framer Motion)
- **Firebase** — autenticación (Email/Password) + Firestore (base de datos)
- **TailwindCSS** — estilos

---

## Instalación rápida

```bash
cd wro-judging
npm install
npm run dev
```

---

## Configuración de Firebase (obligatorio)

1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Crea un proyecto nuevo (ej: `wro-judging-2026`)
3. Agrega una app web → copia el objeto `firebaseConfig`
4. Pega las credenciales en `src/firebase.js`
5. En Firebase Console:
   - **Authentication** → Sign-in method → habilita **Email/Password**
   - **Firestore Database** → crear en modo producción
   - **Firestore Rules** → pega el contenido de `firestore.rules`

---

## Crear la cuenta de administrador

Después de configurar Firebase, crea el admin manualmente desde Firebase Console:

1. **Authentication** → Agregar usuario → pon email y contraseña del admin
2. **Firestore** → Colección `users` → nuevo documento con el **UID** del usuario como ID:
   ```json
   {
     "uid": "UID_DEL_ADMIN",
     "email": "admin@ejemplo.com",
     "name": "Administrador",
     "role": "admin"
   }
   ```

A partir de ahí, el admin puede crear jueces desde el panel web.

---

## Flujo de uso

### Admin
1. Inicia sesión → Panel de Administración
2. **Jueces** → crea cuentas para cada juez (nombre, email, contraseña, categoría)
3. **Equipos** → registra equipos con participantes y asígnalos a un juez

### Juez
1. Inicia sesión con las credenciales que creó el admin
2. Ve sus equipos asignados
3. Para cada equipo: 3 rondas con tabla de puntuación automática
4. Recursos disponibles: reglamento, pista, elementos de pista, video

---

## Estructura del proyecto

```
src/
  App.jsx                    — Enrutador principal
  firebase.js                — Configuración Firebase ⚠️ editar
  index.css                  — Estilos globales (Tailwind)
  contexts/
    AuthContext.jsx           — Auth + perfil de usuario
  components/
    Login.jsx                 — Pantalla de login
    admin/
      AdminDashboard.jsx      — Layout + navegación admin
      JudgeManagement.jsx     — CRUD de jueces
      TeamManagement.jsx      — CRUD de equipos + asignación
    judge/
      JudgeDashboard.jsx      — Lista de equipos del juez
      scoring/
        ScoreSheet.jsx        — Tabla de puntuación interactiva
        scoringData.js        — Misiones y puntos (Elementary/Junior/Senior)
```

---

## Categorías y puntajes máximos

| Categoría | Edades | Puntuación máxima | Temática |
|-----------|--------|-------------------|----------|
| Elementary | 8–12 años | 255 pts | 🎵 Festival de Música |
| Junior | 11–15 años | 230 pts | 🏰 Patrimonio Histórico |
| Senior | 14–19 años | 233 pts | 🏗️ Construcción Urbana |

---

## Deploy

```bash
npm run build
# Sube la carpeta `dist/` a Firebase Hosting, Vercel, o Netlify
```

Para Firebase Hosting:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

*WRO Mexico 2026 · Game Changer Robotics*

# Rulo Dashboard

Dashboard web del **Rulo Fitness**: app para registrar entrenos de gimnasio y comidas con macros. Pensado para uso en navegador y como **PWA** (instalable en iOS y Android).

---

## Índice

1. [Qué es el Dashboard de Rulo](#qué-es-el-dashboard-de-rulo)
2. [Stack técnico](#stack-técnico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Requisitos e instalación](#requisitos-e-instalación)
5. [Variables de entorno](#variables-de-entorno)
6. [Scripts disponibles](#scripts-disponibles)
7. [Flujo de la aplicación](#flujo-de-la-aplicación)
8. [Autenticación](#autenticación)
9. [Vistas principales](#vistas-principales)
10. [Datos y persistencia](#datos-y-persistencia)
11. [API (rulo-api)](#api-rulo-api)
12. [Internacionalización (i18n)](#internacionalización-i18n)
13. [Temas (claro / oscuro)](#temas-claro--oscuro)
14. [PWA y manifest](#pwa-y-manifest)
15. [Componentes clave](#componentes-clave)
16. [Convenciones y notas](#convenciones-y-notas)

---

## Qué es el Dashboard de Rulo

El **Rulo Dashboard** es el frontend de la experiencia Rulo Fitness. Permite:

- **Iniciar sesión** con teléfono y contraseña (API externa).
- **Registro de perfil** (edad, sexo, peso, altura, nivel de actividad, objetivo, ritmo semanal) para calcular metas de calorías y macros.
- **Dashboard (Inicio)**: resumen del día (calorías y macros vs metas), entreno de hoy, actividad reciente, acceso rápido a “agregar entreno” y “registrar comida”, y cards de la semana. Incluye modales para instalar la PWA, ver planes (Máquina, Fiera, Bestia), enviar reportes y resumen semanal.
- **Entrenos**: elegir fecha, listar ejercicios del día (nombre, series, reps, peso), agregar / editar / borrar ejercicios. Si hay usuario logueado, los datos se sincronizan con la API (workout-logs).
- **Comidas**: listar comidas por fecha, agregar / editar / borrar comidas con nombre y macros (calorías, proteína, carbos, grasa). Todo en `localStorage` (por ahora sin API de comidas).
- **Perfil / Ajustes**: editar perfil (metas, idioma, tema), ver estadísticas (sesiones y comidas totales), cerrar sesión, borrar todos los datos.

La app está preparada para usarse como **PWA**: se puede instalar en la pantalla de inicio, funciona en modo standalone y usa `viewport-fit=cover` y `env(safe-area-inset-*)` para notches y barras de gestos.

---

## Stack técnico

| Tecnología | Uso |
|------------|-----|
| **Next.js 16** | Framework React (App Router). |
| **React 19** | UI y hooks. |
| **TypeScript** | Tipado estático. |
| **Tailwind CSS 4** | Estilos (utilidades, `@theme`, `@custom-variant`). |
| **Radix UI** | Componentes accesibles (dialog, select, tabs, etc.). |
| **next-themes** | Tema claro/oscuro. |
| **Lucide React** | Iconos. |
| **date-fns** | Fechas. |
| **Vercel Analytics** | Métricas (opcional). |

Otras dependencias relevantes: `react-hook-form`, `zod`, `@hookform/resolvers`, `sonner` (toasts), `recharts` (gráficos en dashboard), `vaul` (drawer), etc.

---

## Estructura del proyecto

```
rulo-dashboard/
├── app/
│   ├── layout.tsx          # Layout raíz: metadata, viewport, Providers, ServiceWorker, Analytics
│   ├── page.tsx             # Home: tabs Dashboard | Entrenos | Comidas | Perfil + BottomNav
│   ├── globals.css          # Tailwind, variables CSS, temas, animaciones
│   ├── login/
│   │   ├── page.tsx         # Login (teléfono + contraseña)
│   │   ├── register/
│   │   │   └── page.tsx     # Registro de perfil (pasos: datos físicos, actividad, objetivo, ritmo)
│   │   └── forgot/
│   │       └── page.tsx     # Recuperar contraseña (flujo básico)
├── components/
│   ├── auth-guard.tsx       # Redirige a /login si no hay usuario; a / si hay usuario en /login
│   ├── bottom-nav.tsx       # Barra inferior: Inicio, Entreno, Comidas, Ajustes
│   ├── dashboard-view.tsx   # Vista Dashboard (resumen día, semana, modales)
│   ├── training-view.tsx    # Vista Entrenos (fecha, lista ejercicios, panel agregar/editar)
│   ├── meals-view.tsx       # Vista Comidas (fecha, lista comidas, panel agregar/editar)
│   ├── profile-view.tsx     # Vista Perfil (perfil, idioma, tema, logout, borrar datos)
│   ├── training-sync.tsx    # Sincroniza workout-logs desde API a localStorage al montar con user
│   ├── providers.tsx        # ThemeProvider, I18nProvider, AuthProvider, AuthGuard
│   └── ui/                  # Componentes UI (Button, Input, Dialog, etc.)
├── lib/
│   ├── api.ts               # Cliente API: workout-logs (fetch, create, update, delete, by-date)
│   ├── auth-context.tsx     # Auth: login (POST /auth/login), logout, user en localStorage
│   ├── storage.ts           # localStorage: sesiones de entreno, comidas, perfil; helpers de fechas
│   ├── i18n.tsx             # i18n: locale en/s, traducciones, useI18n
│   └── utils.ts             # cn (classnames)
└── public/
    ├── manifest.json        # PWA: name, start_url, display standalone, icons
    ├── logo.png             # Icono app
    └── sw.js                # Service Worker (registrado en layout)
```

- **Páginas**: `app/page.tsx` (dashboard principal), `app/login/page.tsx`, `app/login/register/page.tsx`, `app/login/forgot/page.tsx`.
- **Vistas por pestaña**: cada una es un componente que se monta según la tab activa en `app/page.tsx`.
- **Estado global**: auth en `AuthProvider`; datos en `localStorage` vía `lib/storage.ts` y, si hay usuario, entrenos también desde la API vía `lib/api.ts`.

---

## Requisitos e instalación

- **Node.js** 18+ (recomendado 20+).
- **pnpm** (o npm/yarn).

```bash
# Clonar el repo (o ya estar en rulo-dashboard)
cd rulo-dashboard

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env.local

# Editar .env.local y definir NEXT_PUBLIC_RULO_API_URL (ver abajo)
```

---

## Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `NEXT_PUBLIC_RULO_API_URL` | Sí (para login y entrenos) | URL base de la API de Rulo (sin barra final). Ej: `https://rulo-api.kommo-test.workers.dev`. |

- Se usa en **build** y en **cliente** (por el prefijo `NEXT_PUBLIC_`).
- Sin ella, el login muestra un mensaje del tipo “API no configurada” y no se pueden sincronizar entrenos con la API.
- Crear `.env.local` a partir de `.env.example` y definir la URL de tu API.

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo (`next dev`). |
| `pnpm build` | Build de producción (`next build`). |
| `pnpm start` | Servidor de producción (`next start`). |
| `pnpm lint` | Linter ESLint. |

Tras `pnpm dev`, abrir `http://localhost:3000`. Si no hay sesión, se redirige a `/login`.

---

## Flujo de la aplicación

1. **Entrada**: el usuario abre la app (p. ej. `/`).
2. **AuthGuard** (`components/auth-guard.tsx`):
   - Si no hay usuario y la ruta no es `/login` ni `/login/*` → redirige a `/login`.
   - Si hay usuario y está en `/login` o `/login/register` o `/login/forgot` → redirige a `/`.
3. **Login** (`/login`): formulario teléfono + contraseña; `AuthProvider.login()` llama a `POST {API}/auth/login` y guarda el usuario en `localStorage` y en estado; luego el guard redirige a `/`.
4. **Registro** (`/login/register`): flujo en varios pasos (datos físicos, actividad, objetivo, ritmo); al terminar guarda el perfil en `localStorage` y puede redirigir a login o usarse tras registro según el flujo que tengas.
5. **Home** (`/`): muestra una de las cuatro vistas según la pestaña activa (Dashboard, Entrenos, Comidas, Perfil). La **BottomNav** cambia de tab y oculta la barra cuando ciertos paneles/modales están abiertos.

---

## Autenticación

- **Contexto**: `lib/auth-context.tsx` (`AuthProvider`, `useAuth()`).
- **Persistencia**: clave `rulo-auth` en `localStorage`; objeto `{ id, phone, name?, email? }`.
- **Login**: `login(phone, password)` → `POST {NEXT_PUBLIC_RULO_API_URL}/auth/login` con `{ phone, password }`. Si la API devuelve éxito y `result` con `id` y `phone`, se guarda el usuario y se considera “logueado”.
- **Logout**: `logout()` borra el usuario del estado y de `localStorage`; el AuthGuard redirige a `/login`.
- **Protección de rutas**: `AuthGuard` envuelve toda la app; solo las rutas bajo `/login` son accesibles sin usuario.

---

## Vistas principales

### Dashboard (Inicio)

- **Componente**: `components/dashboard-view.tsx`.
- **Datos**: `getTodayMeals()`, `getTodayString()`, `getExercisesForDate(today)`, `getMeals()`, `getProfile()`, `getWeekSessions()`, `getWeekMeals()`.
- **Contenido**: saludo por franja horaria, fecha local, progreso de calorías del día vs meta, macros de hoy, “Entreno de hoy” (ejercicios o mensaje vacío), resumen de la semana (entrenos/comidas), actividad reciente. Botones/acciones para ir a Entrenos/Comidas, agregar ejercicio, registrar comida.
- **Modales**: instalar PWA (pasos iOS/Android), planes (Máquina, Fiera, Bestia), enviar reporte, resumen semanal. Al abrir/cerrar estos modales se notifica al padre para ocultar la BottomNav (`onDashboardModalChange`).

### Entrenos

- **Componente**: `components/training-view.tsx`.
- **Estado**: fecha seleccionada, lista de ejercicios del día, panel abierto/cerrado, ejercicio en edición, carga desde API.
- **Con usuario logueado**: datos del día se cargan con `fetchWorkoutLogsForDate(user.id, selectedDate)`; crear/actualizar/borrar se hace contra la API y luego se refresca la lista. Al montar la app con usuario, `TrainingSync` trae todos los workout-logs del usuario y los escribe en `localStorage` para que el dashboard y esta vista usen los mismos datos.
- **Sin usuario**: se usan solo los datos de `localStorage` (`getExercisesForDate(selectedDate)`, `addExerciseToDate`, `updateExercise`, `deleteExercise`).
- **UI**: selector de fecha, lista de ejercicios (nombre, series, reps, peso), botón “+” que abre un panel desde abajo para agregar/editar ejercicio (mismo estilo que registro: pill, `rounded-t-3xl`, cierre con animación).

### Comidas

- **Componente**: `components/meals-view.tsx`.
- **Estado**: lista de comidas, fecha seleccionada, panel abierto/cerrado, comida en edición.
- **Datos**: todo en `localStorage` (`getMeals()`, `saveMeal`, `updateMeal`, `deleteMeal`); filtro por `selectedDate`.
- **UI**: selector de fecha, lista de comidas con macros, botón “+” que abre panel para agregar/editar comida (nombre, calorías, proteína, carbos, grasa). Misma estructura de panel que en registro/entrenos.

### Perfil (Ajustes)

- **Componente**: `components/profile-view.tsx`.
- **Datos**: `getProfile()`, `saveProfile()`, `getTrainingSessions().length`, `getMeals().length`, `clearAllData()`.
- **Funcionalidad**: edición de perfil (metas de calorías y macros, datos físicos si se exponen), selector de idioma (en/es), selector de tema (claro/oscuro/sistema), cerrar sesión (`logout` + redirección a `/login`), borrar todos los datos (con confirmación). Muestra total de sesiones y comidas.

---

## Datos y persistencia

- **Claves en localStorage** (definidas en `lib/storage.ts`):
  - `fittrack-training`: array de `TrainingSession` (por fecha, con ejercicios).
  - `fittrack-meals`: array de `Meal` (fecha, nombre, hora, calorías, proteína, carbos, grasa).
  - `fittrack-profile`: objeto `UserProfile` (nombre, edad, sexo, peso, altura, actividad, objetivo, ritmo semanal, metas de calorías y macros).
- **Auth**: clave `rulo-auth` en `auth-context.tsx`.
- **Fechas**: se usan en hora local (YYYY-MM-DD) para que “hoy” y filtros por día coincidan con la zona del usuario; helpers como `getTodayString()`, `getTodayMeals()`, `getWeekSessions()` usan esa convención.
- **Sincronización entrenos**: con usuario logueado, `TrainingSync` llama a `fetchWorkoutLogs(user.id)` y reemplaza las sesiones en `localStorage` con `setTrainingSessions(sessions)`, de modo que el dashboard y la pestaña Entrenos vean los mismos datos que la API.

---

## API (rulo-api)

El dashboard asume una API externa (rulo-api) con al menos:

- **Auth**: `POST /auth/login` con `{ phone, password }`; respuesta con `success` y `result: { id, phone, name?, email?, ... }`.
- **Workout logs**:
  - `GET /workout-logs?search={userId}&per_page=100` → lista de logs; se agrupan por fecha y se mapean a `TrainingSession[]`.
  - `GET /workout-logs-by-date?user_id={userId}&date={YYYY-MM-DD}` → ejercicios del día.
  - `POST /workout-logs` → crear (body: `user_id`, `date?`, `name`, `sets`, `reps`, `weight`).
  - `PUT /workout-logs/:id` → actualizar.
  - `DELETE /workout-logs/:id` → eliminar.

La URL base se configura con `NEXT_PUBLIC_RULO_API_URL`. Todo el cliente HTTP está en `lib/api.ts` y `lib/auth-context.tsx`.

---

## Internacionalización (i18n)

- **Implementación**: `lib/i18n.tsx` (contexto con `locale`, `setLocale`, objeto `translations` y función `t(key)`).
- **Idiomas**: `en` y `es`; el locale se puede persistir (p. ej. en localStorage) y se usa en formato de fecha y en todas las cadenas traducidas.
- **Uso**: en componentes, `const { t, locale, setLocale } = useI18n()` y luego `t("nav.home")`, etc. Las claves están definidas en el objeto `translations` (nav, dashboard, training, meals, profile, register, etc.).

---

## Temas (claro / oscuro)

- **next-themes**: `ThemeProvider` en `components/providers.tsx` con `attribute="class"`, `defaultTheme="system"`.
- **CSS**: en `app/globals.css`, variables como `--background`, `--foreground`, `--primary`, etc. en `:root` (tema claro) y `.dark` (tema oscuro). El tema se aplica con la clase `dark` en `<html>`.

---

## PWA y manifest

- **manifest**: `public/manifest.json` (name, short_name, description, start_url `/`, display `standalone`, theme_color, background_color, icons).
- **Layout**: en `app/layout.tsx` se definen `metadata` (title, description, manifest, appleWebApp, icons), `viewport` (themeColor, viewportFit: cover para safe areas) y un script que registra `/sw.js` como Service Worker al cargar la página.
- **Safe areas**: la BottomNav y otras zonas usan `padding-bottom: max(..., env(safe-area-inset-bottom))` para no quedar bajo la barra de gestos en iOS.

---

## Componentes clave

| Componente | Rol |
|------------|-----|
| **Providers** | Envuelve la app con Theme, I18n, Auth y AuthGuard. |
| **AuthGuard** | Redirige según haya usuario o no y según la ruta (login vs resto). |
| **BottomNav** | Navegación por tabs; se puede ocultar cuando están abiertos los paneles de entrenos/comidas o modales del dashboard. |
| **TrainingSync** | Al montar con usuario, obtiene workout-logs de la API y los escribe en localStorage. |
| **DashboardView** | Resumen del día y de la semana, modales de instalación, planes, reporte, resumen semanal. |
| **TrainingView** | Lista de ejercicios por fecha, CRUD local y/o API según haya usuario. |
| **MealsView** | Lista de comidas por fecha, CRUD en localStorage. |
| **ProfileView** | Perfil, idioma, tema, logout, borrar datos. |

Los paneles de agregar/editar (entrenos, comidas) y el flujo de registro comparten estilo: pill superior, `rounded-t-3xl`, fondo `bg-card`, cierre con animación (`isClosing` + timeout).

---

## Convenciones y notas

- **Rutas de login**: todo lo que esté bajo `app/login/` (login, register, forgot) es accesible sin usuario; el resto está protegido por AuthGuard.
- **Refresh entre vistas**: el home pasa `refreshKey` y callbacks (`onUpdate`, `onSynced`) para que al agregar/editar/borrar entreno o comida el dashboard pueda refrescar sus datos.
- **Registro**: el formulario de registro tiene pasos con animación de deslizamiento lateral (siguiente → desde la derecha; atrás → desde la izquierda) y barra de progreso en el header.
- **ESLint**: si el validador CSS marca “Unknown at rule” para `@custom-variant`, `@theme` o `@apply`, en este proyecto se usa `.vscode/settings.json` con `"css.lint.unknownAtRules": "ignore"` (directivas de Tailwind v4).

Si quieres ampliar una sección (por ejemplo solo API o solo PWA), se puede añadir un apartado extra en este README.

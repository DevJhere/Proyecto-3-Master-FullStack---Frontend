# Frontend – Raíces y Alas (Gestión PT)

Aplicación web (SPA) para la gestión de un gabinete pedagógico: alumnos, calendario de sesiones, informes y equipo de profesionales. Consume la API REST de `../../Backend-Pedagogia`.

## Tecnologías

| Área | Herramienta |
|---|---|
| UI | React 19 |
| Build / dev server | Vite 8 |
| Estilos | Tailwind CSS 4 (`@tailwindcss/vite`) |
| Rutas | React Router 7 |
| Peticiones HTTP | Axios (instancia centralizada con interceptores) |
| Iconos | react-icons |
| Tests | Vitest + Testing Library + MSW (jsdom) |
| Calidad | ESLint 10 |
| Gestor de paquetes | pnpm |

## Puesta en marcha

### Requisitos
- Node.js y pnpm.
- El backend en marcha (ver el README de `Backend-Pedagogia`).

### Instalación y variables de entorno
```bash
pnpm install
```
Copia `.env.example` a `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```
`VITE_API_URL` es la URL base de la API (incluyendo `/api`).

### Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Genera la versión de producción en `dist/` |
| `pnpm preview` | Sirve localmente la build |
| `pnpm lint` | Ejecuta ESLint |
| `pnpm test` | Ejecuta los tests una vez |
| `pnpm test:watch` | Tests en modo observación |

## Estructura

```
src/
├── main.jsx / App.jsx          # Arranque: AuthProvider + AppRouter
├── test/                       # Infraestructura de tests (servidor MSW, fixtures, setup, utils)
└── shared/
    ├── config/axios.js         # Cliente Axios: añade el token y gestiona los 401
    ├── context/                # AuthContext (sesión, login, logout, updateUser)
    ├── hooks/useAuth.jsx
    ├── layout/MainLayout.jsx   # Sidebar + contenido principal
    ├── routes/                 # AppRouter y ProtectedRoute
    ├── pages/
    │   ├── public/             # Login, Register, Error404
    │   └── private/            # Dashboard, Students, StudentDetail, Sessions, Profile, Users
    ├── components/
    │   ├── ui/                 # Modal reutilizable, PasswordField
    │   ├── dashboard/          # KpiCard, SessionCard, StudentQuickCard
    │   ├── students/           # StudentCard, NewStudentModal, DeleteStudentModal, SessionTimeline, NewSessionForm, ReportList, StudentSidebar
    │   ├── session/            # ScheduleSessionModal
    │   └── users/              # UserCard, NewUserModal, EditUserModal, DeleteUserModal
    └── utils/                  # constants, APIHelpers, DateHelpers, HelperAvatar
```

## Rutas de la aplicación

| Ruta | Acceso | Pantalla |
|---|---|---|
| `/login`, `/register` | Público | Inicio de sesión y registro (siempre crea un pedagogo) |
| `/` | – | Redirige a `/dashboard` |
| `/dashboard` | Autenticado | **Inicio**: saludo, KPI, sesiones de hoy y acceso rápido a alumnos |
| `/students` | Autenticado | Lista de alumnos con buscador, paginación y alta de alumno |
| `/students/:id` | Autenticado | Ficha del alumno: sesiones, informes y eliminación |
| `/sessions` | Autenticado | Calendario semanal para agendar sesiones |
| `/profile` | Autenticado | Edición de perfil y foto |
| `/users` | **Solo admin** | Gestión de equipo (alta, edición, roles y baja) |
| `/404` y cualquier otra | – | Página de error |

`ProtectedRoute` redirige a `/login` si no hay sesión y a `/dashboard` si el rol no está permitido.

## Funcionalidades

- **Autenticación**: la sesión (`token` y `user`) se guarda en `localStorage`. El interceptor de Axios añade `Authorization: Bearer <token>` y, ante un `401` (que no sea del login), cierra la sesión y vuelve al login.
- **Roles**: el menú lateral oculta *Usuarios* a los pedagogos y la ruta está protegida. El backend aplica además los permisos reales.
- **Inicio (Dashboard)**: KPI de alumnos activos, sesiones del mes y sesiones completadas; lista de las sesiones de hoy del usuario con su estado.
- **Alumnos**:
  - Búsqueda por nombre, curso, diagnóstico o tutor.
  - Paginación de 10 alumnos por página.
  - Alta en dos pasos (datos del alumno y datos del tutor) con validación y foto opcional.
  - El administrador elige el pedagogo asignado, ve a qué pedagogo pertenece cada alumno y puede alternar entre **Todos** y **Mis alumnos**.
- **Ficha del alumno**: línea de intervención con cambio de estado de las sesiones, alta de sesiones, subida de informes (pdf, doc, docx, txt) y eliminación mediante un **modal de confirmación** (`DeleteStudentModal`).
- **Calendario**: vista semanal lunes–viernes, franjas de 09:00 a 17:00; clic en una celda libre para agendar una sesión. Las sesiones canceladas no ocupan hueco.
- **Perfil**: nombre, especialidad y foto (jpg, png o webp, máx. 5 MB).
- **Usuarios (admin)**: crear miembros, editar datos y rol, y eliminar (el backend impide borrar a quien tenga alumnos o sesiones asignados y el modal muestra el motivo).
- **Diseño responsive** (móvil < 768 px, tablet 768-1023 px y PC ≥ 1024 px): en móvil el menú lateral es un panel que se abre desde una barra superior; en tablet la barra lateral muestra solo iconos; en PC es la barra completa. El calendario muestra un solo día (con selector) en móvil y la semana completa desde tablet. Los comentarios `CAMBIO (responsive)` del código explican cada ajuste.
- **Diseño sin scroll de página**: en PC las pantallas principales (Inicio, Alumnos, Sesiones, Perfil, Usuarios) ocupan el alto disponible y solo hacen scroll interno los listados largos; en móvil y tablet la página fluye con altura natural.

## Convenciones del código

- Componentes funcionales con hooks; un componente por archivo.
- Las respuestas de la API se normalizan con `utils/APIHelpers.js` (`normalizeStudents`, `normalizeSessions`) y los errores se muestran con `getApiErrorMessage`.
- Los modales se construyen sobre el componente `ui/Modal`.
- Constantes de dominio (cursos, diagnósticos, especialidades, roles…) en `utils/constants.js`, alineadas con los enumerados del backend.
- Los cambios relevantes se documentan con comentarios `CAMBIO (...)` en el propio código, indicando qué se hizo y por qué.

## Tests

**21 archivos, 298 tests** con Vitest, Testing Library y MSW (la API se simula con *handlers*, no se necesita backend).

```bash
pnpm test
```

Cubren las páginas (Login, Register, Dashboard, Students, StudentDetail, Sessions, Users, Profile), los componentes principales (modales, informes, línea de sesiones, formularios), el contexto de autenticación, el cliente Axios, `ProtectedRoute`, el router (`App`) y las utilidades. La configuración compartida está en `src/test/` y `vitest.config.js`.

## Producción

`pnpm build` genera `dist/` (archivos estáticos). Debe servirse con *fallback* a `index.html` para que funcionen las rutas de React Router (recargar `/students` no debe dar 404), y `VITE_API_URL` debe apuntar a la API de producción **antes** de compilar (Vite la incrusta en la build).

El proyecto incluye `vercel.json` con esa regla de reescritura, por lo que se despliega en Vercel sin configuración extra. En Vercel define la variable `VITE_API_URL` (por ejemplo `https://tu-api.onrender.com/api`) en *Settings → Environment Variables* y vuelve a desplegar si la cambias. Recuerda añadir la URL final del frontend a `CORS_ORIGIN` en el backend.

## Limitaciones conocidas

- El token se guarda en `localStorage` y el backend lo hace caducar a las 2 h; no hay renovación automática.
- El logotipo (`src/assets/images/Raices y Alas Logo.png`) pesa ~1 MB y conviene optimizarlo.
- El Dashboard de un administrador cuenta todos los alumnos del sistema en "Alumnos Activos" y en "Acceso Rápido" (el backend devuelve todos al admin).
- No hay recuperación de contraseña.
- El calendario solo muestra lunes a viernes y no tiene vista mensual.

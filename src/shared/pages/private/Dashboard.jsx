import { NavLink } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { useState } from "react";
import { useEffect } from "react";
import apiClient from "../../config/axios";
import { KpiCard } from "../../components/dashboard/KpiCard";
import { SessionCard } from "../../components/dashboard/SessionCard";
import { StudentQuickCard } from "../../components/dashboard/StudentQuickCard";
import { formatCapitalizedDate, toLocalDateString } from "../../utils/DateHelpers"
import { normalizeSessions, normalizeStudents, getApiErrorMessage } from "../../utils/APIHelpers";


export const Dashboard = () => {

  //Formateamos la fecha actual con la funcion helper para mostrar cabecera de fecha
  const dateTodayCap = formatCapitalizedDate(new Date());

  //Estado para obtener datos del usuario
  const { user } = useAuth();

  //Mostrar nombre capitalizado
  const userNameCap = user?.name?.split(" ")[0] || "Pedagogo/a";

  /* Estado para cargar las sesiones pendientes */
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Cargamos los datos de las sesiones
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        //Peticion a endpoint
        const response = await apiClient("/sessions");

        setSessions(normalizeSessions(response)); //Nuestro endpoint devuelve la data como array y si no es array, cogemos la propiedad sessions.

      } catch (err) {
        setError(getApiErrorMessage(err, "Error al cargar las sesiones."));
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  //Filtrado de sesiones de hoy con la funcion toLocalDateString
  const todayStr = toLocalDateString(new Date());
  const todaySessions = sessions.filter(session => {
    const sDate = toLocalDateString(session.date || session.fecha);
    return sDate === todayStr;
  });

  //Estos nos permite que solo se puedan ver la sesiones filtradas de cada usuario, es decir el admin no podra ver las sesiones asiganadas del pedagogo en su vista
  const myTodaySessions = todaySessions.filter((session) => {
    const pedagogoId = typeof session.pedagogoAsignado === "object"
      ? session.pedagogoAsignado?._id
      : session.pedagogoAsignado;
    return pedagogoId === (user?._id || user?.id);
  }).sort((a, b) => new Date(a.date || a.fecha) - new Date(b.date || b.fecha)); //Ordenadas por hora

  //El saludo solo cuenta las que todavía están pendientes (no las canceladas ni las ya completadas)
  const pendingTodayCount = myTodaySessions.filter((session) => session.status === "Pendiente").length;

  /* CAMBIO (Dashboard del admin): igual que con los alumnos, GET /sessions devuelve al admin las sesiones de TODOS los pedagogos,
     así que "Sesiones este mes" y "Sesiones Completadas" contaban sesiones ajenas. Los KPI usan solo las sesiones asignadas al usuario logueado. */
  const mySessions = sessions.filter((session) => {
    const pedagogoId = typeof session.pedagogoAsignado === "object"
      ? session.pedagogoAsignado?._id
      : session.pedagogoAsignado;
    return pedagogoId === (user?._id || user?.id);
  });

  //Sesiones de este mes
  const currentMonth = new Date().getMonth() + 1; // el + 1 es para que el mes de enero no empiece desde el 0
  const currentYear = new Date().getFullYear(); // el getFullYear es para que el año no empiece desde el 2000

  //Filtramos las sesiones por mes y año. Las canceladas no cuentan como programadas.
  const sessionsThisMounthCount = mySessions.filter(session => {
    const sessionsDate = new Date(session.date || session.fecha);
    return session.status !== "Cancelado" && sessionsDate.getMonth() + 1 === currentMonth && sessionsDate.getFullYear() === currentYear
  }).length;

  /* Alumnos Activos y sesiones completada */

  //Estado para alumnos
  const [students, setStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [errorStudents, setErrorStudents] = useState("");

  // Cargamos los datos de los alumnos
  useEffect(() => {
    const fetchStudentsData = async () => {
      try {
        //Peticion a endpoint
        const response = await apiClient("/students");
        setStudents(normalizeStudents(response));

      } catch (err) {
        setErrorStudents(getApiErrorMessage(err, "Error al cargar los alumnos."));
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudentsData();
  }, []);

  /* CAMBIO (Dashboard del admin): GET /students devuelve al administrador los alumnos de TODOS los pedagogos, por lo que
     "Alumnos Activos" y "Acceso Rápido" mostraban alumnos ajenos (p. ej. los creados por Samantha). Igual que ya se hace con
     las sesiones (myTodaySessions), nos quedamos solo con los alumnos asignados al usuario logueado. Para un pedagogo no cambia
     nada, porque el backend ya solo le devuelve los suyos. El listado completo del admin sigue en la página Alumnos. */
  const myStudents = students.filter((student) => {
    const pedagogoId = typeof student.pedagogoAsignado === "object"
      ? student.pedagogoAsignado?._id
      : student.pedagogoAsignado;
    return pedagogoId === (user?._id || user?.id);
  });

  //Alumnos activos (los asignados al usuario)
  const activeStudentsCount = myStudents.length;

  //Sesiones completadas
  const completedSessionsCount = mySessions.filter(session => session.status === "Completado" || session.estado === "Completado").length;

  return (
    /* CAMBIO (scroll en Inicio): antes el Dashboard tenía su propio overflow-y-auto, un py-6 extra y
       márgenes mb-10 que, sumados al p-8 del <main> de MainLayout, generaban scroll. Ahora ocupa
       exactamente el alto disponible (h-full), reduce los espaciados y solo la lista de "Sesiones de hoy"
       hace scroll interno si hay muchas, así la página en sí no desplaza. */
    /* CAMBIO (responsive): el diseño "sin scroll de página" (h-full + overflow-hidden) solo se aplica desde lg (PC).
       En móvil y tablet el contenido (KPI en columna, lista y accesos rápidos) no cabe en el alto de pantalla y quedaba recortado,
       así que ahí fluye con altura natural y hace scroll el <main> del layout. El px-8 interior también solo desde lg, porque
       el <main> ya aporta su propio padding y en móvil se duplicaba. */
    <div className="lg:h-full lg:overflow-hidden">
      {/* Contenedor */}
      <div className="max-w-7xl mx-auto lg:px-8 lg:h-full flex flex-col">

        {/* Contendedor cabecera */}
        <div className="mb-4 shrink-0">
          <p className="text-sm text-ink-faint font-medium mb-1">{dateTodayCap}</p>

          {/* Titulo Saludo a Usuario */}
          {/* CAMBIO (responsive): título más pequeño en móvil (text-2xl) */}
          <h1 className="text-2xl md:text-3xl tracking-wider font-medium text-ink leading-snug">
            Hola, {userNameCap}
          </h1>
          <p className="text-ink-muted mt-1 text-sm mb-0">Tienes{" "}
            <span className="font-semibold text-sage">
              {pendingTodayCount} {pendingTodayCount === 1 ? "sesión" : "sesiones"}{" "}
            </span>
            pendiente{pendingTodayCount !== 1 ? "s" : ""} para hoy.
          </p>
        </div>

        {/* Errores de carga: sin esto un fallo de la API parecería "no hay datos" */}
        {(error || errorStudents) && (
          <div role="alert" className="mb-4 shrink-0 bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm space-y-1">
            {error && <p>{error}</p>}
            {errorStudents && <p>{errorStudents}</p>}
          </div>
        )}

        {/* Contenedor TARJETAS KPI */}
        {/* CAMBIO (responsive): 1 columna en móvil, 3 desde md (tablet y PC) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 shrink-0">
          {/* Alumnos Activos */}
          <KpiCard
            title="Alumnos Activos"
            value={activeStudentsCount}
            subtitle={`${activeStudentsCount} Perfiles Asignados`}
            isLoading={isLoadingStudents}
            theme="green"
          />

          {/* Sesiones este mes */}
          <KpiCard
            title="Sesiones este mes"
            value={sessionsThisMounthCount}
            subtitle={`${sessionsThisMounthCount} Programadas`}
            isLoading={isLoading}
            theme="blue"
          />

          {/* Sesiones completadas */}
          <KpiCard
            title="Sesiones Completadas"
            value={completedSessionsCount}
            subtitle={`${completedSessionsCount} Realizadas`}
            isLoading={isLoading}
            theme="coral"
          />
        </div>

        {/* Contenedor Sesiones de Hoy */}
        <div className="mb-4 lg:flex-1 lg:min-h-0 flex flex-col">

          {/* CAMBIO (responsive): el enlace puede bajar de línea (flex-wrap) en pantallas estrechas */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 mb-3 shrink-0">
            <h2 className="text-lg font-semibold tracking-wider text-ink">
              Sesiones de hoy
            </h2>
            <NavLink
              to="/students"
              className={"text-sm font-medium text-[#529471] hover:underline"}
            > Ver todos los alumnos → </NavLink>
          </div>

          {/* Card de Sesión */}
          {isLoading ? (
            <div className="text-center py-6 text-slate-400 text-sm">Cargando sesiones...</div>
          ) : myTodaySessions.length === 0 ? (
            <div className="text-center py-6 bg-white rounded-3xl border border-dashed border-[#EBE7DF]">
              <p className="text-ink-muted hover:bg-slate-50 hover:text-slate-700">No hay sesiones programadas para hoy.</p>
            </div>
          ) : (
            // Si hay sesiones, recorremos la lista
            // CAMBIO (responsive): fuera de PC la lista se limita a max-h-80 con scroll propio; en lg ocupa el alto sobrante
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 lg:max-h-none lg:flex-1 lg:min-h-0">

              {myTodaySessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  students={students}
                />
              ))}

            </div>
          )}
        </div>

        {/* Contenedor: Acceso rapido de Alumnos */}
        <div className="shrink-0">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-semibold tracking-wider text-slate-800">
              Acceso Rápido
            </h2>
          </div>

          {/* Tarjetas de acceso rápido */}
          {isLoadingStudents ? (
            <div className="text-center py-4 text-slate-400 text-sm">Cargando alumnos...</div>
          ) : myStudents.length === 0 ? (
            <div className="text-center py-4 bg-white rounded-3xl border border-dashed border-[#EBE7DF]">
              <p className="text-slate-400 text-sm">No tienes alumnos asignados todavía.</p>
            </div>
          ) : (
            // Grid de 3 columons que muestras hasta 6 pacientes/alumnos principales
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myStudents.slice(0, 6).map((student) => (
                <StudentQuickCard key={student._id} student={student} />
              ))}
            </div>

          )}


        </div>
      </div >
    </div>
  )
}

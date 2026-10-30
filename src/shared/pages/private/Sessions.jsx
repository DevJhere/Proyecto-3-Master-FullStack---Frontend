import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../config/axios";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import { ScheduleSessionModal } from "../../components/session/ScheduleSessionModal";
import { HOURS, PASTEL_THEMES } from "../../utils/constants";
import { getMondayOfWeek } from "../../utils/DateHelpers";
import { normalizeSessions, normalizeStudents, getApiErrorMessage } from "../../utils/APIHelpers";


export const Sessions = () => {

  //Definimos estados locales de sesion y students
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  //Fecha inicio de la semana empleando la función getMondayOfWeek para tener el lunes de la semana actual
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMondayOfWeek());

  /* CAMBIO (responsive): en móvil (<768px) cinco columnas de día no caben, así que se muestra un solo día cada vez y este estado guarda
     cuál (0 = lunes ... 4 = viernes). Por defecto, el día de hoy si es laborable y, si no, el lunes. En tablet y PC se sigue viendo la semana completa. */
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => {
    const weekday = new Date().getDay(); // 0 = domingo ... 6 = sábado
    return weekday >= 1 && weekday <= 5 ? weekday - 1 : 0;
  });

  // Estados del Modal de la nueva sesión
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  // Cargamos sesiones y alumnos. También sirve para refrescar el calendario tras agendar una sesión, sin volver a mostrar el estado de carga.
  const fetchCalendardata = async () => {
    try {
      const [sessionRes, studentRes] = await Promise.all([
        apiClient.get("/sessions"),
        apiClient.get("/students"),
      ]);

      //Normalizamos el tipo de dato que nos devuelven las respuestas con la función APIHelpers
      setSessions(normalizeSessions(sessionRes));
      setStudents(normalizeStudents(studentRes));
      setError("");

    } catch (err) {
      setError(getApiErrorMessage(err, "Error al cargar los datos del calendario."));
    } finally {
      setIsLoading(false);
    }
  };

  //hook de carga de datos
  useEffect(() => {
    // Carga de datos al montar la página: el setState ocurre tras el await (no de forma síncrona), la regla no lo distingue al reutilizar la función para recargar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCalendardata();
  }, []);

  //2 . Calcular los 5 días laborables de la semana
  const weekDays = useMemo(() => {
    return [0, 1, 2, 3, 4].map((offset) => {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + offset);
      return d
    });
  }, [currentWeekStart]);

  // Formato del subtítulo de rango semanal (Ej: "24 de agosto – 28 de agosto, 2026")
  const weekRangeText = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[4];
    if (!start || !end) return "";
    const startDay = start.getDate();
    const startMonth = start.toLocaleDateString("es-ES", { month: "long" });
    const endDay = end.getDate();
    const endMonth = end.toLocaleDateString("es-ES", { month: "long" });
    const year = end.getFullYear();
    return `${startDay} de ${startMonth} – ${endDay} de ${endMonth}, ${year}`;
  }, [weekDays]);

  // Navegación entre semanas
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleCurrentWeek = () => {
    setCurrentWeekStart(getMondayOfWeek());
  };

  // Comparador de días seguro sin desfase horario
  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Asigna un tema pastel consistente a cada alumno (para que Sofía siempre sea azul, Lucas melocotón, etc.)
  const getStudentTheme = (studentId) => {
    const sId = typeof studentId === "object" ? studentId?._id : studentId;
    const index = students.findIndex((s) => s._id === sId);
    if (index !== -1) return PASTEL_THEMES[index % PASTEL_THEMES.length];
    return PASTEL_THEMES[0];
  };

  // Manejador al hacer clic en una celda vacía para agendar sesión
  const handleSlotClick = (dayDate, hour) => {
    const slot = new Date(dayDate);
    slot.setHours(hour, 0, 0, 0);
    setSelectedDateTime(slot);
    setIsModalOpen(true);
  };


  return (
    /* CAMBIO (responsive): el alto fijo (h-full) con filas repartidas solo se aplica desde md (tablet y PC); en móvil la página fluye con
       altura natural (filas de 64px mínimo) y hace scroll el <main>. El px-6 interior solo desde lg, porque el <main> ya aporta padding. */
    /* CAMBIO (scroll en Sesiones): antes la página tenía su propio overflow-y-auto y cada fila de hora medía
       min-h-[92px] (9 filas = ~830px), lo que obligaba a hacer scroll. Ahora la página ocupa el alto
       disponible (h-full) y la rejilla reparte ese alto entre las filas con flex-1. Se mantiene un alto
       mínimo por fila (min-h-[56px]) para que, en pantallas muy bajas, el scroll lo gestione el <main>. */
    <div className="md:h-full">
      <div className="max-w-7xl mx-auto lg:px-6 md:h-full flex flex-col gap-4">
        {/* CABECERA: Título, Rango de fechas y Navegación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            {/* CAMBIO (responsive): título más pequeño en móvil */}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Calendario
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
              {weekRangeText}
            </p>
          </div>
          {/* Botones de navegación de semanas */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-2.5 rounded-2xl bg-white border border-[#EBE7DF] hover:border-slate-300 text-slate-600 shadow-xs transition-all cursor-pointer"
              title="Semana anterior"
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleCurrentWeek}
              className="px-4 py-2 rounded-2xl bg-white border border-[#EBE7DF] hover:border-slate-300 text-xs font-semibold text-slate-700 shadow-xs transition-all cursor-pointer"
            >
              Esta semana
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-2.5 rounded-2xl bg-white border border-[#EBE7DF] hover:border-slate-300 text-slate-600 shadow-xs transition-all cursor-pointer"
              title="Semana siguiente"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
        {/* Estados de carga y de error: sin ellos un fallo de la API parecería un calendario sin sesiones */}
        {isLoading && (
          <p className="text-center text-sm text-slate-400 font-medium shrink-0">Cargando calendario...</p>
        )}
        {error && (
          <div role="alert" className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm shrink-0">
            {error}
          </div>
        )}

        {/* CONTENEDOR DE LA REJILLA DEL CALENDARIO */}
        <div className="bg-white rounded-3xl border border-[#EBE7DF] overflow-hidden shadow-sm flex flex-col md:flex-1 md:min-h-0">
          {/* CAMBIO (responsive): selector de día, solo en móvil. Cada botón muestra el día de la semana y su número;
              el seleccionado se resalta y el día de hoy se marca en verde */}
          <div className="md:hidden grid grid-cols-5 border-b border-[#EBE7DF] bg-[#FAF8F5]/40 shrink-0" role="tablist" aria-label="Día de la semana">
            {weekDays.map((dayDate, i) => {
              const dayShort = dayDate.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase().replace(".", "");
              const isSelected = i === selectedDayIdx;
              const isToday = isSameDay(dayDate, new Date());
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedDayIdx(i)}
                  className={`py-2 text-center border-b-2 cursor-pointer transition-colors ${isSelected ? "border-[#529471] bg-white" : "border-transparent"}`}
                >
                  <span className="block text-[11px] font-semibold text-slate-400 tracking-wider">{dayShort}</span>
                  <span className={`block text-lg font-bold ${isToday ? "text-[#529471]" : "text-slate-800"}`}>{dayDate.getDate()}</span>
                </button>
              );
            })}
          </div>
          {/* Cabecera de días (LUN 24, MAR 25, ...) — CAMBIO (responsive): oculta en móvil (lo sustituye el selector de día) */}
          <div className="hidden md:grid grid-cols-[70px_repeat(5,1fr)] sm:grid-cols-[90px_repeat(5,1fr)] border-b border-[#EBE7DF] bg-[#FAF8F5]/40 shrink-0">
            {/* Esquina superior izquierda vacía */}
            <div className="border-r border-[#EBE7DF]" />
            {/* Columnas de los 5 días */}
            {weekDays.map((dayDate, i) => {
              const dayShort = dayDate
                .toLocaleDateString("es-ES", { weekday: "short" })
                .toUpperCase()
                .replace(".", "");
              const dayNum = dayDate.getDate();
              const isToday = isSameDay(dayDate, new Date());
              return (
                <div
                  key={i}
                  className="py-2 text-center border-r border-[#EBE7DF] last:border-r-0"
                >
                  <p className="text-[11px] font-semibold text-slate-400 tracking-wider">
                    {dayShort}
                  </p>
                  <p
                    className={`text-xl font-bold mt-0.5 ${isToday ? "text-[#529471]" : "text-slate-800"
                      }`}
                  >
                    {dayNum}
                  </p>
                </div>
              );
            })}
          </div>
          {/* Filas de horas y celdas */}
          <div className="divide-y divide-[#EBE7DF]/80 flex flex-col md:flex-1 md:min-h-0">
            {HOURS.map((hour) => {
              const hourLabel = `${String(hour).padStart(2, "0")}:00`;
              return (
                <div
                  key={hour}
                  // CAMBIO (responsive): en móvil 2 columnas (hora + el día elegido) con 64px mínimo por fila; desde md la semana completa
                  className="grid grid-cols-[56px_1fr] md:grid-cols-[90px_repeat(5,1fr)] md:flex-1 min-h-[64px] md:min-h-[56px]"
                >
                  {/* Columna Izquierda: Hora */}
                  <div className="text-center pt-2 text-xs font-semibold text-slate-400 border-r border-[#EBE7DF]">
                    {hourLabel}
                  </div>
                  {/* 5 Celdas de días para esta hora */}
                  {weekDays.map((dayDate, dayIdx) => {
                    // Buscamos si hay alguna sesión agendada en este día y esta hora
                    const cellSessions = sessions.filter((s) => {
                      if (!s.date || s.status === "Cancelado") return false;
                      const sDate = new Date(s.date);
                      return isSameDay(sDate, dayDate) && sDate.getHours() === hour;
                    });
                    return (
                      <div
                        key={dayIdx}
                        onClick={() => {
                          if (cellSessions.length === 0) {
                            handleSlotClick(dayDate, hour);
                          }
                        }}
                        // CAMBIO (responsive): en móvil solo se muestra la celda del día seleccionado (el resto "hidden md:block")
                        className={`${dayIdx === selectedDayIdx ? "" : "hidden md:block"} p-1 sm:p-1.5 overflow-hidden border-r border-[#EBE7DF]/80 last:border-r-0 transition-colors group relative ${cellSessions.length === 0
                            ? "hover:bg-[#FAF8F5]/70 cursor-pointer"
                            : ""
                          }`}
                      >
                        {/* Si la celda está vacía, mostramos en hover un sutil botón para agendar */}
                        {cellSessions.length === 0 && (
                          <>
                            {/* CAMBIO (responsive): en móvil no existe el hover, así que la celda libre muestra siempre una pista discreta "Agendar" */}
                            <div className="md:hidden flex items-center justify-center h-full text-slate-300 text-xs font-semibold gap-1">
                              <FiPlus size={14} />
                              <span>Agendar</span>
                            </div>
                            <div className="hidden md:group-hover:flex items-center justify-center h-full text-slate-300 text-xs font-semibold gap-1">
                              <FiPlus size={14} />
                              <span className="hidden md:inline">Agendar</span>
                            </div>
                          </>
                        )}
                        {/* Tarjeta de Sesión programada */}
                        {cellSessions.map((session) => {
                          const theme = getStudentTheme(session.student);
                          const studentName =
                            session.student?.name || "Alumno sin nombre";
                          const studentId = session.student?._id || session.student;
                          return (
                            <Link
                              key={session._id}
                              to={`/students/${studentId}`}
                              onClick={(e) => e.stopPropagation()}
                              className={`block h-full overflow-hidden p-2 rounded-2xl border-l-4 shadow-2xs hover:shadow-md transition-all ${theme.bg} ${theme.text} ${theme.border}`}
                            >
                              <p className="font-bold text-xs truncate">
                                {studentName}
                              </p>
                              <p className="text-[11px] opacity-80 line-clamp-1 mt-0.5 leading-snug">
                                {session.notes || "Sesión de apoyo"}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* MODAL PARA AGENDAR SESIÓN */}
      <ScheduleSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDateTime}
        sessions={sessions}
        students={students}
        onSessionCreated={fetchCalendardata}
      />
    </div>
  );
}

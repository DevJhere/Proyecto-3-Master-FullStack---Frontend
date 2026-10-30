import { StudentCard } from "../../components/students/StudentCard";
import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useEffect } from "react";
import apiClient from "../../config/axios";
import { IoSearchOutline } from "react-icons/io5";
import { LuSearchX } from "react-icons/lu";
import { NewStudentModal } from "../../components/students/NewStudentModal";
import { getApiErrorMessage, normalizeSessions, normalizeStudents } from "../../utils/APIHelpers";

export const Students = () => {

  /* Defimos estados locales */

  /* ==== Estados peticion de datos Alumnos ==== */
  const [ students, setStudents] = useState([]);
  const [ isLoadingStudents, setIsLoadingStudents ] = useState(true);
  const [ errorStudents, setErrorStudents ] = useState("");

  // Cargamos los datos de alumnos. También sirve para refrescar la lista tras crear un alumno, sin volver a mostrar el estado de carga.
  const fetchStudentsData = async() => {
      try {
        //Peticion a endpoint
        const response = await apiClient("/students");
        setStudents(normalizeStudents(response));
        setErrorStudents("");

      } catch (err) {
        setErrorStudents(getApiErrorMessage(err, "Error al cargar los alumnos."));
      } finally {
        setIsLoadingStudents(false);
      }
    };
    
  useEffect( () => {
    // Carga de datos al montar la página: el setState ocurre tras el await (no de forma síncrona), la regla no lo distingue al reutilizar la función para recargar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudentsData();
  }, []);


  /* ==== Estados peticion de datos Sesiones ==== */
  const [ sessions, setSessions ] = useState([]);
  const [ isLoadingSessions, setIsLoadingSessions ] = useState(true);
  const [ errorSessions, setErrorSessions ] = useState("");

  // Cargamos los datos
  useEffect( () => {
    const fetchDashboardData = async() => {
      try {
        //Peticion a endpoint
        const response = await apiClient("/sessions");
        
        setSessions(normalizeSessions(response)); //Nuestro endpoint devuelve la data como array y si no es array, cogemos la propiedad sessions.
        
      } catch (err) {
        setErrorSessions(getApiErrorMessage(err, "Error al cargar las sesiones."));
      } finally {
        setIsLoadingSessions(false);
      }
    };
    fetchDashboardData();
  }, []);


  // Estado para filtrar y gestionar busqueda
  const [ searchTerm, setSearchTerm ] = useState("");

  // CAMBIO (paginación en Alumnos): se muestran como máximo 10 alumnos por página y el resto se consulta con los botones de paginación
  const STUDENTS_PER_PAGE = 10;
  const [ currentPage, setCurrentPage ] = useState(1);

  /* Cálculamos sesiones asociadas al alumno */
  const getStudentSessionsCount = (studentId) => {
    return sessions.filter( (session) => {
      const sId = typeof session.student === "object" ? session.student?._id : session.student;
      return sId === studentId;
    }).length;
  }

  /* Logica de busqueda */
  const filteredStudents = students.filter( (student) => {
    const term = searchTerm.toLowerCase().trim();


    return(
      student.name?.toLowerCase().includes(term) ||
      student.course?.toLowerCase().includes(term) ||
      student.diagnosis?.toLowerCase().includes(term) ||
      student.nameTutor?.toLowerCase().includes(term)
    );
    
  }); 


  // CAMBIO (paginación en Alumnos): calculamos el nº de páginas y recortamos la lista filtrada.
  // Limitamos la página actual por si la lista se acorta (p. ej. al buscar) y la página queda fuera de rango.
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * STUDENTS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(pageStart, pageStart + STUDENTS_PER_PAGE);

  // Conexion modal Nuevo Alumno
  const [ isModalOpen, setIsModalOPen ] = useState(false);

  return (
    /* CAMBIO (scroll en Alumnos): antes la página tenía su propio overflow-y-auto, py-6 y mostraba todas las
       tarjetas a la vez. Ahora ocupa el alto disponible (h-full): cabecera, buscador y paginación quedan fijos
       y solo el listado (máx. 10 alumnos por página) puede hacer scroll interno si la pantalla es pequeña. */
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-8 h-full flex flex-col">
        {/* Contenedor cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-3xl tracking-wider font-medium text-ink leading-snug">Alumnos</h1>
            <p className="text-sm text-slate-500 mt-1 tracking-wider leading-snug">Gestión de alumnos y expedientes</p>
          </div>

          <button
          type="button"
          onClick={() => {
            // Pasamos la ventana del modal creada
            setIsModalOPen(true)
          }}
          className="bg-[#529471] hover:bg-[#437a5d] text-white px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <span className="text-lg">+</span>
            <span>Nuevo Alumno</span>
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative mb-4 shrink-0">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
          <input
          type="text"
          aria-label="Buscar alumnos"
          placeholder="Búsqueda por nombre, curso, diagnóstico, tutor…"
          value={searchTerm}
          onChange={ (e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // CAMBIO: al buscar volvemos a la primera página
          }}
          className="w-full pl-11 pr-4 py-3 bg-white border border-[#e8e4db] rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-[#5d9e7e] transition-colors"
          />
        </div>

        {/* Estados de Carga de Error y Estado vacío */}
        
        {(isLoadingStudents || isLoadingSessions) && (
          <div className="text-center py-12 text-slate-400 font-medium text-sm tracking-wider">Cargando alumnos...</div>
        )}

        {(errorStudents || errorSessions) && (
          <div role="alert" className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 mb-6 text-sm tracking-wider space-y-1">
            {errorStudents && <p>{errorStudents}</p>}
            {errorSessions && <p>{errorSessions}</p>}
          </div>
        )}

        {/* No se encuentran alumnos (si la carga ha fallado, el aviso de error ya lo explica) */}
        {!isLoadingStudents && !isLoadingSessions && !errorStudents && filteredStudents.length === 0 && (
          <div className="text-center py-16 text-ink-faint">
            <LuSearchX className="w-16 h-16 mx-auto mb-4 text-ink-faint"/>
            <p className="text-lg tracking-wider">No se han encontrado alumnos.</p>
          </div>
        )}

        {/* Grid cards Alumnos */}
        {!isLoadingStudents && !isLoadingSessions && filteredStudents.length > 0 && (
          // CAMBIO: grid con scroll interno (flex-1 min-h-0 overflow-y-auto); en xl pasa a 5 columnas para que las 10 tarjetas de la página ocupen 2 filas
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 content-start flex-1 min-h-0 overflow-y-auto p-1">
              {paginatedStudents.map( (student) => (
                <StudentCard
                key={student._id}
                student={{
                  ...student,
                  sessionsCount: getStudentSessionsCount(student._id),
                }}
                />
              ))}
          </div>
        )}

        {/* CAMBIO: controles de paginación (solo si hay más alumnos de los que caben en una página) */}
        {!isLoadingStudents && !isLoadingSessions && filteredStudents.length > STUDENTS_PER_PAGE && (
          <nav aria-label="Paginación de alumnos" className="flex items-center justify-between gap-4 pt-4 shrink-0">
            <p className="text-xs text-slate-500">
              Mostrando {pageStart + 1}–{Math.min(pageStart + STUDENTS_PER_PAGE, filteredStudents.length)} de {filteredStudents.length} alumnos
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={safePage === 1}
                onClick={() => setCurrentPage(safePage - 1)}
                className="p-2 rounded-xl bg-white border border-[#EBE7DF] text-slate-600 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <FiChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  aria-label={`Página ${page}`}
                  aria-current={page === safePage ? "page" : undefined}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-9 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    page === safePage
                      ? "bg-[#529471] border-[#529471] text-white"
                      : "bg-white border-[#EBE7DF] text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                aria-label="Página siguiente"
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage(safePage + 1)}
                className="p-2 rounded-xl bg-white border border-[#EBE7DF] text-slate-600 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </nav>
        )}

        {/* Modal para Crear Alumno */}
        <NewStudentModal
        isOpen={isModalOpen}
        onClose={ () => setIsModalOPen(false)}
        onStudentCreated={fetchStudentsData}
        />

      </div>
    </div>
  )
}

import { StudentCard } from "../../components/students/StudentCard";
import { useState } from "react";
import { useEffect } from "react";
import apiClient from "../../config/axios";
import { IoSearchOutline } from "react-icons/io5";
import { LuSearchX } from "react-icons/lu";

export const Students = () => {

  /* Defimos estados locales */

  /* ==== Estados peticion de datos Alumnos ==== */
  const [ students, setStudents] = useState([]);
  const [ isLoadingStudents, setIsLoadingStudents ] = useState(true);
  const [ errorStudents, setErrorStudents ] = useState("");

  // Cargamos los datos de alumnos
  useEffect( () => {
    const fetchStudentsData = async() => {
      try {
        setIsLoadingStudents(true);
        //Peticion a endpoint
        const response = await apiClient("/students");
        setStudents(response.data.students || []);
        
      } catch (err) {
        setErrorStudents(err.response?.data?.message || "Error al cargar los alumnos.");
      } finally {
        setIsLoadingStudents(false);
      }
    };
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
        setIsLoadingSessions(true);
        //Peticion a endpoint
        const response = await apiClient("/sessions");
        
        setSessions(Array.isArray(response.data) ? response.data : response.data.sessions || []); //Nuestro endpoint devuelve la data como array y si no es array, cogemos la propiedad sessions.
        
      } catch (err) {
        setErrorSessions(err.response?.data?.message || "Error al cargar las sesiones.");
      } finally {
        setIsLoadingSessions(false);
      }
    };
    fetchDashboardData();
  }, []);


  // Estado para filtrar y gestionar busqueda
  const [ searchTerm, setSearchTerm ] = useState("");

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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-8xl mx-auto px-8 py-6">
        {/* Contenedor cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl tracking-wider font-500 text-ink leading-snug">Alumnos</h1>
            <p className="text-sm text-slate-500 mt-1 tracking-wider leading-snug">Gestión de alumnos y expedientes</p>
          </div>

          <button
          type="button"
          onClick={() => {/* Ventana modal para crear alumno */}}
          className="bg-[#529471] hover:bg-[#437a5d] text-white px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <span className="text-lg">+</span>
            <span>Nuevo Alumno</span>
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative mb-8">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
          <input
          type="text"
          placeholder="Búsqueda por nombre, curso, diagnóstico, tutor…"
          value={searchTerm}
          onChange={ (e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-[#e8e4db] rounded-xl text-sm text-ink placeholder:text-int-faint focus:outline-none focus:border-[#5d9e7e] transition-colors"
          />
        </div>

        {/* Estados de Carga de Error y Estado vacío */}
        
        {(isLoadingStudents || isLoadingSessions) && (
          <div className="text-center py-12 text-slate-400 font-medium text-sm tracking-wider">Cargando alumnos...</div>
        )}

        {errorStudents && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 mb-6 text-sm tracking-wider">
            {errorStudents}
          </div>
        )}

        {/* No se encuentran alumnos */}
        
        {!isLoadingStudents && !isLoadingSessions && filteredStudents.length === 0 && (
          <div className="text-center py-16 text-ink-faint">
            <LuSearchX className="w-16 h-16 mx-auto mb-4 text-ink-faint"/>
            <p className="text-lg tracking-wider">No se han encontrado alumnos.</p>
          </div>
        )}



      </div>
    </div>
  )
}

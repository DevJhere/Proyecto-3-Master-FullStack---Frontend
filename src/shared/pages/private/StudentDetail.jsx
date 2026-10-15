import { useEffect, useState } from "react";
import apiClient from "../../config/axios";
import { IoTrashOutline } from "react-icons/io5";
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate, useParams, Link } from "react-router-dom";
import { StudentSidebar } from "../../components/students/StudentSidebar"
import { FaPlus } from "react-icons/fa";
import { SessionTimeline } from "../../components/students/SessionTimeline";
import { NewSessionForm } from "../../components/students/NewSessionForm";
import { ReportList } from "../../components/students/ReportList";

export const StudentDetail = () => {

  // Hook para obtener parametro de la URL
  const { id } = useParams();
  const navigate = useNavigate();

  //Estados de alumno y sesiones
  const [ student, setStudent] = useState(null);
  const [ sessions, setSessions] = useState([]);
  const [ isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [ error, setError] = useState('');

  //Pestaña activa Intervención | Informes
  const [activeTab, setActiveTab] = useState('intervention');

  // Esta para desplegar el formulario Nueva sesion
  const [ showNewSession, setShowNewSession] = useState(false);

  // Función para obtener los datos del estudiante
  const fetchStudentData = async() => {
      try {
        setIsLoadingStudents(true);
        //Hacemos peticiones simultaneas para obtener alumno y sesiones
        const [studentRes, sessionsRes] = await Promise.all([
          apiClient(`/students/${id}`),
          apiClient(`/sessions`), //Revisar backend solicitud sesiones estudiante por id
        ])
        
        //Almacenamos el alumno que se ha traido de la petición
        setStudent(studentRes.data);

        //Filtramos sesiones para el alumno seleccionado
        const allSessions = Array.isArray(sessionsRes.data) 
        ? sessionsRes.data
        : sessionsRes.data.sessions || [];

        const filteredSessions = allSessions.filter( session => (session.student?._id || session.student) === id);
        setSessions(filteredSessions);
        
      } catch (err) {
        setError(err.response?.data?.message || "Error al cargar información del alumno.");
      } finally {
        setIsLoadingStudents(false);
      }
    };

  // Cargamos datos del estudiante
  useEffect( () => {
    fetchStudentData();
  }, [id]);

  //Manejador para Eliminar Alumno
  const handleDeleteStudent = async() => {
    //Muestra ventana de confirmacion con el nombre del alumno y advierte que se perdera toda la informacion
    const confirmDelete = window.confirm(`¿Estás seguro que deseas eliminar a ${student?.name}? Esto eliminará toda la información registrada en el sistema.`);

    if(!confirmDelete) return

    try {
        await apiClient.delete(`/students/${id}`);
        navigate("/students");
    } catch (err) {
        alert(err.response?.data?.message || "Error al eliminar al alumno.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        {/* Boton volver a alaumnos */}
        <Link
        to="/students"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-slate-800 font-medium"
        >
            <IoIosArrowBack size={16}/>
            Volver a alumnos
        </Link>

        {/* Estados de carga, error y Columna Izquierda y Derecha */}
        {isLoadingStudents ? (
            <div className="text-center py-12 text-slate-400 font-medium text-sm tracking-wide">Cargando expediente...</div>
        ) : error ? (
            <div className="text-center py-12 text-red-500 font-medium text-sm">{error}</div>
        ) : (
            // Grid 2 columnas
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Columna Izquierda */}
                <div className="lg:col-span-4">
                    <StudentSidebar student={student}/>
                </div>

                {/* Columna Derecha */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Selector de pestaña  */}
                    <div className="bg-[#EBE7DF]/40 p-1 rounded-xl inline-flex gap-1 border border-[#EBE7DF]">
                        <button 
                        type="button"
                        onClick={ () => setActiveTab("intervention")}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === "intervention"
                        ? "bg-white text-ink shadow-sm"
                        : "text-ink-muted hover:text-shadow-ink-muted"
                        }`}
                        >
                        Historial de Intervención
                        </button>
                        <button 
                        type="button"
                        onClick={ () => setActiveTab("reports")}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === "reports"
                        ? "bg-white text-ink shadow-sm"
                        : "text-ink-muted hover:text-shadow-ink-muted"
                        }`}
                        >
                        Informes
                        </button>
                    </div>

                    {/* Barra subcabecera: Contador + Botones de acción */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <p className="text-xs sm:text-sm text-ink-muted font-medium">
                        {sessions.length} registro{sessions.length !== 1 ? "s" : ""} 
                      </p>

                      <div className="flex items-center gap-2">
                        {/* Boton eliminar Alumno */}
                        <button
                        type="button"
                        onClick={handleDeleteStudent}
                        className="px-4 py-2 bg-[#e06262] hover:bg-[#ee4a4a] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        title="Eliminar expediente"
                        >
                          <IoTrashOutline size={15}/>
                          <span className="hidden sm:inline">Eliminar Alumno</span>

                        </button>

                        {/* Boton añadir Sesion */}
                        <button
                        type="button"
                        onClick={ () => setShowNewSession(true)}
                        className="px-4 py-2 bg-[#529471] hover:bg-[#437a5d] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
                          <FaPlus size={15}/>
                          <span className="hidden sm:inline">Nuevo Registro</span>
                        </button>
                      </div>
                    </div>

                    {/* Formulario de Nueva Sesión (se muestra solo cuando showNewSession es true)  */}
                    {showNewSession && (
                      <NewSessionForm
                      studentId={id}
                      onClose={ () => setShowNewSession(false)}
                      onSessionCreated={fetchStudentData}
                      />
                    )}

                    {/* Contenido segun pestaña */}
                    {activeTab === "intervention" ? (
                      <SessionTimeline sessions={sessions}/>
                    ) : (
                      <ReportList
                      studentId={id}
                      sessions={sessions}
                      onReportUploaded={fetchStudentData} />
                    )}
                </div>

            </div>
        )}


    </div>
  )
}

import { useEffect, useState } from "react";
import apiClient from "../../config/axios";
import { IoTrashOutline } from "react-icons/io5";
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate, useParams, Link } from "react-router-dom";
import { StudentSidebar } from "../../components/students/StudentSidebar"

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

  // Cargamos datos del estudiante
  useEffect( () => {

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

        {/* Estados de carga y error */}
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

            </div>
        )}
    </div>
  )
}

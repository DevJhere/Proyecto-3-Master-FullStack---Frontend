import { useEffect, useState } from "react";
import apiClient from "../../config/axios";
import { IoArrowBack, IoTrainOutline } from "react-icons/io5";
import { use } from "react";
import { useNavigate, useParams } from "react-router-dom";

export const StudentDetail = () => {

  // Hook para obtener parametro de la URL
  const { id } = useParams();
  const navigate = useNavigate();

  //Estados de alumno y sesiones
  const [ student, setStudent] = useState(null);
  const [ sessions, setSessions] = useState([]);
  const [ isLoading, setIsLoading] = useState(true);
  const [ error, setError] = useState('');

  //Pestaña activa Intervención | Informes
  const [activeTab, seActiveTab] = useState('intervention');

  // Esta para desplegar el formulario Nueva sesion
  const [ showNewSession, setShowNewSession] = useState(false);

  // Cargamos datos del estudiante
  useEffect( () => {

    const fetchStudentsData = async() => {
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
        setErrorStudents(err.response?.data?.message || "Error al cargar información del alumno.");
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
    <div>StudentDetail</div>
  )
}

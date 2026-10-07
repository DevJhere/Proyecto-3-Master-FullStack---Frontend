import { NavLink } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { useState } from "react";
import { useEffect } from "react";
import apiClient from "../../config/axios";


export const Dashboard = () => {


  //Creación de instancia para obtener fecha actual ej: Miercoles, 12 de Noviembre de 2026
  const  todayDate = new Date();
  
  //Formato de fecha
  const dayName = todayDate.toLocaleDateString('es-ES', {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dateTodayCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);


  //Estado para obtener datos del usuario
  const { user } = useAuth();

  //Mostrar nombre capitalizado
  const userNameCap = user?.name?.split(" ")[0] || "Pedagogo/a";


  /* Estado para cargar las sesiones pendientes */
  const [ sessions, setSessions] = useState([]);
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState("");

  // Cargamos los datos
  useEffect( () => {
    const fetchDashboardData = async() => {
      try {
        setIsLoading(true);
        //Peticion a endpoint
        const response = await apiClient("/sessions");
        setSessions(response.data.sessions || []);
        
      } catch (err) {
        setError(err.response?.data?.message || "Error al cargar las sesiones.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  //Sesiones de hoy
  const todayStr = new Date().toISOString().slice(0,10);
  const todaySessions = sessions.filter(session => {
      const sessionDate = new Date(session.date || session.fecha).toISOString().slice(0, 10);
      return sessionDate === todayStr;   
  });

  //TODO - Sesiones de este mes
  const currentMonth = new Date().getMonth() + 1; // el + 1 es para que el mes de enero no empiece desde el 0
  const currentYear = new Date().getFullYear(); // el getFullYear es para que el año no empiece desde el 2000
 
  //Filtramos las sesiones por mes y año
  const sessionsThisMounthCount = sessions.filter(session => {
    const sessionsDate = new Date(session.date || session.fecha);
    return sessionsDate.getMonth() + 1 === currentMonth && sessionsDate.getFullYear() === currentYear
  }).length;


  /* Alumnos Activos y sesiones completada */

  //Estado para alumnos
  const [students, setStudents] = useState([]);
  const [ isLoadingStudents, setIsLoadingStudents ] = useState(true);
  const [ errorStudents, setErrorStudents ] = useState("");

  // Cargamos los datos de los alumnos
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

  //Alumnos activos
  const activeStudentsCount = students.length;

  //Sesiones completadas
  const completedSessionsCount = sessions.filter(session => session.status === "Completado" || session.estado === "Completado").length;




  return (
    <div className="flex-1 overflow-y-auto">
      {/* Contenedor Cabecera */}
      <div className="max-w-8xl mx-auto px-8 py-6">

        {/* Contendedor cabecera */}
        <div className="mb-10">
          <p className="text-sm text-ink-faint font-500 mb-1">{dateTodayCap}</p>

          {/* Titulo Saludo a Usuario */}
          <h1 className="text-3xl tracking-wider font-500 text-ink leading-snug">
            Hola, {userNameCap}
          </h1>
          <p className="text-ink-muted mt-1 text-sm mb-8">Tienes {" "}
            <span className="font-600 text-sage">
              {/* TODO. Agregar las sesiones almacenadas en la base de datos para hoy*/}
              {todaySessions.length} sesión{todaySessions.length != 1 ? "es" : ""}{" "}
            </span>
             pendientes para hoy.
          </p>
        </div>

        {/* Contenedor TARJETAS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Alumnos Activos */}
        <div className="bg-[#EBF5EE] p-6 rounded-3xl border border-[#D8EBE0]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#529471] mb-2">
            Alumnos Activos
            </p>
            <p className="text-3xl tracking-wider text-[#529471] font-semibold">
                {isLoadingStudents ? "..." : activeStudentsCount}
            </p>
            <p className="text-xs text-[#529471] mt-1 font-medium">
                {activeStudentsCount} Perfiles asignados
            </p>
        </div>

        {/* Sesiones este mes */}
        <div className="bg-[#EEF6FC] p-6 rounded-3xl border border-[#D5E6F5]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4A86B8] mb-2">
            Sesiones este mes
          </p>
          <p className="text-3xl tracking-wider text-[#4A86B8] font-semibold">
            {isLoading ? "..." : sessionsThisMounthCount}
          </p>
          <p className="text-xs text-[#4A86B8] mt-1 font-medium">
            {sessionsThisMounthCount} Programadas en el mes
          </p>
        </div>

        {/* Sesiones completadas */}
        <div className="bg-[#FDF1EE] p-6 rounded-3xl border border-[#FADCD5]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#E07A5F] mb-2">
            Sesiones Completadas
          </p>
          <p className="text-3xl tracking-wider text-[#D65F41] font-semibold">
            {isLoading ? "..." : completedSessionsCount}
          </p>
          <p className="text-xs text-[#D65F41] mt-1 font-medium">
            Realizadas con éxito
          </p>
        </div>

      </div>


      </div>
    </div>
  )
}

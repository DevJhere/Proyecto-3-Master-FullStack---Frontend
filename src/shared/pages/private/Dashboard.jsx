import { NavLink } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { useState } from "react";
import { useEffect } from "react";
import apiClient from "../../config/axios";
import { KpiCard } from "../../components/dashboard/KpiCard";
import { SessionCard } from "../../components/dashboard/SessionCard";
import { StudentQuickCard } from "../../components/dashboard/StudentQuickCard";


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
        
        setSessions(Array.isArray(response.data) ? response.data : response.data.sessions || []); //Nuestro endpoint devuelve la data como array y si no es array, cogemos la propiedad sessions.
        
      } catch (err) {
        setError(err.response?.data?.message || "Error al cargar las sesiones.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  //Funcion para obtener  hora local
  const getLocaldateStr = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }


  //Filtrado de sesiones de hoy
  const todayStr = getLocaldateStr(new Date());
  const todaySessions = sessions.filter(session => {
    const sDate = getLocaldateStr(session.date || session.fecha);
    return sDate === todayStr; 
  });
  
  //Estos nos permite que solo se puedan ver la sesiones filtradas de cada usuario, es decir el admin no podra ver las sesiones asiganadas del pedagogo en su vista
  const myTodaySessions = todaySessions.filter((session) => {
    const pedagogoId = typeof session.pedagogoAsignado === "object"
      ? session.pedagogoAsignado?._id
      : session.pedagogoAsignado;
    return pedagogoId === (user?._id || user?.id);
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
      {/* Contenedor */}
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
              {myTodaySessions.length} sesión{myTodaySessions.length != 1 ? "es" : ""}{" "}
            </span>
             pendientes para hoy.
          </p>
        </div>

        {/* Contenedor TARJETAS KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
        <div className="mb-10">

          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-wider text-ink-strong">
              Sesiones de hoy
            </h2>
            <NavLink
            to="/students"
            className={"text-sm font-medium text-[#529471] hover:underline"}
            > Ver todos los alumnos → </NavLink>
          </div>

          {/* Card de Sesión */}
          {myTodaySessions.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-[#EBE7DF]">
              <p className="text-slate-400 text-sm">No hay sesiones programadas para hoy.</p>
            </div>
          ): (
            // Si hay sesiones, recorremos la lista
            <div className="space-y-4">
              
              {myTodaySessions.map( (session) => (
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
        <div className="mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-wider text-slate-800">
              Acceso Rápido
            </h2>
          </div>

          {/* Tarjetas de acceso rápido */}
          { students.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-3xl border border-dashed border-[#EBE7DF]">
              <p className="text-slate-400 text-sm">No tienes alumnos asigandos todavía.</p>
            </div>
          ): (
            // Grid de 3 columons que muestras hasta 6 pacientes/alumnos principales
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {students.slice(0,6).map( (student) =>(
                <StudentQuickCard key={student._id} student={student}/>
              ))}
            </div>

          )}

          
        </div>
      </div >
    </div>
  )
}

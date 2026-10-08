import { NavLink } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
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
              
              {myTodaySessions.map( (session) => {
                // Aqui procesamos los datos de cada sesion individual
                const timeFormatted =  session.date ? new Date(session.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit"})
                : "--:--";

                //Obyenemos datos de Students - Con esto al tratarse de un objeto de mongoose, accedemos a sus propiedades. 
                const studentData = typeof session.student === "object" ? session.student : students.find((s) => s._id === session.student);

                //Recogemos los datos y los asignamos a variables que provienen de la base de datos
                const name = studentData?.name || "Alumno sin nombre";
                const diagnosis = studentData?.diagnosis || studentData?.diagnostico || "No diagnosticado";
                const avatar = studentData?.avatar || "https://res.cloudinary.com/kvayxt5w/image/upload/v1788861354/profile-default.jpg";
                const durationSession = session.duration ? `${session.duration} min` : "60 min";

                return(
                  
                  <Link
                   key={session._id || session.id}
                   to={studentData?._id ? `/students/${studentData._id}` : "/students"}
                   className="bg-white rounded-3xl border border-[#EBE7DF] p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
                  >
                    {/* Columna Izquierda: Hora + Avatar + Datos alumno */}
                    <div className="flex items-center gap-4">
                      <div className="text-center pr-4 border-r border-[#EBE7DF]">
                        <p className="text-base font-bold text-slate-800">{timeFormatted}</p>
                        <p className="text-xs text-slate-400">{durationSession}</p>
                      </div>

                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-[#EBE7DF]">
                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800 text-sm" >{name}</h3>
                        <p className="text-xs text-slate-400">{session.notes}</p>
                      </div>
                    </div>

                    {/* Columna Derecha: Boton de Accion */}
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-[#FDF1EE] text-[#E07A5F] rounded-full text-xs font-semibold">
                        {diagnosis}
                      </span>

                      <span className={`text-xs font-medium ${session.status === "Completado" ? "text-[#529471]" : "text-slate-400"}`}>
                        {session.status}
                      </span>

                    </div>
                  </Link>

                );

              })}
              
            </div>
          )} 
        </div>


      </div >
    </div>
  )
}

import { Link } from "react-router-dom";
import { getAvatarUrl } from "../../utils/HelperAvatar";

export const SessionCard = ({session, students}) => {

  /* Sesiones de hoy - Definimos funciones y variables */
 
  // Aqui procesamos los datos de cada sesion individual
  const timeFormatted =  session.date ? new Date(session.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit"})
  : "--:--";
  
  //Obyenemos datos de Students - Con esto al tratarse de un objeto de mongoose, accedemos a sus propiedades. 
  const studentData = typeof session.student === "object" ? session.student : students.find((s) => s._id === session.student);
  
  //Recogemos los datos y los asignamos a variables que provienen de la base de datos
  const name = studentData?.name || "Alumno sin nombre";
  const diagnosis = studentData?.diagnosis || studentData?.diagnostico || "No diagnosticado";
  const durationSession = session.duration ? `${session.duration} min` : "60 min";


  return (
   
    <Link 
      to={studentData?._id ? `/students/${studentData._id}` : "/students"}
      className="bg-white rounded-3xl border border-[#EBE7DF] hover:border-[#529471] p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
    >
        {/* Columna Izquierda: Hora + Avatar + Datos alumno */}
        <div className="flex items-center gap-4">

          {/* Hora */}
          <div className="text-center pr-4 border-r border-[#EBE7DF]">
            <p className="text-base font-bold text-slate-800">{timeFormatted}</p>
            <p className="text-xs text-slate-400">{durationSession}</p>
          </div>

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-[#EBE7DF] group-hover:scale-105 transition-transform">
            <img
                src={getAvatarUrl(studentData?.avatar)}
                alt={name}
                className="w-full h-full object-cover"
            />
          </div>

          {/* Notas de Sesión */}
          <div className="overflow-hidden">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#529471] transition-colors" >{name}</h3>
            <p className="text-xs text-slate-400">{session.notes || "Sesión de apoyo"}</p>
          </div>
        </div>

        {/* Columna Derecha: Boton de Accion */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#FDF1EE] text-[#E07A5F] rounded-full text-xs font-semibold">{diagnosis}</span>
          <span className={`text-xs font-medium ${session.status === "Completado" ? "text-[#529471]" : "text-slate-400"}`}>
            {session.status}
          </span>
        </div>
    
    </Link>
  )
}

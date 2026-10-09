import { Link } from "react-router-dom";
import { getAvatarUrl } from "../../utils/HelperAvatar";
import { COURSES, DIAGNOSIS, TUTOR_RELATIONSHIP } from "../../utils/constants";


export const StudentCard = ({student}) => {
  return (
    <Link
    to={`/students/${student._id}`}
    className="bg-white rounded-3xl border border-[#EBE7DF] hover:border-[#529471] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group cursor-pointer"
    >
        {/* Mostramos el Avatar - Imagen - Mitad Superior */}
        <div className="h-44 w-full overflow-hidden bg-slate-100">
            <img 
            src={getAvatarUrl(student.avatar)} 
            alt={student.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
        </div>

        {/* Mostramos la información del alumno - Mitad inferior  */}
        <div className="p-5 flex-1 flex flex-col justify-between">

            {/* Datos alumno - Fila Nombre + Diagnostico */}
            <div className="flex items-center justify-between gap-2">
                
                <h3 className="font-bold text-slate-800 text-xs group-hover:text-[#529471] transition-colors truncate " >
                    {student.name}
                </h3>

                {/* Etiqueta Diagnostico */}
                <span className="px-0.5 py-1 bg-[#FDF1EE] text-[#E07A5F] rounded-full text-xs font-semibold shrink-0">
                    {DIAGNOSIS[student.diagnosis] || student.diagnosis || "Sin diagnóstico previo"}
                </span>
            </div>

            {/* Datos alumno - Fila Curso + Edad */}
            <p className="text-xs text-slate-400 mt-1 mb-4">
                {`${COURSES[student.course] || student.course || "Curso no asignado"} · ${student.age || "Edad no registrada"} años`}
            </p>
            
            {/* Datos alumno - Fila Tutor y Contador Sesiones */}
            <div className="flex items-center justify-between pt-3 border-t border-[#F5F2EB]">

                {/* Nombre del Tutor */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#529471]"></span>
                    <span className="truncate">
                        {student.nameTutor || "Sin tutor asignado"} 
                    </span>
                </div>

                {/* Sesiones */}
                <span className="text-xs text-slate-400 font-medium">
                    {student.sessionsCount || 0} sesión{(student.sessionsCount !== 1) ? "es" : ""}
                </span>
            </div>

            
        </div>
    
    
    </Link>
  )
}

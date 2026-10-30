import { Link } from "react-router-dom";
import { getAvatarUrl } from "../../utils/HelperAvatar";
import { COURSES, DIAGNOSIS } from "../../utils/constants";


export const StudentCard = ({student, showPedagogo = false}) => {
  return (
    <Link
    to={`/students/${student._id}`}
    className="bg-white rounded-3xl border border-[#EBE7DF] hover:border-[#529471] shadow-sm hover:shadow-md transition-all flex flex-col group cursor-pointer"
    >
        {/* Mostramos el Avatar - Imagen - Mitad Superior */}
        {/* CAMBIO (scroll en Alumnos): altura de la imagen reducida de h-44 a h-32 y padding de p-5 a p-4 para que 2 filas de tarjetas quepan en pantalla */}
        {/* CAMBIO (nombre recortado en tarjetas): cuando nombre y etiqueta ocupan 2 líneas la tarjeta necesita más alto. Para que la fila de la
            rejilla pueda crecer (con overflow-hidden en la tarjeta se recortaba el pie), el overflow-hidden y las esquinas redondeadas
            pasan de la tarjeta a la imagen (rounded-t-3xl), shrink-0 evita que la imagen se comprima y su alto baja a h-28 para compensar la línea extra. */}
        <div className="h-28 w-full overflow-hidden bg-slate-100 shrink-0 rounded-t-3xl">
            <img 
            src={getAvatarUrl(student.avatar)} 
            alt={student.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
        </div>

        {/* Mostramos la información del alumno - Mitad inferior  */}
        <div className="p-4 flex-1 flex flex-col justify-between">

            {/* Datos alumno - Fila Nombre + Diagnostico */}
            {/* CAMBIO (nombre recortado en tarjetas): con 5 columnas, una etiqueta de diagnóstico larga (p. ej. "Retraso del Lenguaje")
                dejaba casi sin espacio al nombre y se veía como "A...". La fila ahora admite salto de línea (flex-wrap): si nombre y
                etiqueta no caben juntos, la etiqueta pasa a la línea de abajo y el nombre se muestra completo (truncate solo si
                el nombre por sí solo supera el ancho de la tarjeta, por eso max-w-full). */}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">

                <h3 className="font-bold text-slate-800 text-xs group-hover:text-[#529471] transition-colors truncate max-w-full " >
                    {student.name}
                </h3>

                {/* Etiqueta Diagnostico */}
                <span className="px-0.5 py-1 bg-[#FDF1EE] text-[#E07A5F] rounded-full text-xs font-semibold shrink-0">
                    {DIAGNOSIS[student.diagnosis] || student.diagnosis || "Sin diagnóstico previo"}
                </span>
            </div>

            {/* Datos alumno - Fila Curso + Edad */}
            <p className="text-xs text-slate-400 mt-1 mb-3">
                {`${COURSES[student.course] || student.course || "Curso no asignado"} · ${student.age || "Edad no registrada"} años`}
            </p>
            
            {/* 
            //nueva prop showPedagogo (la activa el admin) para mostrar el pedagogo asignado al alumno
            CAMBIO: Pedagogo asignado (pedagogoAsignado llega poblado desde el backend con name y email) 
            */}
            {showPedagogo && (
                <p className="text-xs text-[#69488E] font-medium mb-2 truncate">
                    Pedagogo: {student.pedagogoAsignado?.name || "Sin asignar"}
                </p>
            )}

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
                    {student.sessionsCount || 0} {student.sessionsCount === 1 ? "sesión" : "sesiones"}
                </span>
            </div>

            
        </div>
    
    
    </Link>
  )
}

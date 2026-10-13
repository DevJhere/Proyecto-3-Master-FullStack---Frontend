import { getAvatarUrl } from "../../utils/HelperAvatar";
import { COURSES, DIAGNOSIS, TUTOR_RELATIONSHIP } from "../../utils/constants";

export const StudentSidebar = ( {student}) => {

  //Verficamos si estudiante existe
  if(!student) return null;

  // Formateador para la fecha de inicio 
  const formatStarDate = ( dateString ) => {
    //Verficamos si la fecha ha sido registrada
    if(!dateString) return "No registrada";

    const date = new Date(dateString); //Instanciamos la fecha
    const formatted = date.toLocaleDateString('es-ES', { month: "long", year: "numeric"});
    return formatted.charAt(0).toLocaleUpperCase() + formatted.slice(1);
  };


  return (
    <div className="space-y-6">
        
        {/* Card Perfil */}
        <div className="bg-white rounded-3xl border border-[#EBE7DF] overflow-hidden shadow-sm">
            <div className="h-64 w-full overflow-hidden bg-slate-100" >
                <img 
                    src={getAvatarUrl(student.avatar)} 
                    alt={student.name}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="p-6">
                <h1 className="text-2xl font-bold text-slate-900 leading-snug tracking-wider">{student.name}</h1>
                <p className="text-xs text-ink-muted mt-1 mb-4">{COURSES[student.course] || student.course} · {student.age} años</p>
                <span className="px-3 py-1 bg-[#f0f9ff] text-[#5fabda] tracking-wider rounded-full text-xs font-semibold inline-block">{DIAGNOSIS[student.diagnosis] || student.diagnosis ||"Sin diagnosticar"}</span>

            </div>
        </div>

        {/* TUTOR/A LEGAL */}
        <div className="bg-white rounded-3xl border border-[#EBE7DF] p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Tutor/a Legal
            </h2>

            <div>
                <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Nombre</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{student.nameTutor || "Sin tutor"}</p>
            </div>

            <div>
                <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Relación</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{TUTOR_RELATIONSHIP[student.tutorRelationship] || student.tutorRelationship || "Sin tutor"}</p>
            </div>

            <div>
                <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Teléfono</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{student.phoneNumberTutor || "Teléfono no registrado"}</p>
            </div>

            <div>
                <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Correo</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{student.emailTutor || "Correo no registrado"}</p>
            </div>
        </div>

        {/* Card Intervención */}
        <div className="bg-white rounded-3xl border border-[#EBE7DF] p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Fecha Intervención
            </h2>

            <div>
                <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wide">Inicio</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatStarDate(student.createdAt)}</p>
            </div>
    
        </div>
    </div>
  )
}

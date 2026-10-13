import { GoCalendar } from "react-icons/go";
export const SessionTimeline = ({sessions = []}) => {

  //Formateador de fecha
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no registrada";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  //Configuración de colores y estilos según estado emocional
  const getEmotionalBagde = ( state ) => {
    
    //Normalizamos a minusculas el estado emocional.
    const s = state?.toLowerCase() || "";

    // Validamos estado emocional para asignar estilos
    if(s.includes("bien")) {
        return {
            dotColor: "bg-[#529471]",
            badgeClasses: "bg-[#EBF7EE] text-[#2D6A4F]",
            label: "● Bien"
        };
    }

    if(s.includes("regular")) {
        return {
            dotColor: "bg-[#E07A5F]",
            badgeClasses: "bg-[#FFF5ED] text-[#D97706]",
            label: "● Regular"
        };
    }

    if(s.includes("difícil") || s.includes("dificil")) {
        return {
            dotColor: "bg-[#DC2626]",
            badgeClasses: "bg-[#FEF2F2] text-[#DC2626]",
            label: "● Difícil"
        };
    }

    return {
      dotColor: "bg-[#529471]",
      badgeClasses: "bg-slate-100 text-slate-600",
      label: "● Registrado"
    };
  };

  //Estado vacío si no hay sesiones
  if(sessions.length === 0 ){
    return (
        <div className="bg-white rounded-3xl border border-dashed border-[#EBE7DF] p-12 text-center text-ink-muted">
            <GoCalendar size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="font-semibold tracking-wider text-ink-muted">No hay sesiones de intervención registradas</p>
            <p className="text-xs font-light text-ink-muted mt-1">Pulsa en "+ Añadir sesión" para registrar la primera intervención de este alumno.</p>
        </div>
    );
  }
 
  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#EBE7DF]">
        

    </div>
  )
}

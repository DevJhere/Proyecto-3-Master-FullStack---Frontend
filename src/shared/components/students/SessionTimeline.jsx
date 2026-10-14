import { GoCalendar } from "react-icons/go";
import { FiClock, FiFileText } from "react-icons/fi";

export const SessionTimeline = ({ sessions = [] }) => {
  // Formateador de fecha y hora
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no registrada";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  // Configuración de colores según el status del modelo ("Pendiente", "Completado", "Cancelado")
  const getStatusBadge = (status) => {
    switch (status) {
      case "Completado":
        return {
          dotColor: "bg-[#529471]",
          badgeClasses: "bg-[#EBF7EE] text-[#2D6A4F]",
          label: "● Completado",
        };
      case "Cancelado":
        return {
          dotColor: "bg-[#DC2626]",
          badgeClasses: "bg-[#FEF2F2] text-[#DC2626]",
          label: "● Cancelado",
        };
      case "Pendiente":
      default:
        return {
          dotColor: "bg-[#62c7da]",
          badgeClasses: "bg-[#62c7da91] text-[#1c7394ff]",
          label: "● Pendiente",
        };
    }
  };
  // Estado vacío
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-[#EBE7DF] p-12 text-center text-ink-muted">
        <GoCalendar size={36} className="mx-auto mb-3 text-ink-muted" />
        <p className="font-semibold tracking-wider text-ink-muted">No hay sesiones registradas</p>
        <p className="text-xs text-ink-faint mt-1">
          Pulsa en "Nueva Sesión" para registrar la primera intervención de este alumno.
        </p>
      </div>
    );
  }
  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#EBE7DF]">
      {sessions.map((session, index) => {
        const badge = getStatusBadge(session.status);
        return (
          <div key={session._id || index} className="relative group">
            {/* Punto de color en la línea vertical */}
            <span
              className={`absolute -left-5.75 sm:-left-6.80 top-6 w-3.5 h-3.5 rounded-full ring-4 ring-[#FAF8F5] ${badge.dotColor} transition-transform group-hover:scale-125`}
            />
            {/* Tarjeta de Sesión */}
            <div className="bg-white rounded-2xl border border-[#EBE7DF] p-5 shadow-sm hover:shadow-md transition-all space-y-3">
              {/* Cabecera: Duración + Fecha + Badge de Estado */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#529471]">
                  <FiClock size={13} />
                  <span>{session.duration ? `${session.duration} min` : "60 min"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-muted font-medium">
                    {formatDate(session.date)}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.badgeClasses}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
              {/* Notas de la Sesión */}
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                {session.notes || "Sesión de apoyo pedagógico sin notas adicionales."}
              </p>
              {/* Documento adjunto si existe */}
              {session.attachmentDocument && (
                <div className="pt-2 border-t border-[#F5F2EB]">
                  <a
                    href={session.attachmentDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:underline"
                  >
                    <FiFileText size={14} />
                    <span>Ver documento adjunto</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

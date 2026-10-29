import { useMemo, useState } from "react";
import apiClient from "../../config/axios";
import { getApiErrorMessage } from "../../utils/APIHelpers";
import { GoCalendar } from "react-icons/go";
import { FiClock, FiFileText } from "react-icons/fi";
import { FiChevronDown } from "react-icons/fi";
import { SESSION_STATUS } from "../../utils/constants";

export const SessionTimeline = ({ sessions = [], onSessionUpdated }) => {


  //Estados menú desplegable de estado está abierto y cuál está actualizándose
  const [openMenuId, setOpenMenuId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  //Historial: la sesión más reciente primero (la API las devuelve de la más antigua a la más reciente)
  const orderedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [sessions],
  );


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
          badgeClasses: "bg-[#EBF7EE] text-[#2D6A4F] hover:bg-[#d8f0dc]",
          label: "● Completado",
        };
      case "Cancelado":
        return {
          dotColor: "bg-[#DC2626]",
          badgeClasses: "bg-[#FEF2F2] text-[#DC2626] hover:bg-[#fedede]",
          label: "● Cancelado",
        };
      case "Pendiente":
      default:
        return {
          dotColor: "bg-[#62c7da]",
          badgeClasses: "bg-[#62c7da91] text-[#1c7394ff] hover:bg-[#d2f2f7]",
          label: "● Pendiente",
        };
    }
  };

  // Menejador para cambiar el estado de la sesión
  const handleUpdateStatus = async (sessionId, newStatus) => {
    try {
      setUpdatingId(sessionId);
      await apiClient.put(`/sessions/${sessionId}`, { status: newStatus });

      //Verificamos si la petición se realizo correctamente y actualizamos el estado
      if (onSessionUpdated) {
        await onSessionUpdated();
      }

    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert(getApiErrorMessage(error, "No se pudo actualizar el estado de la sesión"))
    } finally {
      setUpdatingId(null);
      setOpenMenuId(null);
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
      {orderedSessions.map((session, index) => {
        const badge = getStatusBadge(session.status);
        const isOpen = openMenuId === session._id;
        const isUpdating = updatingId === session._id;

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
                  {/* Selector interactivo de Estado */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(isOpen ? null : session._id)}
                      disabled={isUpdating}
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${badge.badgeClasses}`}
                      title="Haz clic para cambiar el estado de la sesión"
                    >
                      <span>{isUpdating ? "Actualizando..." : badge.label}</span>
                      <FiChevronDown
                        size={12}
                        className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />

                    </button>

                    {/* Menú desplegable */}
                    {isOpen && (
                      <>
                        {/* Backdrop invisible para cerrar al hacer clic fuera */}
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />

                        {/* Opciones */}
                        <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-[#EBE7DF] py-1.5 z-20 space-y-0.5">
                          {Object.values(SESSION_STATUS).map((statusOption) => {
                            const optionBadge = getStatusBadge(statusOption);
                            const isCurrent = session.status === statusOption;

                            return (
                              <button
                                key={statusOption}
                                type="button"
                                onClick={() => handleUpdateStatus(session._id, statusOption)}
                                className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer ${isCurrent ? "font-bold text-slate-900 bg-slate-50" : "text-slate-600"
                                  }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${optionBadge.dotColor}`} />
                                <span>{statusOption}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                  </div>
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

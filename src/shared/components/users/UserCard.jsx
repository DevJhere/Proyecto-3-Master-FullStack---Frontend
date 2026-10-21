import { FiShield, FiBriefcase, FiMail, FiCalendar, FiEdit2, FiTrash2 } from "react-icons/fi";
import { getAvatarUrl } from "../../utils/HelperAvatar";

export const UserCard = ({ user, currentUserId, onEdit, onDelete }) => {

  //Variable para saber si se está mostrando el usuario actual
  const isCurrentUser = user._id === currentUserId;
  //Variable para saber si el usuario es administrador
  const isAdmin = user.rol === "admin";

  //Funcion para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return "No registrada";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "No registrada";
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EBE7DF] hover:border-[#529471]/70 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between group">
      {/* CABECERA DE LA TARJETA */}
      <div>
        <div className="flex items-start justify-between gap-3">
          {/* Avatar con anillo */}
          <div className="relative shrink-0">
            <img
              src={getAvatarUrl(user.avatar)}
              alt={user.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#EBE7DF] group-hover:ring-[#529471]/40 transition-all bg-slate-100"
            />
            {isCurrentUser && (
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#529471] text-white border-2 border-white shadow-xs">
                Tú
              </span>
            )}
          </div>

          {/* Badge de Rol */}
          <div className="shrink-0">
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F4F0FA] text-[#69488E] border border-[#E4DAF5]">
                <FiShield className="shrink-0 text-sm" />
                <span>Administrador</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF7F2] text-[#2D6A4F] border border-[#D5EFE2]">
                <FiBriefcase className="shrink-0 text-sm" />
                <span>Pedagogo/a</span>
              </span>
            )}
          </div>
        </div>

        {/* Nombre y datos principales */}
        <div className="mt-4">
          <h3 className="font-bold text-slate-800 text-base group-hover:text-[#529471] transition-colors leading-snug truncate">
            {user.name}
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            {isAdmin ? "Acceso completo a la plataforma" : "Gestión de alumnos y sesiones"}
          </p>
        </div>

        {/* Detalles informativos */}
        <div className="mt-4 pt-4 border-t border-[#F5F2EB] space-y-2.5 text-xs">
          {/* Especialidad */}
          <div className="flex items-center gap-2 text-ink font-medium">
            <FiBriefcase className="text-ink-faint shrink-0 text-sm" />
            <span className="truncate" title={user.specialization}>
              {user.specialization || "Sin especialidad definida"}
            </span>
          </div>

          {/* Email */}
          <div className="flex items-center gap-2 text-ink-muted font-medium">
            <FiMail className="text-ink-faint shrink-0 text-sm" />
            <span className="truncate" title={user.email}>
              {user.email}
            </span>
          </div>

          {/* Fecha de registro */}
          <div className="flex items-center gap-2 text-ink-faint">
            <FiCalendar className="text-ink-faint shrink-0 text-sm" />
            <span>Miembro desde {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* FOOTER / ACCIONES */}
      <div className="mt-6 pt-4 border-t border-[#F5F2EB] flex items-center gap-2">
        {/* Botón Editar rol y datos */}
        <button
          type="button"
          onClick={() => onEdit(user)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-[#FAF8F5] hover:bg-[#E2F2E9] hover:text-[#2D6A4F] rounded-xl border border-[#EBE7DF] hover:border-[#529471]/40 transition-all cursor-pointer"
        >
          <FiEdit2 size={13} />
          <span>Editar</span>
        </button>

        {/* Botón Eliminar */}
        {isCurrentUser ? (
          <button
            type="button"
            disabled
            title="No puedes eliminar tu propia cuenta de administrador"
            className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-50 rounded-xl border border-slate-100 cursor-not-allowed"
          >
            <FiTrash2 size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onDelete(user)}
            title="Eliminar usuario del equipo"
            className="px-3 py-2 text-xs font-semibold text-red-500 hover:text-white bg-red-50 hover:bg-red-500 rounded-xl border border-red-100 hover:border-red-500 transition-all cursor-pointer"
          >
            <FiTrash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

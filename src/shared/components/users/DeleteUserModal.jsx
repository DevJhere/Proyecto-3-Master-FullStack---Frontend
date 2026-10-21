import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FiAlertTriangle, FiTrash2, FiUsers, FiCalendar } from "react-icons/fi";
import apiClient from "../../config/axios";
import { getAvatarUrl } from "../../utils/HelperAvatar";

export const DeleteUserModal = ({ isOpen, onClose, userToDelete, onUserDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [blockingDetails, setBlockingDetails] = useState(null);

  if (!isOpen || !userToDelete) return null;

  const handleClose = () => {
    if (isDeleting) return;
    setErrorMsg("");
    setBlockingDetails(null);
    onClose();
  };
  
  // Manejador para eliminar usuario
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setErrorMsg("");
      setBlockingDetails(null);

      // DELETE /users/:id
      await apiClient.delete(`/users/${userToDelete._id}`);

      // Notificamos éxito y cerramos
      onUserDeleted(userToDelete);
      handleClose();
    } catch (err) {
      const data = err.response?.data;
      setErrorMsg(data?.error || data?.message || "Error al eliminar el usuario.");
      if (data?.details) {
        setBlockingDetails(data.details);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#EBE7DF] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera con icono de alerta */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
            <FiAlertTriangle size={24} />
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Título y descripción */}
        <h2 className="text-lg font-bold text-slate-800">¿Eliminar miembro del equipo?</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Esta acción dará de baja definitiva a la cuenta de usuario en el sistema.
        </p>

        {/* Ficha resumida del usuario */}
        <div className="my-5 p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE7DF] flex items-center gap-3">
          <img
            src={getAvatarUrl(userToDelete.avatar)}
            alt={userToDelete.name}
            className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
          />
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-800 truncate">{userToDelete.name}</p>
            <p className="text-xs text-slate-500 truncate">{userToDelete.email}</p>
            <p className="text-[11px] font-semibold text-[#529471] mt-0.5 truncate">
              {userToDelete.specialization || (userToDelete.rol === "admin" ? "Administrador" : "Pedagogo/a")}
            </p>
          </div>
        </div>

        {/* Mensaje de error / Bloqueo por dependencias */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 leading-relaxed">
            <p className="font-semibold">{errorMsg}</p>
            {blockingDetails && (
              <div className="mt-2 pt-2 border-t border-red-200/60 flex items-center gap-4 text-[11px] font-medium text-red-800">
                <span className="flex items-center gap-1.5">
                  <FiUsers /> {blockingDetails.estudiantesAsignados || 0} alumno(s) asignados
                </span>
                <span className="flex items-center gap-1.5">
                  <FiCalendar /> {blockingDetails.sesionesAsignadas || 0} sesión(es) vinculadas
                </span>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-2xl border border-[#EBE7DF] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {blockingDetails ? "Entendido" : "Cancelar"}
          </button>

          {!blockingDetails && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <FiTrash2 size={14} />
              <span>{isDeleting ? "Eliminando..." : "Sí, eliminar"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

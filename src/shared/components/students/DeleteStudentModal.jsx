/* CAMBIO: sustituye al window.confirm / alert que usaba la ficha del alumno (StudentDetail).
   Sigue la misma dinámica que DeleteUserModal: muestra una ficha resumida, pide confirmación y, si la API
   falla, enseña el motivo dentro del propio modal en lugar de un alert del navegador. */
import { useState } from "react";
import { FiAlertTriangle, FiTrash2, FiCalendar } from "react-icons/fi";
import apiClient from "../../config/axios";
import { getAvatarUrl } from "../../utils/HelperAvatar";
import { getApiErrorMessage } from "../../utils/APIHelpers";
import { Modal } from "../ui/Modal";

export const DeleteStudentModal = ({ isOpen, onClose, studentToDelete, sessionsCount = 0, onStudentDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !studentToDelete) return null;

  // No se puede cerrar mientras se está eliminando
  const handleClose = () => {
    if (isDeleting) return;
    setErrorMsg("");
    onClose();
  };

  // Manejador para eliminar alumno
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setErrorMsg("");

      // DELETE /students/:id (el backend también elimina sus sesiones y archivos)
      await apiClient.delete(`/students/${studentToDelete._id}`);

      // Notificamos éxito a la página (que redirige a la lista) y cerramos
      onStudentDeleted(studentToDelete);
      handleClose();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, "Error al eliminar al alumno."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-md"
      title="¿Eliminar alumno?"
      subtitle="Esta acción eliminará definitivamente el expediente del alumno."
    >
      <div className="mt-4">
        {/* Icono de alerta */}
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-4">
          <FiAlertTriangle size={24} />
        </div>

        {/* Ficha resumida del alumno */}
        <div className="my-5 p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE7DF] flex items-center gap-3">
          <img
            src={getAvatarUrl(studentToDelete.avatar)}
            alt={studentToDelete.name}
            className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
          />
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-800 truncate">{studentToDelete.name}</p>
            <p className="text-xs text-slate-500 truncate">
              {studentToDelete.course || "Curso no asignado"}
              {studentToDelete.nameTutor ? ` · Tutor: ${studentToDelete.nameTutor}` : ""}
            </p>
            <p className="text-[11px] font-semibold text-[#E07A5F] mt-0.5 flex items-center gap-1.5">
              <FiCalendar /> {sessionsCount} {sessionsCount === 1 ? "sesión registrada" : "sesiones registradas"}
            </p>
          </div>
        </div>

        {/* Advertencia de pérdida de información */}
        <p className="mb-5 text-xs text-slate-500 leading-relaxed">
          Se perderá toda la información registrada en el sistema: datos del alumno, sesiones, informes y documentos adjuntos.
        </p>

        {/* Mensaje de error de la API */}
        {errorMsg && (
          <div role="alert" className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 leading-relaxed">
            <p className="font-semibold">{errorMsg}</p>
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
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <FiTrash2 size={14} />
            <span>{isDeleting ? "Eliminando..." : "Sí, eliminar"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

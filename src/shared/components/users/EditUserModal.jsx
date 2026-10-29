import { useState } from "react";
import { FiUser, FiBriefcase, FiShield, FiCheck } from "react-icons/fi";
import apiClient from "../../config/axios";
import { SPECIALIZATIONS } from "../../utils/constants";
import { getApiErrorMessage } from "../../utils/APIHelpers";
import { Modal } from "../ui/Modal";

// Este modal se monta con key={userToEdit._id} (ver Users.jsx): cada usuario editado empieza con el estado inicial limpio
export const EditUserModal = ({ isOpen, onClose, userToEdit, onUserUpdated }) => {

  //Estado para guardar los datos del usuario que se va a editar (se inicializa con los datos actuales del usuario)
  const [formData, setFormData] = useState({
    name: userToEdit?.name || "",
    specialization: userToEdit?.specialization || "",
    rol: userToEdit?.rol || "pedagogo",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !userToEdit) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setErrorMsg("");
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrorMsg("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Manejador para enviar los datos actualizados
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrorMsg("El nombre no puede estar vacío.");
      return;
    }
    if (!formData.specialization) {
      setErrorMsg("Debes seleccionar una especialidad.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      // Enviamos actualización vía PUT /users/:id
      const res = await apiClient.put(`/users/${userToEdit._id}`, {
        name: formData.name.trim(),
        specialization: formData.specialization,
        rol: formData.rol,
      });

      const updatedUser = res.data?.user || { ...userToEdit, ...formData };

      onUserUpdated(updatedUser);
      handleClose();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, "Error al actualizar los datos del usuario."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    
      // Usamos el modal Reutilizable 
      <Modal 
      isOpen={isOpen}
      onClose={handleClose}
      title={"Editar Usuario"}
      subtitle={userToEdit?.email}
      >
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMsg && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Nombre Completo */}
          <div>
            <label htmlFor="edit-user-name" className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Nombre Completo
            </label>
            <div className="relative">
              <input
                type="text"
                id="edit-user-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nombre y apellidos"
                className="w-full bg-[#FAF8F5] border border-[#EBE7DF] focus:border-[#529471] focus:bg-white rounded-2xl pl-10 pr-4 py-3 text-sm text-ink-muted outline-none transition-all"
              />
              <FiUser className="absolute left-3.5 top-3.5 text-ink-faint" />
            </div>
          </div>

          {/* Especialidad */}
          <div>
            <label htmlFor="edit-user-specialization" className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Especialidad
            </label>
            <div className="relative">
              <select
                id="edit-user-specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full bg-[#FAF8F5] border border-[#EBE7DF] focus:border-[#529471] focus:bg-white rounded-2xl pl-10 pr-4 py-3 text-sm text-ink-muted outline-none transition-all cursor-pointer"
              >
                <option value="">Selecciona una especialidad</option>
                {Object.values(SPECIALIZATIONS).map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
              <FiBriefcase className="absolute left-3.5 top-3.5 text-ink-faint" />
            </div>
          </div>

          {/* Rol del usuario */}
          <div role="group" aria-labelledby="edit-user-role-label">
            <p id="edit-user-role-label" className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Rol en la Plataforma
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Opción Pedagogo */}
              <button
                type="button"
                aria-pressed={formData.rol === "pedagogo"}
                onClick={() => setFormData((prev) => ({ ...prev, rol: "pedagogo" }))}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  formData.rol === "pedagogo"
                    ? "bg-[#EEF7F2] border-[#529471] text-[#2D6A4F] ring-1 ring-[#529471]"
                    : "bg-[#FAF8F5] border-[#EBE7DF] text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Pedagogo/a</span>
                  {formData.rol === "pedagogo" && <FiCheck className="text-sm" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Gestión de alumnos, informes y sesiones
                </p>
              </button>

              {/* Opción Admin */}
              <button
                type="button"
                aria-pressed={formData.rol === "admin"}
                onClick={() => setFormData((prev) => ({ ...prev, rol: "admin" }))}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  formData.rol === "admin"
                    ? "bg-[#F4F0FA] border-[#A582C9] text-[#69488E] ring-1 ring-[#A582C9]"
                    : "bg-[#FAF8F5] border-[#EBE7DF] text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold flex items-center gap-1">
                    <FiShield size={12} /> Administrador
                  </span>
                  {formData.rol === "admin" && <FiCheck className="text-sm" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Control total del equipo y configuración
                </p>
              </button>
            </div>
          </div>

          {/* Botones */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-2xl border border-[#EBE7DF] text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#529471] hover:bg-[#437a5d] text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Modal>
  );
};

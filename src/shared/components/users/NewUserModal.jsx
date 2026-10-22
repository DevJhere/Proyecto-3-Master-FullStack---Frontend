import { useState } from "react";
import { FiUser, FiMail, FiBriefcase, FiShield, FiCheck } from "react-icons/fi";
import apiClient from "../../config/axios";
import { SPECIALIZATIONS } from "../../utils/constants";
import { Modal } from "../ui/Modal";
import { PasswordField } from "../ui/PasswordField";

export const NewUserModal = ({ isOpen, onClose, onUserCreated }) => {

  //Estado para el formulario
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    rol: "pedagogo",
  });
  
  //Estados Locales
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  //Funcion para cerrar el modal
  const handleClose = () => {
    if (isSubmitting) return;
    setErrorMsg("");
    setFormData({
      name: "",
      email: "",
      password: "",
      specialization: "",
      rol: "pedagogo",
    });
    onClose();
  };
  
  //Manejador de cambios del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrorMsg("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Manejador de envio de datos del Formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.specialization) {
      setErrorMsg("Por favor, cumplimenta todos los campos obligatorios.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      // 1. Registro del usuario
      await apiClient.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        specialization: formData.specialization,
      });

      // 2. Si se eligió 'admin' y el email no contenía @admin.com, actualizamos su rol de inmediato
      if (formData.rol === "admin" && !formData.email.includes("@admin.com")) {
        try {
          const listRes = await apiClient.get("/users");
          const createdUser = listRes.data?.users?.find(
            (u) => u.email.toLowerCase() === formData.email.trim().toLowerCase()
          );
          if (createdUser) {
            await apiClient.put(`/users/${createdUser._id}`, {
              rol: "admin",
            });
          }
        } catch (err) {
          // Si falla la actualización del rol en cascada, el usuario igual fue creado
          console.log("Error al actualizar el rol:", err);
          setErrorMsg("Usuario registrado correctamente, pero hubo un error al asignarle el rol de administrador.");
        }
      }

      onUserCreated();
      handleClose();
    } catch (err) {
      const data = err.response?.data;
      setErrorMsg(data?.error || data?.message || "Error al registrar el usuario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
   
    // Agregamos el Componente Modal reutilizable
    <Modal 
    isOpen={isOpen}
    onClose={handleClose}
    title={"Nuevo Miembro del Equipo"}
    subtitle={"Crea una cuenta para un nuevo profesional o administrador"}
    >
      {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Nombre Completo *
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="ej: Dra. Sofía Ramírez"
                className="w-full bg-[#FAF8F5] border border-[#EBE7DF] focus:border-[#529471] focus:bg-white rounded-2xl pl-10 pr-4 py-2.5 text-sm text-shadow-ink-muted outline-none transition-all"
              />
              <FiUser className="absolute left-3.5 top-3.5 text-ink-muted" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Correo Electrónico *
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="profesional@raicesyalas.com"
                className="w-full bg-[#FAF8F5] border border-[#EBE7DF] focus:border-[#529471] focus:bg-white rounded-2xl pl-10 pr-4 py-2.5 text-sm text-shadow-ink-muted outline-none transition-all"
              />
              <FiMail className="absolute left-3.5 top-3.5 text-ink-muted" />
            </div>
          </div>

          {/* Especialidad */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Especialidad *
            </label>
            <div className="relative">
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full bg-[#FAF8F5] border border-[#EBE7DF] focus:border-[#529471] focus:bg-white rounded-2xl pl-10 pr-4 py-2.5 text-sm text-shadow-ink-muted outline-none transition-all cursor-pointer"
              >
                <option value="">Selecciona una especialidad</option>
                {Object.values(SPECIALIZATIONS).map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
              <FiBriefcase className="absolute left-3.5 top-3.5 text-ink-muted" />
            </div>
          </div>

          {/* Contraseña */}
          <PasswordField
            value={formData.password}
            onChange={handleChange}
            placeholder="Contraseña"
            required
          />

          {/* Selector de Rol */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Rol de Acceso *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, rol: "pedagogo" }))}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.rol === "pedagogo"
                    ? "bg-[#EEF7F2] border-[#529471] text-[#2D6A4F] ring-1 ring-[#529471]"
                    : "bg-[#FAF8F5] border-[#EBE7DF] text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold">Pedagogo/a</span>
                  {formData.rol === "pedagogo" && <FiCheck className="text-sm" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">Alumnos y sesiones</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, rol: "admin" }))}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.rol === "admin"
                    ? "bg-[#F4F0FA] border-[#A582C9] text-[#69488E] ring-1 ring-[#A582C9]"
                    : "bg-[#FAF8F5] border-[#EBE7DF] text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold flex items-center gap-1">
                    <FiShield size={12} /> Admin
                  </span>
                  {formData.rol === "admin" && <FiCheck className="text-sm" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">Control total</p>
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
              {isSubmitting ? "Creando..." : "Registrar miembro"}
            </button>
          </div>
        </form>
    </Modal>
  );
};

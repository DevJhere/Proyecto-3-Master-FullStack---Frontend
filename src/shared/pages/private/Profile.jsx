import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import apiClient from "../../config/axios";
import { SPECIALIZATIONS, SIZE_FILES } from "../../utils/constants";
import { getAvatarUrl } from "../../utils/HelperAvatar";
import { FiCheck, FiAlertCircle } from "react-icons/fi";


export const Profile = () => {

  // Obtenemos los datos de autenticación del Usuario
  const { user, updateUser} = useAuth();
  // Realizamos una referencia al input del archivo
  const fileInputRef = useRef(null);

  //Estados del formulario
  const [ formData, setFormData] = useState({
    name: "",
    email: "",
    specialization: "",
  });

  //Estados locales
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [ isSubmitting, setIsSubmitting] = useState(false);
  const [ successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  //Cargamos datos actuales del usuario al iniciar el componente
  useEffect( () =>{

    //Verificamos que el usuario existe
    if(user){
      setFormData({
        name: user.name || "",
        email: user.email || "",
        specialization: user.specialization || "",
      });
      
      //Si pasa la primera validación, cargamos la previsualización de la imagen
      if(user.avatar && !user.avatar.includes("profile-default")){
        setAvatarPreview(getAvatarUrl(user.avatar));
      }
    }
  }, [user])

  //Manejador de cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData( (prev) => ({...prev, [name]: value}));
    setSuccessMsg("");
    setErrorMsg("");
  }

  //Manejador al seleccionar nueva foto de perfil
  const handleFileChange = async (e) =>{
    const file = e.target.files[0];
    if(!file) return;

    if(file.size > SIZE_FILES.MAX_SIZE_5MB){
      setErrorMsg("La imagen no puede superar los 5MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setSuccessMsg("");
    setErrorMsg("");
  }

  // Manejador para enviar los datos del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("El nombre no puede estar vacío.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSuccessMsg("");
      setErrorMsg("");
      
      //Instancia del Formulario para enviar los datos
      const dataToSend = new FormData();
      dataToSend.append("name", formData.name.trim());
      //Realizamos validación
      if(formData.specialization) {
        dataToSend.append("specialization", formData.specialization);
      }

      //Si se seleccionó una nueva foto de perfil, la añadimos al FormData
      if(avatarFile){
        dataToSend.append("avatar", avatarFile);
      }

      //Llamamos al endpoint para actualizar la imagen del usuario
      const userId = user._id || user.id;
      const res = await apiClient.put(`/users/${userId}`, dataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });

      // Actualizamos el usuario en el estado local y en localStorage
      const updatedUser = res.data.user || res.data;

      //Actualizamos el contexto global
      if (updatedUser) {
        updateUser({...user,...updatedUser });
      }

      setSuccessMsg("Perfil actualizado correctamente.");
      setAvatarFile(null);
      
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      setErrorMsg(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error al actualizar el perfil."
      )
    }finally{
      setIsSubmitting(false);
    }
  }

  // Iniciales del usuario para el avatar por defecto
  const userInitials = user?.name 
  ? user.name
  .split(" ")
  .map((n) => n[0])
  .slice(0, 2)
  .join('')
  : "PT";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* CABECERA */}
        <div>
          <p className="text-[11px] font-bold tracking-wider text-[#529471] uppercase mb-1">
            TU CUENTA
          </p>
          <h1 className="text-3xl font-serif font-bold text-slate-800">
            Configuración de perfil
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Mantén actualizados tus datos profesionales y la imagen que verás en Vinculum.
          </p>
        </div>
        {/* MENSAJES DE FEEDBACK */}
        {successMsg && (
          <div className="p-4 bg-[#EBF7EE] text-[#2D6A4F] rounded-2xl border border-[#D5EEDD] flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <FiCheck size={16} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-200 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <FiAlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TARJETA 1: FOTO DE PERFIL */}
          <div className="bg-white rounded-3xl border border-[#EBE7DF] p-6 sm:p-8 shadow-sm">
            <div className="pb-4 border-b border-[#EBE7DF]">
              <h2 className="text-base font-bold text-slate-800">Foto de perfil</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Una imagen clara ayuda a personalizar tu espacio de trabajo.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-6">
              {/* Círculo Avatar */}
              <div className="w-20 h-20 rounded-full bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center font-bold text-xl overflow-hidden shrink-0 border border-[#EBE7DF]">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
              {/* Botón e Información */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#529471] hover:bg-[#437a5d] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Subir foto
                </button>
                <p className="text-[11px] text-ink-muted mt-2">
                  JPG, PNG o WebP. Máximo 5 MB.
                </p>
              </div>
            </div>
          </div>
          {/* TARJETA 2: INFORMACIÓN PROFESIONAL */}
          <div className="bg-white rounded-3xl border border-[#EBE7DF] p-6 sm:p-8 shadow-sm">
            <div className="pb-4 border-b border-[#EBE7DF]">
              <h2 className="text-base font-bold text-slate-800">
                Información profesional
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Estos datos identifican tu cuenta dentro de la plataforma.
              </p>
            </div>
            <div className="pt-6 space-y-5">
              {/* Nombre Completo */}
              <div>
                <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2">
                  NOMBRE COMPLETO
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tu nombre completo"
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#EBE7DF] rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#529471] focus:bg-white transition-all"
                />
              </div>
              {/* Fila: Especialidad y Correo electrónico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Especialidad */}
                <div>
                  <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2">
                    ESPECIALIDAD
                  </label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#EBE7DF] rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#529471] focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">Selecciona una especialidad</option>
                    {Object.values(SPECIALIZATIONS).map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Correo Electrónico (Solo lectura) */}
                <div>
                  <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2">
                    CORREO ELECTRÓNICO
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    title="El correo no se puede modificar"
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#EBE7DF] rounded-2xl text-xs sm:text-sm text-slate-500 cursor-not-allowed opacity-80"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* BOTÓN GUARDAR CAMBIOS */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-[#529471] hover:bg-[#437a5d] text-white rounded-2xl text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


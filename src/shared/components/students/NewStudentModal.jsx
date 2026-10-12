import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { COURSES, DIAGNOSIS, TUTOR_RELATIONSHIP } from "../../utils/constants";
import apiClient from "../../config/axios";
import { MdAddPhotoAlternate } from "react-icons/md";
import { IoMdArrowBack } from "react-icons/io";

export const NewStudentModal = ({isOpen, onClose, onStudentCreated}) => {
 
  /* Control de paso 1 y 2 */
  const [ step, setStep ] = useState(1); //Por defecto en 1
  const [ isSubmitting, setIsSubmitting ] = useState(false);
  const [error, setError] = useState("");
  
  /* Estados del formulario*/
  const [ formData, setFormData ] = useState({
    name:"",
    age: "",
    course: "",
    diagnosis: "",
    avatar: null, // Para la subida de imagen
    nameTutor: "",
    tutorRelationship: "Madre",
    phoneNumberTutor: "",
    emailTutor: "",
  })

  // Estado de preview de imagen Avatar
  const [avatarPreview, setAvatarPreview] = useState(null);

  if(!isOpen) return null; //Si el modal no esta abierto, no renderizamos nada
 
  //Funcion para controlar los inputs del formulario
  const handleChange = (e) => {
    // Nos traemos el nombre y el valor del input
    const { name, value } = e.target;

    //Actualizamos el estado del formulario
    setFormData((prev) => ({...prev, [name]: value}))    
  };

  // Función para pasar al paso 2
  const handleNext = (e) => {
    // Evitamos que el furmulario se enví de forma natica
    e.preventDefault();
    //Validmos los datos del paso 1
    if(!formData.name.trim() || !formData.course || !formData.age || !formData.diagnosis){
        setError("Por favor, debe rellenar los campos obligatorios.")
        return;
    }

    setError("");
    setStep(2); //Finalizamos en el paso 2
  };


  //Función para manejar el envió de datos del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    //Validamos los datos del paso 2
    if(!formData.nameTutor.trim() || !formData.emailTutor.trim() || !formData.phoneNumberTutor.trim() || !formData.tutorRelationship){
        setError("Por favor, debe rellenar los campos obligatorios.")
        return;
    }

    try {

        setIsSubmitting(true);
        setError("");

        //Usamos FormData para permitir subida foto de perfil
        const dataToSend = new FormData();

        //Recorremos todas las claves del objeto formData
        Object.keys(formData).forEach((key) => {
            //Si el valor no es nulo ni vacio, lo agregamos a FormData
            if (formData[key] !== null && formData[key] !== "") {
                dataToSend.append(key, formData[key]);
            }
        });

        // Si subimos imagen usaremos FormData, si no, enviamos JSON
        // POST a /students
        await apiClient.post("/students", dataToSend, {
            //Subida de archivos
            headers: {
                "Content-Type": "multipart/form-data",
            },  
        });

        //Avisamos a Students.jsx para refrescar la lista de Alumnos
        onStudentCreated();

        //Reseteamos el formulario del Modal
        setStep(1);
        setFormData( {
            name:"",
            age: "",
            course: "",
            diagnosis: "",
            avatar: null, // Para la subida de imagen
            nameTutor: "",
            tutorRelationship: "Madre",
            phoneNumberTutor: "",
            emailTutor: "",
        });
        setAvatarPreview(null); //Limpiamos el preview
        onClose(); //Cerramos el modal    

    } catch (err) {
        console.log("Respuesta completa del backend:", err.response?.data);
        const errorDetails = err.response?.data?.error || err.response?.data?.message || "Error al crear el alumno.";
        setError(errorDetails);
        
    }finally {
        setIsSubmitting(false);
    }
  };

 //Función para capturar el archivo
 const handleAvatarChange = (e) => {
    
    //Validamos el tipo de imagen
    const file = e.target.files[0];
    if (file) {
        setFormData( (prev) => ( {...prev, avatar: file}));
        setAvatarPreview(URL.createObjectURL(file));
    }
 };

 // Función para seleccionar los tags de diagnóstico
 const handleTagClick = (type, value) => {
    setFormData( (prev) => ({ ...prev, [type]: value}));
 };

  return (
    <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" >
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Cabecera del modal con barra de progreso */}
            <div className="p-6 pb-4 border-b border-[#EBE7DF] flex items-center justify-between">
                <div>
                    <span className="text-xs font-semibold text-[#529471] uppercase tracking-wider">
                        Paso {step} de 2
                    </span>
                    <h2 className="text-xl font-bold text-slate-800">{step === 1 ? "Datos del Alumno" : "Datos del tutor legal"}</h2>
                </div>

                {/* Boton cerrar */}
                <button onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors" >
                  <IoClose size={18} />                  
                </button>
            </div>

            {/* Formulario */}
            <div className="p-6 overflow-y-auto flex-1">
                {/* Mostrar error */}
                {error && (
                  <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-3 text-center text-red-700 text-xs mb-4">
                    {error}
                  </div>
                )}

                {/* Formulario Paso 1 */}
                {step === 1 ? (
                    // Campors del paso 1
                    <div className="space-y-4">
                        {/* Subida de foto perfil con Preview */}
                        <div className="flex items-center gap-4 pb-2">
                            <div className="relative w-16 h-16 rounded-full bg-[#FAF8F5] border-2 border-dashed border-[#EBE7DF] flex items-center justify-center overflow-hidden shrink-0">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-slate-500 font-medium">
                                        <MdAddPhotoAlternate size={20} />
                                    </span>
                                )}
                            </div>

                           <div>
                                <p className="text-xs font-600 text-ink mb-1">Foto del alumno</p>
                                <label className="mt-1.5 text-xs text-sage font-600 hover:underline cursor-pointer">
                                    Seleccionar imagen
                                    <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                    />
                                </label>
                                <p className="text-[11px] text-slate-400 mt-1">PNG o JPG (máx. 5MB)</p>
                            </div>
                        </div>

                        {/* Nombre Completo */}
                        <div>
                            <label className="block text-xs font-700 uppercase tracking-wide text-ink-muted mb-1.5">Nombre Completo *</label>
                            <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ej: Lucía Navarro Martinéz"
                            className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage transition-colors" />
                        </div>

                        {/* Edad y Curos en dos Columnas */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-700 uppercase tracking-wide text-ink-muted mb-1.5">Edad *</label>
                                <input 
                                type="number"
                                name="age"
                                placeholder="Ej: 9"
                                min={3}
                                max={18}
                                value={formData.age}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage transition-colors"

                                />
                            </div>

                            <div>
                                <label className="block text-xs font-700 uppercase tracking-wide text-ink-muted mb-1.5">Curso *</label>
                                <select
                                name="course"
                                value={formData.course}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage transition-colors"
                                >
                                <option value="">Seleccionar</option>
                                {/*  Mapeamos los cursos que provienen de la base de datos */}
                                {Object.entries(COURSES).map( ([key, value]) => (
                                        <option
                                        key={key}
                                        value={value}
                                        >
                                        {value}   
                                        </option>
                                ))}
                                </select>
                            </div>
                        </div>

                        {/* Diagnostico */}
                        <div>
                            <label className="block text-xs font-700 uppercase tracking-wide text-ink-muted mb-1.5">Área de intervención principal</label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="flex flex-wrap gap-2 col-span-2">
                                    {Object.entries(DIAGNOSIS).map( ([key, value]) => (
                                        <button
                                        key={key}
                                        type="button"
                                        onClick={ () => handleTagClick('diagnosis', value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-600 border transition-all
                                        ${formData.diagnosis === value
                                            ? "bg-sage text-white border-sage"
                                            : "bg-white text-ink-muted border-border hover:border-sage"
                                        }`}
                                        >
                                        {value}
                                        </button>

                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                ): (
                    // Campos del paso 2
                    <div className="space-y-4">
                        {/* Nombre del tutor legal */}
                        <div>
                            <label className="block text-xs font-700 uppercase tracking-wide text-ink-muted mb-1.5">Nombre del tutor/a legal *</label>
                            <input
                            type="text"
                            name="nameTutor"
                            value={formData.nameTutor}
                            onChange={handleChange}
                            placeholder="Ej: Carmen Gómez Santos"
                            className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage transition-colors"
                            />
                        </div>

                        <div>
                            {/* Relación o parentesco */}
                            <label className="block text-xs font-700 uppercase tracking-wide text-ink-muted mb-1.5" >Parentesco *</label>
                            <select
                            name="tutorRelationship"
                            value={formData.tutorRelationship}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage transition-colors"
                            >
                                {Object.entries(TUTOR_RELATIONSHIP).map(([key, value]) =>(
                                    <option key={key} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Telefono y Email en 2 Col */}
                            <div>
                                <label className="block text-xs font-700 uppercase tracking-wide text-ink-muted mb-1.5">Teléfono *</label>
                                <input 
                                type="tel"
                                name="phoneNumberTutor"
                                value={formData.phoneNumberTutor}
                                onChange={handleChange}
                                placeholder="6XX XXX XXX"
                                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage transition-colors"
                                />
                            </div>
                            {/* Email Tutor */}
                            <div>
                                <label className="block text-xs font-700 uppercase tracking-wide text-ink-muted mb-1.5">Correo de Contacto *</label>
                                <input
                                type="email"
                                name="emailTutor"
                                value={formData.emailTutor}
                                onChange={handleChange}
                                placeholder="tutor@email.com"
                                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage transition-colors"
                                />
                                
                            </div>
                        </div>
                        
                    </div>

                    
                )}
            </div>

            {/* Botones de Accion */}
            <div className="p-6 pt-4 border-t border-[#EBE7DF] flex items-center justify-between bg-slate-50">
                {step === 2 ? (
                    <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700">
                    <IoMdArrowBack className="inline" size={18} />Atrás
                    </button>
                ) : (
                    <button 
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700">
                      Cancelar
                    </button>
                )}

                {step === 1 ? (
                    <button
                    type="button"
                    onClick={handleNext}
                    className="bg-[#529471] hover:bg-[#437a5d] text-white px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all shadow-sm"
                    >Siguiente →</button>
                )
                 : (
                    <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-[#529471] hover:bg-[#437a5d] text-white px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all shadow-sm disabled:opacity-50">
                      {isSubmitting ? "Guardando..." : "Crear alumno"}
                    </button>
                 )}
            </div>

        </div>
        
    </div>
  )
}

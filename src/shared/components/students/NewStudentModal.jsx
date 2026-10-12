import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { COURSES, DIAGNOSIS, TUTOR_RELATIONSHIP } from "../../utils/constants";
import apiClient from "../../config/axios";
import { set } from "react-hook-form";

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
    tutorRelationship: "MADRE",
    phoneTutor: "",
    emailTutor: "",
  })

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
    if(!formData.name.trim() || !formData.course){
        setError("Por favor, debe rellenar el nombre y curso.")
        return;
    }

    setError("");
    setStep(2); //Finalizamos en el paso 2
  };


  //Función para manejar el envió de datos del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    //Validamos los datos del paso 2
    if(!formData.nameTutor.trim()){
        setError("Por favor, debe indicar el tutor.")
        return;
    }

    try {

        setIsSubmitting(true);
        setError("");

        // Si subimos imagen usaremos FormData, si no, enviamos JSON
        // POST a /students
        await apiClient.post("/students", formData);

        //Avisamos a Students.jsx para refrescar la lista de Alumnos
        onStudentCreated();
        onClose(); //Cerramos el modal    

    } catch (err) {
        setError(err.response?.data?.message || "Error al crear el alumno. Por favor, inténtelo de nuevo")
    }finally {
        setIsSubmitting(false);
    }
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


                    </div>
                ): (
                    <div className="space-y-4">
                        {/* Campos del paso 2 */}

                    </div>
                )}
            </div>

            {/* Botones de Accion */}
            <div className="p-6 pt-4 border-t border-[#EBE7DF] flex items-center justify-between bg-slate-50">
                {step === 2 ? (
                    <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">
                      ← Atrás
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

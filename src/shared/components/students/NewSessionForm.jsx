import { useState } from "react";
import apiClient from "../../config/axios";
import { FiClock, FiFileText } from "react-icons/fi";

export const NewSessionForm = ({studentId, onClose, onSessionCreated}) => {

  //Estado envío de datos
  const [ isSubmmitting, setIsSubmitting] = useState(false);
  const [ error, setError ] = useState("");

  // Inicializamos la fecha actual en formato YYYY-MM-DDTHH:mm para datetime-local
  const getDefaultDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Al haber instanciado now como Date(), pasamos la diferencia horaria a la hora local. Evitamos error fehcas incorrectas
    return now.toISOString().slice(0, 16); // Recortamos la fecha para quedarnos solo con la fecha y hora, sin segundos ni milisegundos.
  }

  // Obtenemos datos del formulario
  const [ formData, setFormData ] = useState({
    date: getDefaultDateTime(),
    duration: 60,
    status: "Pendiente",
    notes: "",
    attachmentDocument: null,
  });

  //Manejador de cambios en el Formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData( (prev) => ( {...prev, [name]:  value})); 
  };

  //Manejador de cambios del archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0]; // Accedemos al primer archivo seleccionado

    //Verificamos que se haya seleccionado un archivo
    if(file) {
        setFormData( (prev) => ({...prev, attachmentDocument: file}));
    }
  };

  //Manejador del envió de datos
  const handleSubmit = async (e) => {
    e.preventDefault();

    //Verificamos que se haya registrado la fecha
    if(!formData.date){
        setError("Por favor, ingresa la fecha y hora de la sesión.");
        return;
    }
    
    try {
        setIsSubmitting(true);
        setError("");

        //Si hay un archivo usamos ForDamta sino enviamos JSON
        if( formData.attachmentDocument){
            const dataToSend = new FormData();
            dataToSend.append("student", studentId);
            dataToSend.append("date", formData.date);
            dataToSend.append("duration", formData.duration);
            dataToSend.append("status", formData.status);
            dataToSend.append("notes", formData.notes);
            dataToSend.append("attachmentDocument", formData.attachmentDocument);

            await apiClient.post("/sessions", dataToSend, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
        } else {
            await apiClient.post("/sessions", {
                student: studentId,
                date: formData.date,
                duration: Number(formData.duration), // Aseguramos que sea un número
                status: formData.status,
                notes: formData.notes, 
            });
        }

        //Notificamos para recargar sesiones y cerramos el formulario
        onSessionCreated();
        onClose();
        
    } catch (err) {
        setError(err.response?.data?.message || "Error al crear la sesión.")
    } finally {
        setIsSubmitting(false);
    }
  };
  
  return (
    <form
    onSubmit={handleSubmit}
    className="bg-[#F4F9F6] border border-[#A3C9B8] rounded-2xl p-6 shadow-sm space-y-4 mb-6 transition-all"
    >
        <h3 className="text-base font-bold text-[#2D6A4F]"> Nueva Sesión de Intervención</h3>

        {/* Vision de errores */}
        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs">
                {error}
            </div>
        )}

        {/* Fila 1: Fecha, Hora y Duración */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1"> Fecha y hora *</label>
                <input 
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-[#EBE7DF] rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:border-[#529471]"
                />
            </div>

            <div>
                <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1"> Duración (minutos)</label>
                <div className="relative">
                    <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    readOnly
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#EBE7DF] rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:border-[#529471]"
                    />
                    <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                </div>
            </div>
        </div>

        {/* Fila 2: Selector de estado */}
        <div>
            <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5"> Estado de la sesión * </label>
            <div className="flex gap-2">
                {["Completado", "Pendiente", "Cancelado"].map( (state) =>(
                    <button
                    key={state}
                    type="button"
                    onClick={ () => setFormData( (prev) => ( {...prev, status: state}))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        formData.status === state
                        ? state === "Completado"
                            ? "bg-[#529471] text-white border-[#529471]"
                            : state === "Cancelado"
                            ? "bg-[#DC2626] text-white border-[#DC2626]"
                            : "bg-[#62c7da] text-white border-[#62c7da]"
                        : "bg-white text-ink-muted border-[#EBE7DF] hover:border-slate-300"
                        }`}
                    >
                       ● {state}
                    </button>
                ))}

            </div>
        </div>

        {/* Fila 3: Observaciones/ Notas */}
        <div>
            <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">Notas de Intervención</label>
            <textarea 
            name="notes" 
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Avances, dificultades, actividades realizadas, próximos pasos..."
            className="w-full px-3 py-2.5 bg-white border border-[#EBE7DF] rounded-xl text-xs sm:text-sm text-ink-base placeholder:text-ink-faint focus:outline-none focus:border-[#529471]" />
        </div>

        {/* Fila 4: Archivo adjunto opcional */}
        <div>
            <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">Documento Adjunto (Opcional) </label>

            <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#EBE7DF] hover:border-[#529471] rounded-xl text-xs text-slate-600 cursor-pointer transition-colors">
                <FiFileText size={14} className="text-[#529471]" />
                <span>
                    {formData.attachmentDocument ? formData.attachmentDocument.name : "Seleccionar PDF o documento"}
                </span>
                <input
                type="file"
                onChange={handleFileChange}
                accept=".pdfm,.doc,.docx,image/*"
                className="hidden"
                />
            </label>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-3 pt-2"> 
            <button
            type="submit"
            disabled={isSubmmitting}
            className="px-5 py-2.5 bg-[#529471] hover:bg-[#437a5d] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
                {isSubmmitting ? "Guardando..." : "Guardar Registro"}
            </button>

            <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-500 border border-[#EBE7DF] rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
                Cancelar
            </button>
        </div>


    </form>
  )
}

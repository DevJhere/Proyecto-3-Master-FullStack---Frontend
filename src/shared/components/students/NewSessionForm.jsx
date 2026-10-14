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
            dataToSend.append("studentId", studentId);
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
    <div></div>
  )
}

import { useState, useMemo } from "react";
import apiClient from "../../config/axios";
import { FiCheck } from "react-icons/fi";
import { getAvatarUrl } from "../../utils/HelperAvatar";
import { COURSES, } from "../../utils/constants";
import { Modal } from "../ui/Modal";
import { formatCapitalizedDate, formatTime, toLocalDateString } from "../../utils/DateHelpers"
import { getApiErrorMessage } from "../../utils/APIHelpers";


export const ScheduleSessionModal = ({ isOpen, onClose, selectedDate, sessions = [], students = [], onSessionCreated }) => { // Creamos Objeto Date con dia y hora seleccionado, Array de sesiones para calcular las franjas ocupadas y array de alumnos asignados

    // Definimos estados locales
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [notes, setNotes] = useState("");
    const [duration, setDuration] = useState(60); //Duración fija de 60 min
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    /* Refactorizamos empleando la funcion helper formatCapitalizedDate, formatTime y toLocaleDateString  */
    //Mostramos fecha seleccionada
    const formattedDayTitle = formatCapitalizedDate(selectedDate);

    //Formateamos hora seleccionada
    const formattedTime = formatTime(selectedDate);

    //Franjas horarias ya seleccionadas
    const selectedSlots = useMemo(() => {
        //Verificamos que tenemos fecha y hora seleccionada
        if (!selectedDate) return [];

        //Comparamos fecha seleccionada con sesiones programadas y obtenemos su franja horaria
        const targetDayStr = toLocalDateString(selectedDate);

        return sessions.filter((s) => {

            return toLocalDateString(s.date) === targetDayStr && s.status !== "Cancelado";
        }).map((s) => { // Cuando se haya filtrado la fecha y estado  se mapea para que nos devuelva la hora en formato string HH:MM  y Ordenada por fecha
            //Definimos dias hora y minutos - Ahora con el formateo de hora en formato 24h con digitos ya no hace falta ordenar los horarios Horas y minutos
            return formatTime(s.date)
        }).sort();
    }, [selectedDate, sessions]); //Se ejecuta cada vez que cambia la fecha o las sesiones

    //Manejador para crear la sesión.
    const handleSchedule = async (e) => {
        e.preventDefault();
        if (!selectedStudentId) {
            setError("Por favor, debe seleccionar un alumno")
            return
        }

        try {
            setIsSubmitting(true);
            setError("");

            //Realizamos la peticón al endpoint
            await apiClient.post("/sessions", {
                student: selectedStudentId,
                date: selectedDate.toISOString(),
                duration: Number(duration),
                status: "Pendiente",
                notes: notes.trim() || "Sesión de apoyo registrado"
            });

            //Avisamos al componente padre que se ha creado una nueva sesión
            if (onSessionCreated) await onSessionCreated();

            //Reseteamos y cerramos el modal
            onClose();
            setSelectedStudentId("");
            setNotes("");



        } catch (err) {
            setError(getApiErrorMessage(err, "Error al agendar la sesión"));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Función handleClose para resetear y cerrar el model de forma limpia
    const handleClose = () => {
        onClose();
        setSelectedStudentId("");
        setNotes("");
        setError("");
        setIsSubmitting(false);
    };

    return (


        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Nueva Sesión"
            subtitle={`${formattedDayTitle} · ${formattedTime}`}
            maxWidth="max-w-md"
        >
            {/* Cuerpo del formulario */}
            <form onSubmit={handleSchedule} className="mt-4 space-y-4">
                {/* Controlamos los errores */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs font-medium">
                        {error}
                    </div>
                )}

                {/* Selector de Alumno */}
                <div>
                    <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                        Alumno/a *
                    </label>
                    <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                        {students.length === 0 ? (
                            <p className="text-xs text-ink-muted p-3 bg-slate-50 rounded-xl text-center">No hay alumnos asignados</p>
                        ) : (
                            students.map((student) => {
                                const isSelected = selectedStudentId === student._id;
                                return (
                                    <div
                                        key={student._id}
                                        onClick={() => setSelectedStudentId(student._id)}
                                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                                            ? "border-[#529471] bg-[#F2F8F4] shadow-xs"
                                            : "border-[#EBE7DF] hover:border-slate-300 bg-white"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <img src={getAvatarUrl(student.avatar)} alt={student.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#EBE7DF]" />

                                            <div>
                                                <p className="text-xs font-bold text-ink leading-tight">{student.name}</p>
                                                <p className="text-xs text-ink-muted">{COURSES[student.course] || student.course}</p>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-[#529471] text-white flex items-center justify-center shrink-0">
                                                <FiCheck size={12} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Franjas horarias ocupadas */}
                <div className="bg-[#FFF5F2] border border-[#FDE2D9] rounded-2xl p-3.5 space-y-1.5">
                    <p className="text-[11px] font-semibold text-[#D9534F]">
                        Franjas ya ocupadas este día:
                    </p>
                    {/* Renderizamos las franjas ocupadas */}
                    {selectedSlots.length === 0 ? (
                        <p className="text-xs text-[#6ce098]">Todo el día está disponible</p>
                    ) : (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {selectedSlots.map((slot, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-0.5 bg-[#FDE2D9] text-[#C2410C] rounded-lg text-[11px] font-semibold"
                                >
                                    {slot}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tipo de Sesión */}
                <div>
                    <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Tipo de Sesión</label>
                    <input
                        type="text"
                        placeholder="p.ej. Lectura comprensiva, Cálculo mental..."
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE7DF] rounded-2xl text-xs sm:text-sm text-ink focus:outline-none focus:border-[#529471] focus:bg-white transition-all" />
                </div>

                {/* Duración */}
                <div>
                    <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                        DURACIÓN
                    </label>
                    <div className="flex items-center">
                        <span className="px-4 py-2.5 bg-[#F2F8F4] text-[#2D6A4F] border border-[#529471]/30 rounded-xl text-xs font-semibold inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#529471]" />
                            <span>60 minutos</span>
                        </span>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-[#529471] hover:bg-[#437a5d] text-white text-xs font-semibold rounded-2xl shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                        {isSubmitting ? "Guardando..." : "Agendar Sesión"}
                    </button>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-3 bg-[#F5F2EB] hover:bg-[#EBE7DF] text-slate-700 text-xs font-semibold rounded-2xl transition-all cursor-pointer"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </Modal>


    )
}



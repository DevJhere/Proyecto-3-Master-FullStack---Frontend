import { useEffect, useState } from "react";
import { COURSES, DIAGNOSIS, SIZE_FILES, TUTOR_RELATIONSHIP, USER_ROLES } from "../../utils/constants";
import apiClient from "../../config/axios";
import { MdAddPhotoAlternate } from "react-icons/md";
import { IoMdArrowBack } from "react-icons/io";
import { Modal } from "../ui/Modal";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/APIHelpers";

//Límites que valida también el backend
const MIN_AGE = 3;
const MAX_AGE = 18;
const PHONE_REGEX = /^\d{9}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

//Estilo común de los campos
const INPUT_CLASS = "w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage transition-colors";
const LABEL_CLASS = "block text-xs font-bold uppercase tracking-wide text-ink-muted mb-1.5";

const INITIAL_FORM = {
    name: "",
    age: "",
    course: "",
    diagnosis: "",
    avatar: null, // Para la subida de imagen
    nameTutor: "",
    tutorRelationship: "Madre",
    phoneNumberTutor: "",
    emailTutor: "",
    pedagogoAsignado: "", // Solo lo elige un administrador
};

export const NewStudentModal = ({ isOpen, onClose, onStudentCreated }) => {

    //Un administrador debe elegir a qué pedagogo se asigna el alumno; un pedagogo se asigna el alumno a sí mismo
    const { user } = useAuth();
    const isAdmin = user?.rol === USER_ROLES.ADMIN;

    /* Control de paso 1 y 2 */
    const [step, setStep] = useState(1); //Por defecto en 1
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    /* Estados del formulario*/
    const [formData, setFormData] = useState(INITIAL_FORM);

    // Estado de preview de imagen Avatar
    const [avatarPreview, setAvatarPreview] = useState(null);

    //Lista de pedagogos disponibles para asignar (solo se carga para administradores)
    const [pedagogos, setPedagogos] = useState([]);

    useEffect(() => {
        if (!isOpen || !isAdmin) return;

        let cancelled = false;

        apiClient.get("/users")
            .then((response) => {
                if (cancelled) return;
                const users = response.data?.users || [];
                setPedagogos(users.filter((u) => u.rol === USER_ROLES.PEDAGOGO));
            })
            .catch((err) => {
                if (cancelled) return;
                setError(getApiErrorMessage(err, "No se pudo cargar la lista de pedagogos."));
            });

        return () => { cancelled = true; };
    }, [isOpen, isAdmin]);

    //Funcion para controlar los inputs del formulario
    const handleChange = (e) => {
        // Nos traemos el nombre y el valor del input
        const { name, value } = e.target;

        //Actualizamos el estado del formulario
        setFormData((prev) => ({ ...prev, [name]: value }))
    };

    // Función para pasar al paso 2
    const handleNext = (e) => {
        // Evitamos que el furmulario se enví de forma natica
        e?.preventDefault();
        //Validmos los datos del paso 1
        if (!formData.name.trim() || !formData.course || !formData.age || !formData.diagnosis) {
            setError("Por favor, debe rellenar los campos obligatorios.")
            return;
        }

        const age = Number(formData.age);
        if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
            setError(`La edad debe estar entre ${MIN_AGE} y ${MAX_AGE} años.`);
            return;
        }

        if (isAdmin && !formData.pedagogoAsignado) {
            setError("Debes asignar un pedagogo al alumno.");
            return;
        }

        setError("");
        setStep(2); //Finalizamos en el paso 2
    };


    //Función para manejar el envió de datos del formulario
    const handleSubmit = async (e) => {
        e?.preventDefault();

        //Validamos los datos del paso 2
        if (!formData.nameTutor.trim() || !formData.emailTutor.trim() || !formData.phoneNumberTutor.trim() || !formData.tutorRelationship) {
            setError("Por favor, debe rellenar los campos obligatorios.")
            return;
        }

        //El backend exige 9 dígitos: aceptamos que el usuario escriba espacios o guiones (6XX XXX XXX)
        const phone = formData.phoneNumberTutor.replace(/[\s-]/g, "");
        if (!PHONE_REGEX.test(phone)) {
            setError("El teléfono debe tener 9 dígitos.");
            return;
        }

        if (!EMAIL_REGEX.test(formData.emailTutor.trim())) {
            setError("El correo electrónico del tutor no es válido.");
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

            //Enviamos el teléfono ya normalizado
            dataToSend.set("phoneNumberTutor", phone);

            // POST a /students
            await apiClient.post("/students", dataToSend, {
                //Subida de archivos
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            //Avisamos a Students.jsx para refrescar la lista de Alumnos
            onStudentCreated()
            handleClose(); //Cerramos el modal

        } catch (err) {
            setError(getApiErrorMessage(err, "Error al crear el alumno"));

        } finally {
            setIsSubmitting(false);
        }
    };

    //Función para capturar el archivo
    const handleAvatarChange = (e) => {

        //Validamos el tipo y el tamaño de la imagen (el backend rechaza más de 5MB)
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("El archivo debe ser una imagen (PNG o JPG).");
            return;
        }

        if (file.size > SIZE_FILES.MAX_SIZE_5MB) {
            setError("La imagen no puede superar los 5MB.");
            return;
        }

        setError("");
        setFormData((prev) => ({ ...prev, avatar: file }));
        setAvatarPreview(URL.createObjectURL(file));
    };

    // Función para seleccionar los tags de diagnóstico
    const handleTagClick = (type, value) => {
        setFormData((prev) => ({ ...prev, [type]: value }));
    };

    // Función handleClose para resetear y cerrar el model de forma limpia
    const handleClose = () => {
        onClose(); //Cerrar el modal llamando a la función padre
        //Limpieza de estado interno del modal
        setStep(1);
        setFormData(INITIAL_FORM);
        setAvatarPreview(null); //Limpiamos la preview de la foto
        setError(""); //Limpiamos cualquier error
        setIsSubmitting(false); //Reseteamos el estado de envío
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={step === 1 ? "Datos del Alumno" : "Datos del tutor legal"}
            subtitle={`Paso ${step} de 2`}
            // CAMBIO (scroll en Nuevo Alumno): el contenedor del Modal tiene max-h-[90vh] con overflow-y-auto, así que el paso 1
            // generaba scroll al ser demasiado alto. Se amplía a max-w-xl, se junta foto + nombre en una fila y se
            // reducen los espaciados verticales para que el formulario quepa sin desplazar.
            maxWidth="max-w-xl"
        >
            {/* Formulario. Enter valida el paso en el que se encuentra el usuario */}
            <form onSubmit={step === 1 ? handleNext : handleSubmit} noValidate className="mt-3 space-y-3">
                {/* Mostrar error */}
                {error && (
                    <div role="alert" className="w-full bg-red-50 border border-red-200 rounded-2xl p-3 text-center text-red-700 text-xs">
                        {error}
                    </div>
                )}

                {/* Formulario Paso 1 */}
                {step === 1 ? (
                    // Campors del paso 1
                    <div className="space-y-3">
                        {/* Subida de foto perfil con Preview */}
                        {/* CAMBIO (scroll en Nuevo Alumno): la foto y el nombre completo comparten fila (antes ocupaban dos bloques apilados) */}
                        <div className="flex items-end gap-4">
                            <div className="relative w-14 h-14 rounded-full bg-[#FAF8F5] border-2 border-dashed border-[#EBE7DF] flex items-center justify-center overflow-hidden shrink-0">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-slate-500 font-medium">
                                        <MdAddPhotoAlternate size={20} />
                                    </span>
                                )}
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-ink mb-1">Foto del alumno</p>
                                <label className="mt-1.5 text-xs text-sage font-semibold hover:underline cursor-pointer">
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

                            {/* Nombre Completo */}
                            <div className="flex-1 min-w-0">
                                <label htmlFor="student-name" className={LABEL_CLASS}>Nombre Completo *</label>
                                <input
                                    type="text"
                                    id="student-name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ej: Lucía Navarro Martinéz"
                                    className={INPUT_CLASS} />
                            </div>
                        </div>

                        {/* Edad y Curos en dos Columnas */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="student-age" className={LABEL_CLASS}>Edad *</label>
                                <input
                                    type="number"
                                    id="student-age"
                                    name="age"
                                    placeholder="Ej: 9"
                                    min={MIN_AGE}
                                    max={MAX_AGE}
                                    value={formData.age}
                                    onChange={handleChange}
                                    className={INPUT_CLASS}

                                />
                            </div>

                            <div>
                                <label htmlFor="student-course" className={LABEL_CLASS}>Curso *</label>
                                <select
                                    id="student-course"
                                    name="course"
                                    value={formData.course}
                                    onChange={handleChange}
                                    className={INPUT_CLASS}
                                >
                                    <option value="">Seleccionar</option>
                                    {/*  Mapeamos los cursos que provienen de la base de datos */}
                                    {Object.entries(COURSES).map(([key, value]) => (
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

                        {/* Pedagogo asignado: solo lo elige el administrador */}
                        {isAdmin && (
                            <div>
                                <label htmlFor="student-pedagogo" className={LABEL_CLASS}>Pedagogo asignado *</label>
                                <select
                                    id="student-pedagogo"
                                    name="pedagogoAsignado"
                                    value={formData.pedagogoAsignado}
                                    onChange={handleChange}
                                    className={INPUT_CLASS}
                                >
                                    <option value="">Seleccionar pedagogo</option>
                                    {pedagogos.map((pedagogo) => (
                                        <option key={pedagogo._id} value={pedagogo._id}>
                                            {pedagogo.name} · {pedagogo.specialization}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Diagnostico */}
                        <div role="group" aria-labelledby="student-diagnosis-label">
                            <p id="student-diagnosis-label" className={LABEL_CLASS}>Área de intervención principal *</p>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="flex flex-wrap gap-2 col-span-2">
                                    {Object.entries(DIAGNOSIS).map(([key, value]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            aria-pressed={formData.diagnosis === value}
                                            onClick={() => handleTagClick('diagnosis', value)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
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
                ) : (
                    // Campos del paso 2
                    <div className="space-y-3">
                        {/* Nombre del tutor legal */}
                        <div>
                            <label htmlFor="student-nameTutor" className={LABEL_CLASS}>Nombre del tutor/a legal *</label>
                            <input
                                type="text"
                                id="student-nameTutor"
                                name="nameTutor"
                                value={formData.nameTutor}
                                onChange={handleChange}
                                placeholder="Ej: Carmen Gómez Santos"
                                className={INPUT_CLASS}
                            />
                        </div>

                        <div>
                            {/* Relación o parentesco */}
                            <label htmlFor="student-tutorRelationship" className={LABEL_CLASS} >Parentesco *</label>
                            <select
                                id="student-tutorRelationship"
                                name="tutorRelationship"
                                value={formData.tutorRelationship}
                                onChange={handleChange}
                                className={INPUT_CLASS}
                            >
                                {Object.entries(TUTOR_RELATIONSHIP).map(([key, value]) => (
                                    <option key={key} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Telefono y Email en 2 Col */}
                            <div>
                                <label htmlFor="student-phone" className={LABEL_CLASS}>Teléfono *</label>
                                <input
                                    type="tel"
                                    id="student-phone"
                                    name="phoneNumberTutor"
                                    value={formData.phoneNumberTutor}
                                    onChange={handleChange}
                                    placeholder="6XX XXX XXX"
                                    className={INPUT_CLASS}
                                />
                            </div>
                            {/* Email Tutor */}
                            <div>
                                <label htmlFor="student-emailTutor" className={LABEL_CLASS}>Correo de Contacto *</label>
                                <input
                                    type="email"
                                    id="student-emailTutor"
                                    name="emailTutor"
                                    value={formData.emailTutor}
                                    onChange={handleChange}
                                    placeholder="tutor@email.com"
                                    className={INPUT_CLASS}
                                />

                            </div>
                        </div>

                    </div>


                )}
            </form>

            {/* Botones de Accion */}
            <div className="pt-3 border-t border-[#EBE7DF] flex items-center justify-between bg-white mt-4">
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
                        onClick={handleClose}
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

        </Modal>
    );
}

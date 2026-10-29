/* Archivo de funciones de apoyo para la API */

// Función normalizeSessions. Recibimos respuesta de axios y garantizamos que se devuelva un Array.
const normalizeSessions = (responseData) => {
    //Si es nulo o undifined retorna []
    if(responseData === undefined || responseData === null) return [];

    //Extraemos los datos
    const data = responseData?.data || responseData;

    //Validaciones
    if(Array.isArray(data)) return data;

    if(Array.isArray(data.sessions)) return data.sessions;

    //En otro caso retorna []
    return [];
};

// Función normalizeEstudents: Recibimos respuesta de axios y garantizamos que se devuelva un Array.
const normalizeStudents = (responseData) => {
    //Si es nulo o undifined retorna []
    if(responseData === undefined || responseData === null) return [];

    //Extraemos los datos
    const data = responseData?.data || responseData;

    //Validaciones
    if(Array.isArray(data)) return data;

    if(Array.isArray(data.students)) return data.students;

    //En otro caso retorna []
    return [];
};

// Función getApiErrorMessage: Recibimos respuesta de axios y extrae un mensaje de error claro y usable para el usuario.
const getApiErrorMessage = (error, defaultMessage = "Ha ocurrido un error inesperado.") => {
    //Si es nulo o undifined retorna un mensaje de error por defecto
    if(!error) return defaultMessage;

    //Sin respuesta del servidor (caído o sin conexión) el mensaje de axios es técnico y está en inglés: mostramos uno claro
    if(error.isAxiosError && !error.response) return "No se pudo conectar con el servidor. Inténtalo de nuevo.";

    //Extraemos los datos
    const data = error?.response?.data || error?.data || error;

    //Validaciones
    if(typeof data === 'string') return data;

    if(data?.error && typeof data.error === 'string') return data.error;

    if(data?.message && typeof data.message === 'string') return data.message;

    //En otro caso retorna un mensaje de error por defecto
    return defaultMessage;
};

export {
    normalizeSessions,
    normalizeStudents,
    getApiErrorMessage
};

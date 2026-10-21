/* Comparar fechas de sesiones sin problemas de desfase horario (timezone de UTC vs Local). */

// Función toLocalDateString, devuelve la fecha en formato local
const toLocalDateString = (dateInput) => {
  
    //Verficamos que la fehca sea válida
    if(!dateInput) return "";

    //Creamos instancia Date();
    const date = new Date(dateInput);
    
    //Comprobamos que la fecha - validicacion de null
    if (isNaN(date.getTime())) return "";

    //Sacamos año, mes y día de la fecha
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// Función formDate, permite dar formato a la fecha
const formatDate = (dateInput, option = {}) => {
    //Verificamos que la fecha válida
    if(!dateInput) return "No registrada";

    try {
        // Instanciamos la fecha en Date();
        const date = new Date(dateInput);

        //Comprobamos que la fecha - validicacion de null
        if (isNaN(date.getTime())) return "";

        //Definimos las opciones por defecto.
        const defaultOptions = {
            day: "2-digit",
            month: "short",
            year: "numeric",
        };

        //Combinamos las opciones pasadas con las por defecto
        const options = {...defaultOptions, ...option};

        //Retornamos la fecha en Formato local
        return date.toLocaleDateString("es-ES", options);
        
    } catch (error) {
        console.error("Error al formatear la fecha:", error);
        return "Fecha inválida";
    }
};

// Función formatTime, mostrar inicio de las sesiones en formato 24h con digitos
const formatTime = (dateInput) => {
    //Verificamos que la hora sea valida
    if(!dateInput) return "";

    //Obtenemos las horas y minutos y lo devolvemos en formato HH:MM
    const date = new Date(dateInput);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
};

// Función formatCapitalizedDate, Genera cabeceras en espalos con la Primera letra en Mayuscula - ej: "Miércoles, 12 de noviembre de 2026"
const formatCapitalizedDate = (dateInput, options = {}) => {
    //Si no hay fecha
    if(!dateInput) return "";

    try {
        // Instanciamos la fecha en Date();
        const date = new Date(dateInput);

        //Definimos las opciones por defecto.
        const defaultOptions = {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        };

        //Combinamos las opciones pasadas con las por defecto
        const mergedOptions = {...defaultOptions, ...options};

        //Formateamos la fecha y pasamos la primera letra en Mayusculas
        const formattedDate = date.toLocaleDateString("es-ES", mergedOptions);
        const capitalized = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

        //Retornamos la fecha en Formato local
        return capitalized;

    } catch (error) {
        console.error("Error al formatear la fecha:", error);
        return "Fecha inválida";
    }
};

// Función getmondayOfWeek, Reempleza el cálculo del Lunes inical de la semana
const getMondayOfWeek = (dateInput = new Date() ) => {

    //Cogemos la fecha dada
    const date = new Date(dateInput);

    //Calculamos la direncia de dias con respecto al lunes
    const day = date.getDay(); // 0 para domingo, 1 para lunes...
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para que empiece en lunes (1)
    const monday = new Date(date.setDate(diff));

    // Establecemos a las 00:00
    monday.setHours(0, 0, 0, 0);

    //Retornamos el lunes
    return monday;

};

//Exportamos
export {
    toLocalDateString,
    formatDate,
    formatTime,
    formatCapitalizedDate,
    getMondayOfWeek
};







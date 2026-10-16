/* DEFINIMOS LAS CONSTANTES DEL PROYECTO BACK-END */

//Constantes Users
const SPECIALIZATIONS = {
  PSICOLOGIA_EDUCATIVA: "Psicología Educativa",
  LOGOPEDIA: "Logopedia",
  ATENCION_TEMPRANA: "Atención Temprana",
  NEUROPSICOLOGIA: "Neuropsicología",
  ORIENTACION_EDUCATIVA: "Orientación Educativa",
};

const USER_ROLES = {
  ADMIN: "admin",
  PEDAGOGO: "pedagogo",
};

//Constantes Students/Pacientes
const COURSES = {
  INFANTIL_3: "Infantil 3 años",
  INFANTIL_4: "Infantil 4 años",
  INFANTIL_5: "Infantil 5 años",
  PRIMARIA_1: "1 Primaria",
  PRIMARIA_2: "2 Primaria",
  PRIMARIA_3: "3 Primaria",
  PRIMARIA_4: "4 Primaria",
  PRIMARIA_5: "5 Primaria",
  PRIMARIA_6: "6 Primaria",
  ESO_1: "1 ESO",
  ESO_2: "2 ESO",
  ESO_3: "3 ESO",
  ESO_4: "4 ESO",
  BACHILLER_1: "1 Bachillerato",
  BACHILLER_2: "2 Bachillerato",
  FP: "FP",
};

const DIAGNOSIS = {
  DISLEXIA: "Dislexia",
  DISCALCULIA: "Discalculia",
  TDAH: "TDAH",
  DISGRAFIA: "Disgrafía",
  TEA: "TEA",
  DISCAPACIDAD_INTELECTUAL: "Discapacidad intelectual",
  RETRASO_DEL_LENGUAJE: "Retraso del Lenguaje",
  ALTAS_CAPACIDADES: "Altas Capacidades",
  RETRASO_MADURATIVO: "Retraso Madurativo",
  ANSIEDAD_ESCOLAR: "Ansiedad Escolar",
  NINGUNO: "Ninguno",
};

const TUTOR_RELATIONSHIP = {
  MADRE: "Madre",
  PADRE: "Padre",
  TUTOR_LEGAL: "Tutor Legal",
};

//CONSTANTES SESIONES
const SESSION_STATUS = {
  PENDIENTE: "Pendiente",
  CANCELADO: "Cancelado",
  COMPLETADO: "Completado",
};

//CONSTANTES DE ARCHIVOS
const SIZE_FILES = {
  MAX_SIZE_5MB: 5 * 1024 * 1024, //5MB - PARA AVATAR
  MAX_SIZE_20MB: 20 * 1024 * 1024, //20MB - PARA DOCUMENTOS
};

// Franjas horarias mostradas en el calendario escolar
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
// Paletas pastel exactas de la maqueta
const PASTEL_THEMES = [
  { bg: "bg-[#EEF7FC]", text: "text-[#2C6E91]", border: "border-l-[#59A4CC]" }, // Azul (ej: Sofía)
  { bg: "bg-[#F4F0FA]", text: "text-[#69488E]", border: "border-l-[#A582C9]" }, // Lila (ej: María, David)
  { bg: "bg-[#FDF3EE]", text: "text-[#A65B32]", border: "border-l-[#E07A5F]" }, // Melocotón (ej: Lucas, Elena)
  { bg: "bg-[#EEF7F2]", text: "text-[#2D6A4F]", border: "border-l-[#529471]" }, // Menta (ej: Pablo)
];

export {
  SPECIALIZATIONS,
  USER_ROLES,
  COURSES,
  DIAGNOSIS,
  TUTOR_RELATIONSHIP,
  SESSION_STATUS,
  SIZE_FILES,
  HOURS,
  PASTEL_THEMES,
};

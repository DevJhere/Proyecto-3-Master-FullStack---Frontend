/* DEFINIMOS LAS CONSTANTES DEL PROYECTO BACK-END */

//Constantes Users
const SPECIALIZATIONS = {
  PSICOLOGIA_EDUCATIVA: "Psicología Educativa",
  LOGOPEDIA: "Logopedia",
  ATENCION_TEMPRANA: "Atención temprana",
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
};

const DIAGNOSIS = {
  DISLEXIA: "Dislexia",
  DISCALCULIA: "Discalculia",
  TDAH: "TDAH",
  DISGRAFIA: "Disgrafía",
  TEA: "TEA",
  DISCAPACIDAD_INTELECTUAL: "Discapacidad Intelectual",
  RETRASO_DEL_LENGUAJE: "Retraso del Lenguaje",
  ALTAS_CAPACIDADES: "Altas Capacidades",
  RETRASO_MADURATIVO: "Retraso Madurativo",
  ANSIEDAD_ESCOLAR: "Ansiedad Escolar",
  NINGUNO: "Ningúno",
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

export {
  SPECIALIZATIONS,
  USER_ROLES,
  COURSES,
  DIAGNOSIS,
  TUTOR_RELATIONSHIP,
  SESSION_STATUS,
};

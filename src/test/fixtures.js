// Datos de ejemplo con la misma forma que devuelve la API
export const adminUser = {
  _id: "u-admin",
  name: "Jheremi Admin",
  email: "jheremi@admin.com",
  rol: "admin",
  specialization: "Orientación Educativa",
  avatar: "https://res.cloudinary.com/test/image/upload/v1/profile-default.jpg",
};

export const pedagogoUser = {
  _id: "u-samantha",
  name: "Samantha Test",
  email: "samatha@pedagogo.com",
  rol: "pedagogo",
  specialization: "Psicología Educativa",
  avatar: "https://res.cloudinary.com/test/image/upload/v1/profile-default.jpg",
};

export const otherPedagogoUser = {
  _id: "u-nathan",
  name: "Nathan Test",
  email: "nathan@pedagogo.com",
  rol: "pedagogo",
  specialization: "Logopedia",
  avatar: "https://res.cloudinary.com/test/image/upload/v1/profile-default.jpg",
};

let counter = 0;

export const makeStudent = (overrides = {}) => {
  counter += 1;
  return {
    _id: `s-${counter}`,
    name: `Alumno ${counter}`,
    course: "3 Primaria",
    age: 8,
    diagnosis: "Dislexia",
    nameTutor: `Tutor ${counter}`,
    emailTutor: `tutor${counter}@correo.com`,
    phoneNumberTutor: "600000000",
    tutorRelationship: "Madre",
    avatar: "profile-default.jpg",
    reports: [],
    createdAt: "2026-09-01T10:00:00.000Z",
    pedagogoAsignado: { _id: pedagogoUser._id, name: pedagogoUser.name, email: pedagogoUser.email },
    ...overrides,
  };
};

export const makeSession = (overrides = {}) => {
  counter += 1;
  return {
    _id: `ses-${counter}`,
    student: { _id: "s-1", name: "Alumno 1", course: "3 Primaria", diagnosis: "Dislexia", avatar: "profile-default.jpg" },
    pedagogoAsignado: { _id: pedagogoUser._id, name: pedagogoUser.name, email: pedagogoUser.email },
    date: "2026-11-05T09:00:00.000Z",
    status: "Pendiente",
    duration: 60,
    notes: "",
    attachmentDocument: "",
    ...overrides,
  };
};

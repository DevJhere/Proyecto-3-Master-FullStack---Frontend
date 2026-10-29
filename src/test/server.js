// Servidor MSW compartido: cada test registra con server.use(...) las respuestas de la API que necesita
import { setupServer } from "msw/node";

export const API_URL = "http://api.test/api";

// URL absoluta de un endpoint de la API falsa: api("/students") -> http://api.test/api/students
export const api = (path) => `${API_URL}${path}`;

export const server = setupServer();

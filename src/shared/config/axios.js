/* CONFIGURACIÓN DE AXIOS - cliente HTTP centralizado */
import axios from "axios";

//Qué hacer cuando la API responde 401 (sesión caducada). Por defecto vuelve al login recargando la página;
//el AuthProvider lo sustituye por un cierre de sesión sin recarga.
const redirectToLogin = () => {
  window.location.href = "/login";
};
let onUnauthorized = redirectToLogin;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler || redirectToLogin;
};

//1. Instancia de axios - CONFIGURACIÓN BASE
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, //URL base del backend
  headers: {
    "Content-Type": "application/json",
  },
});

//2. Interceptor de Petición -  Request Interceptor
apiClient.interceptors.request.use(
    (config) => {
        //Obtenemos token de localStorage
        const token = localStorage.getItem("token");
        if(token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

//3. Interceptor de Respuesta - Response Interceptor
apiClient.interceptors.response.use(
  (response) => response, //En caso de que la petición sea exitosa
  //En caso de error, se ejecuta esta función
  (error) => {
    const status = error.response?.status;
    const isLoginRequest = error.config?.url?.includes("/auth/login");

    // Si es 401 y NO es el intento de login, limpiamos sesión y volvemos al login
    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      onUnauthorized();
    }

    return Promise.reject(error);
  },

);

//Exportamos
export default apiClient;

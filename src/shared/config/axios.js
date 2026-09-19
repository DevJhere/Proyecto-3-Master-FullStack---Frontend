/* CONFIGURACIÓN DE AXIOS - cliente HTTP centralizado */
import axios from "axios";

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

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      //Redirigimos al usuario a la pantalla de inicio
      window.location.href = "/";
    }

    return Promise.reject(error);
  },
);

//Exportamos
export default apiClient;




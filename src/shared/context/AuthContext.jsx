/* Contexto de Autenticación */
import { useEffect, useState } from "react";
import apiClient, { setUnauthorizedHandler } from "../config/axios";
import { AuthContext } from "./authContextObject";

//Sesión vacía - Usuario sin autenticar
const EMPTY_SESSION = { token: null, user: null };

const clearStoredSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

//Recuperamos la sesión guardada. Si los datos están corruptos la descartamos para no dejar la app en blanco.
const loadStoredSession = () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) return EMPTY_SESSION;

    try {
        const user = JSON.parse(storedUser);

        if (!user || typeof user !== "object") throw new Error("Usuario guardado inválido");

        return { token, user };
    } catch {
        clearStoredSession();
        return EMPTY_SESSION;
    }
};

//Creamos el provide para poder acceder a los datos
export const AuthProvider = ({children}) =>{

    //1. Definimos el estado global. Se lee de forma síncrona, así al recargar la página no hay un instante sin sesión que redirija a login.
    const [ session, setSession ] = useState(loadStoredSession);
    const { user, token } = session;

    //2. Si la API responde 401 (token caducado o inválido) cerramos la sesión sin recargar la página: ProtectedRoute redirige a /login
    useEffect( () => {
        setUnauthorizedHandler( () => setSession(EMPTY_SESSION));

        return () => setUnauthorizedHandler(null);
    }, []);

    //3. Con sesión guardada, refrescamos los datos del usuario desde el servidor (el rol o el nombre pueden haber cambiado desde el último acceso)
    useEffect( () => {
        if(!token) return;

        let cancelled = false;

        apiClient.get("/auth/me")
            .then( (response) => {
                if(cancelled) return;

                localStorage.setItem("user", JSON.stringify(response.data));
                setSession( (prev) => prev.token ? { ...prev, user: response.data } : prev);
            })
            //Si falla por red mantenemos los datos guardados; si es un 401 ya lo gestiona el interceptor
            .catch( () => {});

        return () => { cancelled = true; };
    }, [token]);

    /*----------- Funciones Principales de inicio de sesion y cierre de sesion  ----------*/

    const login = async (data) => {
        try{

            //Recibimos respuesta del servidor. Token y datos de usuario.
            const response = await apiClient.post("/auth/login", data);

            //Procesamos la respuesta
            const result = response.data;

            //Almacenamos toke y user en localstorage
            localStorage.setItem("token",result.token);
            localStorage.setItem("user",JSON.stringify(result.user));

            //Actualizamos estado
            setSession({ token: result.token, user: result.user });

           return {success: true, message: "Inicio de sesión exitoso"};

        }catch(err){
            const errorMessage = err.response?.data?.error ||err.response?.data?.message || "Email o contraseña incorrectos.";

            return {success: false, message: errorMessage};
        }
    };

    const logout = async () => {

        //Eliminamos token y user del localstorage
        clearStoredSession();

        //Actualizamos estado - redirecciona a /login automaticamente
        setSession(EMPTY_SESSION);
    };

    // Función para actualizar datos de usuario en memoria y en LocalStorage
    const updateUser = (updatedUser) => {
        setSession( (prev) => ({ ...prev, user: updatedUser }));
        localStorage.setItem("user", JSON.stringify(updatedUser))
    };

    //Estado global
    const value = {
        user,
        token,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser // exportamos la funcion updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );

};

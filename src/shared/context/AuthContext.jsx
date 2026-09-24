/* Contexto de Autenticación */
import { useEffect } from "react";
import { createContext, useState } from "react";
import apiClient from "../config/axios";


//Creamos el contexto de auth
export const AuthContext = createContext();

//Creamos el provide para poder acceder a los datos
export const AuthProvider = ({children}) =>{

    //1. Definimos estados globales
    const [ user, setUser] = useState(null);
    const [ token, setToken] = useState(localStorage.getItem('token'));
    const [ isLoading, setIsLoading] = useState(true);

    //2. Cargamos - Persitimos la sesion
    useEffect( () => {

        //Verificamos que existe token y user en localstorage
        const tokenStorage = localStorage.getItem('token');
        const userStorage = localStorage.getItem('user');
        
        if(tokenStorage && userStorage){
            setToken(tokenStorage);
            setUser(JSON.parse(userStorage));
        }

        //Si pasa el filtro cambiamos estado isLoading a false
        setIsLoading(false); //Evitamos que al recargar la página redirija a login
    }, []);

    /*----------- Funciones Principales de inicio de sesion y cierre de sesion  ----------*/
    
    const login = async (data) => {
        try{

            //Recibimos respuesta del servidor. Token y datos de usuario.
            //Credenciales: Include permite el envio de cookies, para mantener sesion iniciada.
            const response = await apiClient.post("/auth/login", data);

            //Procesamos la respuesta
            const result = response.data;

            //Almacenamos toke y user en localstorage
            localStorage.setItem("token",result.token);
            localStorage.setItem("user",JSON.stringify(result.user));

            //Actualizamos estado
            setToken(result.token);
            setUser(result.user);

           return {success: true, message: "Inicio de sesión exitoso"};
            
        }catch(err){
            return {success: false, message: "Error de autenticación."};
        }
    };

    const logout = async () => {
        
        //Eliminamos token y user del localstorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        //Actualizamos estado - redirecciona a /login automaticamente
        setToken(null);
        setUser(null);
    };

    //Estado global
    const value = {
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );

};
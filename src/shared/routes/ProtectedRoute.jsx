// Archivo para crear rutas protegidas
// Importaciones
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

//COMPONENTE PARA CREAR RUTAS PROTEGIDAS
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {

    //Llamamos a los estados. La sesión se lee de forma síncrona en AuthProvider, no hace falta estado de carga.
    const { user, isAuthenticated } = useAuth();

    //Validamos si el usuario esta autenticado
    if(!isAuthenticated || !user){
        return <Navigate to={"/login"} replace/>
    }

    //Validamos si el usuario tiene rol permitido
    //Si se especifican roles, validamos que el usuario tenga alguno de ellos
    //Si no hay roles definidos, cualquier usuario autenticado puede acceder
    if(allowedRoles.length > 0 && !allowedRoles.includes(user.rol)){
        return <Navigate to={"/dashboard"} replace/>
    }

    //Si todas las validaciones pasan, pemitimos acceso
    return children ? children : <Outlet />;
};

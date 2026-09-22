// Archivo para crear rutas protegidas
// Importaciones
import { useAuth } from "../../modules/auth/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";

//COMPONENTE PARA CREAR RUTAS PROTEGIDAS
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {

    //Llamamos a los estados
    const { user, isAuthenticated, isLoading} = useAuth();

    //Controlamos estado de carga
    //Si no ha cargado, mostramos mensaje de carga
    if(isLoading){
        return <div className="text-center">Cargando estado de autenticación...</div>
    }

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
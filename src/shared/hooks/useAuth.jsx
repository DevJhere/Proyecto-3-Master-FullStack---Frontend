/* Este hook nos ayuda a acceder al contexto de auth desde cualquier componente sin necesidad de importar el contexto y usar useContext() */
import { useContext } from "react"
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => {

    //Obtenemos el contexto
    const context = useContext(AuthContext);

    //Controlamos errores: <AuthProvider> en App.jsx, nos avisará con este error si se nos olvida ponerlo.
    if(!context){
        throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
    }
  return context;
};

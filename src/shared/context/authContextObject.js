/* Objeto del contexto de auth. Está separado de AuthProvider para que ese archivo solo exporte componentes (Fast Refresh) */
import { createContext } from "react";

export const AuthContext = createContext();

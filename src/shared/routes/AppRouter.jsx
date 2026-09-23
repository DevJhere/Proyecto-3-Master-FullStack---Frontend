import { BrowserRouter, Routes, Navigate, Route } from "react-router-dom";

// Importaciones de Layout
import { MainLayout } from "../layout/MainLayout";

// Importaciones de Rutas Protegidas
import { ProtectedRoute } from "../routes/ProtectedRoute";

// Importaciones de Rutas Públicas
import { Login } from "../pages/public/Login";
import { Register } from "../pages/public/Register";

// Importaciones de Rutas Privadas
import { Dashboard } from "../pages/private/Dashboard";
import { Students } from "../pages/private/Students";
import { Sessions } from "../pages/private/Sessions";
  

import { Error404 } from "../pages/public/Error404";

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Definimos las rutas de la App - Plataforma */}

                {/* --- RUTAS PÚBLICAS --- */}
                <Route path="/login" element={<Login />}/>
                <Route path="/register" element={<Register />} />

                {/* Redireccionamiento inicial - replace evita que el usuario pueda volver a esta ruta con el boton de retroceder */}
                <Route path="/" element={<Navigate to={"/dashboard"} replace/>}/>


                {/* --- RUTAS PRIVADAS --- */}

                <Route element={<ProtectedRoute />}>
                    {/* RUTAS DENTRO DE LA CAPA PRINCIPAL QUE COMPARTEN SIDEBAR Y NAVBAR */}
                    <Route element={<MainLayout />}>
                        <Route path="/dashboard" element={<Dashboard />}/>
                        <Route path="/students" element={<Students />}/>
                        
                        {/* <Route path="/students/:id" element={<StudentDetailPage />} /> */}
                        <Route path="/sessions" element={<Sessions />} />

                        {/* <Route path="/" element={<ProfilePage />} /> */}

                        {/* RUTA PROTEGIDA PARA USUARIOS AUTENTICADOS - PERMITE ACCESO A ADMINISTRADORES Y PEDAGOGOS */}
                        <Route path="/users" element={<ProtectedRoute allowedRoles={['admin','pedagogo']}/>}/>

                    </Route>
                </Route>

                {/* --- ERROR 404 --- */}
                <Route path="/404" element={<Error404 />} />
                <Route path="*" element={<Navigate to={"/404"} replace/>}/>
            </Routes>
        </BrowserRouter>
    );
};  
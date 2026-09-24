/* Layout principal con Sidebar y Outlet para navegación */
import { useAuth } from "../hooks/useAuth";
import { VscHome } from "react-icons/vsc";
import { FaUsers } from "react-icons/fa";
import { GoCalendar } from "react-icons/go";
import { SlSettings } from "react-icons/sl";
import { GrUserSettings } from "react-icons/gr";
import { NavLink, Outlet } from "react-router-dom";
import { IoExitOutline } from "react-icons/io5";
import logo from "../../assets/images/Raices y Alas Logo.png";

export const MainLayout = () => {
    // Traemos estado global de auth
    const { user, logout } = useAuth();
    
    // ITEMS de sidebar 
    const navItems = [
        { path: "/dashboard", label: "Inicio", icon: <VscHome /> },
        { path: "/students", label: "Alumnos", icon: <FaUsers /> },
        { path: "/sessions", label: "Sesiones", icon: <GoCalendar /> },
        { path: "/profile", label: "Perfil", icon: <SlSettings /> },
        { path: "/users", label: "Usuarios", icon: <GrUserSettings />, requiredRole: "admin" },
    ];

    return (
        <div className="flex h-screen bg-[#FAF8F5] overflow-hidden font-sans">
            {/* SIDEBAR - LATERAL */}
            <aside className="w-64 bg-white border-r border-[#EBE8E0] flex flex-col justify-between p-6 select-none">
                <div>
                    {/* LOGO E IDENTIDAD DE MARCA */}
                    <div className="flex items-center gap-3 mb-8 px-2">
                        {/* LOGO - Se carga la imagen importada */}
                        <div className="w-9 h-9 rounded-full bg-[#E2F2E9] flex items-center justify-center text-[#2D6A4F] font-bold overflow-hidden shrink-0">
                            <img src={logo} alt="Raíces y Alas Logo" className="w-full h-full object-cover" />
                        </div>

                        <div>
                            <span className="font-bold text-slate-800 text-sm block leading-tight">RAÍCES Y ALAS</span>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Gestión PT
                            </p>
                        </div>                        
                    </div>

                    {/* Navegación */}
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            if (item.requiredRole && user?.rol !== item.requiredRole) return null;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                                        isActive 
                                        ? "bg-[#E2F2E9] text-[#2D6A4F] font-semibold"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                    }`}
                                >
                                    <span className="text-base">{item.icon}</span>
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* USUARIO Y BOTÓN DE LOGOUT (FOOTER SIDEBAR) */}
                <div className="pt-6 border-t border-[#F0EDE6] space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        {/* Avatar - Tono pastel */}
                        <div className="w-10 h-10 rounded-full bg-[#E8E3F5] text-[#6B5B95] flex items-center justify-center font-semibold text-sm shrink-0">
                            {user?.nombre ? user.nombre.slice(0, 2).toUpperCase() : "TP"}
                        </div>

                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-800 truncate leading-snug">
                                {user?.nombre || "Usuario"}
                            </p>

                            <p className="text-xs text-slate-400 truncate">
                                {user?.specialization || (user?.rol === 'admin' ? 'Administrador' : 'Pedagogo')}
                            </p>
                        </div>
                    </div>
                    
                    {/* Botón Cerrar sesión */}
                    <button
                        type="button"
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-2 py-2 text-sm font-medium text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <span className="text-base"><IoExitOutline /></span>
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 overflow-y-auto p-8"> 
                <Outlet />
            </main>
        </div>
    );
};
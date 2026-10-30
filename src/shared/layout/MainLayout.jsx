/* Layout principal con Sidebar y Outlet para navegación */
/* CAMBIO (responsive): el layout se adapta a tres tamaños. Antes la barra lateral era fija (w-64) y en móvil dejaba
   solo ~134px al contenido. Ahora:
   - Móvil (<768px): barra superior con botón de menú; la navegación es un panel deslizante con fondo oscuro.
   - Tablet (768-1023px): barra lateral estrecha solo con iconos (las etiquetas se ocultan).
   - PC (>=1024px): barra lateral completa, como antes. */
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { IoMenu, IoClose } from "react-icons/io5";
import { VscHome } from "react-icons/vsc";
import { FaUsers } from "react-icons/fa";
import { GoCalendar } from "react-icons/go";
import { SlSettings } from "react-icons/sl";
import { GrUserSettings } from "react-icons/gr";
import { NavLink, Outlet } from "react-router-dom";
import { IoExitOutline } from "react-icons/io5";
import logo from "../../assets/images/Raices y Alas Logo.png";
import { getAvatarUrl } from "../utils/HelperAvatar";

export const MainLayout = () => {
    // Traemos estado global de auth
    const { user, logout } = useAuth();
    // CAMBIO (responsive): estado del panel de navegación en móvil (en tablet y PC la barra es fija y no lo usa)
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    // ITEMS de sidebar 
    const navItems = [
        { path: "/dashboard", label: "Inicio", icon: <VscHome /> },
        { path: "/students", label: "Alumnos", icon: <FaUsers /> },
        { path: "/sessions", label: "Sesiones", icon: <GoCalendar /> },
        { path: "/profile", label: "Perfil", icon: <SlSettings /> },
        { path: "/users", label: "Usuarios", icon: <GrUserSettings />, requiredRole: "admin" },
    ];

    return (
        /* CAMBIO (responsive): h-dvh en lugar de h-screen para que la barra del navegador móvil no recorte la parte inferior;
           en móvil el layout pasa a columna (barra superior + contenido) y desde md vuelve a fila (barra lateral + contenido) */
        <div className="flex flex-col md:flex-row h-dvh bg-[#FAF8F5] overflow-hidden font-sans">
            {/* CAMBIO (responsive): barra superior solo en móvil, con el botón que abre el menú */}
            <header className="md:hidden shrink-0 flex items-center justify-between bg-white border-b border-[#c8c6c1] px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#E2F2E9] overflow-hidden shrink-0">
                        <img src={logo} alt="Raíces y Alas Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">RAÍCES Y ALAS</span>
                </div>
                <button
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Abrir menú"
                    className="w-11 h-11 flex items-center justify-center rounded-xl text-2xl text-slate-700 hover:bg-slate-50"
                >
                    <IoMenu />
                </button>
            </header>

            {/* CAMBIO (responsive): fondo oscuro detrás del panel en móvil; al pulsarlo se cierra el menú */}
            {menuOpen && (
                <div
                    className="md:hidden fixed inset-0 z-30 bg-black/40"
                    onClick={closeMenu}
                    aria-hidden="true"
                />
            )}

            {/* SIDEBAR - LATERAL
                CAMBIO (responsive): en móvil es un panel fijo que entra desde la izquierda (translate-x); desde md es estático,
                con ancho w-20 (solo iconos) en tablet y w-64 (completo) desde lg */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:w-20 lg:w-64 shrink-0 bg-white border-r border-[#c8c6c1] flex flex-col justify-between overflow-y-auto p-6 md:p-3 lg:p-6 select-none ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                {/* CAMBIO (responsive): botón para cerrar el panel, solo visible en móvil */}
                <button
                    type="button"
                    onClick={closeMenu}
                    aria-label="Cerrar menú"
                    className="md:hidden absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-xl text-2xl text-slate-500 hover:bg-slate-50"
                >
                    <IoClose />
                </button>
                <div>
                    {/* LOGO E IDENTIDAD DE MARCA */}
                    <div className="flex items-center gap-3 mb-8 px-2 md:justify-center lg:justify-start md:px-0 lg:px-2">
                        {/* LOGO - Se carga la imagen importada */}
                        <div className="w-9 h-9 rounded-full bg-[#E2F2E9] flex items-center justify-center text-[#2D6A4F] font-bold overflow-hidden shrink-0">
                            <img src={logo} alt="Raíces y Alas Logo" className="w-full h-full object-cover" />
                        </div>

                        {/* CAMBIO (responsive): el texto de la marca se oculta en tablet (md) y se muestra en móvil y PC */}
                        <div className="md:hidden lg:block">
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
                                    onClick={closeMenu}
                                    title={item.label}
                                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 md:justify-center lg:justify-start md:px-0 lg:px-4 rounded-2xl text-sm font-medium transition-all duration-200 ${
                                        isActive 
                                        ? "bg-[#E2F2E9] text-[#2D6A4F] font-semibold"
                                        : "text-ink-muted hover:bg-slate-50 hover:text-slate-700"
                                    }`}
                                >
                                    <span className="text-base md:text-xl lg:text-base">{item.icon}</span>
                                    {/* CAMBIO (responsive): la etiqueta se oculta en tablet (barra de solo iconos) */}
                                    <span className="md:hidden lg:inline">{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* USUARIO Y BOTÓN DE LOGOUT (FOOTER SIDEBAR) */}
                <div className="pt-6 border-t border-[#c8c6c1] space-y-4">
                    <div className="flex items-center gap-3 px-2 md:justify-center lg:justify-start md:px-0 lg:px-2">
                        {/* Avatar con imagen de Cloudinary o fallback */}
                        <img
                            src={getAvatarUrl(user?.avatar)}
                            alt={user?.name || "Usuario"}
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 shrink-0 bg-slate-100"
                        />

                        {/* CAMBIO (responsive): nombre y especialidad ocultos en tablet */}
                        <div className="overflow-hidden md:hidden lg:block">
                            <p className="text-sm font-bold text-slate-800  truncate leading-snug">
                                {user?.name || "Usuario"}
                            </p>

                            <p className="text-xs text-ink-muted truncate">
                                {user?.specialization || (user?.rol === 'admin' ? 'admin' : 'pedagogo')}
                            </p>
                        </div>
                    </div>
                    
                    {/* Botón Cerrar sesión */}
                    <button
                        type="button"
                        onClick={logout}
                        title="Cerrar sesión"
                        className="w-full flex items-center gap-3 px-2 py-2 md:justify-center lg:justify-start text-sm font-medium text-ink-muted hover:text-red-500 transition-colors"
                    >
                        <span className="text-base md:text-xl lg:text-base"><IoExitOutline /></span>
                        <span className="md:hidden lg:inline">Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            {/* CAMBIO (responsive): min-w-0 evita que el contenido ensanche el main; padding progresivo p-4 / p-6 / p-8 */}
            <main className="flex-1 min-w-0 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8">
                <Outlet />
            </main>
        </div>
    );
};

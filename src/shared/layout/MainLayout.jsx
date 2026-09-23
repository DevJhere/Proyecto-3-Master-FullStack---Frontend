/*  */
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";

export const MainLayout = () => {

    //Traemos estado global de auth
    const { user, logout } = useAuth();
    //Estado para manejar la visibilidad del menú móvil
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    //




}
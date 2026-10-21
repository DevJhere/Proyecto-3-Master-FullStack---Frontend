import React from 'react'
import { useEffect } from 'react';
import { IoClose } from 'react-icons/io5';

export const Modal = ({ isOpen, onClose, title, subtitle, maxWidth = "max-w-lg", showCloseButton = true, children }) => {

    //Si no se encuentra abierto el modal no se aplica nada
    if (!isOpen) return null;

    //Efecto de accesibilidad
    useEffect(() => {
        //Función para cerrar el modal con tecla ESCAPE
        const handleEscape = (e) => {
            //Si el evento es la tecla ESCAPE y el modal está abierto, cerramos el modal
            if (e.key === "Escape") {
                onClose();
            }
        };

        //Añadimos el evento
        window.addEventListener("keydown", handleEscape);

        //Bloquemos scroll del body cuando el modal está abierto
        document.body.style.overflow = "hidden";

        // Limpieza del efecto
        return () => {
            window.removeEventListener("keydown", handleEscape);
            //Devuelve el scroll
            document.body.style.overflow = "unset";
        };

    }, [isOpen, onClose])

    return (
        //Overlay del modal con transparencia
        <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={onClose}>

            {/* Contenedor del Modal */}
            <div className={`bg-white rounded-3xl ${maxWidth} w-full p-6 shadow-xl border border-[#EBE7DF] overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()} > {/* Evita que al hacer click dentro del modal, lo cierre */}

                {/* Cabecera del Modal - Titulo y subtitulo*/}
                <div className="flex items-center justify-between pb-4 border-b border-[#F5F2EB]">
                    <div>
                        {/* Condicionamos que los campos existan para renderizarlos */}
                        {title && <h2 className="text-base font-bold text-slate-800">{title}</h2>}
                        {subtitle && <p className="text-xs text-ink-faint mt-0.5">{subtitle}</p>}
                    </div>

                    {/* Boton Cerrar */}
                    {showCloseButton && (
                        <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer">
                        <IoClose size={20} />
                        </button>
                    )}
                </div>

                {/* Cuerpo del modal */}
                {children}

            </div>

        </div>



    )
}


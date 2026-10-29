import { useEffect, useId } from 'react';
import { IoClose } from 'react-icons/io5';

export const Modal = ({ isOpen, onClose, title, subtitle, maxWidth = "max-w-lg", showCloseButton = true, children }) => {

    //Identificador para asociar el título con el diálogo (accesibilidad)
    const titleId = useId();

    //Efecto de accesibilidad. Los hooks se ejecutan siempre; el efecto solo actúa cuando el modal está abierto.
    useEffect(() => {
        if (!isOpen) return;

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

    //Si no se encuentra abierto el modal no se muestra nada
    if (!isOpen) return null;

    return (
        //Overlay del modal con transparencia
        <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={onClose}>

            {/* Contenedor del Modal */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                className={`bg-white rounded-3xl ${maxWidth} w-full p-6 shadow-xl border border-[#EBE7DF] overflow-hidden max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()} > {/* Evita que al hacer click dentro del modal, lo cierre */}

                {/* Cabecera del Modal - Titulo y subtitulo*/}
                <div className="flex items-center justify-between pb-4 border-b border-[#F5F2EB]">
                    <div>
                        {/* Condicionamos que los campos existan para renderizarlos */}
                        {title && <h2 id={titleId} className="text-base font-bold text-slate-800">{title}</h2>}
                        {subtitle && <p className="text-xs text-ink-faint mt-0.5">{subtitle}</p>}
                    </div>

                    {/* Boton Cerrar */}
                    {showCloseButton && (
                        <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
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

import { useState } from "react";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";



export const PasswordField = ( {label = "Contraseña", name = "password", value, onChange, placeholder = "••••••••", required = false }) => {

  //Estados locales
  const  [showPassword, setShowPassword] = useState(false);
  
  //Función toggle para mostrar/ocultar contraseña
  const toggleShowPassword = () => setShowPassword(prev => !prev);

  return (
    // Label del campo

     <div className="relative w-full">
        <label htmlFor={name} className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            {label}
        </label>

        <input
            type={showPassword ? "text" : "password"} 
            name={name}
            value={value}
            id={name}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full bg-[#FAF8F5] border border-[#EBE7DF] focus:border-[#529471] focus:bg-white rounded-2xl pl-10 pr-10 py-3 text-sm text-int-faint outline-none transition-all"
        />
        <FiLock className="absolute left-3.5 top-10 text-ink-faint"/>
        <button 
          type="button"
          onClick={toggleShowPassword}
          className="absolute right-3.5 top-10 text-ink-faint hover:text-slate-600 focus:outline-none cursor-pointer"
        >
          {showPassword ? <FiEyeOff /> : <FiEye />}
        </button>
        
     </div>
    
    
  );
}

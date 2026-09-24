import { useState } from "react";
import { useNavigate, Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import logo from '../../../assets/images/Raices y Alas Logo.png';
import { FiEyeOff } from "react-icons/fi";
import { FiEye } from "react-icons/fi";
import { FiLock } from "react-icons/fi";
import { FiMail } from "react-icons/fi";

export const Login = () => {

  //Declaramos los estados
  const [ formData, setFormData] = useState({ email: "", password: "" });
  const [ error, setError] = useState("");
  const [ isSubmitting, setIsSubmitting] = useState(false);
  const [ showPassword, setShowPassword] = useState(false);

  //Hooks
  const navigate = useNavigate();
  const { login } = useAuth();

  //Funcion para manejar cambios en los inputs
  const handleChange = (e) => {
    
    //Extraemos name y value del input
    const {name, value} = e.target;

    //limpiamos errores si el usuario intenta corregir
    if(error) setError("");

    //Actualizamos el estado forData de forma inmutable
    setFormData(prevData => {

      return { ...prevData, [name]: value };
    });

  };

  
  //Toggle mostrar/ocultar contraseña
  const toggleShowPassword = () => setShowPassword(prev => !prev);

  //Funcion para manejar el envio del formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); //Evitamos que se recargue la página al enviar el formulario

    try {
      
      //Validamos email y password
      const { email, password} = formData;
      if( !email || !password){
        setError("Debes completar todos los campos.");
        return;
      }

      //Cambiamos a tru isSubmitting
      setIsSubmitting(true);

      //Ejecutamos result
      const result = await login(formData);

      //Verificamos si la peticion fue exitosa
      if(result.success){
        navigate("/dashboard"); //Redirigimos a panel de administrador
      }else{
        setError(result.message); //Mostramos error
      }
      
    } catch (err) {
      setError("Error de autenticación. Intente nuevamente.");
    }finally{
      setIsSubmitting(false)
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col items-center justify-center p-4">
      {/* Formulario */}

      {/* CABECERA: Logo + Título */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center p-2 mb-3">
          <img src={logo} alt="Raíces y Alas" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-serif text-slate-800 tracking-wide">
          RAÍCES Y ALAS
        </h1>
        <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
          Gestión PT
        </p>
      </div>

      {/* CARD principal con Pestañas */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#EBE7DF] overflow-hidden mt-6">


          <div className="grid grid-cols-2 text-center border-b border-[#EBE7DF] text-sm font-medium">
            <NavLink 
              to="/login"
              className="border-b-2 border-[#529471] text-[#529471] py-4"
            >
              Iniciar sesión
            </NavLink>

            <NavLink
              to="/register"
              className="text-slate-400 hover:text-slate-600 py-4"
              >
              Crear Cuenta
            </NavLink>
          </div>
      

          {/* Campos del Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {error && (
              <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-3 text-center text-red-700 text-xs mb-4">
                {error}
              </div>
            )}
            
            <div className="relative w-full">
              <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Correo Electrónico</label>
              <input 
                type="email" 
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ingresa tu correo electrónico"
                className="w-full bg-[#F5F2EB] border border-transparent focus:border-[#529471] focus:bg-white rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-700 outline-none transition-all"
              />
              <FiMail className="absolute left-3.5 top-10 text-slate-400" />
            </div>

            <div className="relative w-full">
              <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Contraseña
              </label>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Ingresa tu contraseña"
                className="w-full bg-[#F5F2EB] border border-transparent focus:border-[#529471] focus:bg-white rounded-2xl pl-10 pr-10 py-3 text-sm text-slate-700 outline-none transition-all"
              />
              <FiLock className="absolute left-3.5 top-10 text-slate-400"/>
              <button 
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3.5 top-10 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#529471] hover:bg-[#437a5d] text-white font-medium py-3.5 rounded-2xl shadow-sm transition-all duration-200 text-sm mt-4 cursor-pointer"
            >
              {isSubmitting ? "Entrando..." : "Entrar a Raíces y Alas"}
            </button>
          </form>
        
        </div>
    </div>
  )
}


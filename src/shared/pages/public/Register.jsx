import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import apiClient from "../../config/axios";
import logo from '../../../assets/images/Raices y Alas Logo.png';
import { FiUser } from "react-icons/fi";
import { FiBriefcase } from "react-icons/fi";
import { FiMail } from "react-icons/fi";
import { FiLock } from "react-icons/fi";
import { FiEyeOff } from "react-icons/fi";
import { FiEye } from "react-icons/fi";
import { SPECIALIZATIONS } from "../../utils/constants";


export const Register = () => {

  /* === Estados locales === */

  const [ formData, setFormData ] =  useState({
    name: "",
    specialization: "",
    email: "",
    password: "",
    rol: "pedagogo",
  });

  //Estado de errores
  const [ error, setError ] = useState("");
  //Esatdo confirmado de exito
  const [ successMsg, setSuccessMsg ] = useState("");
  //Estado de carga del boton
  const [ isSubmitting, setIsSubmitting ] = useState(false);
  // Estado para ocultar/mostrar contraseña
  const [ showPassword, setShowPassword ] = useState(false);
  // Hook navigate - Instanciamos para manejar la redireccion
  const navigate = useNavigate();

  /* ==== Manejadores de evento - LOGICA DE REGISTRO === */

  //Manejador para actualizar formData
  const handleChange = (e) => {

    const { name, value } = e.target;

    if( error ||  successMsg ){
      setError("");
      setSuccessMsg("");
    }

    //Actualizamos formData en base al cambio
    setFormData({
      ...formData,
      [name]: value, 
    });
  };
  
  //Manejador para ocultar/mostrar contraseña
  const toggleShowPassword = () => {

    //Conmutamos el valor actual de showPassword
    setShowPassword( prev => !prev); //Con el prev => !prev, cambiamos el valor de true a false y viceversa
  };

  //Manejador para el vió del formulario
  const handleSubmit = async (e) => {

    //Prevenimos el comportamiento de recarga del formulario
    e.preventDefault();

    //Verificamos que name, email y pass no esten vacios
    if( !formData.name || !formData.email || !formData.password || !formData.specialization){

      setError("Por favor, debe cumplimentar los campos obligatorios");
      return; // Detenemos el proceso
    }

    //Bloque try-catch - Para manejar la logica de registro
    try{

      setIsSubmitting(true); // Establecemos el estado de carga

      //Realizamos la peticion al endpoint /register
      const response =  await apiClient.post("/auth/register", formData);
      setSuccessMsg("Cuenta creada con éxito. Redirigiendo a inicio de sesión...");
      
      // Esperamos 1.5 segundos para que el usuario lea el mensaje y redirigimos
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    }catch(err){

      const msg = err.response?.data?.message || "Error al crear la cuenta. Inténtelo de nuevo.";
      setError(msg);
    }finally{

      setIsSubmitting(false);
    }

  };

  


  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col items-center justify-center p-4">

      {/* CABECERA: Logo + Titulo */}
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

      {/* CARD principal con pestañas */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#EBE7DF] overflow-hidden mt-6 ">

        {/* Pestañas de Navegación */}
        <div className="grid grid-cols-2 text-center border-b border-[#EBE7DF] text-sm font-medium">
            <NavLink 
              to="/login"
              className="text-slate-400 hover:text-slate-600 py-4"
            >
              Iniciar sesión
            </NavLink>

            <NavLink
              to="/register"
              className="border-b-2 border-[#529471] text-[#529471] py-4"
            >
              Crear Cuenta
            </NavLink>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 ">

          {/* Mensajes de Error y Exito */}
          {error && (
            <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-3 text-center text-red-700 text-xs mb-4">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="w-full bg-green-50 border border-green-200 rounded-2xl p-3 text-center text-green-700 text-xs mb-4">
              {successMsg}
            </div>
          )}

          {/* === CAMPOS DEL FORMULARIO === */}
          {/* CAMPO: NOMBRE COMPLETO*/}
          <div className="relative w-full">
            <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nombre Completo</label>
            <input 
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-[#F5F2EB] border border-transparent focus:border-[#529471] focus:bg-white rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-700 outline-none transition-all"
            placeholder="ej: Lucía Rodríguez"
            />
            <FiUser className="absolute left-3.5 top-10 text-slate-400"/>
          </div>

          {/* CAMPO ESPECIALIZACIÓN */}
          <div className="relative w-full">
            <label htmlFor="specialization" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Especialidad</label>
            <select
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            className="w-full bg-[#F5F2EB] border border-transparent focus:border-[#529471] focus:bg-white rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-700 outline-none transition-all"
            >           
              <option value="">Selecciona una especialidad</option>
              {Object.values(SPECIALIZATIONS).map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
            <FiBriefcase className="absolute left-3.5 top-10 text-slate-400"/> 
          </div>

          {/* CAMPO EMAIL */}
          <div className="relative w-full">
            <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Correo Electrónico</label>
            <input 
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-[#F5F2EB] border border-transparent focus:border-[#529471] focus:bg-white rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-700 outline-none transition-all"
            placeholder="ejemplo@correo.com"
            />
            <FiMail className="absolute left-3.5 top-10 text-slate-400"/>
          </div>

          {/* CAMPO PASSWORD */}
          <div className="relative w-full">
            <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Contraseña</label>
            <input 
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-[#F5F2EB] border border-transparent focus:border-[#529471] focus:bg-white rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-700 outline-none transition-all"
            placeholder="Mínimo 8 caracteres"
            />
            {/* Icono del ojo para mostrar/ocultar contraseña */}
            <FiLock className="absolute left-3.5 top-10 text-slate-400"/>
            <button 
            type="button"
            onClick={toggleShowPassword} 
            className="absolute right-3.5 top-10 text-slate-400 hover:text-slate-600 focus:outline-none">
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

           {/* BOTON CREAR CUENTA */}
            <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#529471] hover:bg-[#437a5d] text-white font-medium py-3.5 rounded-2xl shadow-sm transition-all duration-200 text-sm mt-4 cursor-pointer">
              {isSubmitting ? "Creando Cuenta..." : "Crear Cuenta"}
            </button>
        </form>

      </div>
    </div>
  )
}
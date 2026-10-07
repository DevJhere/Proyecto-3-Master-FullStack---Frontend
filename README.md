# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

🎯 Guía de Implementación para Register.jsx
Abre 

Register.jsx
 y trabajemos en la estructura dividida en 4 pasos principales:

1️⃣ Importaciones y Hooks
En la parte superior necesitarás:

useState de React.
useNavigate y NavLink desde react-router-dom.
Tu cliente de axios configurado: import apiClient from "../../config/axios";.
La imagen del logo: import logo from "../../../assets/images/Raices y Alas Logo.png";.
Iconos de react-icons/fi: FiUser, FiBriefcase, FiMail, FiLock, FiEye, FiEyeOff.
2️⃣ Definición de Estados Locales
Dentro del componente Register:

formData: Objeto para capturar los datos del registro:
javascript
const [formData, setFormData] = useState({
  name: "",
  specialization: "",
  email: "",
  password: "",
  rol: "pedagogo", // Valor por defecto
});
error: String para mensajes de error.
successMsg: String para el mensaje de confirmación cuando el registro sea exitoso (ej. "¡Cuenta creada con éxito! Redirigiendo...").
isSubmitting: Booleano para el estado de carga del botón.
showPassword: Booleano para conmutar la visibilidad de la contraseña.
navigate: Instancia de useNavigate().
3️⃣ Manejadores de Eventos (handleChange, toggleShowPassword, handleSubmit)
handleChange(e):

Extrae name y value.
Si hay un error o successMsg activo, los limpia (setError(""), setSuccessMsg("")).
Actualiza formData de forma inmutable.
toggleShowPassword():

Conmuta setShowPassword(prev => !prev).
handleSubmit(e):

Función async.
Previene recarga: e.preventDefault().
Valida que name, email y password no estén vacíos.
Activa setIsSubmitting(true).
En un bloque try / catch:
javascript
try {
  const response = await apiClient.post("/auth/register", formData);
  setSuccessMsg("¡Cuenta creada con éxito! Redirigiendo a inicio de sesión...");
  
  // Esperamos 1.5 segundos para que el usuario lea el mensaje y redirigimos
  setTimeout(() => {
    navigate("/login");
  }, 1500);
} catch (err) {
  const msg = err.response?.data?.message || "Error al crear la cuenta. Inténtelo de nuevo.";
  setError(msg);
} finally {
  setIsSubmitting(false);
}
4️⃣ Estructura Visual (JSX)
La maquetación será casi idéntica a la de Login, manteniendo la coherencia de tu diseño:

Cabecera Superior: Fondo #F8F6F0, icono en tarjeta blanca, título RAÍCES Y ALAS y subtítulo GESTIÓN PT.
Pestañas:
Iniciar sesión: Inactiva (to="/login", texto gris).
Crear cuenta: Activa (to="/register", borde inferior verde #529471).
Formulario (<form onSubmit={handleSubmit}>):
Alerta de Error: {error && <div className="bg-red-50 text-red-700 text-xs p-3 rounded-2xl mb-4">{error}</div>}
Alerta de Éxito: {successMsg && <div className="bg-emerald-50 text-emerald-700 text-xs p-3 rounded-2xl mb-4">{successMsg}</div>}
Campo 1: NOMBRE COMPLETO (icon FiUser, placeholder "p.ej. Laura Prieto", name="name").
Campo 2: ESPECIALIDAD (icon FiBriefcase, placeholder "Selecciona tu especialidad", name="specialization").
Campo 3: CORREO ELECTRÓNICO (icon FiMail, placeholder "nombre@colegio.es", name="email").
Campo 4: CONTRASEÑA (icon FiLock, botón del ojo toggleShowPassword, name="password").
Botón Principal: <button type="submit" disabled={isSubmitting} className="w-full bg-[#529471] ..."> con texto dinámico {isSubmitting ? "Creando cuenta..." : "Crear mi cuenta"}.
🚀 Tu Primer Paso
Empieza declarando las importaciones, los estados y la lógica de handleSubmit en 

Register.jsx
.

Cuando tengas la lógica lista, pasamos a revisar la maquetación. ¡Adelante!
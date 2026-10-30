import { useState, useEffect, useMemo, useRef } from "react";
import { FiUsers, FiShield, FiBriefcase, FiPlus, FiSearch } from "react-icons/fi";
import { LuSearchX } from "react-icons/lu";
import apiClient from "../../config/axios";
import { useAuth } from "../../hooks/useAuth";
import { UserCard } from "../../components/users/UserCard";
import { NewUserModal } from "../../components/users/NewUserModal";
import { EditUserModal } from "../../components/users/EditUserModal";
import { DeleteUserModal } from "../../components/users/DeleteUserModal";
import { getApiErrorMessage } from "../../utils/APIHelpers";

export const Users = () => {
  const { user: currentUser, updateUser } = useAuth();

  // Estados de datos
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [warning, setWarning] = useState("");

  // Estados de filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // 'all' | 'pedagogo' | 'admin'

  // Estados de modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Carga de usuarios. También se usa para refrescar la lista tras crear un miembro, sin volver a mostrar el estado de carga.
  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/users");
      setUsers(res.data?.users || []);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Error al cargar la lista de usuarios."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Carga de datos al montar la página: el setState ocurre tras el await (no de forma síncrona), la regla no lo distingue al reutilizar la función para recargar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  // Helper para mostrar toast de éxito temporal. Guardamos el temporizador para cancelarlo si se muestra otro toast o se sale de la página.
  const toastTimer = useRef(null);

  useEffect(() => {
    return () => clearTimeout(toastTimer.current);
  }, []);

  const showSuccess = (msg) => {
    clearTimeout(toastTimer.current);
    setSuccessToast(msg);
    toastTimer.current = setTimeout(() => {
      setSuccessToast("");
    }, 4000);
  };

  // Métricas
  const totalUsers = users.length;
  const totalPedagogos = users.filter((user) => user.rol === "pedagogo").length;
  const totalAdmins = users.filter((user) => user.rol === "admin").length;

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.specialization?.toLowerCase().includes(term) ||
        u.rol?.toLowerCase().includes(term);

      // Filtro de Roles
      const matchesRole = roleFilter === "all" || u.rol === roleFilter;
      // Retornamos los usuarios que coincidan con el filtro de búsqueda y rol
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Callbacks de modales
  // Si el miembro se registró pero no se pudo asignar el rol de admin, lo avisamos en un banner (el modal ya se ha cerrado)
  const handleUserCreated = ({ roleAssignmentFailed } = {}) => {
    fetchUsers();

    if (roleAssignmentFailed) {
      setWarning("El miembro se registró correctamente, pero no se pudo asignarle el rol de administrador. Edítalo para cambiar su rol.");
      return;
    }

    setWarning("");
    showSuccess("Nuevo miembro del equipo registrado correctamente.");
  };

  //Manejador para Usuario Actualizado
  const handleUserUpdated = (updatedUser) => {
    setUsers((prev) =>
      prev.map((user) => (user._id === updatedUser._id ? { ...user, ...updatedUser } : user))
    );

    //Si el admin se ha editado a sí mismo, actualizamos también la sesión (menú lateral, permisos...)
    if (updatedUser._id === currentUser?._id) {
      updateUser({ ...currentUser, ...updatedUser });
    }

    showSuccess("Datos del usuario actualizados correctamente.");
  };

  //Manejador para Usuario Eliminado
  const handleUserDeleted = (deletedUser) => {
    setUsers((prev) => prev.filter((user) => user._id !== deletedUser._id));
    showSuccess(`El usuario "${deletedUser.name}" ha sido eliminado del equipo.`);
  };

  return (
    /* CAMBIO (scroll en Usuarios): antes la página tenía su propio overflow-y-auto, py-6 y márgenes mb-6/mb-8
       entre bloques que, sumados al p-8 del <main>, generaban scroll. Ahora ocupa el alto disponible (h-full):
       cabecera, métricas y buscador quedan fijos y solo el listado de tarjetas puede hacer scroll interno
       si hay muchos miembros. */
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-8 h-full flex flex-col">
        {/* CABECERA PRINCIPAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-3xl tracking-wider font-semibold text-ink leading-snug">
              Gestión de Equipo
            </h1>
            <p className="text-sm text-ink-muted mt-1 tracking-wider leading-snug">
              Supervisión de profesionales, asignación de roles y control de acceso
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="bg-[#529471] hover:bg-[#437a5d] text-white px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <FiPlus className="text-lg" />
            <span>Nuevo Miembro</span>
          </button>
        </div>

        {/* TOAST DE ÉXITO */}
        {successToast && (
          <div role="status" className="mb-4 shrink-0 p-4 bg-[#EEF7F2] border border-[#A8D4BB] text-[#2D6A4F] rounded-2xl text-xs font-semibold flex items-center justify-between">
            <span>{successToast}</span>
            <button
              onClick={() => setSuccessToast("")}
              aria-label="Cerrar aviso"
              className="text-[#2D6A4F] hover:text-[#1a3f2f] cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* AVISO: acción completada solo en parte */}
        {warning && (
          <div role="alert" className="mb-4 shrink-0 p-4 bg-[#FFF8E6] border border-[#F2D98D] text-[#8A6100] rounded-2xl text-xs font-semibold flex items-center justify-between">
            <span>{warning}</span>
            <button type="button" onClick={() => setWarning("")} aria-label="Cerrar advertencia" className="cursor-pointer">✕</button>
          </div>
        )}

        {/* MENSAJE DE ERROR GLOBAL */}
        {error && (
          <div role="alert" className="mb-4 shrink-0 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* TARJETAS DE MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 shrink-0">
          {/* Card 1: Total */}
          <div className="bg-white rounded-3xl border border-[#EBE7DF] p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Total Equipo
              </p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalUsers}</p>
              <p className="text-xs text-ink-faint mt-0.5">Cuentas activas en el centro</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#EBE7DF] flex items-center justify-center text-slate-600 text-xl">
              <FiUsers />
            </div>
          </div>

          {/* Card 2: Pedagogos */}
          <div className="bg-white rounded-3xl border border-[#EBE7DF] p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Pedagogos / Terapeutas
              </p>
              <p className="text-2xl font-bold text-[#2D6A4F] mt-1">{totalPedagogos}</p>
              <p className="text-xs text-ink-faint mt-0.5">Atención directa a alumnos</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#EEF7F2] border border-[#D5EFE2] flex items-center justify-center text-[#2D6A4F] text-xl">
              <FiBriefcase />
            </div>
          </div>

          {/* Card 3: Administradores */}
          <div className="bg-white rounded-3xl border border-[#EBE7DF] p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Administradores
              </p>
              <p className="text-2xl font-bold text-[#69488E] mt-1">{totalAdmins}</p>
              <p className="text-xs text-ink-faint mt-0.5">Control de gestión y roles</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F4F0FA] border border-[#E4DAF5] flex items-center justify-center text-[#69488E] text-xl">
              <FiShield />
            </div>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-4 shrink-0">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, correo, especialidad o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-[#EBE7DF] rounded-2xl text-sm text-slate-700 placeholder:text-ink-faint focus:outline-none focus:border-[#529471] transition-colors"
            />
          </div>

          {/* Filtros por Rol en formato pills */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#EBE7DF] rounded-2xl shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${roleFilter === "all"
                ? "bg-[#529471] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-800 hover:bg-[#FAF8F5]"
                }`}
            >
              Todos ({totalUsers})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("pedagogo")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${roleFilter === "pedagogo"
                ? "bg-[#2D6A4F] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-800 hover:bg-[#FAF8F5]"
                }`}
            >
              Pedagogos ({totalPedagogos})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("admin")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${roleFilter === "admin"
                ? "bg-[#69488E] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-800 hover:bg-[#FAF8F5]"
                }`}
            >
              Admins ({totalAdmins})
            </button>
          </div>
        </div>

        {/* ESTADOS DE CARGA Y VACÍO */}
        {isLoading && (
          <div className="text-center py-8 text-slate-400 font-medium text-sm tracking-wider">
            Cargando miembros del equipo...
          </div>
        )}

        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center py-8 bg-white rounded-3xl border border-[#EBE7DF] p-6">
            <LuSearchX className="w-14 h-14 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-bold text-slate-700">No se encontraron miembros</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No hay profesionales que coincidan con los filtros aplicados. Intenta con otro término de búsqueda.
            </p>
          </div>
        )}

        {/* GRID DE TARJETAS DE USUARIOS */}
        {!isLoading && filteredUsers.length > 0 && (
          // CAMBIO: grid con scroll interno (flex-1 min-h-0 overflow-y-auto) para que la página no desplace
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start flex-1 min-h-0 overflow-y-auto p-1">
            {filteredUsers.map((user) => (
              <UserCard
                key={user._id}
                user={user}
                currentUserId={currentUser?._id}
                onEdit={(u) => setUserToEdit(u)}
                onDelete={(u) => setUserToDelete(u)}
              />
            ))}
          </div>
        )}

        {/* MODAL CREAR USUARIO */}
        <NewUserModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onUserCreated={handleUserCreated}
        />

        {/* MODAL EDITAR USUARIO */}
        <EditUserModal
          key={userToEdit?._id}
          isOpen={!!userToEdit}
          onClose={() => setUserToEdit(null)}
          userToEdit={userToEdit}
          onUserUpdated={handleUserUpdated}
        />

        {/* MODAL ELIMINAR USUARIO */}
        <DeleteUserModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          userToDelete={userToDelete}
          onUserDeleted={handleUserDeleted}
        />
      </div>
    </div>
  );
};
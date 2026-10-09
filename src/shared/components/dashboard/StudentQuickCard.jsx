import { Link } from "react-router-dom";
import { getAvatarUrl } from "../../utils/HelperAvatar";

export const StudentQuickCard = ({student}) => {
  // Creamos el acceso directo al perfil del alumno desde el dashboard junto con los estilos
  return(
  <Link
  to={`/students/${student._id}`}
  className="bg-white rounded-2xl p-4 border border-[#EBE7DF] hover:border-[#529471] shadow-sm hover:shadow-md transition-all flex items-center gap-3 group cursor-pointer"
  >
    {/* Mostramos imagen y datos del alumno de acceso rápido */}
    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-[#EBE7DF] group-hover:scale-105 transition-transform">
        <img src={getAvatarUrl(student.avatar)} alt={student.name} className="w-full h-full object-cover" />
    </div>

    <div className="overflow-hidden">
        <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-[#529471] transition-colors">
            {student.name}
        </h3>
        <p className="text-xs text-slate-400 truncate">{student.course || "Curso no asignado"}</p>
    </div>

  </Link>
  );
};

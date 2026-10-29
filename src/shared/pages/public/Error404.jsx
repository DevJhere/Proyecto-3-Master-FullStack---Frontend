import { Link } from "react-router-dom";

export const Error404 = () => {
  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-6xl font-serif text-slate-800">404</p>
      <h1 className="text-xl font-semibold text-slate-800 mt-2">Página no encontrada</h1>
      <p className="text-sm text-ink-muted mt-1 max-w-sm">
        La página que buscas no existe o ha cambiado de dirección.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 bg-[#529471] hover:bg-[#437a5d] text-white font-medium px-6 py-3 rounded-2xl shadow-sm transition-all text-sm"
      >
        Volver al inicio
      </Link>
    </div>
  )
}

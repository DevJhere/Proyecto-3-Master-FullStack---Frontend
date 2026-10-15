import apiClient from "../../config/axios";
import { useState } from "react";
import { FiFileText, FiDownload, FiUploadCloud } from "react-icons/fi";
import { IoClose } from "react-icons/io5";



export const ReportList = ( {studentId, reports = [], onReportUploaded}) => {

  // Definimos estados locales
  const [ isUploading, setIsUploading ] = useState(false);
  const [ showUploadModal, setShowUploadModal ] = useState(false);
  const [ uploadError, setUploadError ] = useState("");
  
  // Estado para gestionar el título y el archivo del reporte
  const [ title, setTitle ] = useState("");
  const [ file, setFile ] = useState(null);

  //Formateador de fecha
  const formatDate = (dateString) => {
    //Verficamos que exista la fecha registrada
    if(!dateString) return "Fecha no registrada";

    const date = new Date(dateString);

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  //Manejador para subir el nuevo informe
  const handleUploadReport = async (e) => {
    e.preventDefault();

    if(!file){
      setUploadError("POr favor, selecciona un documento")
      return;
    }

    try {

      setIsUploading(true);
      setUploadError("");

      // Capturamos los datos para enviar
      const dataToSend = new FormData();
      dataToSend.append("title", title.trim() || "Informe de Evaluacion");
      dataToSend.append("attachmentDocument", file);

      //Solicitud a la API
      await apiClient.post(`/students/${studentId}/reports`, dataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Refrescamos las sesiones y reseteamos
      onReportUploaded();
      setShowUploadModal(false);
      setTitle("");
      setFile(null);

    } catch (err) {
      setUploadError(err.response?.data?.error ||
        err.response?.data?.message ||
        "Eroor al subir el informe"
      )
    } finally {
      setIsUploading(false);
    }
  };
  

  return (
    <div className="space-y-4">
      {/* Boton  /barra para Subir informes */}
      <div className="flex justify-end">
        <button
        type="button"
        onClick={ () => setShowUploadModal(true)}
        className="px-4 py-2 bg-[#59a4cc] hover:bg-[#43afe0] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <FiUploadCloud size={16}/>
          <span>Subir Informe</span>
        </button>
      </div>

      {/* Estado vacío */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#EBE7DF] p-12 text-center text-ink-muted">
          <FiFileText size={36} className="mx-auto mb-3 text-ink-muted"/>
          <p className="font-semibold tracking-wider text-ink-muted">No hay informes ni documentos adjuntos</p>
          <p className="text-xs text-ink-faint mt-1">
            Los documentos adjuntados en las sesiones o subidos directamente aparecerán aquí.
          </p>
        </div>
       ) : (
        // Lista de Tarjetas de Documentos
        <div className="space-y-3">
          {reports.map( (report, index) => (
            <div
            key={report._id || index }
            className="bg-white rounded-2xl border border-[#EBE7DF] p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
            >
              {/* Lado Izquierdo: Icono | Título | Fecha */}
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-[#FDF1EE] text-[#E07A5F] flex items-center justify-center shrink-0">
                  <FiFileText size={20} />
                </div>

                <div className="overflow-hidden">
                  <h4 className="font-semibold text-ink-muted text-xs truncate">
                    {report.title || "Informe de Evaluación"}
                  </h4>
                  <p className="text-xs text-ink-faint mt-0.5">
                    {formatDate(report.date || report.createdAt)} · Documento adjunto
                  </p>
                </div>
              </div>

              {/* Lado derecho: Boton descargar */}
              <a 
              href={report.attachmentDocument}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F4F9F6] hover:bg-[#E2F2E9] text-[#2D6A4F] text-xs font-semibold rounded-xl transition-colors shrink-0"
              >
                <FiDownload size={14} />
                <span>Descargar</span>
              </a>
            </div>
          ))}

        </div>
       )}

       {/* Modal para Subir Informe */}
       {showUploadModal && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Contenedor del Modal */}
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden p-6 space-y-4">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-3">
              <h3 className="font-semibold text-ink text-base">Subir nuevo Informe</h3>

              <button
              onClick={ () => setShowUploadModal(false)}
              className="text-slate-400 hover:text-slate-600 rounded-full p-1"
              >
                <IoClose size={18} />
              </button>
            </div>

            {/* Estados de error */}
            {uploadError && (
              <div className="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs">
                {uploadError}
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleUploadReport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">Titulo del Informe</label>
                {/* Campo de texto titulo */}
                <input
                  type="text"
                  placeholder="Ej: Informe Inicial de Evaluación"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EBE7DF] rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:border-[#529471]"
                />
              </div>

              {/* Archivo adjunto */}
              <div>
                <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
                  Archivo (PDF o Documento) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-ink-muted file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#E2F2E9] file:text-[#2D6A4F] hover:file:bg-[#d0ebd9] cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-[#529471] hover:bg-[#437a5d] text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isUploading ? "Subiendo..." : "Subir"}
                </button>
              </div>
            </form>

          </div>

        </div>
       )}
    </div>
  )
}

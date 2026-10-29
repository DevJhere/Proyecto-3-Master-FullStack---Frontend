import apiClient from "../../config/axios";
import { useState } from "react";
import { FiFileText, FiDownload, FiUploadCloud } from "react-icons/fi";
import { Modal } from "../ui/Modal";
import { SIZE_FILES } from "../../utils/constants";
import { getApiErrorMessage } from "../../utils/APIHelpers";

//Formatos de documento que acepta el backend para los informes
const ALLOWED_DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];
const DEFAULT_REPORT_TITLE = "Informe de Evaluación";

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

  //Cerramos el modal y dejamos el formulario limpio para la próxima vez
  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadError("");
    setTitle("");
    setFile(null);
  };

  //Manejador al elegir el documento: validamos formato y tamaño antes de enviarlo
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if(!selected) return;

    const isAllowedFormat = ALLOWED_DOCUMENT_EXTENSIONS.some( (extension) => selected.name.toLowerCase().endsWith(extension));
    if(!isAllowedFormat){
      setFile(null);
      setUploadError("El documento debe ser un PDF, Word (.doc, .docx) o de texto (.txt).");
      return;
    }

    if(selected.size > SIZE_FILES.MAX_SIZE_20MB){
      setFile(null);
      setUploadError("El documento no puede superar los 20MB.");
      return;
    }

    setUploadError("");
    setFile(selected);
  };

  //Manejador para subir el nuevo informe
  const handleUploadReport = async (e) => {
    e.preventDefault();

    if(!file){
      setUploadError("Por favor, selecciona un documento")
      return;
    }

    try {

      setIsUploading(true);
      setUploadError("");

      // Capturamos los datos para enviar
      const dataToSend = new FormData();
      dataToSend.append("title", title.trim() || DEFAULT_REPORT_TITLE);
      dataToSend.append("attachmentDocument", file);

      //Solicitud a la API
      await apiClient.post(`/students/${studentId}/reports`, dataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Refrescamos la lista de informes y reseteamos
      await onReportUploaded();
      closeUploadModal();

    } catch (err) {
      setUploadError(getApiErrorMessage(err, "Error al subir el informe"));
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
                    {report.title || DEFAULT_REPORT_TITLE}
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
       <Modal
        isOpen={showUploadModal}
        onClose={isUploading ? () => {} : closeUploadModal}
        title="Subir nuevo Informe"
        maxWidth="max-w-md"
       >
        {/* Estados de error */}
        {uploadError && (
          <div role="alert" className="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs mt-4">
            {uploadError}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleUploadReport} className="space-y-4 mt-4">
          <div>
            <label htmlFor="report-title" className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">Titulo del Informe</label>
            {/* Campo de texto titulo */}
            <input
              type="text"
              id="report-title"
              placeholder="Ej: Informe Inicial de Evaluación"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#EBE7DF] rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:border-[#529471]"
            />
          </div>

          {/* Archivo adjunto */}
          <div>
            <label htmlFor="report-file" className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
              Archivo (PDF o Documento) *
            </label>
            <input
              type="file"
              id="report-file"
              accept={ALLOWED_DOCUMENT_EXTENSIONS.join(",")}
              onChange={handleFileChange}
              className="w-full text-xs text-ink-muted file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#E2F2E9] file:text-[#2D6A4F] hover:file:bg-[#d0ebd9] cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeUploadModal}
              disabled={isUploading}
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
       </Modal>
    </div>
  )
}

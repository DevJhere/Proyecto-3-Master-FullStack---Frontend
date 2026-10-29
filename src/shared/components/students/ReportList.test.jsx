// Listado de informes del alumno y modal para subir uno nuevo (multipart a POST /students/:id/reports)

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { ReportList } from "./ReportList";
import { api, server } from "../../../test/server";

const REPORTS = [
  { _id: "r1", title: "Informe inicial", date: "2026-10-01T10:00:00.000Z", attachmentDocument: "https://res.cloudinary.com/test/image/upload/v1/a/inicial.pdf" },
  { _id: "r2", title: "", date: "2026-11-02T10:00:00.000Z", attachmentDocument: "https://res.cloudinary.com/test/raw/upload/v1/a/sin-titulo.docx" },
];

const setup = ({ reports = REPORTS, userOptions } = {}) => {
  const onReportUploaded = vi.fn().mockResolvedValue(undefined);
  render(<ReportList studentId="student-7" reports={reports} onReportUploaded={onReportUploaded} />);
  return { onReportUploaded, user: userEvent.setup(userOptions) };
};

// Registra la subida guardando el FormData recibido; `response` permite simular errores del servidor
const captureUpload = (response = () => HttpResponse.json({ message: "Informe subido correctamente" }, { status: 201 })) => {
  const captured = { form: null, calls: 0 };
  server.use(
    http.post(api("/students/student-7/reports"), async ({ request }) => {
      captured.calls += 1;
      captured.form = await request.formData();
      return response();
    }),
  );
  return captured;
};

// Abre el modal con el botón 'Subir Informe'
const openModal = (user) => user.click(screen.getByRole("button", { name: /Subir Informe/ }));
const pdf = (name = "informe.pdf") => new File(["pdf"], name, { type: "application/pdf" });

describe("ReportList: listado", () => {
  it("muestra el estado vacío cuando no hay informes", () => {
    setup({ reports: [] });
    expect(screen.getByText("No hay informes ni documentos adjuntos")).toBeInTheDocument();
  });

  it("muestra cada informe con título, fecha y enlace al documento", () => {
    setup();

    expect(screen.getByText("Informe inicial")).toBeInTheDocument();
    expect(screen.getByText(/1 de octubre de 2026/)).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: /Descargar/ });
    expect(links.map((link) => link.getAttribute("href"))).toEqual(REPORTS.map((r) => r.attachmentDocument));
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("usa un título por defecto si el informe no tiene", () => {
    setup();
    expect(screen.getByText("Informe de Evaluación")).toBeInTheDocument();
  });
});

describe("ReportList: subir un informe", () => {
  it("el modal está cerrado hasta pulsar 'Subir Informe'", async () => {
    const { user } = setup();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await openModal(user);

    expect(screen.getByRole("dialog", { name: "Subir nuevo Informe" })).toBeInTheDocument();
  });

  it("solo ofrece los formatos que acepta el backend", async () => {
    const { user } = setup();
    await openModal(user);
    expect(screen.getByLabelText(/Archivo/)).toHaveAttribute("accept", ".pdf,.doc,.docx,.txt");
  });

  it("exige elegir un documento", async () => {
    const captured = captureUpload();
    const { user } = setup();
    await openModal(user);

    await user.click(screen.getByRole("button", { name: "Subir" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Por favor, selecciona un documento");
    expect(captured.calls).toBe(0);
  });

  it("envía título y documento como multipart, refresca la lista y cierra el modal", async () => {
    const captured = captureUpload();
    const { user, onReportUploaded } = setup();
    await openModal(user);

    await user.type(screen.getByLabelText("Titulo del Informe"), "  Informe de seguimiento  ");
    await user.upload(screen.getByLabelText(/Archivo/), pdf("seguimiento.pdf"));
    await user.click(screen.getByRole("button", { name: "Subir" }));

    await waitFor(() => expect(onReportUploaded).toHaveBeenCalledTimes(1));
    expect(captured.form.get("title")).toBe("Informe de seguimiento");
    expect(captured.form.get("attachmentDocument").name).toBe("seguimiento.pdf");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("sin título envía el título por defecto", async () => {
    const captured = captureUpload();
    const { user } = setup();
    await openModal(user);

    await user.upload(screen.getByLabelText(/Archivo/), pdf());
    await user.click(screen.getByRole("button", { name: "Subir" }));

    await waitFor(() => expect(captured.calls).toBe(1));
    expect(captured.form.get("title")).toBe("Informe de Evaluación");
  });

  it.each([
    ["una imagen", new File(["x"], "foto.png", { type: "image/png" }), "El documento debe ser un PDF"],
    ["una hoja de cálculo", new File(["x"], "datos.xlsx"), "El documento debe ser un PDF"],
    ["un PDF de más de 20MB", new File([new ArrayBuffer(20 * 1024 * 1024 + 1)], "enorme.pdf", { type: "application/pdf" }), "no puede superar los 20MB"],
  ])("rechaza %s antes de enviar", async (_, file, message) => {
    const captured = captureUpload();
    const { user } = setup({ userOptions: { applyAccept: false } });
    await openModal(user);

    await user.upload(screen.getByLabelText(/Archivo/), file);
    expect(screen.getByRole("alert")).toHaveTextContent(message);

    await user.click(screen.getByRole("button", { name: "Subir" }));
    expect(captured.calls).toBe(0);
  });

  it.each(["a.pdf", "a.DOC", "a.docx", "a.txt"])("acepta el formato de %s", async (name) => {
    const { user } = setup();
    await openModal(user);

    await user.upload(screen.getByLabelText(/Archivo/), new File(["x"], name));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("muestra el error del servidor y deja el modal abierto", async () => {
    captureUpload(() => HttpResponse.json({ message: "No autorizado", error: "No tienes permiso para subir informes a este estudiante" }, { status: 403 }));
    const { user, onReportUploaded } = setup();
    await openModal(user);
    await user.upload(screen.getByLabelText(/Archivo/), pdf());

    await user.click(screen.getByRole("button", { name: "Subir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso para subir informes a este estudiante");
    expect(onReportUploaded).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir" })).toBeEnabled();
  });

  it("deshabilita los botones mientras sube", async () => {
    captureUpload(async () => {
      await delay(100);
      return HttpResponse.json({}, { status: 201 });
    });
    const { user } = setup();
    await openModal(user);
    await user.upload(screen.getByLabelText(/Archivo/), pdf());

    await user.click(screen.getByRole("button", { name: "Subir" }));

    expect(await screen.findByRole("button", { name: "Subiendo..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("Cancelar, Escape y el botón Cerrar cierran el modal y descartan lo escrito", async () => {
    const { user } = setup();

    await openModal(user);
    await user.type(screen.getByLabelText("Titulo del Informe"), "Borrador");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await openModal(user);
    expect(screen.getByLabelText("Titulo del Informe")).toHaveValue("");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await openModal(user);
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

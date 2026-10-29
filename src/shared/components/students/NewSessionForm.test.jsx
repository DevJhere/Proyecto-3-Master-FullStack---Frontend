import { afterEach, describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { NewSessionForm } from "./NewSessionForm";
import { api, server } from "../../../test/server";

afterEach(() => vi.useRealTimers());

const setup = ({ studentId = "student-1", userOptions } = {}) => {
  const onClose = vi.fn();
  const onSessionCreated = vi.fn();
  render(<NewSessionForm studentId={studentId} onClose={onClose} onSessionCreated={onSessionCreated} />);
  return { onClose, onSessionCreated, user: userEvent.setup(userOptions) };
};

// Captura la petición POST /sessions, sea JSON o multipart
const captureSessionPost = (response = () => HttpResponse.json({ message: "Sesión creada exitosamente" }, { status: 201 })) => {
  const captured = { json: null, form: null, calls: 0 };
  server.use(
    http.post(api("/sessions"), async ({ request }) => {
      captured.calls += 1;
      if ((request.headers.get("content-type") || "").includes("multipart/form-data")) {
        captured.form = await request.formData();
      } else {
        captured.json = await request.json();
      }
      return response();
    }),
  );
  return captured;
};

const setDate = (value) => fireEvent.change(screen.getByLabelText(/Fecha y hora/), { target: { value } });
const save = (user) => user.click(screen.getByRole("button", { name: "Guardar Registro" }));

describe("NewSessionForm", () => {
  it("propone por defecto la fecha y hora actuales en hora local", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 5, 10, 30)); // 5 nov 2026, 10:30 en Madrid

    setup();

    expect(screen.getByLabelText(/Fecha y hora/)).toHaveValue("2026-11-05T10:30");
  });

  it("la duración es de 60 minutos y no se puede editar", () => {
    setup();
    expect(screen.getByLabelText(/Duración/)).toHaveValue(60);
    expect(screen.getByLabelText(/Duración/)).toHaveAttribute("readonly");
  });

  it("envía la fecha en ISO con la zona horaria correcta (10:00 en Madrid = 09:00 UTC en noviembre)", async () => {
    const captured = captureSessionPost();
    const { user } = setup({ studentId: "alumno-9" });
    setDate("2026-11-05T10:00");
    await user.type(screen.getByLabelText("Notas de Intervención"), "Trabajo de lectura");

    await save(user);

    await waitFor(() => expect(captured.calls).toBe(1));
    expect(captured.json).toEqual({
      student: "alumno-9",
      date: "2026-11-05T09:00:00.000Z",
      duration: 60,
      status: "Pendiente",
      notes: "Trabajo de lectura",
    });
  });

  it("respeta el horario de verano: 10:00 en agosto = 08:00 UTC", async () => {
    const captured = captureSessionPost();
    const { user } = setup();
    setDate("2026-08-05T10:00");

    await save(user);

    await waitFor(() => expect(captured.calls).toBe(1));
    expect(captured.json.date).toBe("2026-08-05T08:00:00.000Z");
  });

  it("con documento adjunto envía multipart con la fecha en ISO", async () => {
    const captured = captureSessionPost();
    const { user } = setup({ studentId: "alumno-9" });
    setDate("2026-11-05T10:00");
    await user.upload(screen.getByLabelText(/Seleccionar PDF/), new File(["pdf"], "informe.pdf", { type: "application/pdf" }));
    expect(screen.getByText("informe.pdf")).toBeInTheDocument();

    await save(user);

    await waitFor(() => expect(captured.calls).toBe(1));
    expect(captured.form.get("student")).toBe("alumno-9");
    expect(captured.form.get("date")).toBe("2026-11-05T09:00:00.000Z");
    expect(captured.form.get("attachmentDocument").name).toBe("informe.pdf");
  });

  it("avisa al padre y se cierra cuando la sesión se crea", async () => {
    captureSessionPost();
    const { user, onClose, onSessionCreated } = setup();

    await save(user);

    await waitFor(() => expect(onSessionCreated).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("exige fecha y hora", async () => {
    const captured = captureSessionPost();
    const { user } = setup();
    setDate("");

    await save(user);

    expect(screen.getByRole("alert")).toHaveTextContent("Por favor, ingresa la fecha y hora de la sesión.");
    expect(captured.calls).toBe(0);
  });

  it("muestra el motivo concreto cuando el horario está ocupado (409) y no se cierra", async () => {
    captureSessionPost(() =>
      HttpResponse.json(
        { message: "Horario no disponible", error: "El pedagogo ya tiene una sesión programada en ese horario" },
        { status: 409 },
      ),
    );
    const { user, onClose, onSessionCreated } = setup();

    await save(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("El pedagogo ya tiene una sesión programada en ese horario");
    expect(onClose).not.toHaveBeenCalled();
    expect(onSessionCreated).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Guardar Registro" })).toBeEnabled();
  });

  it("muestra un mensaje de conexión si no hay respuesta del servidor", async () => {
    captureSessionPost(() => HttpResponse.error());
    const { user } = setup();

    await save(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo conectar con el servidor");
  });

  it("deshabilita el botón mientras guarda", async () => {
    captureSessionPost(async () => {
      await delay(100);
      return HttpResponse.json({}, { status: 201 });
    });
    const { user } = setup();

    await save(user);

    expect(await screen.findByRole("button", { name: "Guardando..." })).toBeDisabled();
  });

  it.each([
    ["una imagen", new File(["x"], "foto.png", { type: "image/png" }), "El documento debe ser un PDF"],
    ["un ejecutable", new File(["x"], "virus.exe", { type: "application/octet-stream" }), "El documento debe ser un PDF"],
    ["un PDF de más de 20MB", new File([new ArrayBuffer(20 * 1024 * 1024 + 1)], "enorme.pdf", { type: "application/pdf" }), "no puede superar los 20MB"],
  ])("rechaza %s como documento adjunto", async (_, file, message) => {
    const { user } = setup({ userOptions: { applyAccept: false } });

    await user.upload(screen.getByLabelText(/Seleccionar PDF/), file);

    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(screen.getByText("Seleccionar PDF o documento")).toBeInTheDocument(); // no se adjunta
  });

  it.each(["informe.pdf", "informe.DOCX", "notas.txt", "viejo.doc"])("acepta el documento %s", async (name) => {
    const { user } = setup();
    await user.upload(screen.getByLabelText(/Seleccionar PDF/), new File(["x"], name));
    expect(screen.getByText(name)).toBeInTheDocument();
  });

  it("Cancelar llama a onClose sin enviar nada", async () => {
    const captured = captureSessionPost();
    const { user, onClose } = setup();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(captured.calls).toBe(0);
  });
});

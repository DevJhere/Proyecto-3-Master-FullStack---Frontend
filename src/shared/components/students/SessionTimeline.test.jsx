// Historial de sesiones del alumno: orden, contenido y cambio de estado (PUT /sessions/:id) desde el menú desplegable

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { SessionTimeline } from "./SessionTimeline";
import { api, server } from "../../../test/server";
import { makeSession } from "../../../test/fixtures";

const setup = (sessions, { onSessionUpdated = vi.fn().mockResolvedValue(undefined) } = {}) => {
  render(<SessionTimeline sessions={sessions} onSessionUpdated={onSessionUpdated} />);
  return { onSessionUpdated, user: userEvent.setup() };
};

// Registra PUT /sessions/:id guardando el id y el body; `response` permite simular errores
const capturePut = (response = () => HttpResponse.json({ message: "Sesión actualizada exitosamente" })) => {
  const captured = { id: null, body: null, calls: 0 };
  server.use(
    http.put(api("/sessions/:id"), async ({ request, params }) => {
      captured.calls += 1;
      captured.id = params.id;
      captured.body = await request.json();
      return response();
    }),
  );
  return captured;
};

// Qué se pinta para cada sesión y el estado vacío
describe("SessionTimeline: contenido", () => {
  it("muestra el estado vacío sin sesiones", () => {
    setup([]);
    expect(screen.getByText("No hay sesiones registradas")).toBeInTheDocument();
  });

  it("ordena el historial con la sesión más reciente primero", () => {
    setup([
      makeSession({ _id: "a", notes: "Septiembre", date: "2026-09-10T09:00:00.000Z" }),
      makeSession({ _id: "c", notes: "Noviembre", date: "2026-11-10T09:00:00.000Z" }),
      makeSession({ _id: "b", notes: "Octubre", date: "2026-10-10T09:00:00.000Z" }),
    ]);

    const notes = screen.getAllByText(/^(Septiembre|Octubre|Noviembre)$/).map((node) => node.textContent);
    expect(notes).toEqual(["Noviembre", "Octubre", "Septiembre"]);
  });

  it("no modifica el array recibido al ordenarlo", () => {
    const sessions = [
      makeSession({ date: "2026-09-10T09:00:00.000Z" }),
      makeSession({ date: "2026-11-10T09:00:00.000Z" }),
    ];
    const original = [...sessions];
    setup(sessions);
    expect(sessions).toEqual(original);
  });

  it("muestra duración, fecha, notas y el estado de cada sesión", () => {
    setup([makeSession({ duration: 45, notes: "Trabajo de lectura", status: "Completado", date: "2026-11-05T09:00:00.000Z" })]);

    expect(screen.getByText("45 min")).toBeInTheDocument();
    expect(screen.getByText(/05 nov/)).toBeInTheDocument();
    expect(screen.getByText("Trabajo de lectura")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Completado/ })).toBeInTheDocument();
  });

  it("usa 60 min y un texto por defecto si faltan la duración o las notas", () => {
    setup([makeSession({ duration: undefined, notes: "" })]);
    expect(screen.getByText("60 min")).toBeInTheDocument();
    expect(screen.getByText("Sesión de apoyo pedagógico sin notas adicionales.")).toBeInTheDocument();
  });

  it("enlaza al documento adjunto solo cuando existe", () => {
    setup([
      makeSession({ notes: "Con documento", attachmentDocument: "https://res.cloudinary.com/test/raw/upload/v1/a/doc.pdf" }),
      makeSession({ notes: "Sin documento", attachmentDocument: "" }),
    ]);

    const links = screen.getAllByRole("link", { name: /Ver documento adjunto/ });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://res.cloudinary.com/test/raw/upload/v1/a/doc.pdf");
  });
});

// Menú de estados: petición, recarga del padre, estado de espera y errores de la API
describe("SessionTimeline: cambio de estado", () => {
  it("el menú ofrece los tres estados y marca el actual", async () => {
    const { user } = setup([makeSession({ status: "Pendiente" })]);

    await user.click(screen.getByRole("button", { name: /Pendiente/ }));

    for (const status of ["Pendiente", "Cancelado", "Completado"]) {
      expect(screen.getByRole("button", { name: status })).toBeInTheDocument();
    }
  });

  it("al elegir un estado envía PUT con el nuevo estado y recarga las sesiones", async () => {
    const captured = capturePut();
    const { user, onSessionUpdated } = setup([makeSession({ _id: "ses-42", status: "Pendiente" })]);

    await user.click(screen.getByRole("button", { name: /Pendiente/ }));
    await user.click(screen.getByRole("button", { name: "Completado" }));

    await waitFor(() => expect(onSessionUpdated).toHaveBeenCalledTimes(1));
    expect(captured.id).toBe("ses-42");
    expect(captured.body).toEqual({ status: "Completado" });
  });

  it("muestra 'Actualizando...' mientras espera y cierra el menú al terminar", async () => {
    capturePut(async () => {
      await delay(100);
      return HttpResponse.json({});
    });
    const { user } = setup([makeSession({ status: "Pendiente" })]);

    await user.click(screen.getByRole("button", { name: /Pendiente/ }));
    await user.click(screen.getByRole("button", { name: "Cancelado" }));

    expect(await screen.findByRole("button", { name: /Actualizando/ })).toBeDisabled();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Cancelado" })).not.toBeInTheDocument());
  });

  it("si la API rechaza el cambio (p. ej. horario ocupado al reactivar) avisa con el motivo y no recarga", async () => {
    capturePut(() =>
      HttpResponse.json({ message: "Horario no disponible", error: "El pedagogo ya tiene una sesión programada en ese horario" }, { status: 409 }),
    );
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { user, onSessionUpdated } = setup([makeSession({ status: "Cancelado" })]);

    await user.click(screen.getByRole("button", { name: /Cancelado/ }));
    await user.click(screen.getByRole("button", { name: "Pendiente" }));

    await waitFor(() => expect(alert).toHaveBeenCalledWith("El pedagogo ya tiene una sesión programada en ese horario"));
    expect(onSessionUpdated).not.toHaveBeenCalled();
  });

  it("pulsar fuera del menú lo cierra sin enviar nada", async () => {
    const captured = capturePut();
    const { user } = setup([makeSession({ status: "Pendiente" })]);

    await user.click(screen.getByRole("button", { name: /Pendiente/ }));
    expect(screen.getByRole("button", { name: "Completado" })).toBeInTheDocument();

    // El fondo invisible que cierra el menú es el elemento fixed que lo acompaña
    await user.click(document.querySelector(".fixed.inset-0"));

    expect(screen.queryByRole("button", { name: "Completado" })).not.toBeInTheDocument();
    expect(captured.calls).toBe(0);
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { ScheduleSessionModal } from "./ScheduleSessionModal";
import { api, server } from "../../../test/server";
import { makeSession, makeStudent } from "../../../test/fixtures";

// Jueves 5 de noviembre de 2026, 10:00 hora de Madrid (09:00 UTC)
const SELECTED = new Date(2026, 10, 5, 10, 0);

const lucia = makeStudent({ _id: "s-lucia", name: "Lucía Navarro", course: "3 Primaria" });
const pablo = makeStudent({ _id: "s-pablo", name: "Pablo Ruiz", course: "1 ESO" });

const setup = (props = {}) => {
  const onClose = vi.fn();
  const onSessionCreated = vi.fn();
  render(
    <ScheduleSessionModal
      isOpen
      onClose={onClose}
      selectedDate={SELECTED}
      sessions={[]}
      students={[lucia, pablo]}
      onSessionCreated={onSessionCreated}
      {...props}
    />,
  );
  return { onClose, onSessionCreated, user: userEvent.setup() };
};

const captureSessionPost = (response = () => HttpResponse.json({ message: "Sesión creada exitosamente" }, { status: 201 })) => {
  const captured = { body: null, calls: 0 };
  server.use(
    http.post(api("/sessions"), async ({ request }) => {
      captured.calls += 1;
      captured.body = await request.json();
      return response();
    }),
  );
  return captured;
};

const schedule = (user) => user.click(screen.getByRole("button", { name: "Agendar Sesión" }));

describe("ScheduleSessionModal", () => {
  it("muestra el día y la hora elegidos en el calendario", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Nueva Sesión" })).toBeInTheDocument();
    expect(screen.getByText("Jueves, 5 de noviembre de 2026 · 10:00")).toBeInTheDocument();
  });

  it("lista los alumnos con su curso y avisa si no hay ninguno", () => {
    const { unmount } = render(
      <ScheduleSessionModal isOpen onClose={() => {}} selectedDate={SELECTED} students={[lucia, pablo]} />,
    );
    expect(screen.getByRole("button", { name: /Lucía Navarro/ })).toHaveTextContent("3 Primaria");
    expect(screen.getByRole("button", { name: /Pablo Ruiz/ })).toHaveTextContent("1 ESO");
    unmount();

    render(<ScheduleSessionModal isOpen onClose={() => {}} selectedDate={SELECTED} students={[]} />);
    expect(screen.getByText("No hay alumnos asignados")).toBeInTheDocument();
  });

  it("marca un solo alumno seleccionado cada vez", async () => {
    const { user } = setup();
    const luciaButton = screen.getByRole("button", { name: /Lucía Navarro/ });
    const pabloButton = screen.getByRole("button", { name: /Pablo Ruiz/ });

    await user.click(luciaButton);
    expect(luciaButton).toHaveAttribute("aria-pressed", "true");

    await user.click(pabloButton);
    expect(pabloButton).toHaveAttribute("aria-pressed", "true");
    expect(luciaButton).toHaveAttribute("aria-pressed", "false");
  });

  it("exige elegir un alumno antes de agendar", async () => {
    const captured = captureSessionPost();
    const { user } = setup();

    await schedule(user);

    expect(screen.getByRole("alert")).toHaveTextContent("Por favor, debe seleccionar un alumno");
    expect(captured.calls).toBe(0);
  });

  it("envía alumno, fecha ISO, duración de 60 min, estado Pendiente y las notas escritas", async () => {
    const captured = captureSessionPost();
    const { user, onSessionCreated, onClose } = setup();

    await user.click(screen.getByRole("button", { name: /Lucía Navarro/ }));
    await user.type(screen.getByLabelText("Tipo de Sesión"), "  Lectura comprensiva  ");
    await schedule(user);

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(captured.body).toEqual({
      student: "s-lucia",
      date: "2026-11-05T09:00:00.000Z",
      duration: 60,
      status: "Pendiente",
      notes: "Lectura comprensiva",
    });
    expect(onSessionCreated).toHaveBeenCalledTimes(1);
  });

  it("sin notas guarda una nota por defecto", async () => {
    const captured = captureSessionPost();
    const { user, onClose } = setup();

    await user.click(screen.getByRole("button", { name: /Pablo Ruiz/ }));
    await schedule(user);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(captured.body.notes).toBe("Sesión de apoyo registrado");
  });

  it("si el horario está ocupado (409) muestra el motivo y no se cierra", async () => {
    captureSessionPost(() =>
      HttpResponse.json(
        { message: "Horario no disponible", error: "El pedagogo ya tiene una sesión programada en ese horario" },
        { status: 409 },
      ),
    );
    const { user, onClose, onSessionCreated } = setup();

    await user.click(screen.getByRole("button", { name: /Lucía Navarro/ }));
    await schedule(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("El pedagogo ya tiene una sesión programada en ese horario");
    expect(onClose).not.toHaveBeenCalled();
    expect(onSessionCreated).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Agendar Sesión" })).toBeEnabled();
  });

  describe("franjas ocupadas del día", () => {
    it("indica que todo el día está libre si no hay sesiones", () => {
      setup();
      expect(screen.getByText("Todo el día está disponible")).toBeInTheDocument();
    });

    it("muestra las horas de las sesiones de ese día ordenadas, sin las canceladas ni las de otros días", () => {
      const sessions = [
        makeSession({ date: "2026-11-05T10:00:00.000Z" }), // 11:00 en Madrid
        makeSession({ date: "2026-11-05T08:00:00.000Z" }), // 09:00
        makeSession({ date: "2026-11-05T12:00:00.000Z", status: "Cancelado" }), // cancelada: libre
        makeSession({ date: "2026-11-06T08:00:00.000Z" }), // otro día
      ];
      setup({ sessions });

      const busy = screen.getByText("Franjas ya ocupadas este día:").parentElement;
      const slots = within(busy)
        .getAllByText(/^\d{2}:\d{2}$/)
        .map((node) => node.textContent);

      expect(slots).toEqual(["09:00", "11:00"]);
      expect(screen.queryByText("Todo el día está disponible")).not.toBeInTheDocument();
    });
  });

  it("Cancelar cierra el modal sin enviar nada", async () => {
    const captured = captureSessionPost();
    const { user, onClose } = setup();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(captured.calls).toBe(0);
  });

  it("no renderiza nada si está cerrado", () => {
    render(<ScheduleSessionModal isOpen={false} onClose={() => {}} selectedDate={null} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

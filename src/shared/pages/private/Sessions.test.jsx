// Calendario semanal de sesiones: estructura, colocación de sesiones, navegación entre semanas y agenda desde una celda libre

import { afterEach, describe, it, expect, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { Sessions } from "./Sessions";
import { api, server } from "../../../test/server";
import { makeSession, makeStudent, pedagogoUser } from "../../../test/fixtures";
import { renderWithProviders } from "../../../test/utils";

// Devuelve el reloj real tras los tests que lo congelan
afterEach(() => vi.useRealTimers());

// "Hoy" es el jueves 5 de noviembre de 2026: la semana mostrada va del lunes 2 al viernes 6
const freezeToday = () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 5, 8, 0));
};

const lucia = makeStudent({ _id: "s-lucia", name: "Lucía Navarro" });
const pablo = makeStudent({ _id: "s-pablo", name: "Pablo Ruiz" });

// Horas en UTC: Madrid es UTC+1 en noviembre, así que 09:00Z = 10:00 en el calendario
const sessionOf = (student, date, overrides = {}) =>
  makeSession({ student: { _id: student._id, name: student.name }, date, ...overrides });

const stubApi = ({ sessions = [], students = [lucia, pablo] } = {}) =>
  server.use(
    http.get(api("/sessions"), () => HttpResponse.json(sessions)),
    http.get(api("/students"), () => HttpResponse.json({ students })),
  );

const renderCalendar = () => {
  renderWithProviders(
    <Routes>
      <Route path="/sessions" element={<Sessions />} />
      <Route path="/students/:id" element={<p>Ficha del alumno</p>} />
    </Routes>,
    { route: "/sessions", user: pedagogoUser },
  );
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Celda del calendario para una hora ("10:00") y un día de la semana ("Jueves")
const cellAt = (hour, day) => {
  const row = screen.getByText(hour).parentElement;
  return row.children[1 + DAYS.indexOf(day)];
};

const waitForCalendar = () => screen.findByText("2 de noviembre – 6 de noviembre, 2026");

// Semana de lunes a viernes, franjas de 09:00 a 17:00, estado de carga y errores
describe("Sessions: estructura del calendario", () => {
  it("muestra la semana actual de lunes a viernes y resalta el día de hoy", async () => {
    freezeToday();
    stubApi();
    renderCalendar();
    await waitForCalendar();

    // CAMBIO (responsive): cada día aparece dos veces en el DOM (cabecera de PC/tablet y selector de día móvil, ocultos por CSS según el ancho).
    // Aquí comprobamos la cabecera de la semana completa, excluyendo el selector móvil (role="tablist").
    const headerLabel = (label) => screen.getAllByText(label).find((el) => !el.closest('[role="tablist"]'));

    for (const [label, number] of [["LUN", "2"], ["MAR", "3"], ["MIÉ", "4"], ["JUE", "5"], ["VIE", "6"]]) {
      expect(headerLabel(label).nextElementSibling).toHaveTextContent(number);
    }
    expect(headerLabel("JUE").nextElementSibling).toHaveClass("text-[#529471]"); // hoy
    expect(headerLabel("MAR").nextElementSibling).not.toHaveClass("text-[#529471]");
  });

  // CAMBIO (responsive): selector de día para móvil (solo se ve un día cada vez por debajo de md)
  it("ofrece un selector de día para móvil con el día de hoy seleccionado y permite cambiarlo", async () => {
    const user = userEvent.setup();
    freezeToday();
    stubApi();
    renderCalendar();
    await waitForCalendar();

    const tabs = within(screen.getByRole("tablist", { name: "Día de la semana" })).getAllByRole("tab");
    expect(tabs).toHaveLength(5);
    expect(tabs[3]).toHaveAttribute("aria-selected", "true"); // jueves = hoy

    await user.click(tabs[0]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[3]).toHaveAttribute("aria-selected", "false");
  });

  it("tiene una fila por franja de 09:00 a 17:00", async () => {
    freezeToday();
    stubApi();
    renderCalendar();
    await waitForCalendar();

    for (const hour of ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]) {
      expect(screen.getByText(hour)).toBeInTheDocument();
    }
    expect(screen.queryByText("18:00")).not.toBeInTheDocument();
  });

  it("muestra el estado de carga mientras llegan los datos", () => {
    freezeToday();
    stubApi();
    renderCalendar();
    expect(screen.getByText("Cargando calendario...")).toBeInTheDocument();
  });

  it("muestra el error de la API en lugar de aparentar un calendario vacío", async () => {
    freezeToday();
    server.use(
      http.get(api("/sessions"), () => HttpResponse.json({ message: "Error al obtener las sesiones" }, { status: 500 })),
      http.get(api("/students"), () => HttpResponse.json({ students: [] })),
    );
    renderCalendar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Error al obtener las sesiones");
    expect(screen.queryByText("Cargando calendario...")).not.toBeInTheDocument();
  });
});

// Posición de cada sesión según su hora local y qué sesiones se ocultan
describe("Sessions: sesiones en el calendario", () => {
  it("coloca cada sesión en su día y hora local con el nombre del alumno", async () => {
    freezeToday();
    stubApi({
      sessions: [
        sessionOf(lucia, "2026-11-05T09:00:00.000Z", { notes: "Lectura" }), // jueves 10:00
        sessionOf(pablo, "2026-11-03T13:00:00.000Z"), // martes 14:00
      ],
    });
    renderCalendar();
    await waitForCalendar();

    const thursday = await within(cellAt("10:00", "Jueves")).findByRole("link");
    expect(thursday).toHaveTextContent("Lucía Navarro");
    expect(thursday).toHaveTextContent("Lectura");
    expect(thursday).toHaveAttribute("href", "/students/s-lucia");

    expect(within(cellAt("14:00", "Martes")).getByRole("link")).toHaveTextContent("Pablo Ruiz");
    expect(within(cellAt("10:00", "Martes")).queryByRole("link")).not.toBeInTheDocument();
  });

  it("no muestra las sesiones canceladas ni las de otras semanas", async () => {
    freezeToday();
    stubApi({
      sessions: [
        sessionOf(lucia, "2026-11-04T10:00:00.000Z", { status: "Cancelado" }), // miércoles 11:00, cancelada
        sessionOf(pablo, "2026-11-12T09:00:00.000Z"), // semana siguiente
      ],
    });
    renderCalendar();
    await waitForCalendar();
    await waitFor(() => expect(screen.queryByText("Cargando calendario...")).not.toBeInTheDocument());

    expect(screen.queryByRole("link", { name: /Lucía Navarro/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Pablo Ruiz/ })).not.toBeInTheDocument();
  });

  it("pulsar una sesión lleva a la ficha del alumno sin abrir el formulario de nueva sesión", async () => {
    freezeToday();
    stubApi({ sessions: [sessionOf(lucia, "2026-11-05T09:00:00.000Z")] });
    const user = userEvent.setup();
    renderCalendar();
    await waitForCalendar();

    await user.click(await within(cellAt("10:00", "Jueves")).findByRole("link"));

    expect(await screen.findByText("Ficha del alumno")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// Botones de semana anterior, siguiente y volver a la actual
describe("Sessions: navegación entre semanas", () => {
  it("avanza y retrocede de semana y vuelve a la actual", async () => {
    freezeToday();
    stubApi();
    const user = userEvent.setup();
    renderCalendar();
    await waitForCalendar();

    await user.click(screen.getByTitle("Semana siguiente"));
    expect(screen.getByText("9 de noviembre – 13 de noviembre, 2026")).toBeInTheDocument();

    await user.click(screen.getByTitle("Semana anterior"));
    await user.click(screen.getByTitle("Semana anterior"));
    expect(screen.getByText("26 de octubre – 30 de octubre, 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Esta semana" }));
    expect(screen.getByText("2 de noviembre – 6 de noviembre, 2026")).toBeInTheDocument();
  });

  it("muestra las sesiones de la semana a la que se navega", async () => {
    freezeToday();
    stubApi({ sessions: [sessionOf(pablo, "2026-11-12T09:00:00.000Z")] }); // jueves 12, 10:00
    const user = userEvent.setup();
    renderCalendar();
    await waitForCalendar();

    await user.click(screen.getByTitle("Semana siguiente"));

    expect(within(cellAt("10:00", "Jueves")).getByRole("link")).toHaveTextContent("Pablo Ruiz");
  });
});

// Al pulsar una celda libre se abre ScheduleSessionModal con ese día y hora
describe("Sessions: agendar desde una celda vacía", () => {
  it("al pulsar una celda libre abre el formulario con ese día y hora", async () => {
    freezeToday();
    stubApi();
    const user = userEvent.setup();
    renderCalendar();
    await waitForCalendar();

    await user.click(cellAt("12:00", "Miércoles"));

    const dialog = await screen.findByRole("dialog", { name: "Nueva Sesión" });
    expect(within(dialog).getByText("Miércoles, 4 de noviembre de 2026 · 12:00")).toBeInTheDocument();
  });

  it("crea la sesión con la hora elegida y la muestra en el calendario sin recargar", async () => {
    freezeToday();
    let sessions = [];
    let posted = null;
    server.use(
      http.get(api("/sessions"), () => HttpResponse.json(sessions)),
      http.get(api("/students"), () => HttpResponse.json({ students: [lucia, pablo] })),
      http.post(api("/sessions"), async ({ request }) => {
        posted = await request.json();
        sessions = [sessionOf(pablo, posted.date, { notes: posted.notes })];
        return HttpResponse.json({ message: "Sesión creada exitosamente" }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderCalendar();
    await waitForCalendar();
    await waitFor(() => expect(screen.queryByText("Cargando calendario...")).not.toBeInTheDocument());

    await user.click(cellAt("12:00", "Miércoles"));
    await user.click(await screen.findByRole("button", { name: /Pablo Ruiz/ }));
    await user.click(screen.getByRole("button", { name: "Agendar Sesión" }));

    expect(await within(cellAt("12:00", "Miércoles")).findByRole("link")).toHaveTextContent("Pablo Ruiz");
    expect(posted).toMatchObject({ student: "s-pablo", date: "2026-11-04T11:00:00.000Z", duration: 60, status: "Pendiente" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Cargando calendario...")).not.toBeInTheDocument();
  });

  it("si el horario está ocupado (409) lo explica en el formulario", async () => {
    freezeToday();
    stubApi();
    server.use(
      http.post(api("/sessions"), () =>
        HttpResponse.json({ message: "Horario no disponible", error: "El pedagogo ya tiene una sesión programada en ese horario" }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderCalendar();
    await waitForCalendar();

    await user.click(cellAt("12:00", "Miércoles"));
    await user.click(await screen.findByRole("button", { name: /Lucía Navarro/ }));
    await user.click(screen.getByRole("button", { name: "Agendar Sesión" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El pedagogo ya tiene una sesión programada en ese horario");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

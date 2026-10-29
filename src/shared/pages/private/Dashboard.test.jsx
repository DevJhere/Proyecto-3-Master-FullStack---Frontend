import { afterEach, describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { api, server } from "../../../test/server";
import { adminUser, makeSession, makeStudent, otherPedagogoUser, pedagogoUser } from "../../../test/fixtures";
import { renderWithProviders } from "../../../test/utils";

afterEach(() => vi.useRealTimers());

// "Hoy" es el jueves 5 de noviembre de 2026, 08:00 en Madrid
const freezeToday = () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 5, 8, 0));
};

const lucia = makeStudent({ _id: "s-lucia", name: "Lucía Navarro" });
const pablo = makeStudent({ _id: "s-pablo", name: "Pablo Ruiz" });
const elena = makeStudent({ _id: "s-elena", name: "Elena Soto" });

// Sesión de Samantha sobre un alumno, a la hora UTC indicada (Madrid = UTC+1 en noviembre)
const mine = (student, date, status = "Pendiente", overrides = {}) =>
  makeSession({ student: { _id: student._id, name: student.name }, date, status, ...overrides });

const stubApi = ({ sessions = [], students = [lucia, pablo, elena] } = {}) =>
  server.use(
    http.get(api("/sessions"), () => HttpResponse.json(sessions)),
    http.get(api("/students"), () => HttpResponse.json({ students })),
  );

const renderDashboard = (user = pedagogoUser) =>
  renderWithProviders(
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/students" element={<p>Lista de alumnos</p>} />
      <Route path="/students/:id" element={<p>Ficha del alumno</p>} />
    </Routes>,
    { route: "/dashboard", user },
  );

const kpi = (title) => screen.getByText(title).parentElement;

// El texto del saludo está repartido en varios nodos: lo buscamos por el contenido del párrafo completo
const greeting = (regex) => screen.findByText((_, element) => element.tagName === "P" && regex.test(element.textContent));

// El alumno aparece tanto en 'Sesiones de hoy' como en 'Acceso rápido': acotamos a la sección de hoy
const todaySection = () => screen.getByText("Sesiones de hoy").parentElement.parentElement;

describe("Dashboard: cabecera y resumen", () => {
  it("saluda con el primer nombre y la fecha de hoy", async () => {
    freezeToday();
    stubApi();
    renderDashboard();

    expect(await screen.findByText("Hola, Samantha")).toBeInTheDocument();
    expect(screen.getByText("Jueves, 5 de noviembre de 2026")).toBeInTheDocument();
  });

  it("cuenta como pendientes solo las sesiones de hoy en estado Pendiente (no las canceladas ni las completadas)", async () => {
    freezeToday();
    stubApi({
      sessions: [
        mine(lucia, "2026-11-05T08:00:00.000Z", "Pendiente"),
        mine(pablo, "2026-11-05T09:00:00.000Z", "Pendiente"),
        mine(elena, "2026-11-05T10:00:00.000Z", "Completado"),
        mine(lucia, "2026-11-05T12:00:00.000Z", "Cancelado"),
      ],
    });
    renderDashboard();

    expect(await greeting(/Tienes\s+2 sesiones\s+pendientes para hoy\./)).toBeInTheDocument();
  });

  it.each([
    [0, "0 sesiones", "pendientes"],
    [1, "1 sesión", "pendiente"],
  ])("concuerda singular y plural con %i pendientes", async (count, amount, word) => {
    freezeToday();
    stubApi({ sessions: Array.from({ length: count }, (_, i) => mine(lucia, `2026-11-05T0${8 + i}:00:00.000Z`)) });
    renderDashboard();

    expect(await greeting(new RegExp(`Tienes\\s+${amount}\\s+${word} para hoy\\.`))).toBeInTheDocument();
  });

  it("muestra los indicadores: alumnos, sesiones del mes (sin canceladas) y completadas", async () => {
    freezeToday();
    stubApi({
      sessions: [
        mine(lucia, "2026-11-05T08:00:00.000Z", "Pendiente"),
        mine(pablo, "2026-11-12T08:00:00.000Z", "Completado"),
        mine(elena, "2026-11-20T08:00:00.000Z", "Cancelado"), // no cuenta como programada
        mine(lucia, "2026-10-15T08:00:00.000Z", "Completado"), // mes anterior: cuenta como completada, no del mes
      ],
    });
    renderDashboard();

    await screen.findByText("Hola, Samantha");
    await screen.findByText("3 Perfiles Asignados");

    expect(kpi("Alumnos Activos")).toHaveTextContent("3");
    expect(kpi("Sesiones este mes")).toHaveTextContent("2");
    expect(kpi("Sesiones este mes")).toHaveTextContent("2 Programadas");
    expect(kpi("Sesiones Completadas")).toHaveTextContent("2");
  });

  it("muestra '...' en los indicadores mientras carga", () => {
    freezeToday();
    stubApi();
    renderDashboard();
    expect(kpi("Alumnos Activos")).toHaveTextContent("...");
  });
});

describe("Dashboard: sesiones de hoy", () => {
  it("lista las sesiones de hoy ordenadas por hora, con alumno y estado", async () => {
    freezeToday();
    stubApi({
      sessions: [
        mine(pablo, "2026-11-05T12:00:00.000Z", "Pendiente"), // 13:00
        mine(lucia, "2026-11-05T08:00:00.000Z", "Completado"), // 09:00
        mine(elena, "2026-11-05T10:00:00.000Z", "Cancelado"), // 11:00
        mine(lucia, "2026-11-06T08:00:00.000Z", "Pendiente"), // mañana: no aparece
      ],
    });
    renderDashboard();

    await screen.findByText("Sesiones de hoy");
    const times = (await screen.findAllByText(/^\d{2}:\d{2}$/)).map((node) => node.textContent);
    expect(times).toEqual(["09:00", "11:00", "13:00"]);

    const cards = screen.getAllByRole("link").filter((link) => /^\d{2}:\d{2}/.test(link.textContent));
    expect(cards[0]).toHaveTextContent("Lucía Navarro");
    expect(cards[0]).toHaveTextContent("Completado");
    expect(cards[1]).toHaveTextContent("Cancelado");
    expect(cards[2]).toHaveTextContent("Pendiente");
  });

  it("no muestra las sesiones de otros pedagogos", async () => {
    freezeToday();
    stubApi({
      sessions: [
        mine(lucia, "2026-11-05T08:00:00.000Z"),
        makeSession({
          student: { _id: pablo._id, name: "Alumno Ajeno" },
          pedagogoAsignado: { _id: otherPedagogoUser._id, name: otherPedagogoUser.name },
          date: "2026-11-05T09:00:00.000Z",
        }),
      ],
    });
    renderDashboard();

    await screen.findByText("Sesiones de hoy");
    expect(await within(todaySection()).findByText("Lucía Navarro")).toBeInTheDocument();
    expect(within(todaySection()).queryByText("Alumno Ajeno")).not.toBeInTheDocument();
  });

  it("un admin solo ve en 'hoy' las sesiones que tiene asignadas a él", async () => {
    freezeToday();
    stubApi({ sessions: [mine(lucia, "2026-11-05T08:00:00.000Z")] }); // asignada a Samantha
    renderDashboard(adminUser);

    expect(await screen.findByText("No hay sesiones programadas para hoy.")).toBeInTheDocument();
  });

  it("muestra el estado vacío si no hay sesiones hoy", async () => {
    freezeToday();
    stubApi({ sessions: [mine(lucia, "2026-11-09T08:00:00.000Z")] });
    renderDashboard();
    expect(await screen.findByText("No hay sesiones programadas para hoy.")).toBeInTheDocument();
  });

  it("pulsar una sesión lleva a la ficha del alumno", async () => {
    freezeToday();
    stubApi({ sessions: [mine(lucia, "2026-11-05T08:00:00.000Z")] });
    renderDashboard();

    await screen.findByText("Sesiones de hoy");
    const card = (await within(todaySection()).findByText("Lucía Navarro")).closest("a");
    expect(card).toHaveAttribute("href", "/students/s-lucia");
  });
});

describe("Dashboard: acceso rápido y errores", () => {
  it("muestra hasta 6 alumnos en el acceso rápido", async () => {
    freezeToday();
    const many = Array.from({ length: 8 }, (_, i) => makeStudent({ _id: `q-${i}`, name: `Quick ${i}` }));
    stubApi({ students: many });
    renderDashboard();

    await screen.findByText("Acceso Rápido");
    expect(await screen.findAllByRole("link", { name: /Quick \d/ })).toHaveLength(6);
  });

  it("avisa si no hay alumnos asignados", async () => {
    freezeToday();
    stubApi({ students: [] });
    renderDashboard();
    expect(await screen.findByText("No tienes alumnos asignados todavía.")).toBeInTheDocument();
  });

  it("muestra el error de las sesiones en lugar de aparentar que no hay datos", async () => {
    freezeToday();
    server.use(
      http.get(api("/sessions"), () => HttpResponse.json({ message: "Error al obtener las sesiones" }, { status: 500 })),
      http.get(api("/students"), () => HttpResponse.json({ students: [lucia] })),
    );
    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Error al obtener las sesiones");
  });

  it("muestra el error de los alumnos", async () => {
    freezeToday();
    server.use(
      http.get(api("/sessions"), () => HttpResponse.json([])),
      http.get(api("/students"), () => HttpResponse.json({ error: "Error al obtener datos de estudiantes" }, { status: 500 })),
    );
    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Error al obtener datos de estudiantes");
  });

  it("muestra un mensaje de conexión si no hay respuesta del servidor", async () => {
    freezeToday();
    server.use(
      http.get(api("/sessions"), () => HttpResponse.error()),
      http.get(api("/students"), () => HttpResponse.error()),
    );
    renderDashboard();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No se pudo conectar con el servidor");
  });
});

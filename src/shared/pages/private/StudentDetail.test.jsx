// Ficha del alumno: carga, pestañas de sesiones e informes, recarga de datos y eliminación del alumno

import { describe, it, expect, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { Link, Route, Routes } from "react-router-dom";
import { StudentDetail } from "./StudentDetail";
import { api, server } from "../../../test/server";
import { makeSession, makeStudent, pedagogoUser } from "../../../test/fixtures";
import { renderWithProviders } from "../../../test/utils";

const lucia = makeStudent({ _id: "s-lucia", name: "Lucía Navarro", nameTutor: "Carmen Gómez", phoneNumberTutor: "600111222", reports: [] });
const pablo = makeStudent({ _id: "s-pablo", name: "Pablo Ruiz", nameTutor: "Luis Ruiz" });

const sessionFor = (student, overrides = {}) =>
  makeSession({ student: { _id: student._id, name: student.name }, ...overrides });

const renderDetail = (route = "/students/s-lucia") =>
  renderWithProviders(
    <Routes>
      <Route path="/students" element={<p>Lista de alumnos</p>} />
      <Route
        path="/students/:id"
        element={
          <>
            <Link to="/students/s-lucia">ir a Lucía</Link>
            <Link to="/students/s-pablo">ir a Pablo</Link>
            <StudentDetail />
          </>
        }
      />
    </Routes>,
    { route, user: pedagogoUser },
  );

// Responde con los alumnos y sesiones indicados
const stubApi = ({ students = [lucia, pablo], sessions = [] } = {}) => {
  server.use(
    http.get(api("/students/:id"), ({ params }) => {
      const student = students.find((s) => s._id === params.id);
      return student ? HttpResponse.json(student) : HttpResponse.json({ message: "Estudiante no encontrado", error: "El estudiante no existe" }, { status: 404 });
    }),
    http.get(api("/sessions"), () => HttpResponse.json(sessions)),
  );
};

// Estados de carga y error, y que una respuesta tardía de otro alumno no pise la ficha actual
describe("StudentDetail: carga", () => {
  it("muestra el estado de carga y después la ficha del alumno y el contador de sesiones", async () => {
    stubApi({ sessions: [sessionFor(lucia), sessionFor(lucia), sessionFor(pablo)] });
    renderDetail();

    expect(screen.getByText("Cargando expediente...")).toBeInTheDocument();

    expect(await screen.findByRole("heading", { name: "Lucía Navarro" })).toBeInTheDocument();
    expect(screen.getByText("Carmen Gómez")).toBeInTheDocument();
    expect(screen.getByText("600111222")).toBeInTheDocument();
    expect(screen.getByText("2 registros de intervención")).toBeInTheDocument(); // solo las sesiones de Lucía
  });

  it("usa el singular con un solo registro", async () => {
    stubApi({ sessions: [sessionFor(lucia)] });
    renderDetail();
    expect(await screen.findByText("1 registro de intervención")).toBeInTheDocument();
  });

  it("muestra el mensaje de la API si el alumno no existe o no es suyo", async () => {
    stubApi({ students: [] });
    renderDetail("/students/s-lucia");
    expect(await screen.findByText("El estudiante no existe")).toBeInTheDocument();
  });

  it("si cambia a otro alumno muestra el nuevo y descarta la respuesta tardía del anterior", async () => {
    server.use(
      http.get(api("/students/:id"), async ({ params }) => {
        if (params.id === "s-lucia") await delay(250); // la respuesta de Lucía llega después de la de Pablo
        return HttpResponse.json(params.id === "s-lucia" ? lucia : pablo);
      }),
      http.get(api("/sessions"), () => HttpResponse.json([])),
    );
    const user = userEvent.setup();
    renderDetail("/students/s-lucia");

    await user.click(screen.getByText("ir a Pablo"));
    expect(await screen.findByRole("heading", { name: "Pablo Ruiz" })).toBeInTheDocument();

    await delay(400); // da tiempo a que llegue la respuesta antigua
    expect(screen.getByRole("heading", { name: "Pablo Ruiz" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Lucía Navarro" })).not.toBeInTheDocument();
  });
});

// Cambio de pestaña y recarga de datos tras crear una sesión o cambiar su estado
describe("StudentDetail: pestañas, sesiones e informes", () => {
  it("cambia a la pestaña de informes y muestra su contador y su lista", async () => {
    const withReports = { ...lucia, reports: [{ _id: "r1", title: "Informe inicial", date: "2026-10-01T10:00:00.000Z", attachmentDocument: "https://x/a.pdf" }] };
    stubApi({ students: [withReports] });
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole("heading", { name: "Lucía Navarro" });

    await user.click(screen.getByRole("button", { name: "Informes" }));

    expect(screen.getByText("1 informe")).toBeInTheDocument();
    expect(screen.getByText("Informe inicial")).toBeInTheDocument();
  });

  it("al crear una sesión recarga los datos sin volver a mostrar 'Cargando expediente...'", async () => {
    let sessions = [];
    server.use(
      http.get(api("/students/:id"), () => HttpResponse.json(lucia)),
      http.get(api("/sessions"), () => HttpResponse.json(sessions)),
      http.post(api("/sessions"), () => {
        sessions = [sessionFor(lucia, { notes: "Sesión nueva" })];
        return HttpResponse.json({ message: "Sesión creada exitosamente" }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderDetail();
    await screen.findByText("0 registros de intervención");

    await user.click(screen.getByRole("button", { name: /Nuevo Registro/ }));
    expect(screen.getByText("Nueva Sesión de Intervención")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar Registro" }));

    expect(await screen.findByText("1 registro de intervención")).toBeInTheDocument();
    expect(screen.queryByText("Cargando expediente...")).not.toBeInTheDocument();
    expect(screen.getByText("Sesión nueva")).toBeInTheDocument();
    // El formulario se cierra al guardar
    expect(screen.queryByText("Nueva Sesión de Intervención")).not.toBeInTheDocument();
  });

  it("al cambiar el estado de una sesión se recargan los datos", async () => {
    let status = "Pendiente";
    server.use(
      http.get(api("/students/:id"), () => HttpResponse.json(lucia)),
      http.get(api("/sessions"), () => HttpResponse.json([sessionFor(lucia, { _id: "ses-1", status })])),
      http.put(api("/sessions/ses-1"), async ({ request }) => {
        status = (await request.json()).status;
        return HttpResponse.json({ message: "Sesión actualizada exitosamente" });
      }),
    );
    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole("button", { name: /Pendiente/ }));
    await user.click(screen.getByRole("button", { name: "Completado" }));

    expect(await screen.findByRole("button", { name: /● Completado/ })).toBeInTheDocument();
  });
});

// Eliminación con confirmación del navegador; si la API falla se avisa y se permanece en la ficha
describe("StudentDetail: eliminar alumno", () => {
  it("no hace nada si el usuario cancela la confirmación", async () => {
    stubApi();
    let deleted = false;
    server.use(http.delete(api("/students/:id"), () => ((deleted = true), HttpResponse.json({}))));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole("heading", { name: "Lucía Navarro" });

    await user.click(screen.getByRole("button", { name: /Eliminar Alumno/ }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Lucía Navarro"));
    expect(deleted).toBe(false);
    expect(screen.getByRole("heading", { name: "Lucía Navarro" })).toBeInTheDocument();
  });

  it("elimina al alumno y vuelve a la lista si confirma", async () => {
    stubApi();
    let deletedId = null;
    server.use(http.delete(api("/students/:id"), ({ params }) => ((deletedId = params.id), HttpResponse.json({ message: "Estudiante eliminado correctamente" }))));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole("heading", { name: "Lucía Navarro" });

    await user.click(screen.getByRole("button", { name: /Eliminar Alumno/ }));

    expect(await screen.findByText("Lista de alumnos")).toBeInTheDocument();
    expect(deletedId).toBe("s-lucia");
  });

  it("si la API falla avisa con el motivo y se queda en la ficha", async () => {
    stubApi();
    server.use(http.delete(api("/students/:id"), () => HttpResponse.json({ message: "No autorizado", error: "No tienes permiso para eliminar este estudiante" }, { status: 403 })));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole("heading", { name: "Lucía Navarro" });

    await user.click(screen.getByRole("button", { name: /Eliminar Alumno/ }));

    await waitFor(() => expect(alert).toHaveBeenCalledWith("No tienes permiso para eliminar este estudiante"));
    expect(screen.queryByText("Lista de alumnos")).not.toBeInTheDocument();
    expect(within(document.body).getByRole("heading", { name: "Lucía Navarro" })).toBeInTheDocument();
  });
});

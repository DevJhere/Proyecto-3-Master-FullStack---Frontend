import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { Students } from "./Students";
import { api, server } from "../../../test/server";
import { adminUser, makeSession, makeStudent, pedagogoUser } from "../../../test/fixtures";
import { renderWithProviders } from "../../../test/utils";

const lucia = makeStudent({ _id: "s-lucia", name: "Lucía Navarro", course: "3 Primaria", diagnosis: "Dislexia", nameTutor: "Carmen Gómez" });
const pablo = makeStudent({ _id: "s-pablo", name: "Pablo Ruiz", course: "1 ESO", diagnosis: "TDAH", nameTutor: "Luis Ruiz" });
const elena = makeStudent({ _id: "s-elena", name: "Elena Soto", course: "Infantil 4 años", diagnosis: "Retraso del Lenguaje", nameTutor: "Marta Díaz" });

const sessionOf = (student) => makeSession({ student: { _id: student._id, name: student.name } });

const stubApi = ({ students = [lucia, pablo, elena], sessions = [] } = {}) =>
  server.use(
    http.get(api("/students"), () => HttpResponse.json({ students })),
    http.get(api("/sessions"), () => HttpResponse.json(sessions)),
  );

const renderStudents = (user = pedagogoUser) =>
  renderWithProviders(
    <Routes>
      <Route path="/students" element={<Students />} />
      <Route path="/students/:id" element={<p>Ficha del alumno</p>} />
    </Routes>,
    { route: "/students", user },
  );

const search = (user, text) => user.type(screen.getByLabelText("Buscar alumnos"), text);

describe("Students: listado", () => {
  it("muestra el estado de carga y después una tarjeta por alumno con enlace a su ficha", async () => {
    stubApi();
    renderStudents();
    expect(screen.getByText("Cargando alumnos...")).toBeInTheDocument();

    const card = (await screen.findByText("Lucía Navarro")).closest("a");
    expect(card).toHaveAttribute("href", "/students/s-lucia");
    expect(screen.getByText("Pablo Ruiz")).toBeInTheDocument();
    expect(screen.getByText("Elena Soto")).toBeInTheDocument();
    expect(screen.queryByText("Cargando alumnos...")).not.toBeInTheDocument();
  });

  it("muestra el curso, la edad, el diagnóstico y el tutor de cada alumno", async () => {
    stubApi({ students: [lucia] });
    renderStudents();

    const card = (await screen.findByText("Lucía Navarro")).closest("a");
    expect(card).toHaveTextContent("Dislexia");
    expect(card).toHaveTextContent("3 Primaria · 8 años");
    expect(card).toHaveTextContent("Carmen Gómez");
  });

  it("cuenta las sesiones de cada alumno con su singular y plural", async () => {
    stubApi({ sessions: [sessionOf(lucia), sessionOf(lucia), sessionOf(pablo)] });
    renderStudents();

    const cardOf = async (name) => (await screen.findByText(name)).closest("a");
    expect(await cardOf("Lucía Navarro")).toHaveTextContent("2 sesiones");
    expect(await cardOf("Pablo Ruiz")).toHaveTextContent("1 sesión");
    expect(await cardOf("Elena Soto")).toHaveTextContent("0 sesiones");
  });

  it("muestra el estado vacío si no hay alumnos", async () => {
    stubApi({ students: [] });
    renderStudents();
    expect(await screen.findByText("No se han encontrado alumnos.")).toBeInTheDocument();
  });
});

describe("Students: búsqueda", () => {
  it.each([
    ["por nombre", "lucía", ["Lucía Navarro"]],
    ["por curso", "eso", ["Pablo Ruiz"]],
    ["por diagnóstico", "tdah", ["Pablo Ruiz"]],
    ["por tutor", "marta", ["Elena Soto"]],
    ["sin importar mayúsculas ni espacios alrededor", "  PABLO  ", ["Pablo Ruiz"]],
  ])("filtra %s", async (_, term, expected) => {
    stubApi();
    const user = userEvent.setup();
    renderStudents();
    await screen.findByText("Lucía Navarro");

    await search(user, term);

    for (const name of ["Lucía Navarro", "Pablo Ruiz", "Elena Soto"]) {
      if (expected.includes(name)) expect(screen.getByText(name)).toBeInTheDocument();
      else expect(screen.queryByText(name)).not.toBeInTheDocument();
    }
  });

  it("avisa si ningún alumno coincide y vuelve a mostrarlos al borrar la búsqueda", async () => {
    stubApi();
    const user = userEvent.setup();
    renderStudents();
    await screen.findByText("Lucía Navarro");

    await search(user, "zzz");
    expect(screen.getByText("No se han encontrado alumnos.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar alumnos"));
    expect(screen.getByText("Lucía Navarro")).toBeInTheDocument();
  });
});

describe("Students: errores", () => {
  it("muestra el error de la API y no el aviso de 'sin alumnos'", async () => {
    server.use(
      http.get(api("/students"), () => HttpResponse.json({ error: "Error al obtener datos de estudiantes" }, { status: 500 })),
      http.get(api("/sessions"), () => HttpResponse.json([])),
    );
    renderStudents();

    expect(await screen.findByRole("alert")).toHaveTextContent("Error al obtener datos de estudiantes");
    expect(screen.queryByText("No se han encontrado alumnos.")).not.toBeInTheDocument();
  });

  it("muestra el error de las sesiones sin ocultar la lista de alumnos", async () => {
    server.use(
      http.get(api("/students"), () => HttpResponse.json({ students: [lucia] })),
      http.get(api("/sessions"), () => HttpResponse.json({ message: "Error al obtener las sesiones" }, { status: 500 })),
    );
    renderStudents();

    expect(await screen.findByRole("alert")).toHaveTextContent("Error al obtener las sesiones");
    expect(screen.getByText("Lucía Navarro")).toBeInTheDocument();
  });
});

describe("Students: nuevo alumno", () => {
  it("el botón abre el formulario y al crear un alumno se refresca la lista sin recargar la página", async () => {
    let students = [lucia];
    server.use(
      http.get(api("/students"), () => HttpResponse.json({ students })),
      http.get(api("/sessions"), () => HttpResponse.json([])),
      http.post(api("/students"), () => {
        students = [lucia, makeStudent({ _id: "s-nuevo", name: "Alumno Recién Creado" })];
        return HttpResponse.json({ message: "Estudiante creado exitosamente" }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderStudents();
    await screen.findByText("Lucía Navarro");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nuevo Alumno/ }));
    expect(screen.getByRole("dialog", { name: "Datos del Alumno" })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Nombre Completo/), "Alumno Recién Creado");
    await user.type(screen.getByLabelText(/^Edad/), "9");
    await user.selectOptions(screen.getByLabelText(/^Curso/), "3 Primaria");
    await user.click(screen.getByRole("button", { name: "Dislexia" }));
    await user.click(screen.getByRole("button", { name: /Siguiente/ }));
    await user.type(screen.getByLabelText(/^Nombre del tutor/), "Tutor Nuevo");
    await user.type(screen.getByLabelText(/^Teléfono/), "600111222");
    await user.type(screen.getByLabelText(/^Correo de Contacto/), "tutor@correo.com");
    await user.click(screen.getByRole("button", { name: "Crear alumno" }));

    expect(await screen.findByText("Alumno Recién Creado")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByText("Cargando alumnos...")).not.toBeInTheDocument();
  });

  it("un admin ve en el formulario el selector de pedagogo", async () => {
    stubApi();
    server.use(http.get(api("/users"), () => HttpResponse.json({ users: [pedagogoUser] })));
    const user = userEvent.setup();
    renderStudents(adminUser);
    await screen.findByText("Lucía Navarro");

    await user.click(screen.getByRole("button", { name: /Nuevo Alumno/ }));

    expect(await screen.findByLabelText(/^Pedagogo asignado/)).toBeInTheDocument();
  });
});

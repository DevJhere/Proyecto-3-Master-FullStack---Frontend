import { describe, it, expect } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Users } from "./Users";
import { api, server } from "../../../test/server";
import { adminUser, otherPedagogoUser, pedagogoUser } from "../../../test/fixtures";
import { renderWithProviders } from "../../../test/utils";

const team = [
  { ...adminUser, createdAt: "2026-01-10T10:00:00.000Z" },
  { ...pedagogoUser, createdAt: "2026-02-10T10:00:00.000Z" },
  { ...otherPedagogoUser, createdAt: "2026-03-10T10:00:00.000Z" },
];

// Lista de usuarios mutable: los handlers de POST/PUT/DELETE pueden modificarla
const stubUsers = (initial = team) => {
  const state = { users: [...initial] };
  server.use(http.get(api("/users"), () => HttpResponse.json({ users: state.users })));
  return state;
};

const renderUsers = () => renderWithProviders(<Users />, { user: adminUser });

// Tarjeta de un usuario concreto (el contenedor con la clase `group` que rodea su nombre)
const cardOf = async (name) => (await screen.findByRole("heading", { name })).closest(".group");

describe("Users: listado y filtros", () => {
  it("muestra una tarjeta por miembro y los contadores de equipo", async () => {
    stubUsers();
    renderUsers();

    expect(screen.getByText("Cargando miembros del equipo...")).toBeInTheDocument();
    for (const user of team) expect(await screen.findByRole("heading", { name: user.name })).toBeInTheDocument();

    expect(screen.getByText("Total Equipo").nextElementSibling).toHaveTextContent("3");
    expect(screen.getByText("Pedagogos / Terapeutas").nextElementSibling).toHaveTextContent("2");
    expect(screen.getByText("Administradores").nextElementSibling).toHaveTextContent("1");
  });

  it("marca la propia cuenta con 'Tú' y no permite eliminarla", async () => {
    stubUsers();
    renderUsers();

    const own = await cardOf("Jheremi Admin");
    expect(within(own).getByText("Tú")).toBeInTheDocument();
    expect(within(own).getByTitle("No puedes eliminar tu propia cuenta de administrador")).toBeDisabled();

    const other = await cardOf("Nathan Test");
    expect(within(other).queryByText("Tú")).not.toBeInTheDocument();
    expect(within(other).getByTitle("Eliminar usuario del equipo")).toBeEnabled();
  });

  it("filtra por rol con los botones de la barra", async () => {
    stubUsers();
    const user = userEvent.setup();
    renderUsers();
    await screen.findByRole("heading", { name: "Nathan Test" });

    await user.click(screen.getByRole("button", { name: "Admins (1)" }));
    expect(screen.getByRole("heading", { name: "Jheremi Admin" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Nathan Test" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pedagogos (2)" }));
    expect(screen.queryByRole("heading", { name: "Jheremi Admin" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nathan Test" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Todos (3)" }));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });

  it.each([
    ["nombre", "nathan", "Nathan Test"],
    ["correo", "samatha@", "Samantha Test"],
    ["especialidad", "logopedia", "Nathan Test"],
    ["rol", "admin", "Jheremi Admin"],
  ])("busca por %s", async (_, term, expectedName) => {
    stubUsers();
    const user = userEvent.setup();
    renderUsers();
    await screen.findByRole("heading", { name: "Nathan Test" });

    await user.type(screen.getByPlaceholderText(/Buscar por nombre/), term);

    expect(screen.getByRole("heading", { name: expectedName })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
  });

  it("avisa si ninguna búsqueda coincide", async () => {
    stubUsers();
    const user = userEvent.setup();
    renderUsers();
    await screen.findByRole("heading", { name: "Nathan Test" });

    await user.type(screen.getByPlaceholderText(/Buscar por nombre/), "zzz");

    expect(screen.getByText("No se encontraron miembros")).toBeInTheDocument();
  });

  it("muestra el motivo si la API rechaza la carga (p. ej. 403)", async () => {
    server.use(http.get(api("/users"), () => HttpResponse.json({ message: "No autorizado", error: "Esta acción requiere rol de administrador" }, { status: 403 })));
    renderUsers();

    expect(await screen.findByRole("alert")).toHaveTextContent("Esta acción requiere rol de administrador");
  });
});

describe("Users: nuevo miembro", () => {
  const openForm = async (user) => {
    await user.click(screen.getByRole("button", { name: /Nuevo Miembro/ }));
    return screen.findByRole("dialog", { name: "Nuevo Miembro del Equipo" });
  };

  const fillForm = async (user, { name = "Marta Prueba", email = "Marta@Correo.com", specialization = "Logopedia", password = "secreto1" } = {}) => {
    await user.type(screen.getByLabelText(/^Nombre Completo/), name);
    await user.type(screen.getByLabelText(/^Correo Electrónico/), email);
    await user.selectOptions(screen.getByLabelText(/^Especialidad/), specialization);
    await user.type(screen.getByLabelText("Contraseña"), password);
  };

  // Registro correcto: añade el usuario a la lista que devuelve GET /users
  const stubRegister = (state, { onBody } = {}) =>
    server.use(
      http.post(api("/auth/register"), async ({ request }) => {
        const body = await request.json();
        onBody?.(body);
        state.users = [...state.users, { _id: "u-nueva", name: body.name, email: body.email, specialization: body.specialization, rol: "pedagogo" }];
        return HttpResponse.json({ message: "Usuario registrado correctamente" }, { status: 201 });
      }),
    );

  it("registra a un pedagogo, refresca la lista y confirma con un aviso", async () => {
    const state = stubUsers();
    let body;
    stubRegister(state, { onBody: (b) => (body = b) });
    const user = userEvent.setup();
    renderUsers();
    await screen.findByRole("heading", { name: "Nathan Test" });

    await openForm(user);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Registrar miembro" }));

    expect(await screen.findByRole("heading", { name: "Marta Prueba" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Nuevo miembro del equipo registrado correctamente.");
    expect(body).toEqual({ name: "Marta Prueba", email: "marta@correo.com", specialization: "Logopedia", password: "secreto1" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("si se elige Admin, tras registrar le asigna el rol admin (el registro público siempre crea pedagogos)", async () => {
    const state = stubUsers();
    stubRegister(state);
    let put = null;
    server.use(
      http.put(api("/users/:id"), async ({ request, params }) => {
        put = { id: params.id, body: await request.json() };
        state.users = state.users.map((u) => (u._id === params.id ? { ...u, rol: "admin" } : u));
        return HttpResponse.json({ user: { _id: params.id, rol: "admin" } });
      }),
    );
    const user = userEvent.setup();
    renderUsers();
    await screen.findByRole("heading", { name: "Nathan Test" });

    await openForm(user);
    await fillForm(user, { email: "nuevo@admin.com" }); // aunque el correo termine en @admin.com, hay que promoverlo explícitamente
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Admin/ }));
    await user.click(screen.getByRole("button", { name: "Registrar miembro" }));

    await waitFor(() => expect(put).not.toBeNull());
    expect(put).toEqual({ id: "u-nueva", body: { rol: "admin" } });
    expect(await screen.findByRole("status")).toHaveTextContent("registrado correctamente");
  });

  it("si falla la asignación del rol avisa de que el miembro sí se creó, sin ocultarlo", async () => {
    const state = stubUsers();
    stubRegister(state);
    server.use(http.put(api("/users/:id"), () => HttpResponse.json({ error: "fallo" }, { status: 500 })));
    const user = userEvent.setup();
    renderUsers();
    await screen.findByRole("heading", { name: "Nathan Test" });

    await openForm(user);
    await fillForm(user);
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Admin/ }));
    await user.click(screen.getByRole("button", { name: "Registrar miembro" }));

    const warning = await screen.findByRole("alert");
    expect(warning).toHaveTextContent("se registró correctamente, pero no se pudo asignarle el rol de administrador");
    expect(await screen.findByRole("heading", { name: "Marta Prueba" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("valida los campos obligatorios y la longitud de la contraseña antes de llamar a la API", async () => {
    stubUsers();
    let calls = 0;
    server.use(http.post(api("/auth/register"), () => ((calls += 1), HttpResponse.json({}, { status: 201 }))));
    const user = userEvent.setup();
    renderUsers();
    await screen.findByRole("heading", { name: "Nathan Test" });
    const dialog = await openForm(user);

    fireEvent.submit(within(dialog).getByRole("button", { name: "Registrar miembro" }).closest("form"));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Por favor, cumplimenta todos los campos obligatorios.");

    await fillForm(user, { password: "12345" });
    await user.click(screen.getByRole("button", { name: "Registrar miembro" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("La contraseña debe tener al menos 6 caracteres.");
    expect(calls).toBe(0);
  });

  it("muestra el error del servidor (email ya registrado) y deja el formulario abierto", async () => {
    stubUsers();
    server.use(
      http.post(api("/auth/register"), () =>
        HttpResponse.json({ message: "Usuario ya registrado", error: "El correo electrónico ya está registrado" }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderUsers();
    await screen.findByRole("heading", { name: "Nathan Test" });
    const dialog = await openForm(user);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Registrar miembro" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("El correo electrónico ya está registrado");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("Users: editar miembro", () => {
  const openEdit = async (user, name) => {
    await user.click(within(await cardOf(name)).getByRole("button", { name: "Editar" }));
    return screen.findByRole("dialog", { name: "Editar Usuario" });
  };

  it("carga los datos del miembro, envía los cambios y actualiza la tarjeta", async () => {
    stubUsers();
    let put = null;
    server.use(
      http.put(api("/users/:id"), async ({ request, params }) => {
        put = { id: params.id, body: await request.json() };
        return HttpResponse.json({ user: { ...otherPedagogoUser, ...put.body, createdAt: "2026-03-10T10:00:00.000Z" } });
      }),
    );
    const user = userEvent.setup();
    renderUsers();

    const dialog = await openEdit(user, "Nathan Test");
    expect(within(dialog).getByLabelText("Nombre Completo")).toHaveValue("Nathan Test");
    expect(within(dialog).getByLabelText("Especialidad")).toHaveValue("Logopedia");
    expect(within(dialog).getByRole("button", { name: /Pedagogo\/a/ })).toHaveAttribute("aria-pressed", "true");

    await user.clear(within(dialog).getByLabelText("Nombre Completo"));
    await user.type(within(dialog).getByLabelText("Nombre Completo"), "Nathan Renombrado");
    await user.click(within(dialog).getByRole("button", { name: /Administrador/ }));
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByRole("heading", { name: "Nathan Renombrado" })).toBeInTheDocument();
    expect(put).toEqual({ id: "u-nathan", body: { name: "Nathan Renombrado", specialization: "Logopedia", rol: "admin" } });
    expect(screen.getByRole("status")).toHaveTextContent("Datos del usuario actualizados correctamente.");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("al editar la propia cuenta se actualiza también la sesión guardada", async () => {
    stubUsers();
    server.use(
      http.put(api("/users/:id"), async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ user: { ...adminUser, ...body } });
      }),
    );
    const user = userEvent.setup();
    renderUsers();

    const dialog = await openEdit(user, "Jheremi Admin");
    await user.clear(within(dialog).getByLabelText("Nombre Completo"));
    await user.type(within(dialog).getByLabelText("Nombre Completo"), "Jheremi Renombrado");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    await screen.findByRole("heading", { name: "Jheremi Renombrado" });
    expect(JSON.parse(localStorage.getItem("user")).name).toBe("Jheremi Renombrado");
  });

  it("valida que haya nombre y especialidad", async () => {
    stubUsers();
    const user = userEvent.setup();
    renderUsers();
    const dialog = await openEdit(user, "Nathan Test");

    await user.clear(within(dialog).getByLabelText("Nombre Completo"));
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("El nombre no puede estar vacío.");

    await user.type(within(dialog).getByLabelText("Nombre Completo"), "Nathan");
    await user.selectOptions(within(dialog).getByLabelText("Especialidad"), "");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Debes seleccionar una especialidad.");
  });

  it("muestra el motivo si la API rechaza el cambio (p. ej. quitar el rol al último admin)", async () => {
    stubUsers();
    server.use(
      http.put(api("/users/:id"), () =>
        HttpResponse.json({ message: "Operación no permitida", error: "Debe existir al menos un administrador en el sistema" }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderUsers();
    const dialog = await openEdit(user, "Jheremi Admin");

    await user.click(within(dialog).getByRole("button", { name: /Pedagogo\/a/ }));
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Debe existir al menos un administrador en el sistema");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("al reabrir el modal para otro miembro empieza con los datos de ese miembro", async () => {
    stubUsers();
    const user = userEvent.setup();
    renderUsers();

    let dialog = await openEdit(user, "Nathan Test");
    await user.type(within(dialog).getByLabelText("Nombre Completo"), " (sin guardar)");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    dialog = await openEdit(user, "Samantha Test");
    expect(within(dialog).getByLabelText("Nombre Completo")).toHaveValue("Samantha Test");
  });
});

describe("Users: eliminar miembro", () => {
  const openDelete = async (user, name) => {
    await user.click(within(await cardOf(name)).getByTitle("Eliminar usuario del equipo"));
    return screen.findByRole("dialog", { name: "¿Eliminar usuario del equipo?" });
  };

  it("pide confirmación, elimina al miembro y lo quita de la lista", async () => {
    const state = stubUsers();
    let deletedId = null;
    server.use(
      http.delete(api("/users/:id"), ({ params }) => {
        deletedId = params.id;
        state.users = state.users.filter((u) => u._id !== params.id);
        return HttpResponse.json({ message: "Usuario eliminado correctamente" });
      }),
    );
    const user = userEvent.setup();
    renderUsers();

    const dialog = await openDelete(user, "Nathan Test");
    expect(within(dialog).getByText("nathan@pedagogo.com")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Sí, eliminar" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Nathan Test" })).not.toBeInTheDocument());
    expect(deletedId).toBe("u-nathan");
    expect(screen.getByRole("status")).toHaveTextContent('El usuario "Nathan Test" ha sido eliminado del equipo.');
    expect(screen.getByText("Total Equipo").nextElementSibling).toHaveTextContent("2");
  });

  it("Cancelar no elimina nada", async () => {
    stubUsers();
    let called = false;
    server.use(http.delete(api("/users/:id"), () => ((called = true), HttpResponse.json({}))));
    const user = userEvent.setup();
    renderUsers();

    const dialog = await openDelete(user, "Nathan Test");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(called).toBe(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nathan Test" })).toBeInTheDocument();
  });

  it("si el miembro tiene alumnos o sesiones asignados explica cuántos y ya no ofrece eliminar", async () => {
    stubUsers();
    server.use(
      http.delete(api("/users/:id"), () =>
        HttpResponse.json(
          {
            message: "No se puede eliminar el usuario",
            error: "El usuario tiene estudiantes o sesiones asignadas. Debes reasignarlos o gestionarlos antes de eliminarlo.",
            details: { estudiantesAsignados: 3, sesionesAsignadas: 5 },
          },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderUsers();

    const dialog = await openDelete(user, "Samantha Test");
    await user.click(within(dialog).getByRole("button", { name: "Sí, eliminar" }));

    expect(await within(dialog).findByText(/3 alumno\(s\) asignados/)).toBeInTheDocument();
    expect(within(dialog).getByText(/5 sesión\(es\) vinculadas/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Sí, eliminar" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Entendido" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Samantha Test" })).toBeInTheDocument();
  });
});

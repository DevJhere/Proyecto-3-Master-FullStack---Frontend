// Pruebas de integración de toda la aplicación: router + sesión + layout + páginas, con la API simulada
import { afterEach, describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import App from "./App";
import { api, server } from "./test/server";
import { adminUser, makeStudent, pedagogoUser } from "./test/fixtures";
import { loginAs } from "./test/utils";

afterEach(() => window.history.pushState({}, "", "/"));

const lucia = makeStudent({ _id: "s-lucia", name: "Lucía Navarro" });

// Respuestas comunes que piden el dashboard, el listado de alumnos y el de usuarios
const stubApi = () =>
  server.use(
    http.get(api("/sessions"), () => HttpResponse.json([])),
    http.get(api("/students"), () => HttpResponse.json({ students: [lucia] })),
    http.get(api("/users"), () => HttpResponse.json({ users: [adminUser, pedagogoUser] })),
  );

const visit = (path, user = null) => {
  if (user) loginAs(user);
  stubApi();
  window.history.pushState({}, "", path);
  return render(<App />);
};

const sidebar = () => screen.getByRole("complementary");

describe("App: acceso y redirecciones", () => {
  it.each(["/dashboard", "/students", "/sessions", "/profile", "/users", "/"])(
    "sin sesión, %s lleva al login",
    (path) => {
      visit(path);
      expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
      expect(window.location.pathname).toBe("/login");
    },
  );

  it("con sesión, /login y /register llevan al dashboard", async () => {
    visit("/login", pedagogoUser);
    expect(await screen.findByText("Hola, Samantha")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/dashboard");
  });

  it("una ruta inexistente muestra la página 404 con enlace de vuelta", () => {
    visit("/esto-no-existe", pedagogoUser);

    expect(screen.getByRole("heading", { name: "Página no encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/dashboard");
    expect(window.location.pathname).toBe("/404");
  });
});

describe("App: acceso por rol", () => {
  it("un admin ve 'Usuarios' en el menú y puede abrir la gestión de equipo", async () => {
    visit("/users", adminUser);

    expect(await screen.findByRole("heading", { name: "Gestión de Equipo" })).toBeInTheDocument();
    expect(within(sidebar()).getByRole("link", { name: "Usuarios" })).toBeInTheDocument();
  });

  it("un pedagogo no ve 'Usuarios' en el menú y /users lo devuelve al dashboard", async () => {
    visit("/users", pedagogoUser);

    expect(await screen.findByText("Hola, Samantha")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/dashboard");
    expect(within(sidebar()).queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
  });

  it("el menú muestra el nombre y la especialidad del usuario", async () => {
    visit("/dashboard", pedagogoUser);
    await screen.findByText("Hola, Samantha");

    expect(within(sidebar()).getByText("Samantha Test")).toBeInTheDocument();
    expect(within(sidebar()).getByText("Psicología Educativa")).toBeInTheDocument();
  });

  it("el rol guardado en el navegador se corrige con el que devuelve el servidor", async () => {
    // El usuario guardado dice 'admin', pero el servidor sabe que es pedagogo
    localStorage.setItem("token", "tok");
    localStorage.setItem("user", JSON.stringify({ ...pedagogoUser, rol: "admin" }));
    server.use(http.get(api("/auth/me"), () => HttpResponse.json(pedagogoUser)));
    stubApi();
    window.history.pushState({}, "", "/dashboard");
    render(<App />);

    await waitFor(() => expect(within(sidebar()).queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument());
    expect(JSON.parse(localStorage.getItem("user")).rol).toBe("pedagogo");
  });
});

describe("App: flujo completo de sesión", () => {
  it("iniciar sesión lleva al dashboard y cerrar sesión vuelve al login limpiando el almacenamiento", async () => {
    server.use(
      http.post(api("/auth/login"), () => HttpResponse.json({ token: "tok-1", user: pedagogoUser })),
      http.get(api("/auth/me"), () => HttpResponse.json(pedagogoUser)),
    );
    stubApi();
    const user = userEvent.setup();
    window.history.pushState({}, "", "/login");
    render(<App />);

    await user.type(screen.getByLabelText("Correo Electrónico"), "samatha@pedagogo.com");
    await user.type(screen.getByLabelText("Contraseña"), "password1234");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Hola, Samantha")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBe("tok-1");

    await user.click(screen.getByRole("button", { name: /Cerrar sesión/ }));

    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("tras cerrar sesión, el botón atrás no permite volver a una página privada", async () => {
    const user = userEvent.setup();
    visit("/dashboard", pedagogoUser);
    await screen.findByText("Hola, Samantha");

    await user.click(screen.getByRole("button", { name: /Cerrar sesión/ }));
    await screen.findByRole("button", { name: "Entrar" });
    window.history.back();

    await waitFor(() => expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument());
  });

  it("si la API responde 401 (sesión caducada) vuelve al login sin recargar y sin dejar datos guardados", async () => {
    loginAs(pedagogoUser);
    server.use(
      http.get(api("/students"), () => HttpResponse.json({ error: "Token inválido o expirado" }, { status: 401 })),
      http.get(api("/sessions"), () => HttpResponse.json([])),
    );
    window.history.pushState({}, "", "/students");
    render(<App />);

    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
    expect(window.location.pathname).toBe("/login");
  });

  it("la sesión guardada está corrupta: muestra el login en lugar de una pantalla en blanco", () => {
    localStorage.setItem("token", "tok");
    localStorage.setItem("user", "{esto-no-es-json");
    stubApi();
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });
});

describe("App: navegación con el menú", () => {
  it("cada enlace del menú abre su página", async () => {
    const user = userEvent.setup();
    visit("/dashboard", pedagogoUser);
    await screen.findByText("Hola, Samantha");

    await user.click(within(sidebar()).getByRole("link", { name: "Alumnos" }));
    expect(await screen.findByRole("heading", { name: "Alumnos" })).toBeInTheDocument();
    expect(await screen.findByText("Lucía Navarro")).toBeInTheDocument();

    await user.click(within(sidebar()).getByRole("link", { name: "Sesiones" }));
    expect(await screen.findByRole("heading", { name: "Calendario" })).toBeInTheDocument();

    await user.click(within(sidebar()).getByRole("link", { name: "Perfil" }));
    expect(await screen.findByRole("heading", { name: "Configuración de perfil" })).toBeInTheDocument();

    await user.click(within(sidebar()).getByRole("link", { name: "Inicio" }));
    expect(await screen.findByText("Hola, Samantha")).toBeInTheDocument();
  });

  it("desde un alumno se llega a su ficha y se puede volver a la lista", async () => {
    server.use(http.get(api("/students/:id"), () => HttpResponse.json(lucia)));
    const user = userEvent.setup();
    visit("/students", pedagogoUser);

    await user.click((await screen.findByText("Lucía Navarro")).closest("a"));
    expect(await screen.findByRole("heading", { name: "Lucía Navarro" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/students/s-lucia");

    await user.click(screen.getByRole("link", { name: /Volver a alumnos/ }));
    expect(await screen.findByRole("heading", { name: "Alumnos" })).toBeInTheDocument();
  });
});

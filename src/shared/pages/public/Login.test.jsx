import { describe, it, expect } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { Route, Routes } from "react-router-dom";
import { Login } from "./Login";
import { api, server } from "../../../test/server";
import { adminUser, pedagogoUser } from "../../../test/fixtures";
import { renderWithProviders } from "../../../test/utils";

const renderLogin = (user = null) =>
  renderWithProviders(
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<p>Pantalla de registro</p>} />
      <Route path="/dashboard" element={<p>Pantalla de dashboard</p>} />
    </Routes>,
    { route: "/login", user },
  );

const fillAndSubmit = async (user, email, password) => {
  await user.type(screen.getByLabelText("Correo Electrónico"), email);
  await user.type(screen.getByLabelText("Contraseña"), password);
  await user.click(screen.getByRole("button", { name: "Entrar" }));
};

describe("Login", () => {
  it("muestra los campos y el enlace a crear cuenta", () => {
    renderLogin();
    expect(screen.getByLabelText("Correo Electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear Cuenta" })).toHaveAttribute("href", "/register");
  });

  it("no envía nada y avisa si faltan campos", () => {
    let called = false;
    server.use(http.post(api("/auth/login"), () => ((called = true), HttpResponse.json({}))));
    renderLogin();

    fireEvent.submit(screen.getByRole("button", { name: "Entrar" }).closest("form"));

    expect(screen.getByText("Debes completar todos los campos.")).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it("con credenciales correctas envía el login y navega al dashboard", async () => {
    let body;
    server.use(
      http.post(api("/auth/login"), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ token: "tok", user: pedagogoUser });
      }),
      http.get(api("/auth/me"), () => HttpResponse.json(pedagogoUser)),
    );
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, "samatha@pedagogo.com", "password1234");

    expect(await screen.findByText("Pantalla de dashboard")).toBeInTheDocument();
    expect(body).toEqual({ email: "samatha@pedagogo.com", password: "password1234" });
    expect(localStorage.getItem("token")).toBe("tok");
  });

  it("con credenciales incorrectas muestra el error del servidor y se queda en el login", async () => {
    server.use(http.post(api("/auth/login"), () => HttpResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 })));
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, "samatha@pedagogo.com", "mala");

    expect(await screen.findByText("Email o contraseña incorrectos")).toBeInTheDocument();
    expect(screen.queryByText("Pantalla de dashboard")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("deshabilita el botón y muestra 'Entrando...' mientras espera la respuesta", async () => {
    server.use(
      http.post(api("/auth/login"), async () => {
        await delay(150);
        return HttpResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
      }),
    );
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, "a@a.com", "123456");

    expect(await screen.findByRole("button", { name: "Entrando..." })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled());
  });

  it("borra el mensaje de error en cuanto el usuario vuelve a escribir", async () => {
    server.use(http.post(api("/auth/login"), () => HttpResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 })));
    const user = userEvent.setup();
    renderLogin();
    await fillAndSubmit(user, "a@a.com", "mala");
    await screen.findByText("Email o contraseña incorrectos");

    await user.type(screen.getByLabelText("Contraseña"), "x");

    expect(screen.queryByText("Email o contraseña incorrectos")).not.toBeInTheDocument();
  });

  it("el botón del ojo muestra y oculta la contraseña", async () => {
    const user = userEvent.setup();
    renderLogin();
    const password = screen.getByLabelText("Contraseña");
    expect(password).toHaveAttribute("type", "password");

    // El botón del ojo es el único botón del campo que no es "Entrar"
    const toggle = screen.getAllByRole("button").find((button) => button.textContent === "");
    await user.click(toggle);
    expect(password).toHaveAttribute("type", "text");

    await user.click(toggle);
    expect(password).toHaveAttribute("type", "password");
  });

  it.each([
    ["pedagogo", pedagogoUser],
    ["admin", adminUser],
  ])("si ya hay sesión de %s redirige al dashboard", (_, user) => {
    renderLogin(user);
    expect(screen.getByText("Pantalla de dashboard")).toBeInTheDocument();
  });
});

// Página de registro: validaciones, envío sin rol (el backend crea siempre pedagogos), mensajes y redirección al login

import { describe, it, expect } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { Register } from "./Register";
import { api, server } from "../../../test/server";
import { pedagogoUser } from "../../../test/fixtures";
import { renderWithProviders } from "../../../test/utils";

const renderRegister = (user = null) =>
  renderWithProviders(
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<p>Pantalla de login</p>} />
      <Route path="/dashboard" element={<p>Pantalla de dashboard</p>} />
    </Routes>,
    { route: "/register", user },
  );

const fillForm = async (user, { name = "Lucía Rodríguez", specialization = "Logopedia", email = "lucia@correo.com", password = "123456" } = {}) => {
  if (name) await user.type(screen.getByLabelText("Nombre Completo"), name);
  if (specialization) await user.selectOptions(screen.getByLabelText("Especialidad"), specialization);
  if (email) await user.type(screen.getByLabelText("Correo Electrónico"), email);
  if (password) await user.type(screen.getByLabelText("Contraseña"), password);
};

// Pulsa 'Crear Cuenta'
const submit = (user) => user.click(screen.getByRole("button", { name: "Crear Cuenta" }));

// Registra un handler que guarda el body recibido
const captureRegister = (response = () => HttpResponse.json({ message: "Usuario registrado correctamente" }, { status: 201 })) => {
  const captured = { body: null, calls: 0 };
  server.use(
    http.post(api("/auth/register"), async ({ request }) => {
      captured.calls += 1;
      captured.body = await request.json();
      return response();
    }),
  );
  return captured;
};

describe("Register", () => {
  it("ofrece todas las especialidades y tiene los campos asociados a su etiqueta", () => {
    renderRegister();
    const options = Array.from(screen.getByLabelText("Especialidad").querySelectorAll("option")).map((o) => o.textContent);
    expect(options).toEqual([
      "Selecciona una especialidad",
      "Psicología Educativa",
      "Logopedia",
      "Atención Temprana",
      "Neuropsicología",
      "Orientación Educativa",
    ]);
  });

  it("avisa y no envía nada si faltan campos obligatorios", () => {
    const captured = captureRegister();
    renderRegister();

    fireEvent.submit(screen.getByRole("button", { name: "Crear Cuenta" }).closest("form"));

    expect(screen.getByText("Por favor, debe cumplimentar los campos obligatorios")).toBeInTheDocument();
    expect(captured.calls).toBe(0);
  });

  it("rechaza contraseñas de menos de 6 caracteres sin llamar a la API", async () => {
    const captured = captureRegister();
    const user = userEvent.setup();
    renderRegister();

    await fillForm(user, { password: "12345" });
    await submit(user);

    expect(screen.getByText("La contraseña debe tener al menos 6 caracteres")).toBeInTheDocument();
    expect(captured.calls).toBe(0);
  });

  it("envía los datos limpios, sin rol, y muestra el mensaje de éxito", async () => {
    const captured = captureRegister();
    const user = userEvent.setup();
    renderRegister();

    await fillForm(user, { name: "  Lucía Rodríguez  ", email: "  Lucia@CORREO.com " });
    await submit(user);

    expect(await screen.findByText(/Cuenta creada con éxito/)).toBeInTheDocument();
    expect(captured.body).toEqual({
      name: "Lucía Rodríguez",
      specialization: "Logopedia",
      email: "lucia@correo.com",
      password: "123456",
    });
    expect(captured.body).not.toHaveProperty("rol");
  });

  it("tras registrarse redirige al login pasado 1,5 segundos", async () => {
    captureRegister();
    const user = userEvent.setup();
    renderRegister();

    await fillForm(user);
    await submit(user);
    await screen.findByText(/Cuenta creada con éxito/);
    expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();

    expect(await screen.findByText("Pantalla de login", {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it("muestra el error del servidor (p. ej. email ya registrado) y no redirige", async () => {
    captureRegister(() => HttpResponse.json({ message: "Usuario ya registrado", error: "El correo electrónico ya está registrado" }, { status: 400 }));
    const user = userEvent.setup();
    renderRegister();

    await fillForm(user);
    await submit(user);

    expect(await screen.findByText("El correo electrónico ya está registrado")).toBeInTheDocument();
    expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear Cuenta" })).toBeEnabled();
  });

  it("quita los mensajes al volver a escribir", async () => {
    captureRegister(() => HttpResponse.json({ error: "Fallo del servidor" }, { status: 500 }));
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user);
    await submit(user);
    await screen.findByText("Fallo del servidor");

    await user.type(screen.getByLabelText("Nombre Completo"), "x");

    expect(screen.queryByText("Fallo del servidor")).not.toBeInTheDocument();
  });

  it("si ya hay sesión redirige al dashboard", () => {
    renderRegister(pedagogoUser);
    expect(screen.getByText("Pantalla de dashboard")).toBeInTheDocument();
  });
});

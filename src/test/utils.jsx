// Utilidades para renderizar componentes con router y sesión, igual que en la app real
import { render } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../shared/context/AuthContext";
import { api, server } from "./server";

// Deja guardada una sesión como si el usuario ya hubiese iniciado sesión.
// También responde a GET /auth/me (el AuthProvider lo consulta al arrancar con sesión guardada).
export const loginAs = (user) => {
  localStorage.setItem("token", `token-${user._id}`);
  localStorage.setItem("user", JSON.stringify(user));
  server.use(http.get(api("/auth/me"), () => HttpResponse.json(user)));
};

// Renderiza dentro de MemoryRouter + AuthProvider. Con `user` arranca ya autenticado.
export const renderWithProviders = (ui, { route = "/", user = null } = {}) => {
  if (user) loginAs(user);

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
};

// Atajo para registrar respuestas JSON: json("get", "/students", { students: [] })
export const json = (method, path, body, status = 200) =>
  server.use(http[method](api(path), () => HttpResponse.json(body, { status })));

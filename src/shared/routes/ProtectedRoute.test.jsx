import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { renderWithProviders } from "../../test/utils";
import { adminUser, pedagogoUser } from "../../test/fixtures";

// Rutas mínimas para ver adónde redirige cada caso
const renderRoutes = (route, user) =>
  renderWithProviders(
    <Routes>
      <Route path="/login" element={<p>Pantalla de login</p>} />
      <Route path="/dashboard" element={<p>Pantalla de dashboard</p>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/privada" element={<p>Contenido privado</p>} />
      </Route>
      <Route
        path="/solo-admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <p>Contenido de admin</p>
          </ProtectedRoute>
        }
      />
    </Routes>,
    { route, user },
  );

describe("ProtectedRoute", () => {
  it("redirige a /login si no hay sesión", () => {
    renderRoutes("/privada", null);
    expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
  });

  it("muestra la ruta anidada (Outlet) a un usuario autenticado", () => {
    renderRoutes("/privada", pedagogoUser);
    expect(screen.getByText("Contenido privado")).toBeInTheDocument();
  });

  it("muestra los children si el rol está permitido", () => {
    renderRoutes("/solo-admin", adminUser);
    expect(screen.getByText("Contenido de admin")).toBeInTheDocument();
  });

  it("redirige a /dashboard si el rol no está permitido", () => {
    renderRoutes("/solo-admin", pedagogoUser);
    expect(screen.getByText("Pantalla de dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Contenido de admin")).not.toBeInTheDocument();
  });

  it("sin sesión, una ruta con roles redirige a /login (no a /dashboard)", () => {
    renderRoutes("/solo-admin", null);
    expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
  });
});

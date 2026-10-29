import { describe, it, expect } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "../hooks/useAuth";
import { api, server } from "../../test/server";
import { adminUser, pedagogoUser } from "../../test/fixtures";
import { loginAs } from "../../test/utils";

const renderAuth = () => renderHook(() => useAuth(), { wrapper: AuthProvider });

describe("AuthProvider: sesión guardada", () => {
  it("sin datos guardados arranca sin autenticar", () => {
    const { result } = renderAuth();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("recupera la sesión guardada en el primer render, sin pasar por un estado sin sesión", () => {
    loginAs(pedagogoUser);
    const { result } = renderAuth();

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.email).toBe(pedagogoUser.email);
    expect(result.current.token).toBe(`token-${pedagogoUser._id}`);
  });

  it.each([
    ["JSON corrupto", "{no-es-json"],
    ["valor null", "null"],
    ["un valor que no es objeto", '"texto"'],
  ])("descarta la sesión sin romper la app si el usuario guardado es %s", (_, storedUser) => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("user", storedUser);

    const { result } = renderAuth();

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("sin token no se considera autenticado aunque haya usuario guardado", () => {
    localStorage.setItem("user", JSON.stringify(pedagogoUser));
    const { result } = renderAuth();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("refresca el usuario desde /auth/me (por ejemplo, si le han cambiado el rol)", async () => {
    loginAs({ ...pedagogoUser, rol: "pedagogo" });
    server.use(http.get(api("/auth/me"), () => HttpResponse.json({ ...pedagogoUser, rol: "admin", name: "Nombre Nuevo" })));

    const { result } = renderAuth();
    expect(result.current.user.rol).toBe("pedagogo"); // primero lo guardado

    await waitFor(() => expect(result.current.user.rol).toBe("admin"));
    expect(result.current.user.name).toBe("Nombre Nuevo");
    expect(JSON.parse(localStorage.getItem("user")).rol).toBe("admin");
  });

  it("si /auth/me falla por red mantiene la sesión guardada", async () => {
    loginAs(pedagogoUser);
    server.use(http.get(api("/auth/me"), () => HttpResponse.error()));

    const { result } = renderAuth();
    await act(async () => {}); // deja terminar la petición fallida

    expect(result.current.isAuthenticated).toBe(true);
  });

  it("si /auth/me responde 401 cierra la sesión sin recargar la página", async () => {
    loginAs(pedagogoUser);
    server.use(http.get(api("/auth/me"), () => HttpResponse.json({ error: "Token inválido" }, { status: 401 })));

    const { result } = renderAuth();

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(localStorage.getItem("token")).toBeNull();
  });
});

describe("AuthProvider: login, logout y updateUser", () => {
  it("login correcto guarda token y usuario y actualiza el estado", async () => {
    server.use(
      http.post(api("/auth/login"), () => HttpResponse.json({ token: "tok-123", user: adminUser })),
      http.get(api("/auth/me"), () => HttpResponse.json(adminUser)),
    );
    const { result } = renderAuth();

    let outcome;
    await act(async () => {
      outcome = await result.current.login({ email: adminUser.email, password: "x" });
    });

    expect(outcome).toEqual({ success: true, message: "Inicio de sesión exitoso" });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.rol).toBe("admin");
    expect(localStorage.getItem("token")).toBe("tok-123");
    expect(JSON.parse(localStorage.getItem("user")).email).toBe(adminUser.email);
  });

  it("login con credenciales incorrectas devuelve el mensaje del servidor y no guarda nada", async () => {
    server.use(http.post(api("/auth/login"), () => HttpResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 })));
    const { result } = renderAuth();

    let outcome;
    await act(async () => {
      outcome = await result.current.login({ email: "a@a.com", password: "mala" });
    });

    expect(outcome).toEqual({ success: false, message: "Email o contraseña incorrectos" });
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("login sin respuesta del servidor devuelve un mensaje por defecto", async () => {
    server.use(http.post(api("/auth/login"), () => HttpResponse.error()));
    const { result } = renderAuth();

    let outcome;
    await act(async () => {
      outcome = await result.current.login({ email: "a@a.com", password: "x" });
    });

    expect(outcome.success).toBe(false);
    expect(outcome.message).toBe("Email o contraseña incorrectos.");
  });

  it("un 401 en el login no se trata como sesión caducada", async () => {
    loginAs(pedagogoUser);
    server.use(http.post(api("/auth/login"), () => HttpResponse.json({ error: "mal" }, { status: 401 })));
    const { result } = renderAuth();

    await act(async () => {
      await result.current.login({ email: "a@a.com", password: "x" });
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it("logout limpia el estado y el almacenamiento", async () => {
    loginAs(pedagogoUser);
    const { result } = renderAuth();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("updateUser actualiza el estado y el almacenamiento", async () => {
    loginAs(pedagogoUser);
    const { result } = renderAuth();

    act(() => result.current.updateUser({ ...pedagogoUser, name: "Otro Nombre" }));

    expect(result.current.user.name).toBe("Otro Nombre");
    expect(JSON.parse(localStorage.getItem("user")).name).toBe("Otro Nombre");
    expect(result.current.token).toBe(`token-${pedagogoUser._id}`);
  });
});

describe("useAuth", () => {
  it("lanza un error claro si se usa fuera de un AuthProvider", () => {
    const consoleError = () => {};
    const original = console.error;
    console.error = consoleError; // React escribe el error en consola al lanzar durante el render
    try {
      expect(() => renderHook(() => useAuth())).toThrow("useAuth debe ser utilizado dentro de un AuthProvider");
    } finally {
      console.error = original;
    }
  });
});

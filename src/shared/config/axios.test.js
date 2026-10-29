// Cliente HTTP compartido: cabecera Authorization y cierre de sesión automático ante un 401 (contra el servidor falso de MSW)

import { afterEach, describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import apiClient, { setUnauthorizedHandler } from "./axios";
import { api, server } from "../../test/server";

// Quita el manejador de 401 para que no se filtre de un test a otro
afterEach(() => setUnauthorizedHandler(null));

// El token guardado en localStorage se añade a cada petición como Bearer
describe("apiClient: cabecera de autenticación", () => {
  it("envía Authorization: Bearer con el token guardado", async () => {
    let authorization;
    server.use(
      http.get(api("/ping"), ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      }),
    );
    localStorage.setItem("token", "tok-abc");

    await apiClient.get("/ping");

    expect(authorization).toBe("Bearer tok-abc");
  });

  it("no envía Authorization si no hay token", async () => {
    let authorization = "sin-valor";
    server.use(
      http.get(api("/ping"), ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiClient.get("/ping");

    expect(authorization).toBeNull();
  });
});

// Solo un 401 en rutas protegidas es sesión caducada; el 401 del login (credenciales mal) y el resto de errores no cierran sesión
describe("apiClient: respuesta 401", () => {
  // Responde a cualquier método de la ruta con el status indicado
  const stubStatus = (path, status) =>
    server.use(http.all(api(path), () => HttpResponse.json({ error: "x" }, { status })));

  it("limpia la sesión y avisa al manejador, y el error sigue llegando al llamador", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    localStorage.setItem("token", "tok");
    localStorage.setItem("user", "{}");
    stubStatus("/students", 401);

    await expect(apiClient.get("/students")).rejects.toMatchObject({ response: { status: 401 } });

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("un 401 en /auth/login (credenciales mal) no cierra ninguna sesión", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    localStorage.setItem("token", "tok");
    stubStatus("/auth/login", 401);

    await expect(apiClient.post("/auth/login", {})).rejects.toBeTruthy();

    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(localStorage.getItem("token")).toBe("tok");
  });

  it.each([400, 403, 404, 409, 500])("un %i no cierra la sesión", async (status) => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    localStorage.setItem("token", "tok");
    stubStatus("/students", status);

    await expect(apiClient.get("/students")).rejects.toMatchObject({ response: { status } });

    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(localStorage.getItem("token")).toBe("tok");
  });
});

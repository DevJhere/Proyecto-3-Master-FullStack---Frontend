import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./server";

// jsdom no implementa createObjectURL (previsualización de imágenes)
URL.createObjectURL = () => "blob:preview";
URL.revokeObjectURL = () => {};

// Cualquier petición sin handler falla el test: así no se escapan llamadas reales a la red
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  vi.restoreAllMocks();
});

afterAll(() => server.close());

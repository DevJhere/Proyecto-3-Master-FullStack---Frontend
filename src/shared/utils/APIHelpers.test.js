import { describe, it, expect } from "vitest";
import { AxiosError } from "axios";
import { normalizeSessions, normalizeStudents, getApiErrorMessage } from "./APIHelpers";

describe.each([
  ["normalizeSessions", normalizeSessions, "sessions"],
  ["normalizeStudents", normalizeStudents, "students"],
])("%s", (_, normalize, key) => {
  const items = [{ _id: "1" }, { _id: "2" }];

  it("acepta la respuesta de axios con un array en data", () => {
    expect(normalize({ data: items })).toEqual(items);
  });

  it(`acepta la respuesta de axios con { ${key} } en data`, () => {
    expect(normalize({ data: { [key]: items } })).toEqual(items);
  });

  it("acepta directamente un array o un objeto con la clave", () => {
    expect(normalize(items)).toEqual(items);
    expect(normalize({ [key]: items })).toEqual(items);
  });

  it.each([undefined, null, {}, { data: null }, { data: "texto" }, { data: { otra: [] } }, "texto"])(
    "devuelve [] con una respuesta inesperada (%j)",
    (value) => {
      expect(normalize(value)).toEqual([]);
    },
  );
});

describe("getApiErrorMessage", () => {
  const axiosError = (data) => ({ response: { data } });

  it("prefiere el campo error del backend", () => {
    expect(getApiErrorMessage(axiosError({ error: "Detalle", message: "Resumen" }))).toBe("Detalle");
  });

  it("usa message si no hay error", () => {
    expect(getApiErrorMessage(axiosError({ message: "Resumen" }))).toBe("Resumen");
  });

  it("acepta un cuerpo de respuesta que es texto plano", () => {
    expect(getApiErrorMessage(axiosError("Texto del servidor"))).toBe("Texto del servidor");
  });

  it("ignora error o message que no son texto (p. ej. objetos de validación)", () => {
    expect(getApiErrorMessage(axiosError({ error: { campo: "x" }, message: ["a"] }), "Por defecto")).toBe("Por defecto");
  });

  it("usa el mensaje por defecto sin error o sin cuerpo", () => {
    expect(getApiErrorMessage(null)).toBe("Ha ocurrido un error inesperado.");
    expect(getApiErrorMessage(axiosError({}), "Por defecto")).toBe("Por defecto");
  });

  it("sin respuesta del servidor muestra un mensaje de conexión en español, no el 'Network Error' de axios", () => {
    const networkError = new AxiosError("Network Error", "ERR_NETWORK");
    expect(getApiErrorMessage(networkError, "Por defecto")).toBe("No se pudo conectar con el servidor. Inténtalo de nuevo.");
  });
});

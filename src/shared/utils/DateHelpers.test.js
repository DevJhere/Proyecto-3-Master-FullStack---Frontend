import { describe, it, expect } from "vitest";
import {
  toLocalDateString,
  formatDate,
  formatTime,
  formatCapitalizedDate,
  getMondayOfWeek,
} from "./DateHelpers";

// Los tests corren con TZ=Europe/Madrid (ver src/test/global-setup.js)
describe("toLocalDateString", () => {
  it("devuelve YYYY-MM-DD en hora local", () => {
    expect(toLocalDateString(new Date(2026, 10, 5, 10, 30))).toBe("2026-11-05");
  });

  it("usa el día local, no el UTC: 00:30 en Madrid sigue siendo ese día", () => {
    // 2026-11-04T23:30Z es el 5 de noviembre a las 00:30 en Madrid
    expect(toLocalDateString("2026-11-04T23:30:00.000Z")).toBe("2026-11-05");
  });

  it("rellena con ceros mes y día", () => {
    expect(toLocalDateString(new Date(2026, 0, 3))).toBe("2026-01-03");
  });

  it.each([undefined, null, "", "no-es-fecha"])("devuelve cadena vacía con %s", (value) => {
    expect(toLocalDateString(value)).toBe("");
  });
});

describe("formatDate", () => {
  it("formatea en español con día, mes corto y año", () => {
    expect(formatDate(new Date(2026, 10, 5))).toMatch(/^05 nov\.? 2026$/);
  });

  it("acepta opciones que sustituyen a las por defecto", () => {
    expect(formatDate(new Date(2026, 10, 5), { month: "long" })).toContain("noviembre");
  });

  it("devuelve 'No registrada' sin fecha y cadena vacía con fecha inválida", () => {
    expect(formatDate(null)).toBe("No registrada");
    expect(formatDate("no-es-fecha")).toBe("");
  });
});

describe("formatTime", () => {
  it("devuelve HH:MM en 24 horas con ceros", () => {
    expect(formatTime(new Date(2026, 10, 5, 9, 5))).toBe("09:05");
    expect(formatTime(new Date(2026, 10, 5, 17, 0))).toBe("17:00");
  });

  it("convierte desde UTC a hora local", () => {
    expect(formatTime("2026-11-05T09:00:00.000Z")).toBe("10:00"); // noviembre: UTC+1
  });

  it("devuelve cadena vacía sin fecha", () => {
    expect(formatTime(undefined)).toBe("");
  });
});

describe("formatCapitalizedDate", () => {
  it("empieza en mayúscula y escribe el día de la semana completo", () => {
    expect(formatCapitalizedDate(new Date(2026, 10, 12))).toBe("Jueves, 12 de noviembre de 2026");
  });

  it("devuelve cadena vacía sin fecha", () => {
    expect(formatCapitalizedDate(null)).toBe("");
  });
});

describe("getMondayOfWeek", () => {
  it.each([
    ["lunes", new Date(2026, 10, 2, 15, 0)],
    ["miércoles", new Date(2026, 10, 4)],
    ["domingo", new Date(2026, 10, 8, 23, 59)],
  ])("devuelve el lunes 2 de noviembre a las 00:00 para un %s", (_, date) => {
    const monday = getMondayOfWeek(date);
    expect(toLocalDateString(monday)).toBe("2026-11-02");
    expect(monday.getHours()).toBe(0);
    expect(monday.getMinutes()).toBe(0);
  });

  it("no modifica la fecha recibida", () => {
    const original = new Date(2026, 10, 5, 12, 0);
    getMondayOfWeek(original);
    expect(original.getDate()).toBe(5);
  });

  it("cruza correctamente el cambio de mes", () => {
    expect(toLocalDateString(getMondayOfWeek(new Date(2026, 11, 2)))).toBe("2026-11-30");
  });
});

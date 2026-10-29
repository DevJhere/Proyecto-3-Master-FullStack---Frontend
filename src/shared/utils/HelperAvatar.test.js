// Resolución de la URL del avatar: imagen por defecto de Cloudinary o la propia del usuario

import { describe, it, expect } from "vitest";
import { getAvatarUrl } from "./HelperAvatar";

const DEFAULT_URL = "https://res.cloudinary.com/kvayxt5w/image/upload/v1788861354/profile-default.jpg";

describe("getAvatarUrl", () => {
  it.each([undefined, null, ""])("devuelve la imagen por defecto sin avatar (%s)", (value) => {
    expect(getAvatarUrl(value)).toBe(DEFAULT_URL);
  });

  it("convierte el nombre de archivo por defecto que guarda el backend en la URL completa", () => {
    expect(getAvatarUrl("profile-default.jpg")).toBe(DEFAULT_URL);
  });

  it("también trata como por defecto cualquier URL que contenga profile-default", () => {
    expect(getAvatarUrl("https://otra.cdn/profile-default.jpg")).toBe(DEFAULT_URL);
  });

  it("devuelve el avatar propio tal cual", () => {
    const own = "https://res.cloudinary.com/test/image/upload/v1/API_pedagogia/avatars/abc.png";
    expect(getAvatarUrl(own)).toBe(own);
  });
});

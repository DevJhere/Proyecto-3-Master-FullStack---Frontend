// Página de perfil: datos del usuario, guardado (PUT /users/:id multipart) y subida de foto con validación de tipo y tamaño

import { describe, it, expect } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { Profile } from "./Profile";
import { api, server } from "../../../test/server";
import { pedagogoUser } from "../../../test/fixtures";
import { renderWithProviders } from "../../../test/utils";

const CUSTOM_AVATAR = "https://res.cloudinary.com/test/image/upload/v1/API_pedagogia/avatars/mia.png";

const setup = ({ user = pedagogoUser, userOptions } = {}) => {
  renderWithProviders(<Profile />, { user });
  return userEvent.setup(userOptions);
};

// Captura la petición PUT /users/:id (multipart)
const capturePut = (response) => {
  const captured = { id: null, form: null, calls: 0 };
  server.use(
    http.put(api("/users/:id"), async ({ request, params }) => {
      captured.calls += 1;
      captured.id = params.id;
      captured.form = await request.formData();
      return response ? response(captured) : HttpResponse.json({ message: "Perfil actualizado correctamente", user: { ...pedagogoUser, name: captured.form.get("name"), specialization: captured.form.get("specialization") } });
    }),
  );
  return captured;
};

const save = (user) => user.click(screen.getByRole("button", { name: "Guardar cambios" }));
const photoInput = () => screen.getByLabelText("Foto de perfil");

// Qué se muestra al abrir la página (el correo no es editable)
describe("Profile: datos iniciales", () => {
  it("muestra los datos del usuario y deja el correo solo en lectura", () => {
    setup();
    expect(screen.getByLabelText("NOMBRE COMPLETO")).toHaveValue("Samantha Test");
    expect(screen.getByLabelText("ESPECIALIDAD")).toHaveValue("Psicología Educativa");
    expect(screen.getByLabelText("CORREO ELECTRÓNICO")).toHaveValue("samatha@pedagogo.com");
    expect(screen.getByLabelText("CORREO ELECTRÓNICO")).toBeDisabled();
  });

  it("sin foto propia muestra las iniciales; con foto propia, la imagen", () => {
    const { unmount } = renderWithProviders(<Profile />, { user: pedagogoUser });
    expect(screen.getByText("ST")).toBeInTheDocument();
    expect(screen.queryByAltText("Avatar Preview")).not.toBeInTheDocument();
    unmount();

    renderWithProviders(<Profile />, { user: { ...pedagogoUser, avatar: CUSTOM_AVATAR } });
    expect(screen.getByAltText("Avatar Preview")).toHaveAttribute("src", CUSTOM_AVATAR);
  });

  it("se actualiza si el servidor devuelve datos distintos a los guardados", async () => {
    server.use(http.get(api("/auth/me"), () => HttpResponse.json({ ...pedagogoUser, name: "Nombre Actualizado" })));
    localStorage.setItem("token", "tok");
    localStorage.setItem("user", JSON.stringify(pedagogoUser));
    renderWithProviders(<Profile />);

    await waitFor(() => expect(screen.getByLabelText("NOMBRE COMPLETO")).toHaveValue("Nombre Actualizado"));
  });
});

// Envío del formulario, sincronización de la sesión guardada y mensajes de éxito/error
describe("Profile: guardar cambios", () => {
  it("envía nombre y especialidad (no el correo), confirma y actualiza la sesión guardada", async () => {
    const captured = capturePut();
    const user = setup();

    await user.clear(screen.getByLabelText("NOMBRE COMPLETO"));
    await user.type(screen.getByLabelText("NOMBRE COMPLETO"), "  Samantha Nueva  ");
    await user.selectOptions(screen.getByLabelText("ESPECIALIDAD"), "Neuropsicología");
    await save(user);

    expect(await screen.findByRole("status")).toHaveTextContent("Perfil actualizado correctamente.");
    expect(captured.id).toBe("u-samantha");
    expect(Object.fromEntries(captured.form)).toEqual({ name: "Samantha Nueva", specialization: "Neuropsicología" });
    expect(JSON.parse(localStorage.getItem("user"))).toMatchObject({ name: "Samantha Nueva", specialization: "Neuropsicología", _id: "u-samantha" });
    expect(screen.getByLabelText("NOMBRE COMPLETO")).toHaveValue("Samantha Nueva");
  });

  it("no envía nada si el nombre está vacío", async () => {
    const captured = capturePut();
    const user = setup();

    await user.clear(screen.getByLabelText("NOMBRE COMPLETO"));
    await save(user);

    expect(screen.getByRole("alert")).toHaveTextContent("El nombre no puede estar vacío.");
    expect(captured.calls).toBe(0);
  });

  it("muestra el error del servidor y no actualiza la sesión", async () => {
    capturePut(() => HttpResponse.json({ message: "Datos incorrectos del usuario", error: "Especialidad inválida" }, { status: 400 }));
    const user = setup();

    await user.type(screen.getByLabelText("NOMBRE COMPLETO"), "x");
    await save(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Especialidad inválida");
    expect(JSON.parse(localStorage.getItem("user")).name).toBe("Samantha Test");
  });

  it("deshabilita el botón mientras guarda", async () => {
    capturePut(async () => {
      await delay(100);
      return HttpResponse.json({ user: pedagogoUser });
    });
    const user = setup();

    await save(user);

    expect(await screen.findByRole("button", { name: "Guardando..." })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled());
  });

  it("los mensajes se quitan al volver a editar", async () => {
    capturePut();
    const user = setup();
    await save(user);
    await screen.findByRole("status");

    await user.type(screen.getByLabelText("NOMBRE COMPLETO"), "x");

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

// Previsualización y límites de la foto: JPG/PNG/WebP de hasta 5MB
describe("Profile: foto de perfil", () => {
  it("previsualiza la foto elegida y la envía junto al resto de datos", async () => {
    const captured = capturePut();
    const user = setup();

    await user.upload(photoInput(), new File(["x"], "mia.png", { type: "image/png" }));
    expect(screen.getByAltText("Avatar Preview")).toHaveAttribute("src", "blob:preview");

    await save(user);
    await screen.findByRole("status");
    expect(captured.form.get("avatar").name).toBe("mia.png");
  });

  it("el botón 'Subir foto' abre el selector de archivos", async () => {
    const user = setup();
    const input = photoInput();
    let clicked = false;
    input.addEventListener("click", (event) => {
      clicked = true;
      event.preventDefault();
    });

    await user.click(screen.getByRole("button", { name: "Subir foto" }));

    expect(clicked).toBe(true);
  });

  it("rechaza imágenes de más de 5MB", async () => {
    const captured = capturePut();
    const user = setup();

    await user.upload(photoInput(), new File([new ArrayBuffer(5 * 1024 * 1024 + 1)], "grande.png", { type: "image/png" }));

    expect(screen.getByRole("alert")).toHaveTextContent("La imagen no puede superar los 5MB");
    expect(screen.queryByAltText("Avatar Preview")).not.toBeInTheDocument();
    await save(user);
    await screen.findByRole("status");
    expect(captured.form.has("avatar")).toBe(false);
  });

  it("rechaza archivos que no son JPG, PNG o WebP", async () => {
    const user = setup({ userOptions: { applyAccept: false } });

    await user.upload(photoInput(), new File(["x"], "foto.gif", { type: "image/gif" }));

    expect(screen.getByRole("alert")).toHaveTextContent("La imagen debe ser JPG, PNG o WebP.");
    expect(screen.queryByAltText("Avatar Preview")).not.toBeInTheDocument();
  });

  it("no cambia nada si se cancela el selector sin elegir archivo", () => {
    setup();
    fireEvent.change(photoInput(), { target: { files: [] } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

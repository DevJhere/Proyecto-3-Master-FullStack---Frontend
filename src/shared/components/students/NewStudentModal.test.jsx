// Alta de alumno en dos pasos (alumno -> tutor): validaciones de cada campo, envío como FormData y selector de pedagogo para admin

import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { NewStudentModal } from "./NewStudentModal";
import { api, server } from "../../../test/server";
import { adminUser, otherPedagogoUser, pedagogoUser } from "../../../test/fixtures";
import { renderWithProviders } from "../../../test/utils";

// El modal lo controla el padre con isOpen, como en la página de alumnos
const Harness = ({ onStudentCreated }) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <NewStudentModal isOpen={open} onClose={() => setOpen(false)} onStudentCreated={onStudentCreated} />
    </>
  );
};

const setup = ({ user = pedagogoUser, onStudentCreated = vi.fn(), userOptions } = {}) => {
  renderWithProviders(<Harness onStudentCreated={onStudentCreated} />, { user });
  return { onStudentCreated, user: userEvent.setup(userOptions) };
};

// Captura el FormData que recibe POST /students
const captureStudentPost = (response = () => HttpResponse.json({ message: "Estudiante creado exitosamente" }, { status: 201 })) => {
  const captured = { fields: null, calls: 0 };
  server.use(
    http.post(api("/students"), async ({ request }) => {
      captured.calls += 1;
      captured.fields = await request.formData();
      return response();
    }),
  );
  return captured;
};

// Rellena el paso 1 (datos del alumno) con valores válidos por defecto
const fillStep1 = async (user, { name = "Lucía Navarro", age = "9", course = "3 Primaria", diagnosis = "Dislexia" } = {}) => {
  await user.type(screen.getByLabelText(/^Nombre Completo/), name);
  await user.type(screen.getByLabelText(/^Edad/), age);
  if (course) await user.selectOptions(screen.getByLabelText(/^Curso/), course);
  if (diagnosis) await user.click(screen.getByRole("button", { name: diagnosis }));
};

// Rellena el paso 2 (datos del tutor) con valores válidos por defecto
const fillStep2 = async (user, { nameTutor = "Carmen Gómez", phone = "600123456", email = "carmen@correo.com" } = {}) => {
  await user.type(screen.getByLabelText(/^Nombre del tutor/), nameTutor);
  await user.type(screen.getByLabelText(/^Teléfono/), phone);
  await user.type(screen.getByLabelText(/^Correo de Contacto/), email);
};

// Avanza al paso 2
const next = (user) => user.click(screen.getByRole("button", { name: /Siguiente/ }));
// Envía el formulario
const create = (user) => user.click(screen.getByRole("button", { name: "Crear alumno" }));

// Validaciones del alumno: obligatorios, edad entre 3 y 18, diagnóstico y foto (imagen de hasta 5MB)
describe("NewStudentModal: paso 1 (alumno)", () => {
  it("empieza en el paso 1 y un pedagogo no ve el selector de pedagogo", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Datos del Alumno" })).toBeInTheDocument();
    expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Pedagogo asignado/)).not.toBeInTheDocument();
  });

  it("ofrece todos los diagnósticos como botones que se marcan al elegirlos", async () => {
    const { user } = setup();
    const dislexia = screen.getByRole("button", { name: "Dislexia" });
    expect(dislexia).toHaveAttribute("aria-pressed", "false");

    await user.click(dislexia);
    await user.click(screen.getByRole("button", { name: "TDAH" }));

    expect(dislexia).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "TDAH" })).toHaveAttribute("aria-pressed", "true");
  });

  it("no avanza y avisa si faltan datos obligatorios", async () => {
    const { user } = setup();
    await next(user);
    expect(screen.getByRole("alert")).toHaveTextContent("Por favor, debe rellenar los campos obligatorios.");
    expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
  });

  it.each(["2", "19", "9.5"])("rechaza la edad %s", async (age) => {
    const { user } = setup();
    await fillStep1(user, { age });
    await next(user);
    expect(screen.getByRole("alert")).toHaveTextContent("La edad debe estar entre 3 y 18 años.");
  });

  it.each(["3", "18"])("acepta la edad límite %s", async (age) => {
    const { user } = setup();
    await fillStep1(user, { age });
    await next(user);
    expect(screen.getByText("Paso 2 de 2")).toBeInTheDocument();
  });

  it("rechaza una imagen que no lo es", async () => {
    const { user } = setup({ userOptions: { applyAccept: false } });
    await user.upload(screen.getByLabelText("Seleccionar imagen"), new File(["x"], "informe.pdf", { type: "application/pdf" }));
    expect(screen.getByRole("alert")).toHaveTextContent("El archivo debe ser una imagen");
  });

  it("rechaza una imagen de más de 5MB", async () => {
    const { user } = setup();
    const big = new File([new ArrayBuffer(5 * 1024 * 1024 + 1)], "grande.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Seleccionar imagen"), big);
    expect(screen.getByRole("alert")).toHaveTextContent("La imagen no puede superar los 5MB.");
    expect(screen.queryByAltText("Avatar Preview")).not.toBeInTheDocument();
  });

  it("muestra la previsualización de una imagen válida", async () => {
    const { user } = setup();
    await user.upload(screen.getByLabelText("Seleccionar imagen"), new File(["x"], "foto.png", { type: "image/png" }));
    expect(screen.getByAltText("Avatar Preview")).toHaveAttribute("src", "blob:preview");
  });
});

// Validaciones del tutor (teléfono de 9 dígitos, correo), navegación entre pasos y envío
describe("NewStudentModal: paso 2 (tutor) y envío", () => {
  const goToStep2 = async (user) => {
    await fillStep1(user);
    await next(user);
  };

  it("permite volver atrás conservando lo escrito", async () => {
    const { user } = setup();
    await goToStep2(user);
    expect(screen.getByRole("dialog", { name: "Datos del tutor legal" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Atrás/ }));

    expect(screen.getByLabelText(/^Nombre Completo/)).toHaveValue("Lucía Navarro");
    expect(screen.getByRole("button", { name: "Dislexia" })).toHaveAttribute("aria-pressed", "true");
  });

  it("avisa si faltan datos del tutor", async () => {
    const captured = captureStudentPost();
    const { user } = setup();
    await goToStep2(user);

    await create(user);

    expect(screen.getByRole("alert")).toHaveTextContent("Por favor, debe rellenar los campos obligatorios.");
    expect(captured.calls).toBe(0);
  });

  it.each(["60012345", "6001234567", "+34600123456", "abcdefghi"])("rechaza el teléfono %s sin llamar a la API", async (phone) => {
    const captured = captureStudentPost();
    const { user } = setup();
    await goToStep2(user);
    await fillStep2(user, { phone });

    await create(user);

    expect(screen.getByRole("alert")).toHaveTextContent("El teléfono debe tener 9 dígitos.");
    expect(captured.calls).toBe(0);
  });

  it("rechaza un correo de tutor mal escrito", async () => {
    const captured = captureStudentPost();
    const { user } = setup();
    await goToStep2(user);
    await fillStep2(user, { email: "no-es-email" });

    await create(user);

    expect(screen.getByRole("alert")).toHaveTextContent("El correo electrónico del tutor no es válido.");
    expect(captured.calls).toBe(0);
  });

  it("envía todos los campos como FormData, normaliza el teléfono y avisa al padre", async () => {
    const captured = captureStudentPost();
    const { user, onStudentCreated } = setup();
    await goToStep2(user);
    await fillStep2(user, { phone: "600 123-456" });

    await create(user);

    await waitFor(() => expect(onStudentCreated).toHaveBeenCalledTimes(1));
    expect(Object.fromEntries(captured.fields)).toEqual({
      name: "Lucía Navarro",
      age: "9",
      course: "3 Primaria",
      diagnosis: "Dislexia",
      nameTutor: "Carmen Gómez",
      tutorRelationship: "Madre",
      phoneNumberTutor: "600123456",
      emailTutor: "carmen@correo.com",
    });
    // Un pedagogo no envía pedagogoAsignado: el backend lo asigna a él
    expect(captured.fields.has("pedagogoAsignado")).toBe(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("incluye la foto elegida en el envío", async () => {
    const captured = captureStudentPost();
    const { user } = setup();
    await user.upload(screen.getByLabelText("Seleccionar imagen"), new File(["x"], "foto.png", { type: "image/png" }));
    await goToStep2(user);
    await fillStep2(user);

    await create(user);

    await waitFor(() => expect(captured.calls).toBe(1));
    expect(captured.fields.get("avatar").name).toBe("foto.png");
  });

  it("muestra el error del servidor y deja el formulario abierto para corregir", async () => {
    captureStudentPost(() =>
      HttpResponse.json({ message: "El estudiante ya existe", error: "Ya existe un estudiante con ese nombre y tutor registrado" }, { status: 400 }),
    );
    const { user, onStudentCreated } = setup();
    await goToStep2(user);
    await fillStep2(user);

    await create(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe un estudiante con ese nombre y tutor registrado");
    expect(onStudentCreated).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Crear alumno" })).toBeEnabled();
  });

  it("deshabilita el botón mientras se guarda", async () => {
    captureStudentPost(async () => {
      await delay(100);
      return HttpResponse.json({}, { status: 201 });
    });
    const { user } = setup();
    await goToStep2(user);
    await fillStep2(user);

    await create(user);

    expect(await screen.findByRole("button", { name: "Guardando..." })).toBeDisabled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("Cancelar cierra el modal y al reabrirlo el formulario está vacío", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/^Nombre Completo/), "Texto a descartar");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    expect(screen.getByLabelText(/^Nombre Completo/)).toHaveValue("");
    expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
  });
});

// Un admin debe elegir pedagogo (solo se listan pedagogos) porque la API se lo exige al crear alumnos
describe("NewStudentModal: como administrador", () => {
  const stubUsers = (users) => server.use(http.get(api("/users"), () => HttpResponse.json({ users })));

  it("carga los pedagogos y no ofrece a los administradores", async () => {
    stubUsers([adminUser, pedagogoUser, otherPedagogoUser]);
    setup({ user: adminUser });

    const select = await screen.findByLabelText(/^Pedagogo asignado/);
    await waitFor(() => expect(select.querySelectorAll("option")).toHaveLength(3)); // placeholder + 2 pedagogos
    const labels = Array.from(select.querySelectorAll("option")).map((o) => o.textContent);

    expect(labels).toContain("Samantha Test · Psicología Educativa");
    expect(labels).toContain("Nathan Test · Logopedia");
    expect(labels.some((label) => label.includes("Jheremi"))).toBe(false);
  });

  it("exige elegir un pedagogo antes de pasar al paso 2", async () => {
    stubUsers([pedagogoUser]);
    const { user } = setup({ user: adminUser });
    await screen.findByRole("option", { name: /Samantha/ });

    await fillStep1(user);
    await next(user);

    expect(screen.getByRole("alert")).toHaveTextContent("Debes asignar un pedagogo al alumno.");
    expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
  });

  it("envía el id del pedagogo elegido, que es lo que exige la API para crear alumnos como admin", async () => {
    stubUsers([pedagogoUser, otherPedagogoUser]);
    const captured = captureStudentPost();
    const { user, onStudentCreated } = setup({ user: adminUser });
    await screen.findByRole("option", { name: /Nathan/ });

    await user.selectOptions(screen.getByLabelText(/^Pedagogo asignado/), otherPedagogoUser._id);
    await fillStep1(user);
    await next(user);
    await fillStep2(user);
    await create(user);

    await waitFor(() => expect(onStudentCreated).toHaveBeenCalled());
    expect(captured.fields.get("pedagogoAsignado")).toBe(otherPedagogoUser._id);
  });

  it("muestra un error si no se puede cargar la lista de pedagogos", async () => {
    server.use(http.get(api("/users"), () => HttpResponse.json({ message: "Error al obtener usuarios" }, { status: 500 })));
    setup({ user: adminUser });

    expect(await screen.findByRole("alert")).toHaveTextContent("Error al obtener usuarios");
  });
});

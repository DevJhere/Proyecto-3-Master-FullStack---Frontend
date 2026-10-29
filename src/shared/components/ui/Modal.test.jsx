// Modal reutilizable: accesibilidad (role dialog), cierre por botón, Escape y overlay, y bloqueo del scroll del body

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("no renderiza nada si está cerrado", () => {
    render(<Modal isOpen={false} onClose={() => {}} title="Título">Contenido</Modal>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("muestra un diálogo accesible con su título, subtítulo y contenido", () => {
    render(
      <Modal isOpen onClose={() => {}} title="Nueva Sesión" subtitle="Jueves · 10:00">
        <p>Cuerpo</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: "Nueva Sesión" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Jueves · 10:00")).toBeInTheDocument();
    expect(screen.getByText("Cuerpo")).toBeInTheDocument();
  });

  it("el botón Cerrar llama a onClose", async () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="T">x</Modal>);

    await userEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("se puede ocultar el botón Cerrar", () => {
    render(<Modal isOpen onClose={() => {}} title="T" showCloseButton={false}>x</Modal>);
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
  });

  it("se cierra con la tecla Escape", async () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="T">x</Modal>);

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("se cierra al pulsar fuera, pero no al pulsar dentro", async () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="T"><button>Dentro</button></Modal>);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Dentro" }));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("dialog").parentElement); // overlay
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("bloquea el scroll del body mientras está abierto y lo restablece al cerrarse", () => {
    const { rerender } = render(<Modal isOpen onClose={() => {}} title="T">x</Modal>);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<Modal isOpen={false} onClose={() => {}} title="T">x</Modal>);
    expect(document.body.style.overflow).toBe("unset");
  });

  it("puede abrirse y cerrarse varias veces sin romper el orden de los hooks", () => {
    const { rerender } = render(<Modal isOpen={false} onClose={() => {}} title="T">x</Modal>);

    for (const isOpen of [true, false, true, false]) {
      rerender(<Modal isOpen={isOpen} onClose={() => {}} title="T">x</Modal>);
      expect(screen.queryByRole("dialog") !== null).toBe(isOpen);
    }
  });

  it("no reacciona a Escape cuando está cerrado", async () => {
    const onClose = vi.fn();
    render(<Modal isOpen={false} onClose={onClose} title="T">x</Modal>);

    await userEvent.keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
  });
});

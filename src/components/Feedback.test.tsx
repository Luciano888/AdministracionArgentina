import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FeedbackProvider } from "@/components/Feedback";
import { useConfirm, useToast } from "@/lib/feedback";

function Probe() {
  const confirm = useConfirm();
  const toast = useToast();
  const [answer, setAnswer] = useState("sin respuesta");
  return (
    <>
      <button
        type="button"
        onClick={async () => setAnswer(String(await confirm({ title: "¿Borrar esto?", message: "No se deshace." })))}
      >
        Preguntar
      </button>
      <button type="button" onClick={() => toast("Guardado")}>
        Avisar
      </button>
      <p>{answer}</p>
    </>
  );
}

function setup() {
  render(
    <FeedbackProvider>
      <Probe />
    </FeedbackProvider>
  );
  fireEvent.click(screen.getByText("Preguntar"));
  return screen.getByRole("dialog", { name: "¿Borrar esto?" });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("confirm", () => {
  it("muestra título y mensaje, con foco en Cancelar", () => {
    const dialog = setup();
    expect(dialog).toHaveProperty("textContent", expect.stringContaining("No se deshace."));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancelar" }));
  });

  it("resuelve true al confirmar y cierra", async () => {
    setup();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Borrar" })));
    expect(screen.getByText("true")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("resuelve false con Cancelar, Escape o click afuera", async () => {
    setup();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Cancelar" })));
    expect(screen.getByText("false")).toBeTruthy();

    fireEvent.click(screen.getByText("Preguntar"));
    await act(async () => fireEvent.keyDown(document, { key: "Escape" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByText("Preguntar"));
    const dialog = screen.getByRole("dialog");
    await act(async () => fireEvent.mouseDown(dialog.parentElement!));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("toast", () => {
  it("aparece y se va solo", () => {
    vi.useFakeTimers();
    render(
      <FeedbackProvider>
        <Probe />
      </FeedbackProvider>
    );
    fireEvent.click(screen.getByText("Avisar"));
    expect(screen.getByRole("status").textContent).toBe("Guardado");
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByRole("status")).toBeNull();
  });
});

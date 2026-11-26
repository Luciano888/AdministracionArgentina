import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FeedbackProvider } from "@/components/Feedback";
import { MercadoPagoCard } from "@/components/MercadoPagoCard";
import { useAdmin } from "@/lib/session";
import type { MercadoPagoConnection } from "@/types";

const LINKED: MercadoPagoConnection = {
  status: "oauth",
  accountId: "123456",
  tokenExpiresAt: "2027-05-24T12:00:00.000Z",
  expired: false,
  renewalFailedAt: null,
};

function show(connection: MercadoPagoConnection) {
  render(
    <FeedbackProvider>
      <MercadoPagoCard tenantId="ccs-001" connection={connection} onError={() => {}} onChange={() => {}} />
    </FeedbackProvider>
  );
}

beforeEach(() => {
  useAdmin.setState({
    session: { token: "t", operatorId: "o", nombre: "Admin", email: "admin@ccs-001", role: "admin", tenantId: "ccs-001", expiresAt: "2099-01-01T00:00:00.000Z" },
  });
});

afterEach(() => cleanup());

describe("MercadoPagoCard", () => {
  it("cuenta conectada: muestra la cuenta y que el permiso se renueva solo", () => {
    show(LINKED);
    expect(screen.getByText("Cuenta conectada")).toBeTruthy();
    expect(screen.getByText(/Cuenta de Mercado Pago 123456\. El permiso vence el .* y se renueva solo\./)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reconectar" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("si falló la renovación, pide reconectar antes del vencimiento", () => {
    show({ ...LINKED, renewalFailedAt: "2027-04-25T09:00:00.000Z" });
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Hay que reconectar la cuenta");
    expect(alert.textContent).toMatch(/Sigue cobrando hasta el .*: tocá «Reconectar» antes de esa fecha\./);
  });

  it("si el permiso venció, avisa que el recinto no está cobrando", () => {
    show({ ...LINKED, expired: true, renewalFailedAt: "2027-05-23T09:00:00.000Z" });
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("El permiso venció");
    expect(alert.textContent).toContain("no está cobrando online ni con QR o Point");
    expect(screen.queryByText("Cuenta conectada")).toBeNull();
  });

  it("sin cuenta: ofrece conectar y no desconectar", () => {
    show({ status: "none", accountId: null, tokenExpiresAt: null, expired: false, renewalFailedAt: null });
    expect(screen.getByRole("button", { name: "Conectar Mercado Pago" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Desconectar" })).toBeNull();
  });
});

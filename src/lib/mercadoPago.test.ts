import { describe, expect, it } from "vitest";
import { CONNECT_ERRORS, connectErrorMessage } from "@/lib/mercadoPago";

describe("connectErrorMessage", () => {
  it("explica cada motivo que manda el callback", () => {
    for (const motivo of ["estado", "denegado", "permiso", "canje", "guardado"]) {
      expect(connectErrorMessage(motivo)).toBe(CONNECT_ERRORS[motivo]);
    }
  });

  it("un motivo desconocido o ausente se trata como un rechazo de Mercado Pago", () => {
    expect(connectErrorMessage("otro")).toBe(CONNECT_ERRORS.canje);
    expect(connectErrorMessage(null)).toBe(CONNECT_ERRORS.canje);
  });
});

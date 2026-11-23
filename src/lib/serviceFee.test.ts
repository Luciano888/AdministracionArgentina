import { describe, expect, it } from "vitest";
import { serviceFeeError, serviceFeePerTicket } from "@/lib/serviceFee";

describe("serviceFeePerTicket", () => {
  it("aplica el porcentaje y redondea a pesos", () => {
    expect(serviceFeePerTicket(10_000, { percent: 8, minimum: 0 })).toBe(800);
    expect(serviceFeePerTicket(1_234, { percent: 7.5, minimum: 0 })).toBe(93);
  });

  it("el mínimo es un piso por entrada", () => {
    expect(serviceFeePerTicket(1_000, { percent: 8, minimum: 300 })).toBe(300);
    expect(serviceFeePerTicket(10_000, { percent: 8, minimum: 300 })).toBe(800);
  });

  it("una entrada gratis no lleva cargo", () => {
    expect(serviceFeePerTicket(0, { percent: 8, minimum: 300 })).toBe(0);
  });
});

describe("serviceFeeError", () => {
  it("acepta lo que acepta la API", () => {
    expect(serviceFeeError({ percent: 0, minimum: 0 })).toBe("");
    expect(serviceFeeError({ percent: 7.25, minimum: 500 })).toBe("");
    expect(serviceFeeError({ percent: 30, minimum: 0 })).toBe("");
  });

  it("rechaza porcentajes fuera de rango o con más de dos decimales", () => {
    expect(serviceFeeError({ percent: 31, minimum: 0 })).not.toBe("");
    expect(serviceFeeError({ percent: -1, minimum: 0 })).not.toBe("");
    expect(serviceFeeError({ percent: 7.555, minimum: 0 })).not.toBe("");
    expect(serviceFeeError({ percent: Number.NaN, minimum: 0 })).not.toBe("");
  });

  it("rechaza mínimos con centavos o negativos", () => {
    expect(serviceFeeError({ percent: 8, minimum: 10.5 })).not.toBe("");
    expect(serviceFeeError({ percent: 8, minimum: -1 })).not.toBe("");
  });
});

/**
 * Cargo por servicio de una entrada web, igual que lo calcula la API (Venta Online,
 * src/lib/pricing/service-fee.ts): `max(redondeo(precio × percent / 100), minimum)`. Las entradas gratis no
 * llevan cargo. El panel lo usa solo para mostrar un ejemplo; el cobro lo calcula siempre la API.
 */
export function serviceFeePerTicket(price: number, fee: { percent: number; minimum: number }) {
  if (price <= 0) return 0;
  return Math.max(Math.round((price * Math.round(fee.percent * 100)) / 10_000), fee.minimum);
}

/** Lo que acepta la API: porcentaje de 0 a 30 con hasta dos decimales, mínimo entero en pesos. */
export function serviceFeeError(fee: { percent: number; minimum: number }) {
  const bps = fee.percent * 100;
  if (!Number.isFinite(fee.percent) || fee.percent < 0 || fee.percent > 30 || Math.abs(bps - Math.round(bps)) > 1e-6) {
    return "El porcentaje va de 0 a 30, con hasta dos decimales.";
  }
  if (!Number.isInteger(fee.minimum) || fee.minimum < 0) return "El mínimo es un monto entero en pesos.";
  return "";
}

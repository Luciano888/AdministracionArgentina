/** Qué pasó al volver de Mercado Pago (`?mp=error&motivo=…`, lo arma el callback de Venta Online). */
export const CONNECT_ERRORS: Record<string, string> = {
  estado: "El enlace para conectar venció o no es válido. Probá de nuevo.",
  denegado: "Se canceló la autorización en Mercado Pago. La cuenta no se conectó.",
  permiso: "Tu usuario ya no puede administrar este recinto.",
  canje: "Mercado Pago no confirmó la conexión. Probá de nuevo en unos minutos.",
  guardado: "Mercado Pago autorizó, pero no se pudo guardar la conexión. Avisale a la plataforma.",
};

/** Mensaje para un motivo; uno desconocido se trata como un rechazo de Mercado Pago. */
export function connectErrorMessage(motivo: string | null) {
  return CONNECT_ERRORS[motivo ?? ""] ?? CONNECT_ERRORS.canje;
}

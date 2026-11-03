export const CATEGORIAS = ["Música", "Teatro", "Taller", "Cine", "Exposición", "Visita", "Conferencia"] as const;

export const DESCRIPCION_MAX = 80;
export const DESCRIPCION_LARGA_MAX = 280;

export const TEXTO_AMIGABLE_AYUDA =
  "Identificador de la dirección pública del evento. Minúsculas, números y guiones. Ejemplo: tango-en-el-patio.";

export function parseDuracion(value: string) {
  const raw = value.trim();
  if (/^libre$/i.test(raw)) return { libre: true, horas: 1, minutos: 0 };
  const horas = Number(raw.match(/(\d+)\s*h/i)?.[1] ?? (raw ? 0 : 1));
  const minutos = Number(raw.match(/(\d+)\s*m/i)?.[1] ?? 0);
  return {
    libre: false,
    horas: Math.min(12, Math.max(0, horas)),
    minutos: Math.min(59, Math.max(0, minutos)),
  };
}

export function formatDuracion(libre: boolean, horas: number, minutos: number) {
  if (libre) return "Libre";
  const h = Math.min(12, Math.max(0, Math.round(horas)));
  const m = Math.min(59, Math.max(0, Math.round(minutos)));
  if (h === 0 && m === 0) return "";
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

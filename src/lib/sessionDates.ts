/** Fechas de sesión como `yyyy-MM-dd`, siempre en hora local (sin corrimiento por zona horaria). */

export function parseDay(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function monthKey(fecha: string) {
  return fecha.slice(0, 7);
}

/** Lunes de la semana de `fecha`. Un domingo pertenece a la semana que empezó el lunes anterior. */
export function weekStart(fecha: string) {
  const date = parseDay(fecha);
  const weekday = date.getDay();
  date.setDate(date.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return dayKey(date);
}

export function monthLabel(key: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(parseDay(`${key}-01`));
}

export function weekLabel(start: string, locale: string) {
  const from = parseDay(start);
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  const format = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  return `${format.format(from)} – ${format.format(to)}`;
}

export function formatFecha(fecha: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(parseDay(fecha));
}

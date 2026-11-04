import { type FormEvent, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Banner, Card, Field, GhostButton, PageTitle, PrimaryButton, SelectField, Spinner } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { useAdmin } from "@/lib/session";
import { useAdminQuery } from "@/lib/useAdminQuery";
import type { ShowSession } from "@/types";

const EMPTY = { id: "", fecha: "", hora: "18:00", cupo: "40" };
const NO_ROWS: ShowSession[] = [];

function parseDay(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function monthKey(fecha: string) {
  return fecha.slice(0, 7);
}

function weekStart(fecha: string) {
  const date = parseDay(fecha);
  const weekday = date.getDay();
  date.setDate(date.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return dayKey(date);
}

function monthLabel(key: string) {
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(parseDay(`${key}-01`));
}

function weekLabel(start: string) {
  const from = parseDay(start);
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  const format = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });
  return `${format.format(from)} – ${format.format(to)}`;
}

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" }).format(parseDay(fecha));
}

export function SessionsPage() {
  const { tenantId = "", eventId = "" } = useParams();
  const token = useAdmin((s) => s.session)!.token;
  const { data: rows = NO_ROWS, loading, error: loadError, reload } = useAdminQuery<ShowSession[]>("Admin/Sessions", { eventId });
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState<string | null>(null);
  const [week, setWeek] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminFetch("Admin/Sessions", {
        method: draft.id ? "PUT" : "POST",
        token,
        body: { id: draft.id || undefined, eventId, fecha: draft.fecha, hora: draft.hora, cupo: Number(draft.cupo) },
      });
      setDraft(EMPTY);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Borrar esta sesión? Solo se puede si no tiene ventas ni reservas.")) return;
    setError("");
    try {
      await adminFetch("Admin/Sessions", { method: "DELETE", token, query: { id } });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar");
    }
  }

  const months = useMemo(() => [...new Set(rows.map((row) => monthKey(row.fecha)))].sort(), [rows]);
  const todayMonth = monthKey(dayKey(new Date()));
  const activeMonth = month && months.includes(month) ? month : months.includes(todayMonth) ? todayMonth : (months[0] ?? "");
  const weeks = useMemo(
    () => [...new Set(rows.filter((row) => monthKey(row.fecha) === activeMonth).map((row) => weekStart(row.fecha)))].sort(),
    [rows, activeMonth]
  );
  const todayWeek = weekStart(dayKey(new Date()));
  const activeWeek = week === null ? (weeks.includes(todayWeek) ? todayWeek : "") : weeks.includes(week) || week === "" ? week : "";
  const visible = rows.filter((row) => monthKey(row.fecha) === activeMonth && (activeWeek === "" || weekStart(row.fecha) === activeWeek));

  return (
    <div className="space-y-6">
      <PageTitle kicker="Aforo">Sesiones</PageTitle>
      <p className="text-sm text-slate-500">
        El cupo es el mismo para la tienda y la taquilla. Si el día no está publicado, no se vende.{" "}
        <Link to={`/recintos/${tenantId}/eventos/${eventId}`} className="text-primary">
          Volver al evento
        </Link>
      </p>
      {error || loadError ? <Banner>{error || loadError}</Banner> : null}
      {!loading && months.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Mes"
            value={activeMonth}
            onChange={(event) => {
              setMonth(event.target.value);
              setWeek(null);
            }}
          >
            {months.map((key) => (
              <option key={key} value={key}>
                {monthLabel(key)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Semana"
            value={activeWeek}
            onChange={(event) => setWeek(event.target.value)}
          >
            <option value="">Todas las semanas del mes</option>
            {weeks.map((key) => (
              <option key={key} value={key}>
                {weekLabel(key)}
              </option>
            ))}
          </SelectField>
        </div>
      ) : null}
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="pb-2 font-medium">Fecha</th>
              <th className="pb-2 font-medium">Hora</th>
              <th className="pb-2 font-medium">Cupo</th>
              <th className="pb-2 font-medium">Disponible</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="py-3">{formatFecha(row.fecha)}</td>
                <td>{row.hora}</td>
                <td>{row.cupo}</td>
                <td>{row.disponible}</td>
                <td className="text-right">
                  <button
                    type="button"
                    className="mr-3 text-primary"
                    onClick={() => setDraft({ id: row.id, fecha: row.fecha, hora: row.hora, cupo: String(row.cupo) })}
                  >
                    Editar
                  </button>
                  <button type="button" className="text-slate-500" onClick={() => remove(row.id)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? <Spinner label="Cargando sesiones" className="py-4" /> : null}
        {!loading && rows.length === 0 ? <p className="pt-3 text-sm text-slate-500">Sin sesiones publicadas.</p> : null}
        {!loading && rows.length > 0 && visible.length === 0 ? (
          <p className="pt-3 text-sm text-slate-500">No hay sesiones en ese mes y semana.</p>
        ) : null}
        {!loading && visible.length > 0 ? (
          <p className="pt-3 text-xs text-slate-500">
            {visible.length} {visible.length === 1 ? "sesión" : "sesiones"}
          </p>
        ) : null}
      </Card>
      <form onSubmit={onSubmit}>
        <Card className="grid gap-4 sm:grid-cols-3">
          <Field label="Fecha" type="date" value={draft.fecha} onChange={(e) => setDraft({ ...draft, fecha: e.target.value })} required />
          <Field label="Hora" type="time" value={draft.hora} onChange={(e) => setDraft({ ...draft, hora: e.target.value })} required />
          <Field label="Cupo" type="number" min={0} value={draft.cupo} onChange={(e) => setDraft({ ...draft, cupo: e.target.value })} required />
          <div className="flex gap-3 sm:col-span-3">
            <PrimaryButton type="submit" disabled={busy}>
              {draft.id ? "Actualizar sesión" : "Publicar sesión"}
            </PrimaryButton>
            {draft.id ? (
              <GhostButton type="button" onClick={() => setDraft(EMPTY)}>
                Cancelar
              </GhostButton>
            ) : null}
          </div>
        </Card>
      </form>
    </div>
  );
}

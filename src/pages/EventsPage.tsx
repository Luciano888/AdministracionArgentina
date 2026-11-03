import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EventCover } from "@/components/EventCover";
import { Banner, PageTitle, Spinner } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { formatARS } from "@/lib/format";
import { useAdmin } from "@/lib/session";
import type { ShowEvent } from "@/types";

export function EventsPage() {
  const { tenantId = "" } = useParams();
  const token = useAdmin((s) => s.session)!.token;
  const [rows, setRows] = useState<ShowEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminFetch<ShowEvent[]>("Admin/Events", { token, query: { tenantId } })
      .then((next) => {
        if (!cancelled) setRows(next);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudieron cargar los eventos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, token]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <PageTitle kicker="Catálogo">Eventos</PageTitle>
        <Link
          to={`/recintos/${tenantId}/eventos/nuevo`}
          className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Nuevo evento
        </Link>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {loading ? <Spinner label="Cargando eventos" className="py-4" /> : null}
      {!loading ? <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((event) => (
          <article key={event.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EventCover gradient={event.gradient} icon={event.icon} imagen={event.imagen} className="h-28 w-full p-4" />
            <div className="space-y-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">{event.categoria}</p>
              <h2 className="text-lg font-semibold">{event.titulo}</h2>
              <p className="text-sm text-slate-500">{event.ubicacion || "Sin ubicación"} · desde {formatARS(event.minimoPrecio)}</p>
              <div className="flex gap-3 pt-1 text-sm font-medium">
                <Link to={`/recintos/${tenantId}/eventos/${event.id}`} className="text-primary">
                  Editar
                </Link>
                <Link to={`/recintos/${tenantId}/eventos/${event.id}/tarifas`} className="text-slate-600">
                  Tarifas
                </Link>
                <Link to={`/recintos/${tenantId}/eventos/${event.id}/sesiones`} className="text-slate-600">
                  Sesiones
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div> : null}
      {!loading && !error && rows.length === 0 ? <p className="text-sm text-slate-500">Este recinto todavía no tiene eventos.</p> : null}
    </div>
  );
}

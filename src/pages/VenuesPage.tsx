import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Banner, Card, PageTitle, Spinner } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { useAdmin } from "@/lib/session";
import type { Venue } from "@/types";

export function VenuesPage() {
  const session = useAdmin((s) => s.session)!;
  const [rows, setRows] = useState<Venue[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminFetch<Venue[]>("Admin/Tenants", { token: session.token })
      .then((next) => {
        if (!cancelled) setRows(next);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudieron cargar los recintos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session.token]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <PageTitle kicker="Plataforma">Recintos</PageTitle>
        {session.role === "platform" ? (
          <Link to="/recintos/nuevo" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
            Nuevo recinto
          </Link>
        ) : null}
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {loading ? <Spinner label="Cargando recintos" className="py-4" /> : null}
      {!loading ? <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((venue) => (
          <Card key={venue.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{venue.name}</h2>
                <p className="text-sm text-slate-500">{venue.city || "Sin ciudad"}</p>
              </div>
              <span className="size-8 rounded-full" style={{ background: venue.theme.primary }} />
            </div>
            <p className="mt-3 text-sm text-slate-600">{venue.tagline || "Sin descripción"}</p>
            <div className="mt-4 flex gap-3 text-sm font-medium">
              <Link to={`/recintos/${venue.id}/eventos`} style={{ color: venue.theme.primary }}>
                Eventos
              </Link>
              <Link to={`/recintos/${venue.id}/datos`} className="text-slate-500">
                Datos
              </Link>
            </div>
          </Card>
        ))}
      </div> : null}
      {!loading && !error && rows.length === 0 ? <p className="text-sm text-slate-500">Todavía no hay recintos.</p> : null}
    </div>
  );
}

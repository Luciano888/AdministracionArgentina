import { type FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Banner, Card, Field, PageTitle, PrimaryButton, Spinner } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { formatARS, formatWhen } from "@/lib/format";
import { useAdmin } from "@/lib/session";
import type { IssuedOrder } from "@/types";

const CHANNEL: Record<string, string> = { web: "Web", box_office: "Taquilla" };

export function TicketsPage() {
  const { tenantId = "" } = useParams();
  const token = useAdmin((s) => s.session)!.token;
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<IssuedOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const loadSeq = useRef(0);

  function load(query = q) {
    const seq = ++loadSeq.current;
    setLoading(true);
    return adminFetch<IssuedOrder[]>("Admin/Entradas", { token, query: { tenantId, q: query } })
      .then((next) => {
        if (seq === loadSeq.current) setRows(next);
      })
      .catch((err) => {
        if (seq === loadSeq.current) setError(err instanceof Error ? err.message : "No se pudieron cargar las entradas");
      })
      .finally(() => {
        if (seq === loadSeq.current) setLoading(false);
      });
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, token]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    load(q);
  }

  return (
    <div className="space-y-6">
      <PageTitle kicker="Consulta">Entradas emitidas</PageTitle>
      <p className="text-sm text-slate-500">Lectura de lo vendido en la web y en la taquilla. Anular y reimprimir se hace en la caja.</p>
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <Field label="Localizador, email o código" value={q} onChange={(e) => setQ(e.target.value)} placeholder="VO-123456" />
        </div>
        <PrimaryButton type="submit">Buscar</PrimaryButton>
      </form>
      {error ? <Banner>{error}</Banner> : null}
      <div className="space-y-3">
        {rows.map((order) => (
          <Card key={order.localizador}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">{order.localizador}</h2>
              <p className="text-sm text-slate-500">
                {CHANNEL[order.canal] ?? order.canal} · {order.estado} · {formatWhen(order.fecha)}
              </p>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {order.titulo || "Sin título"} · {order.email} · {formatARS(order.total)}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-slate-500">
              {order.tickets.map((ticket) => (
                <li key={ticket.code}>
                  {ticket.code} · {ticket.tariffName || "Entrada"} · {ticket.status} · {formatARS(ticket.price)}
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {loading ? <Spinner label="Cargando entradas" className="py-4" /> : null}
        {!loading && rows.length === 0 ? <p className="text-sm text-slate-500">No hay entradas para mostrar.</p> : null}
      </div>
    </div>
  );
}

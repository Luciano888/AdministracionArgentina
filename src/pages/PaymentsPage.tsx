import { type FormEvent, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { MercadoPagoCard } from "@/components/MercadoPagoCard";
import { Banner, Card, Field, PageTitle, PrimaryButton, Spinner } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { useToast } from "@/lib/feedback";
import { connectErrorMessage } from "@/lib/mercadoPago";
import { serviceFeeError, serviceFeePerTicket } from "@/lib/serviceFee";
import { useAdmin } from "@/lib/session";
import { useAdminQuery } from "@/lib/useAdminQuery";
import { useVenueConfig } from "@/lib/venueConfig";
import type { PaymentSettings } from "@/types";

/** Precio de referencia para el ejemplo del cargo. */
const EXAMPLE_PRICE = 10_000;

export function PaymentsPage() {
  const { tenantId = "" } = useParams();
  const session = useAdmin((s) => s.session)!;
  const isPlatform = session.role === "platform";
  const { money } = useVenueConfig();
  const toast = useToast();
  const { data, loading, error: loadError, reload } = useAdminQuery<PaymentSettings>("Admin/PaymentSettings", { tenantId });
  const [percent, setPercent] = useState("0");
  const [minimum, setMinimum] = useState("0");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filledFrom, setFilledFrom] = useState<PaymentSettings | null>(null);

  // Al llegar (o recargarse) la configuración se copia al formulario (ajuste de estado en el render, sin efecto).
  if (data && data !== filledFrom) {
    setFilledFrom(data);
    setPercent(String(data.serviceFee.percent));
    setMinimum(String(data.serviceFee.minimum));
  }

  // Vuelta de Mercado Pago: `?mp=ok` avisa y se limpia; `?mp=error&motivo=…` queda a la vista.
  const [searchParams, setSearchParams] = useSearchParams();
  const mpResult = searchParams.get("mp");
  const connectError = mpResult === "error" ? connectErrorMessage(searchParams.get("motivo")) : "";
  // StrictMode runs the effect twice before the URL is cleaned: announce once.
  const announced = useRef(false);
  useEffect(() => {
    if (mpResult !== "ok" || announced.current) return;
    announced.current = true;
    toast("Cuenta de Mercado Pago conectada");
    setSearchParams({}, { replace: true });
  }, [mpResult, setSearchParams, toast]);

  const draft = { percent: Number(percent.replace(",", ".")), minimum: Number(minimum) };
  const draftError = serviceFeeError(draft);
  const shown = isPlatform ? draft : (data?.serviceFee ?? { percent: 0, minimum: 0 });
  const noFee = shown.percent === 0 && shown.minimum === 0;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (draftError) {
      setError(draftError);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminFetch<PaymentSettings>("Admin/PaymentSettings", {
        method: "PUT",
        token: session.token,
        body: { tenantId, serviceFee: draft },
      });
      toast("Cargo por servicio guardado");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle kicker="Cobros">Medios de pago</PageTitle>
      {error || loadError || connectError ? <Banner>{error || loadError || connectError}</Banner> : null}
      {loading ? <Spinner label="Cargando medios de pago" /> : null}

      {data ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Mercado Pago</h2>
          <p className="text-sm text-slate-500">
            El recinto cobra en su propia cuenta. Al conectarla, el cargo por servicio se acredita solo en la cuenta de la plataforma.
          </p>
          <MercadoPagoCard tenantId={tenantId} connection={data.mercadoPago} onError={setError} onChange={reload} />
        </section>
      ) : null}

      {data ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Cargo por servicio</h2>
          <p className="text-sm text-slate-500">
            Lo paga quien compra en la tienda online, como una línea aparte del total. El recinto recibe el precio completo de
            cada entrada. La taquilla no lo cobra.
          </p>
          {isPlatform ? (
            <form onSubmit={onSubmit}>
              <Card className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Porcentaje por entrada"
                  inputMode="decimal"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  required
                />
                <Field
                  label="Mínimo por entrada (en pesos)"
                  inputMode="numeric"
                  value={minimum}
                  onChange={(e) => setMinimum(e.target.value)}
                  required
                />
                <p className="text-sm text-slate-600 sm:col-span-2" aria-live="polite">
                  {draftError
                    ? draftError
                    : noFee
                      ? "Sin cargo: el comprador paga solo las entradas."
                      : `Ejemplo: una entrada de ${money(EXAMPLE_PRICE)} paga ${money(serviceFeePerTicket(EXAMPLE_PRICE, draft))} de cargo.`}
                </p>
                <div className="sm:col-span-2">
                  <PrimaryButton type="submit" disabled={busy}>
                    Guardar cargo
                  </PrimaryButton>
                </div>
              </Card>
            </form>
          ) : (
            <Card>
              <p className="text-sm text-slate-700">
                {noFee
                  ? "Este recinto no tiene cargo por servicio."
                  : `${shown.percent}% por entrada, con un mínimo de ${money(shown.minimum)}. Ejemplo: una entrada de ${money(EXAMPLE_PRICE)} paga ${money(serviceFeePerTicket(EXAMPLE_PRICE, shown))} de cargo.`}
              </p>
              <p className="mt-2 text-xs text-slate-500">Lo define la plataforma según el acuerdo con el recinto.</p>
            </Card>
          )}
        </section>
      ) : null}
    </div>
  );
}

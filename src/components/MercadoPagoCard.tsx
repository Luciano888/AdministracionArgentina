import { useState } from "react";
import { Card, GhostButton, PrimaryButton } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { useConfirm, useToast } from "@/lib/feedback";
import { useAdmin } from "@/lib/session";
import type { MercadoPagoConnection, PaymentSettings } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Conexión de la cuenta de Mercado Pago del recinto (marketplace, fase 2). «Conectar» lleva a Mercado Pago;
 * al autorizar, Venta Online guarda la conexión y vuelve a esta pantalla.
 */
export function MercadoPagoCard({
  tenantId,
  connection,
  onError,
  onChange,
}: {
  tenantId: string;
  connection: MercadoPagoConnection;
  onError: (message: string) => void;
  onChange: () => void;
}) {
  const token = useAdmin((s) => s.session)!.token;
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    onError("");
    try {
      const { authorizationUrl } = await adminFetch<{ authorizationUrl: string }>("Admin/MercadoPago/Connect", {
        method: "POST",
        token,
        body: { tenantId },
      });
      window.location.assign(authorizationUrl);
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo iniciar la conexión");
      setBusy(false);
    }
  }

  async function disconnect() {
    const ok = await confirm({
      title: "¿Desconectar Mercado Pago?",
      message: "El recinto deja de cobrar online y en la taquilla con QR o Point hasta que vuelva a conectar su cuenta.",
      confirmLabel: "Desconectar",
    });
    if (!ok) return;
    setBusy(true);
    onError("");
    try {
      await adminFetch<PaymentSettings>("Admin/MercadoPago/Disconnect", { method: "POST", token, body: { tenantId } });
      toast("Mercado Pago desconectado");
      onChange();
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo desconectar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      {connection.status === "oauth" && connection.expired ? (
        <div className="space-y-1 text-sm" role="alert">
          <p className="font-medium text-red-700">El permiso venció</p>
          <p className="text-slate-600">
            {connection.tokenExpiresAt ? `Venció el ${formatDate(connection.tokenExpiresAt)}. ` : ""}
            El recinto no está cobrando online ni con QR o Point. Tocá «Reconectar» para volver a cobrar.
          </p>
        </div>
      ) : connection.status === "oauth" && connection.renewalFailedAt ? (
        <div className="space-y-1 text-sm" role="alert">
          <p className="font-medium text-amber-700">Hay que reconectar la cuenta</p>
          <p className="text-slate-600">
            No se pudo renovar el permiso automáticamente (último intento: {formatDate(connection.renewalFailedAt)}).
            {connection.tokenExpiresAt ? ` Sigue cobrando hasta el ${formatDate(connection.tokenExpiresAt)}: tocá «Reconectar» antes de esa fecha.` : " Tocá «Reconectar»."}
          </p>
        </div>
      ) : connection.status === "oauth" ? (
        <div className="space-y-1 text-sm">
          <p className="font-medium text-emerald-700">Cuenta conectada</p>
          <p className="text-slate-600">
            Cuenta de Mercado Pago {connection.accountId ?? "sin número"}.
            {connection.tokenExpiresAt ? ` El permiso vence el ${formatDate(connection.tokenExpiresAt)} y se renueva solo.` : ""}
          </p>
        </div>
      ) : connection.status === "manual" ? (
        <p className="text-sm text-slate-600">
          Hay un token de Mercado Pago cargado a mano, que solo sirve para desarrollo. Conectá la cuenta para cobrar en producción.
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          El recinto todavía no conectó su cuenta de Mercado Pago. Sin cuenta conectada no puede cobrar online ni con QR o Point.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <PrimaryButton type="button" onClick={connect} disabled={busy}>
          {connection.status === "oauth" ? "Reconectar" : "Conectar Mercado Pago"}
        </PrimaryButton>
        {connection.status !== "none" ? (
          <GhostButton type="button" onClick={disconnect} disabled={busy}>
            Desconectar
          </GhostButton>
        ) : null}
      </div>
    </Card>
  );
}

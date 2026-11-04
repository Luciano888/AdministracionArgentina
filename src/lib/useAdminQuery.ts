import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api";
import { useAdmin } from "@/lib/session";

type Query = Record<string, string | number | undefined>;

type Result<T> = { key: string; data: T | undefined; error: string };

/**
 * GET a Admin/* con el token de la sesión.
 *
 * - `loading` se deriva de si la última respuesta corresponde al pedido actual, así que
 *   vuelve a ser verdadero al cambiar la ruta, la consulta o al llamar `reload()`.
 * - Mientras recarga, `data` conserva la respuesta anterior (la lista no parpadea).
 * - El estado solo se actualiza cuando llega la respuesta, y se descarta si el pedido ya cambió.
 */
export function useAdminQuery<T>(path: string, query: Query = {}, { enabled = true }: { enabled?: boolean } = {}) {
  const token = useAdmin((s) => s.session?.token ?? null);
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const [last, setLast] = useState<T | undefined>(undefined);

  const queryKey = JSON.stringify(query);
  const key = JSON.stringify([path, queryKey, token, nonce]);

  useEffect(() => {
    if (!enabled || !token) return;
    let cancelled = false;
    adminFetch<T>(path, { token, query: JSON.parse(queryKey) as Query }).then(
      (data) => {
        if (cancelled) return;
        setResult({ key, data, error: "" });
        setLast(data);
      },
      (err: unknown) => {
        if (cancelled) return;
        setResult({ key, data: undefined, error: err instanceof Error ? err.message : "No se pudo cargar" });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, token, path, queryKey, key]);

  const current = result?.key === key ? result : null;
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: current ? current.data : last,
    error: current?.error ?? "",
    loading: enabled && !current,
    reload,
  };
}

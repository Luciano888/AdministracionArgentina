import { useAdmin } from "@/lib/session";
import type { AdminSession } from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function adminFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string | number | undefined>;
    token?: string | null;
  } = {}
): Promise<T> {
  const url = new URL(`${API_BASE}/api/${path}`, window.location.origin);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) headers["x-operator-token"] = options.token;
  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (res.status === 401 && options.token) {
    // Token vencido o revocado: se cierra la sesión y RequireSession lleva al login.
    useAdmin.getState().logout();
    throw new Error("La sesión venció. Volvé a entrar.");
  }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export function login(email: string, password: string) {
  return adminFetch<AdminSession>("Admin/Login", { method: "POST", body: { email, password } });
}

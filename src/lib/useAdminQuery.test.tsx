import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminFetch } from "@/lib/api";
import { useAdmin } from "@/lib/session";
import { useAdminQuery } from "@/lib/useAdminQuery";

vi.mock("@/lib/api", () => ({ adminFetch: vi.fn() }));
const fetchMock = vi.mocked(adminFetch);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  useAdmin.setState({
    session: {
      token: "tok",
      operatorId: "op",
      nombre: "Prueba",
      email: "prueba@ejemplo",
      role: "admin",
      tenantId: "t1",
      expiresAt: "2099-01-01T00:00:00Z",
    },
    venue: null,
  });
});

afterEach(() => {
  fetchMock.mockReset();
});

describe("useAdminQuery", () => {
  it("carga y entrega los datos", async () => {
    fetchMock.mockResolvedValue(["a"]);
    const { result } = renderHook(() => useAdminQuery<string[]>("Admin/Events", { tenantId: "t1" }));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(["a"]);
    expect(result.current.error).toBe("");
    expect(fetchMock).toHaveBeenCalledWith("Admin/Events", { token: "tok", query: { tenantId: "t1" } });
  });

  it("entrega el mensaje de error", async () => {
    fetchMock.mockRejectedValue(new Error("Falla"));
    const { result } = renderHook(() => useAdminQuery<string[]>("Admin/Events"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Falla");
    expect(result.current.data).toBeUndefined();
  });

  it("reload vuelve a cargar y conserva los datos anteriores mientras tanto", async () => {
    fetchMock.mockResolvedValueOnce(["a"]);
    const { result } = renderHook(() => useAdminQuery<string[]>("Admin/Events"));
    await waitFor(() => expect(result.current.data).toEqual(["a"]));

    const next = deferred<string[]>();
    fetchMock.mockReturnValueOnce(next.promise);
    act(() => result.current.reload());
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual(["a"]);

    await act(async () => next.resolve(["a", "b"]));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(["a", "b"]);
  });

  it("descarta la respuesta de una consulta vieja", async () => {
    const first = deferred<string[]>();
    const second = deferred<string[]>();
    fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(({ id }) => useAdminQuery<string[]>("Admin/Tariffs", { eventId: id }), {
      initialProps: { id: "e1" },
    });
    rerender({ id: "e2" });

    await act(async () => second.resolve(["de e2"]));
    await act(async () => first.resolve(["de e1"]));
    expect(result.current.data).toEqual(["de e2"]);
    expect(result.current.loading).toBe(false);
  });

  it("con enabled false no pide nada", () => {
    const { result } = renderHook(() => useAdminQuery("Admin/Events", {}, { enabled: false }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});

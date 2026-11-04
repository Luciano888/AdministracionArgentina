import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { type ConfirmOptions, type Feedback, FeedbackContext } from "@/lib/feedback";

const TOAST_MS = 3000;

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };
type Toast = { id: number; text: string };

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending((current) => {
          current?.resolve(false);
          return { ...options, resolve };
        });
      }),
    []
  );

  const toast = useCallback((text: string) => {
    const id = ++nextId.current;
    setToasts((current) => [...current, { id, text }]);
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), TOAST_MS);
  }, []);

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending]
  );

  const value = useMemo<Feedback>(() => ({ confirm, toast }), [confirm, toast]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {pending ? <ConfirmDialog options={pending} onClose={close} /> : null}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <p key={t.id} role="status" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg">
            {t.text}
          </p>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

function ConfirmDialog({ options, onClose }: { options: ConfirmOptions; onClose: (ok: boolean) => void }) {
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={options.message ? messageId : undefined}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 id={titleId} className="text-base font-semibold text-slate-900">
          {options.title}
        </h2>
        {options.message ? (
          <p id={messageId} className="text-sm text-slate-600">
            {options.message}
          </p>
        ) : null}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            autoFocus
            onClick={() => onClose(false)}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onClose(true)}
            className="inline-flex min-h-11 items-center rounded-xl bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700"
          >
            {options.confirmLabel ?? "Borrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

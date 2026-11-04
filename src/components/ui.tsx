import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export function PageTitle({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div className="space-y-1">
      {kicker ? <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{kicker}</p> : null}
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{children}</h1>
    </div>
  );
}

export function PrimaryButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  labelExtra,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; labelExtra?: ReactNode }) {
  const id = useId();
  return (
    <div className="block space-y-1.5 text-sm">
      <span className="flex items-center gap-1.5 font-medium text-slate-700">
        <label htmlFor={id}>{label}</label>
        {labelExtra}
      </span>
      <input
        {...props}
        id={id}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-primary/30 focus:ring-2"
      />
    </div>
  );
}

export function Area({
  label,
  maxLength,
  value,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const count = String(value ?? "").length;
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="flex items-center justify-between gap-3 font-medium text-slate-700">
        <span>{label}</span>
        {maxLength ? (
          <span className="font-normal tabular-nums text-slate-500">
            {count} / {maxLength}
          </span>
        ) : null}
      </span>
      <textarea
        {...props}
        value={value}
        maxLength={maxLength}
        className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-primary/30 focus:ring-2"
      />
    </label>
  );
}

export function SelectField({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-primary/30 focus:ring-2"
      >
        {children}
      </select>
    </label>
  );
}

export function Banner({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{children}</p>;
}

export function Spinner({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm text-slate-500 ${className}`} role="status" aria-live="polite" aria-label={label}>
      <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-primary" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

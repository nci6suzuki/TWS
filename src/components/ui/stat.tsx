import Link from "next/link";

export function StatCard({
  label,
  value,
  href,
  tone = "normal",
}: {
  label: string;
  value: number | string;
  href?: string;
  tone?: "normal" | "danger";
}) {
  const Card = (
    <div
      className={[
        "rounded-2xl border p-5 transition",
        tone === "danger" ? "border-rose-200 bg-rose-50 hover:bg-rose-100/70" : "bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <div className={["text-xs font-semibold tracking-[0.12em]", tone === "danger" ? "text-rose-600" : "text-slate-400"].join(" ")}>
        {label}
      </div>
      <div className={["mt-2 text-4xl font-extrabold", tone === "danger" ? "text-rose-700" : "text-slate-900"].join(" ")}>
        {value}
      </div>
    </div>
  );

  return href ? <Link href={href}>{Card}</Link> : Card;
}

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "danger" | "ok" }) {
  const cls =
    tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}
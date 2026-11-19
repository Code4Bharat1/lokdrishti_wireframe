// Small shared pieces for the Lokdrishti dashboards (same look as the existing analytics views).
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreview, isCandidateRole, scopedCandidate } from "@/lib/preview";
import { models, addDays, iso, TODAY, fmtDate, type CampaignModel } from "@/data/demo";

export const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 } };
export const axis = { fontSize: 11, tickLine: false, axisLine: false, stroke: "var(--muted-foreground)" } as const;
export const series = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
export const n = (x: number) => Math.round(x).toLocaleString("en-IN");
export const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);
export const selectCls = "h-9 rounded-md border bg-card px-2 text-sm";

export function ChartCard({ title, sub, action, children, className }: { title: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel flex flex-col", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b px-5 py-3"><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">{title}</h2>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>{action}</div>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}
export function Kpi({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "warning" | "destructive" | "success" | undefined }) {
  return (
    <div className="panel p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={cn("mt-1.5 text-2xl font-semibold tabular-nums tracking-tight", tone && { warning: "text-warning", destructive: "text-destructive", success: "text-success" }[tone])}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
export function Seg<T extends string>({ value, options, onChange }: { value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void }) {
  return (
    <div className="flex w-fit rounded-md border bg-muted p-0.5 text-xs font-medium">
      {options.map(([k, l]) => <button key={k} onClick={() => onChange(k)} aria-pressed={value === k} className={cn("rounded px-2.5 py-1 text-muted-foreground", value === k && "bg-card text-foreground shadow-card")}>{l}</button>)}
    </div>
  );
}
export function Disclaimer() {
  const { L } = usePreview();
  return <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning"><Info className="mt-0.5 size-4 shrink-0" />{L("Observed survey findings — not statistically representative of the full electorate.", "प्रेक्षित सर्वे निष्कर्ष — पूरे मतदाता वर्ग का सांख्यिकीय प्रतिनिधित्व नहीं।")}</div>;
}
export const periodLabel = (from: string) => `${fmtDate(from)} – ${fmtDate(iso(TODAY))}`;
export const rangeFrom = (r: "all" | "30" | "7") => (r === "all" ? "2026-10-05" : addDays(iso(TODAY), -(Number(r) - 1)));

// Campaign models the current role may see; candidate roles only ever get their own.
export function useScopedModels(candidate: string): { ms: CampaignModel[]; locked: boolean } {
  const { role } = usePreview();
  const locked = isCandidateRole(role);
  const who = locked ? scopedCandidate : candidate;
  return { ms: who === "All" ? models : models.filter((m) => m.c.candidate === who), locked };
}
export function CandidatePicker({ value, onChange, allowAll }: { value: string; onChange: (v: string) => void; allowAll?: boolean }) {
  const { role, L } = usePreview();
  if (isCandidateRole(role)) return <span className="rounded-full border px-3 py-1.5 text-xs font-medium">{L("Viewing:", "देख रहे हैं:")} {scopedCandidate} {L("only", "केवल")}</span>;
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls} aria-label={L("Candidate", "उम्मीदवार")}>
      {allowAll && <option value="All">{L("All candidates", "सभी उम्मीदवार")}</option>}
      {models.map((m) => <option key={m.c.id} value={m.c.candidate}>{m.c.candidate} · {m.client.ac}</option>)}
    </select>
  );
}

// Weekly buckets (week commencing Monday) from a list of dated counts.
export function weekly<T extends { date: string }>(rows: T[], keys: (keyof T)[]): Record<string, number | string>[] {
  const out = new Map<string, Record<string, number | string>>();
  for (const r of rows) {
    const d = new Date(r.date), wc = iso(new Date(d.getTime() - ((d.getDay() + 6) % 7) * 86400000));
    const b = out.get(wc) ?? { label: `w/c ${fmtDate(wc).slice(0, 6)}`, ...Object.fromEntries(keys.map((k) => [k, 0])) };
    for (const k of keys) (b[k as string] as number) += r[k] as number;
    out.set(wc, b);
  }
  return [...out.values()];
}

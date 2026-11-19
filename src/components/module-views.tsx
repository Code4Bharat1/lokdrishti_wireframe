import { useMemo, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Copy, Download, Eye, Plus, Search, Trash2, X, ScanSearch, Square, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { genRows, seeded, type AiToolModule, type AnalyticsModule, type Col, type KanbanModule, type Row, type SettingsModule, type TableModule } from "@/lib/modules";
import { badgeClass, downloadCsv } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import { usePreview, isCandidateRole, scopedCandidate } from "@/lib/preview";

export const btn = "inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium hover:bg-muted";
export const btnPrimary = "inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
export const inputCls = "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 } };

function Cell({ col, v }: { col: Col; v: string | number | undefined }) {
  if (v === undefined) return null;
  switch (col.type) {
    case "badge": return <span className={cn("rounded px-2 py-0.5 text-xs font-medium", badgeClass(String(v)))}>{v}</span>;
    case "progress": return (<div className="flex min-w-24 items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${v}%` }} /></div><span className="w-9 text-xs tabular-nums">{v}%</span></div>);
    case "number": return <span className="tabular-nums">{typeof v === "number" && v > 9999 ? v.toLocaleString("en-IN") : v}</span>;
    case "mono": return <span className="font-mono text-xs text-muted-foreground">{v}</span>;
    case "strong": return <span className="font-medium">{v}</span>;
    case "date": return <span className="whitespace-nowrap text-muted-foreground">{v}</span>;
    default: return <span className="text-muted-foreground">{v}</span>;
  }
}

/* ---------------- Table ---------------- */
export function TableView({ title, mod, compact }: { title: string; mod: TableModule; compact?: boolean }) {
  const { role, t, readOnly } = usePreview();
  // Candidate roles only ever see their own candidate's rows.
  const [rows, setRows] = useState<Row[]>(() => genRows(title, mod.gen, mod.count).map((r) => (isCandidateRole(role) && "candidate" in r ? { ...r, candidate: scopedCandidate } : r)));
  const [q, setQ] = useState("");
  const badgeCol = mod.cols.find((c) => c.type === "badge");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [view, setView] = useState<Row | null>(null);
  const [edit, setEdit] = useState<Row | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const per = compact ? 8 : 10;

  const filtered = useMemo(() => {
    let r = rows.filter((x) => (filter === "All" || !badgeCol || x[badgeCol.key] === filter) && Object.values(x).join(" ").toLowerCase().includes(q.toLowerCase()));
    if (sort) r = [...r].sort((a, b) => (a[sort.key]! > b[sort.key]! ? 1 : -1) * sort.dir);
    return r;
  }, [rows, q, filter, sort, badgeCol]);
  const pages = Math.max(1, Math.ceil(filtered.length / per));
  const shown = filtered.slice(page * per, page * per + per);
  const statuses = badgeCol ? ["All", ...new Set(rows.map((r) => String(r[badgeCol.key])))] : [];

  const save = (r: Row) => {
    setRows((rs) => (rs.some((x) => x._id === r._id) ? rs.map((x) => (x._id === r._id ? r : x)) : [r, ...rs]));
    toast.success(rows.some((x) => x._id === r._id) ? "Changes saved" : "Record added");
    setEdit(null);
  };
  const remove = (ids: string[]) => { setRows((rs) => rs.filter((x) => !ids.includes(x._id))); setSelected(new Set()); setView(null); toast.success(`${ids.length} record${ids.length > 1 ? "s" : ""} deleted`); };
  const decide = (r: Row, status: string) => { setRows((rs) => rs.map((x) => (x._id === r._id ? { ...x, status } : x))); toast.success(`${r["item"] ?? "Item"} ${status.toLowerCase()}`); };
  const blank = (): Row => ({ _id: `new-${Date.now()}`, ...Object.fromEntries(mod.cols.map((c) => [c.key, c.type === "number" || c.type === "progress" ? 0 : c.type === "badge" ? (statuses[1] ?? "") : ""])) });

  const counts = badgeCol ? statuses.slice(1, 4).map((s) => [s, rows.filter((r) => r[badgeCol.key] === s).length] as const) : [];

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={t("Total records")} value={rows.length} />
          {counts.map(([s, n]) => <Stat key={s} label={s} value={n} />)}
        </div>
      )}
      <div className="panel">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative min-w-48 flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder={t("Search…")} className={cn(inputCls, "pl-9")} />
          </div>
          {badgeCol && (
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0); }} className="h-9 rounded-md border bg-card px-2 text-sm">
              {statuses.map((s) => <option key={s}>{s === "All" ? `All ${badgeCol.label.toLowerCase()}` : s}</option>)}
            </select>
          )}
          <div className="ml-auto flex gap-2">
            {!readOnly && selected.size > 0 && <button className={btn} onClick={() => remove([...selected])}><Trash2 className="size-4" /> Delete {selected.size}</button>}
            <button className={btn} onClick={() => { downloadCsv(title, filtered, mod.cols); toast.success("CSV downloaded"); }}><Download className="size-4" /> {t("Export")}</button>
            {!compact && !readOnly && !mod.approvals && <button className={btnPrimary} onClick={() => setEdit(blank())}><Plus className="size-4" /> {t(mod.newLabel ?? "Add record")}</button>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="w-10 px-3 py-2"><input type="checkbox" aria-label="Select all" checked={shown.length > 0 && shown.every((r) => selected.has(r._id))} onChange={(e) => setSelected(e.target.checked ? new Set(shown.map((r) => r._id)) : new Set())} /></th>
                {mod.cols.map((c) => (
                  <th key={c.key} className="whitespace-nowrap py-2 pr-4 font-medium">
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 1 ? -1 : 1 }))}>
                      {t(c.label)}{sort?.key === c.key && (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                    </button>
                  </th>
                ))}
                <th className="pr-3 text-right font-medium">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r._id} className="cursor-pointer border-b last:border-0 hover:bg-muted/50" onClick={() => setView(r)}>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label="Select row" checked={selected.has(r._id)} onChange={(e) => setSelected((s) => { const n = new Set(s); e.target.checked ? n.add(r._id) : n.delete(r._id); return n; })} /></td>
                  {mod.cols.map((c) => <td key={c.key} className="py-2.5 pr-4"><Cell col={c} v={r[c.key]} /></td>)}
                  <td className="pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {readOnly ? null : mod.approvals && r["status"] === "Pending" ? (
                      <div className="inline-flex gap-1">
                        <button className="rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success hover:bg-success/20" onClick={() => decide(r, "Approved")}>{t("Approve")}</button>
                        <button className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20" onClick={() => decide(r, "Rejected")}>{t("Reject")}</button>
                      </div>
                    ) : (
                      <div className="inline-flex gap-0.5">
                        <button className="rounded p-1.5 hover:bg-muted" aria-label="View" onClick={() => setView(r)}><Eye className="size-3.5" /></button>
                        {!readOnly && <button className="rounded p-1.5 hover:bg-muted" aria-label="Delete" onClick={() => remove([r._id])}><Trash2 className="size-3.5" /></button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={mod.cols.length + 2} className="py-12 text-center text-muted-foreground">{t("No records match your search.")}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
          <span>{filtered.length} {t("records")} · {t("demo data")}</span>
          <div className="flex items-center gap-2">
            <button className="rounded border px-2 py-1 hover:bg-muted disabled:opacity-40" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>{t("Previous")}</button>
            <span>{t("Page")} {page + 1} {t("of")} {pages}</span>
            <button className="rounded border px-2 py-1 hover:bg-muted disabled:opacity-40" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>{t("Next")}</button>
          </div>
        </div>
      </div>

      <Sheet open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>{view ? String(view[mod.cols.find((c) => c.type === "strong")?.key ?? mod.cols[0]!.key]) : ""}</SheetTitle></SheetHeader>
          {view && (
            <div className="mt-4 space-y-4 px-4">
              <dl className="divide-y rounded-md border">
                {mod.cols.map((c) => <div key={c.key} className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm"><dt className="text-muted-foreground">{t(c.label)}</dt><dd className="text-right"><Cell col={c} v={view[c.key]} /></dd></div>)}
              </dl>
              <div className="flex gap-2">
                {!readOnly && <button className={btnPrimary} onClick={() => { setEdit(view); setView(null); }}>{t("Edit")}</button>}
                <button className={btn} onClick={() => { navigator.clipboard?.writeText(JSON.stringify(view)); toast.success("Copied to clipboard"); }}><Copy className="size-4" /> {t("Copy")}</button>
                {!readOnly && <button className={cn(btn, "text-destructive")} onClick={() => remove([view._id])}><Trash2 className="size-4" /> {t("Delete")}</button>}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit && rows.some((x) => x._id === edit._id) ? "Edit record" : mod.newLabel ?? "Add record"}</DialogTitle></DialogHeader>
          {edit && (
            <form id="rec-form" className="grid max-h-[60vh] gap-3 overflow-y-auto" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const next: Row = { ...edit };
              for (const c of mod.cols) { const v = String(fd.get(c.key) ?? ""); next[c.key] = c.type === "number" || c.type === "progress" ? Number(v) || 0 : v; }
              save(next);
            }}>
              {mod.cols.map((c) => (
                <label key={c.key} className="grid gap-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
                  {c.type === "badge" ? (
                    <select name={c.key} defaultValue={String(edit[c.key])} className={inputCls}>{[...new Set([String(edit[c.key]), ...statuses.slice(1)])].filter(Boolean).map((s) => <option key={s}>{s}</option>)}</select>
                  ) : (
                    <input name={c.key} defaultValue={String(edit[c.key] ?? "")} type={c.type === "number" || c.type === "progress" ? "number" : "text"} className={inputCls} required={c.type === "strong"} />
                  )}
                </label>
              ))}
            </form>
          )}
          <DialogFooter><button className={btn} onClick={() => setEdit(null)}>Cancel</button><button form="rec-form" type="submit" className={btnPrimary}>Save</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function Stat({ label, value, delta }: { label: string; value: string | number; delta?: string }) {
  return (
    <div className="panel p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      {delta && <div className={cn("mt-0.5 text-xs font-medium", delta.startsWith("−") ? "text-destructive" : "text-success")}>{delta}</div>}
    </div>
  );
}

/* ---------------- Analytics ---------------- */
const lineColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
export function AnalyticsView({ title, mod }: { title: string; mod: AnalyticsModule }) {
  const ranges = { "3 months": 3, "6 months": 6, "12 months": 12 } as const;
  const [range, setRange] = useState<keyof typeof ranges>("6 months");
  const { t } = usePreview();
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].slice(-ranges[range]);
  const line = useMemo(() => { const r = seeded(title + "l"); return months.map((m, i) => Object.fromEntries([["m", m], ...mod.line.series.map((s, j) => [s, Math.round((40 + i * 6 + r() * 25) * (1 - j * 0.2))])])); }, [title, range]);
  const bar = useMemo(() => { const r = seeded(title + "b"); return mod.bar.labels.map((l) => ({ l: t(l), v: Math.round(20 + r() * 80) })); }, [title, t]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border bg-muted p-0.5">
          {(Object.keys(ranges) as (keyof typeof ranges)[]).map((k) => <button key={k} onClick={() => setRange(k)} className={cn("rounded px-3 py-1 text-xs font-medium text-muted-foreground", range === k && "bg-card text-foreground shadow-card")}>{t(k)}</button>)}
        </div>
        <button className={cn(btn, "ml-auto")} onClick={() => { downloadCsv(title, line); toast.success("Chart data downloaded"); }}><Download className="size-4" /> {t("Export data")}</button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{mod.stats.map(([l, v, d]) => <Stat key={l} label={t(l)} value={t(v)} {...(d ? { delta: d } : {})} />)}</div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel"><h2 className="border-b px-5 py-3.5 text-sm font-semibold">{t(mod.line.title)}</h2><div className="p-4">
          <ClientOnly><ResponsiveContainer height={260}><AreaChart data={line}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="m" fontSize={12} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" /><YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" /><Tooltip {...tip} />
            {mod.line.series.map((s, i) => <Area key={s} dataKey={s} stroke={lineColors[i]} fill={lineColors[i]} fillOpacity={0.08} strokeWidth={2} />)}</AreaChart></ResponsiveContainer></ClientOnly>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">{mod.line.series.map((s, i) => <span key={s} className="flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: lineColors[i] }} />{t(s)}</span>)}</div>
        </div></section>
        <section className="panel"><h2 className="border-b px-5 py-3.5 text-sm font-semibold">{t(mod.bar.title)}</h2><div className="p-4">
          <ClientOnly><ResponsiveContainer height={280}><BarChart data={bar}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="l" fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" interval={0} /><YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} /><Bar dataKey="v" name="Value" fill="var(--chart-1)" radius={[3, 3, 0, 0]} maxBarSize={36} /></BarChart></ResponsiveContainer></ClientOnly>
        </div></section>
      </div>
      {mod.table && <TableView title={title + " table"} mod={mod.table} compact />}
    </div>
  );
}

/* ---------------- Kanban ---------------- */
export function KanbanView({ title, mod }: { title: string; mod: KanbanModule }) {
  const [cards, setCards] = useState(() => genRows(title, mod.gen, mod.count ?? 14).map((r, i) => ({ ...r, col: i % mod.columns.length }) as Row & { col: number }));
  const [adding, setAdding] = useState<number | null>(null);
  const [text, setText] = useState("");
  const move = (id: string, d: number) => setCards((cs) => cs.map((c) => (c._id === id ? { ...c, col: Math.max(0, Math.min(mod.columns.length - 1, c.col + d)) } : c)));
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {mod.columns.map((col, ci) => (
        <div key={col} className="flex flex-col rounded-lg border bg-muted/50">
          <div className="flex items-center justify-between px-3 py-2.5"><span className="text-sm font-semibold">{col}</span><span className="rounded bg-card px-1.5 text-xs tabular-nums text-muted-foreground">{cards.filter((c) => c.col === ci).length}</span></div>
          <div className="flex-1 space-y-2 px-2 pb-2">
            {cards.filter((c) => c.col === ci).map((c) => (
              <div key={c._id} className="rounded-md border bg-card p-3 shadow-card">
                <div className="flex items-start gap-1"><GripVertical className="mt-0.5 size-3.5 text-muted-foreground" /><div className="flex-1 text-sm font-medium">{c["title"]}</div>
                  <button aria-label="Remove" className="rounded p-0.5 text-muted-foreground hover:bg-muted" onClick={() => { setCards((cs) => cs.filter((x) => x._id !== c._id)); toast("Card removed"); }}><X className="size-3.5" /></button></div>
                <div className="mt-1 text-xs text-muted-foreground">{c["district"]} · {c["owner"]}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Due {c["due"]}</span>
                  <div className="flex gap-0.5">
                    <button aria-label="Move left" disabled={ci === 0} onClick={() => move(c._id, -1)} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowLeft className="size-3.5" /></button>
                    <button aria-label="Move right" disabled={ci === mod.columns.length - 1} onClick={() => move(c._id, 1)} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowRight className="size-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
            {adding === ci ? (
              <form onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; setCards((cs) => [...cs, { _id: `n${Date.now()}`, title: text, district: "—", owner: "You", due: "—", col: ci }]); setText(""); setAdding(null); toast.success("Card added"); }} className="space-y-2">
                <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Card title" className={inputCls} />
                <div className="flex gap-2"><button className={btnPrimary}>Add</button><button type="button" className={btn} onClick={() => setAdding(null)}>Cancel</button></div>
              </form>
            ) : (
              <button onClick={() => setAdding(ci)} className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-card"><Plus className="size-4" /> Add card</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Settings ---------------- */
export function SettingsView({ mod }: { mod: SettingsModule }) {
  const [dirty, setDirty] = useState(false);
  return (
    <form className="max-w-3xl space-y-4" onChange={() => setDirty(true)} onSubmit={(e) => { e.preventDefault(); setDirty(false); toast.success("Settings saved"); }}>
      {mod.groups.map((g) => (
        <section key={g.title} className="panel">
          <h2 className="border-b px-5 py-3.5 text-sm font-semibold">{g.title}</h2>
          <div className="divide-y">
            {g.fields.map((f) => (
              <label key={f.label} className="flex items-center justify-between gap-6 px-5 py-3.5 text-sm">
                <span>{f.label}</span>
                {f.type === "switch" ? <Switch defaultChecked={f.value as boolean} onCheckedChange={() => setDirty(true)} /> :
                  f.type === "select" ? <select defaultValue={f.value as string} className="h-9 w-48 rounded-md border bg-card px-2 text-sm">{f.options!.map((o) => <option key={o}>{o}</option>)}</select> :
                    <input defaultValue={f.value as string} className={cn(inputCls, "w-64")} />}
              </label>
            ))}
          </div>
        </section>
      ))}
      <div className="flex gap-2"><button className={btnPrimary} disabled={!dirty}>Save changes</button><button type="reset" className={btn} onClick={() => { setDirty(false); toast("Changes discarded"); }}>Discard</button></div>
    </form>
  );
}

/* ---------------- Permissions ---------------- */
const roles = ["Admin", "Analyst", "Researcher", "Field lead", "Viewer"];
const perms = ["View dashboards", "Create surveys", "Edit surveys", "Approve questionnaires", "Manage field teams", "Export data", "Use AI tools", "Manage users"];
export function PermissionsView() {
  const [grid, setGrid] = useState(() => perms.map((_, p) => roles.map((_, r) => r === 0 || (r === 1 && p !== 7) || (r === 2 && p < 3) || (r === 3 && [0, 4].includes(p)) || (r === 4 && p === 0))));
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="px-5 py-3 font-medium">Permission</th>{roles.map((r) => <th key={r} className="px-3 text-center font-medium">{r}</th>)}</tr></thead>
        <tbody>{perms.map((p, pi) => (
          <tr key={p} className="border-b last:border-0"><td className="px-5 py-3">{p}</td>
            {roles.map((r, ri) => <td key={r} className="text-center"><input type="checkbox" aria-label={`${r} ${p}`} disabled={ri === 0} checked={grid[pi]![ri]} onChange={() => setGrid((g) => g.map((row, i) => (i === pi ? row.map((v, j) => (j === ri ? !v : v)) : row)))} /></td>)}</tr>
        ))}</tbody>
      </table>
      <div className="flex justify-end gap-2 border-t p-3"><button className={btnPrimary} onClick={() => toast.success("Permissions updated")}>Save permissions</button></div>
    </div>
  );
}

/* ---------------- AI tool ---------------- */
export function AiToolView({ mod }: { mod: AiToolModule }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({ transport: new DefaultChatTransport({ api: "/api/chat" }) });
  const busy = status === "submitted" || status === "streaming";
  const last = [...messages].reverse().find((m) => m.role === "assistant");
  const out = last?.parts.map((p) => (p.type === "text" ? p.text : "")).join("") ?? "";
  const run = () => { if (!input.trim()) return; setMessages([]); sendMessage({ text: `${mod.instruction}\n\n---\n${input}` }); };
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="panel flex flex-col">
        <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Input</h2>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={12} placeholder={mod.placeholder} className="flex-1 resize-none rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <div className="flex flex-wrap gap-2">
            {mod.examples.map((ex) => <button key={ex} onClick={() => setInput(ex)} className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted">Use example</button>)}
            <button className={cn(btn, "ml-auto")} onClick={() => setInput("")}>Clear</button>
            {busy ? <button className={btnPrimary} onClick={() => stop()}><Square className="size-3.5" /> Stop</button> : <button className={btnPrimary} disabled={!input.trim()} onClick={run}><ScanSearch className="size-4" /> {mod.action}</button>}
          </div>
        </div>
      </section>
      <section className="panel flex flex-col">
        <div className="flex items-center justify-between border-b px-5 py-2.5"><h2 className="text-sm font-semibold">Result</h2>
          <div className="flex gap-2">
            <button className={btn} disabled={!out} onClick={() => { navigator.clipboard?.writeText(out); toast.success("Copied"); }}><Copy className="size-4" /> Copy</button>
            <button className={btn} disabled={!out} onClick={() => { const u = URL.createObjectURL(new Blob([out], { type: "text/plain" })); const a = document.createElement("a"); a.href = u; a.download = "result.txt"; a.click(); }}><Download className="size-4" /> Download</button>
          </div>
        </div>
        <div className="min-h-72 flex-1 whitespace-pre-wrap p-5 text-sm leading-relaxed">
          {error ? <span className="text-destructive">The AI couldn't respond. Please try again.</span> : out || (busy ? <span className="text-muted-foreground">Working…</span> : <span className="text-muted-foreground">Results appear here. AI output can be wrong — verify before use.</span>)}
        </div>
      </section>
    </div>
  );
}


// Volunteer Performance: targets, daily/weekly counts, locations, accepted vs flagged, sync and completion time.
import { useMemo, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, Download } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Header } from "@/components/campaign-management";
import { CandidatePicker, ChartCard, Kpi, Seg, axis, n, pct, selectCls, series, tip, useScopedModels, weekly } from "@/components/dashboard-kit";
import { btn } from "@/components/module-views";
import { usePreview } from "@/lib/preview";
import { downloadCsv } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import { upDistricts, fmtDate, iso, TODAY, addDays, type FieldVolunteer, type CampaignModel } from "@/data/demo";

type Row = FieldVolunteer & { m: CampaignModel; completed: number; today: number; week: number; last7: number[] };
type SortKey = "name" | "target" | "completed" | "progress" | "today" | "week" | "flagged" | "pending" | "avgMin";
const today = iso(TODAY), weekStart = addDays(today, -6);

export function VolunteerPerformance() {
  const { L } = usePreview();
  const [cand, setCand] = useState("All");
  const [district, setDistrict] = useState("All");
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "completed", dir: -1 });
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<Row | null>(null);
  const { ms } = useScopedModels(cand);

  const rows: Row[] = useMemo(() => ms.filter((m) => district === "All" || m.client.district === district).flatMap((m) => m.volunteers.map((v) => {
    const on = (from: string) => m.days.reduce((s, d, i) => s + (d >= from ? v.daily[i]! : 0), 0);
    const last7 = Array.from({ length: 7 }, (_, k) => { const i = m.days.indexOf(addDays(today, k - 6)); return i < 0 ? 0 : v.daily[i]!; });
    return { ...v, m, completed: v.accepted + v.flagged, today: on(today), week: on(weekStart), last7 };
  })), [ms, district]);
  const val = (r: Row, k: SortKey) => (k === "progress" ? pct(r.accepted, r.target) : k === "name" ? r.name : r[k]);
  const sorted = [...rows].sort((a, b) => (val(a, sort.k) > val(b, sort.k) ? 1 : -1) * sort.dir);
  const per = 15, pages = Math.max(1, Math.ceil(sorted.length / per)), shown = sorted.slice(page * per, page * per + per);

  // Team totals by day across the filtered campaigns.
  const days = [...new Set(rows.flatMap((r) => r.m.days))].sort().slice(-21);
  const byDay = days.map((date) => ({ date, label: fmtDate(date).slice(0, 6), accepted: rows.reduce((s, r) => { const i = r.m.days.indexOf(date); return s + (i < 0 ? 0 : r.daily[i]!); }, 0) }));
  const top = [...rows].sort((a, b) => b.completed - a.completed).slice(0, 10).map((r) => ({ name: r.name, accepted: r.accepted, flagged: r.flagged }));
  const byLoc = Object.entries(rows.reduce<Record<string, number>>((acc, r) => { for (const [a, c] of Object.entries(r.byArea)) acc[a] = (acc[a] ?? 0) + c; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, v]) => ({ name, v }));
  const sum = (f: (r: Row) => number) => rows.reduce((s, r) => s + f(r), 0);
  const avgTime = rows.length ? sum((r) => r.avgMin) / rows.length : 0;

  const th = (k: SortKey, label: string, right = true) => (
    <th className={cn("whitespace-nowrap px-3 py-2 font-medium", right && "text-right")}>
      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => { setSort((s) => ({ k, dir: s.k === k && s.dir === -1 ? 1 : -1 })); setPage(0); }}>{label}{sort.k === k && (sort.dir === -1 ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}</button>
    </th>
  );

  return (
    <div className="space-y-5">
      <Header section="Monitoring" title="Volunteer Performance" desc={L("Based on recorded activity; flagged, rejected and duplicate submissions are counted separately.", "दर्ज गतिविधि पर आधारित; फ़्लैग, अस्वीकृत और डुप्लिकेट अलग गिने जाते हैं।")}>
        <CandidatePicker value={cand} onChange={(v) => { setCand(v); setPage(0); }} allowAll />
        <select value={district} onChange={(e) => { setDistrict(e.target.value); setPage(0); }} className={selectCls} aria-label="District"><option value="All">{L("All districts", "सभी ज़िले")}</option>{upDistricts.map((d) => <option key={d}>{d}</option>)}</select>
        <button className={btn} onClick={() => { downloadCsv("volunteer-performance", sorted.map((r) => ({ id: r.id, volunteer: r.name, candidate: r.candidate, areas: r.areas.join(" / "), target: r.target, completed: r.completed, accepted: r.accepted, flagged: r.flagged, rejected: r.rejected, pending_sync: r.pending, avg_minutes: r.avgMin, today: r.today, this_week: r.week }))); toast.success(L("CSV downloaded", "CSV डाउनलोड हुआ")); }}><Download className="size-4" /> {L("Export", "निर्यात")}</button>
      </Header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label={L("Volunteers", "स्वयंसेवक")} value={n(rows.length)} sub={`${rows.filter((r) => r.active).length} ${L("active", "सक्रिय")}`} />
        <Kpi label={L("Surveys completed", "पूर्ण सर्वे")} value={n(sum((r) => r.completed))} sub={`${n(sum((r) => r.today))} ${L("today", "आज")} · ${n(sum((r) => r.week))} ${L("this week", "इस सप्ताह")}`} />
        <Kpi label={L("Accepted vs flagged", "स्वीकृत बनाम फ़्लैग")} value={`${pct(sum((r) => r.accepted), sum((r) => r.completed)).toFixed(1)}%`} sub={`${n(sum((r) => r.flagged))} ${L("flagged", "फ़्लैग")} · ${n(sum((r) => r.rejected))} ${L("rejected", "अस्वीकृत")}`} tone="success" />
        <Kpi label={L("Pending sync", "सिंक लंबित")} value={n(sum((r) => r.pending))} sub={`${rows.filter((r) => r.pending).length} ${L("phones", "फ़ोन")}`} tone="warning" />
        <Kpi label={L("Avg completion time", "औसत पूर्णता समय")} value={`${avgTime.toFixed(1)} min`} sub={L("from consent to submit", "सहमति से जमा तक")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title={L("Surveys per day, whole team", "प्रति दिन सर्वे, पूरी टीम")} action={<Seg value={mode} onChange={setMode} options={[["daily", L("Daily", "दैनिक")], ["weekly", L("Weekly", "साप्ताहिक")]]} />}>
          <ClientOnly><ResponsiveContainer height={240}><BarChart data={mode === "daily" ? byDay : weekly(byDay, ["accepted"])}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="label" {...axis} interval="preserveStartEnd" /><YAxis {...axis} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="accepted" name={L("Accepted", "स्वीकृत")} fill={series[0]} radius={[3, 3, 0, 0]} maxBarSize={28} /></BarChart></ResponsiveContainer></ClientOnly>
        </ChartCard>
        <ChartCard title={L("Distribution by location", "स्थान-वार वितरण")} sub={L("Top Gram Panchayats / wards", "शीर्ष ग्राम पंचायत / वार्ड")}>
          <ClientOnly><ResponsiveContainer height={240}><BarChart data={byLoc} layout="vertical" margin={{ left: 4, right: 12 }}><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={100} {...axis} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="v" name={L("Surveys", "सर्वे")} fill={series[1]} radius={[0, 3, 3, 0]} barSize={10} /></BarChart></ResponsiveContainer></ClientOnly>
        </ChartCard>
      </div>
      <ChartCard title={L("Accepted vs flagged, top 10 volunteers", "स्वीकृत बनाम फ़्लैग, शीर्ष 10 स्वयंसेवक")}>
        <ClientOnly><ResponsiveContainer height={220}><BarChart data={top}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="name" {...axis} interval={0} tick={{ fontSize: 10 }} /><YAxis {...axis} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="accepted" name={L("Accepted", "स्वीकृत")} stackId="a" fill={series[0]} maxBarSize={32} /><Bar dataKey="flagged" name={L("Flagged", "फ़्लैग")} stackId="a" fill={series[2]} radius={[3, 3, 0, 0]} maxBarSize={32} /></BarChart></ResponsiveContainer></ClientOnly>
      </ChartCard>

      <section className="panel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              {th("name", L("Volunteer", "स्वयंसेवक"), false)}<th className="px-3 py-2 font-medium">{L("Candidate · area", "उम्मीदवार · क्षेत्र")}</th>
              {th("target", L("Target", "लक्ष्य"))}{th("completed", L("Completed", "पूर्ण"))}{th("progress", L("Progress", "प्रगति"))}{th("today", L("Today", "आज"))}{th("week", L("7 days", "7 दिन"))}{th("flagged", L("Flagged", "फ़्लैग"))}{th("pending", L("Sync pending", "सिंक लंबित"))}{th("avgMin", L("Avg min", "औसत मिनट"))}
              <th className="px-3 py-2 font-medium">{L("Trend", "रुझान")}</th>
            </tr></thead>
            <tbody>{shown.map((r) => { const p = pct(r.accepted, r.target); return (
              <tr key={r.id} onClick={() => setOpen(r)} className="cursor-pointer border-b last:border-0 hover:bg-muted/50">
                <td className="px-3 py-2"><div className="font-medium">{r.name}{!r.active && <span className="ml-1.5 rounded bg-destructive/10 px-1 text-[10px] text-destructive">{L("Inactive", "निष्क्रिय")}</span>}</div><div className="font-mono text-[11px] text-muted-foreground">{r.id}</div></td>
                <td className="px-3 text-xs text-muted-foreground">{r.candidate}<br />{r.areas.join(", ")}</td>
                <td className="px-3 text-right tabular-nums">{n(r.target)}</td><td className="px-3 text-right tabular-nums">{n(r.completed)}</td>
                <td className="px-3"><div className="ml-auto flex w-28 items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-muted"><div className={cn("h-full rounded-full", p >= 100 ? "bg-success" : "bg-primary")} style={{ width: `${Math.min(100, p)}%` }} /></div><span className="w-9 text-right text-xs tabular-nums">{Math.round(p)}%</span></div></td>
                <td className="px-3 text-right tabular-nums">{r.today}</td><td className="px-3 text-right tabular-nums">{r.week}</td>
                <td className="px-3 text-right tabular-nums">{r.flagged} <span className="text-xs text-muted-foreground">({pct(r.flagged, r.completed).toFixed(0)}%)</span></td>
                <td className={cn("px-3 text-right tabular-nums", r.pending > 0 && "text-warning")}>{r.pending}</td><td className="px-3 text-right tabular-nums">{r.avgMin}</td>
                <td className="px-3"><div className="h-7 w-20"><ClientOnly><ResponsiveContainer><LineChart data={r.last7.map((v) => ({ v }))}><Line dataKey="v" dot={false} strokeWidth={1.5} stroke="var(--primary)" isAnimationActive={false} /></LineChart></ResponsiveContainer></ClientOnly></div></td>
              </tr>
            ); })}</tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
          <span>{rows.length} {L("volunteers", "स्वयंसेवक")} · {L("demo data", "डेमो डेटा")}</span>
          <div className="flex items-center gap-2"><button className="rounded border px-2 py-1 hover:bg-muted disabled:opacity-40" disabled={page === 0} onClick={() => setPage(page - 1)}>{L("Previous", "पिछला")}</button><span>{page + 1} / {pages}</span><button className="rounded border px-2 py-1 hover:bg-muted disabled:opacity-40" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>{L("Next", "अगला")}</button></div>
        </div>
      </section>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && (<>
            <SheetHeader><SheetTitle>{open.name}</SheetTitle><div className="text-xs text-muted-foreground"><span className="font-mono">{open.id}</span> · {open.candidate} · {open.district}</div></SheetHeader>
            <div className="space-y-4 px-4 pb-6">
              <div className="grid grid-cols-3 gap-2">
                {([[L("Target", "लक्ष्य"), n(open.target)], [L("Accepted", "स्वीकृत"), n(open.accepted)], [L("Flagged", "फ़्लैग"), n(open.flagged)], [L("Rejected", "अस्वीकृत"), n(open.rejected)], [L("Sync pending", "सिंक लंबित"), n(open.pending)], [L("Avg min", "औसत मिनट"), String(open.avgMin)]] as const).map(([k, v]) => <div key={k} className="rounded-md border p-2.5"><div className="text-[11px] text-muted-foreground">{k}</div><div className="font-semibold tabular-nums">{v}</div></div>)}
              </div>
              <ChartCard title={L("Daily surveys", "दैनिक सर्वे")}>
                <ClientOnly><ResponsiveContainer height={180}><BarChart data={open.m.days.map((d, i) => ({ label: fmtDate(d).slice(0, 6), v: open.daily[i] }))}><XAxis dataKey="label" {...axis} interval="preserveStartEnd" /><YAxis {...axis} width={30} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} /><Bar dataKey="v" name={L("Surveys", "सर्वे")} fill={series[0]} radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></ClientOnly>
              </ChartCard>
              <ChartCard title={L("By location", "स्थान-वार")}>
                <ul className="space-y-2 text-sm">{Object.entries(open.byArea).map(([a, c]) => <li key={a}><div className="flex justify-between"><span>{a}</span><span className="tabular-nums">{n(c)}</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-chart-2" style={{ width: `${pct(c, open.accepted)}%` }} /></div></li>)}</ul>
              </ChartCard>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}

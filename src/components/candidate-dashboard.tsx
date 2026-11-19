// Candidate Dashboard: one candidate's package, coverage, issues, volunteers and trends.
import { useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { toast } from "sonner";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { Header } from "@/components/campaign-management";
import { bandTone } from "@/components/questionnaire-builder";
import { CandidatePicker, ChartCard, Disclaimer, Kpi, Seg, axis, n, pct, periodLabel, series, tip, useScopedModels, weekly } from "@/components/dashboard-kit";
import { btnPrimary } from "@/components/module-views";
import { usePreview } from "@/lib/preview";
import { downloadCsv, badgeClass } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import { upPackages, deriveStatus, daysLeft, fmtDate, issueStats, priorityBands, histMean } from "@/data/demo";

const bandColour = ["var(--muted-foreground)", "var(--chart-1)", "var(--warning)", "var(--destructive)"];

export function CandidateDashboard() {
  const { L } = usePreview();
  const [cand, setCand] = useState("Rajesh Verma");
  const [trend, setTrend] = useState<"daily" | "weekly" | "campaign">("daily");
  const { ms } = useScopedModels(cand);
  const m = ms[0]!;
  const pkg = upPackages.find((p) => p.id === m.c.packageId)!;
  const status = deriveStatus({ ...m.c, expiry: m.c.end });
  const achieved = pct(m.c.accepted, m.c.target);
  const stats = issueStats([m], 7).filter((s) => s.freq).sort((a, b) => b.freq - a.freq);
  const hist = stats.reduce((h, s) => h.map((v, k) => v + s.hist[k]!), Array<number>(10).fill(0));
  const top = stats.slice(0, 6).map((s) => s.issue);
  const daily = m.daily.map((d) => ({ ...d, label: fmtDate(d.date).slice(0, 6) }));
  let run = 0;
  const cumulative = daily.map((d, i) => ({ label: d.label, acc: (run += d.accepted), pace: Math.round((m.c.target * (i + 1)) / Math.max(1, m.days.length + Math.max(0, daysLeft(m.c.end)))) }));
  const ext = pkg.extensions.at(-1);

  const download = () => {
    downloadCsv(`${m.c.candidate}-report`, [
      ...stats.map((s) => ({ section: "Issue", name: s.issue, value: s.freq, avg_priority: s.avg.toFixed(1), high_priority: s.high, spread: `${s.spread}/${s.locations}`, prevalence: `${s.prevalence.toFixed(1)}%` })),
      ...m.areas.map((a) => ({ section: "Area", name: a.gp, value: a.responses, avg_priority: "", high_priority: "", spread: "", prevalence: `${Math.round(pct(a.responses, a.planned))}% of plan` })),
    ]);
    toast.success(L("Report downloaded (CSV). PDF export is planned in the report module.", "रिपोर्ट डाउनलोड (CSV)। PDF निर्यात रिपोर्ट मॉड्यूल में।"));
  };

  return (
    <div className="space-y-5">
      <Header section="Candidate Workspace" title="Candidate Dashboard" desc={`${m.c.name} · ${periodLabel(m.c.start)}`}>
        <CandidatePicker value={cand} onChange={setCand} />
        <button className={btnPrimary} onClick={download}><Download className="size-4" /> {L("Download report", "रिपोर्ट डाउनलोड करें")}</button>
      </Header>

      <section className="panel grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2"><span className="eyebrow">{L("Package", "पैकेज")}</span><span className="font-semibold">{pkg.name}</span><span className="font-mono text-xs text-muted-foreground">{pkg.id}</span><span className={cn("rounded px-2 py-0.5 text-xs font-medium", badgeClass(status))}>{status}</span></div>
          <div className="mt-3 flex items-end gap-3"><span className="text-4xl font-semibold tabular-nums tracking-tight">{achieved.toFixed(1)}%</span><span className="pb-1 text-sm text-muted-foreground">{L("of target achieved", "लक्ष्य प्राप्त")}</span></div>
          <div className="mt-2 h-2.5 rounded-full bg-muted"><div className={cn("h-full rounded-full", achieved >= 90 ? "bg-warning" : "bg-primary")} style={{ width: `${Math.min(100, achieved)}%` }} /></div>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            {([[L("Target", "लक्ष्य"), n(m.c.target)], [L("Accepted", "स्वीकृत"), n(m.c.accepted)], [L("Remaining", "शेष"), n(Math.max(0, m.c.target - m.c.accepted))]] as const).map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="text-lg font-semibold tabular-nums">{v}</dd></div>)}
          </dl>
        </div>
        <dl className="grid grid-cols-2 gap-3 rounded-md bg-muted/50 p-4 text-sm">
          <div><dt className="text-xs text-muted-foreground">{L("Activation", "सक्रियण")}</dt><dd className="font-medium">{fmtDate(m.c.start)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{L("Expiry", "समाप्ति")}</dt><dd className="font-medium">{fmtDate(m.c.end)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{L("Days remaining", "शेष दिन")}</dt><dd className="font-medium">{daysLeft(m.c.end) < 0 ? L("Expired", "समाप्त") : daysLeft(m.c.end)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{L("Extension", "विस्तार")}</dt><dd className="font-medium">{ext ? `${fmtDate(ext.from).slice(0, 6)} → ${fmtDate(ext.to).slice(0, 6)}` : L("None", "कोई नहीं")}</dd></div>
        </dl>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={L("Completed (accepted)", "पूर्ण (स्वीकृत)")} value={n(m.c.accepted)} tone="success" />
        <Kpi label={L("Pending review", "समीक्षा लंबित")} value={n(m.flagged)} sub={L("flagged by validation rules", "सत्यापन नियमों से फ़्लैग")} tone="warning" />
        <Kpi label={L("Rejected", "अस्वीकृत")} value={n(m.rejected)} tone="destructive" />
        <Kpi label={L("Sync pending", "सिंक लंबित")} value={n(m.syncPending)} sub={L("saved on phones, not yet received", "फ़ोन में सहेजे, अभी प्राप्त नहीं")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={L("Coverage by village / ward", "गाँव / वार्ड-वार कवरेज")} sub={L("Accepted surveys against each area's planned share", "प्रत्येक क्षेत्र के नियोजित हिस्से के सापेक्ष स्वीकृत सर्वे")}>
          <ul className="space-y-2.5">
            {[...m.areas].sort((a, b) => pct(a.responses, a.planned) - pct(b.responses, b.planned)).map((a) => { const p = pct(a.responses, a.planned); return (
              <li key={a.gp} className="text-sm"><div className="flex justify-between gap-2"><span>{a.gp} <span className="text-xs text-muted-foreground">· {a.block}</span></span><span className="tabular-nums text-muted-foreground">{n(a.responses)} / {n(a.planned)} · <b className={cn(p < 50 ? "text-destructive" : "text-foreground")}>{Math.round(p)}%</b></span></div>
                <div className="mt-1 h-1.5 rounded-full bg-muted"><div className={cn("h-full rounded-full", p < 50 ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min(100, p)}%` }} /></div></li>
            ); })}
          </ul>
        </ChartCard>
        <ChartCard title={L("Issue frequency ranking", "मुद्दा आवृत्ति क्रम")} sub={L("Respondents reporting each issue", "प्रत्येक मुद्दा बताने वाले उत्तरदाता")}>
          <ClientOnly><ResponsiveContainer height={stats.length * 24 + 30}><BarChart data={stats} layout="vertical" margin={{ left: 8, right: 16 }}><CartesianGrid stroke="var(--border)" horizontal={false} /><XAxis type="number" {...axis} /><YAxis type="category" dataKey="issue" width={140} {...axis} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="freq" name={L("Respondents", "उत्तरदाता")} fill={series[0]} radius={[0, 3, 3, 0]} barSize={10} /></BarChart></ResponsiveContainer></ClientOnly>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={L("Priority distribution (1–10)", "प्राथमिकता वितरण (1–10)")} sub={`${L("All issue ratings", "सभी मुद्दा रेटिंग")} · ${L("mean", "औसत")} ${histMean(hist).toFixed(1)}`}>
          <ClientOnly><ResponsiveContainer height={220}><BarChart data={hist.map((v, k) => ({ score: k + 1, v }))}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="score" {...axis} /><YAxis {...axis} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="v" name={L("Ratings", "रेटिंग")} radius={[3, 3, 0, 0]}>{hist.map((_, k) => <Cell key={k} fill={bandColour[priorityBands.findIndex((b) => k + 1 >= b.from && k + 1 <= b.to)]} />)}</Bar></BarChart></ResponsiveContainer></ClientOnly>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">{priorityBands.map((b, i) => <span key={b.label} className={cn("rounded px-1.5 py-0.5", bandTone[i])}>{b.from}–{b.to} {b.label}</span>)}</div>
        </ChartCard>
        <ChartCard title={L("Area-wise issue comparison", "क्षेत्र-वार मुद्दा तुलना")} sub={L("% of respondents in each area reporting the issue", "प्रत्येक क्षेत्र में मुद्दा बताने वाले उत्तरदाताओं का %")}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr><th />{top.map((t) => <th key={t} className="px-1 pb-2 text-center font-medium text-muted-foreground">{t}</th>)}</tr></thead>
              <tbody>{m.areas.map((a) => (
                <tr key={a.gp}><td className="whitespace-nowrap py-0.5 pr-2 font-medium">{a.gp}</td>
                  {top.map((t) => { const p = pct(a.issues[t]!.count, a.responses); return <td key={t} className="p-0.5"><div className="rounded py-1.5 text-center tabular-nums" style={{ background: `color-mix(in oklch, var(--chart-1) ${Math.round(p * 1.1)}%, transparent)`, color: p > 55 ? "white" : undefined }}>{Math.round(p)}%</div></td>; })}</tr>
              ))}</tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <ChartCard title={L("Volunteer progress", "स्वयंसेवक प्रगति")} sub={`${m.volunteers.length} ${L("volunteers", "स्वयंसेवक")}`}>
          <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {[...m.volunteers].sort((a, b) => b.accepted - a.accepted).map((v) => { const p = pct(v.accepted, v.target); return (
              <li key={v.id} className="text-sm"><div className="flex justify-between gap-2"><span>{v.name} <span className="text-xs text-muted-foreground">· {v.areas.join(", ")}</span></span><span className="tabular-nums text-muted-foreground">{n(v.accepted)} / {n(v.target)}{v.pending > 0 && <span className="ml-1 text-warning">· {v.pending} {L("sync", "सिंक")}</span>}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-chart-2" style={{ width: `${Math.min(100, p)}%` }} /></div></li>
            ); })}
          </ul>
        </ChartCard>
        <ChartCard title={L("Survey trend", "सर्वे रुझान")} action={<Seg value={trend} onChange={setTrend} options={[["daily", L("Daily", "दैनिक")], ["weekly", L("Weekly", "साप्ताहिक")], ["campaign", L("Campaign", "अभियान")]]} />}>
          <ClientOnly><ResponsiveContainer height={260}>
            {trend === "campaign" ? (
              <AreaChart data={cumulative}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="label" {...axis} interval="preserveStartEnd" /><YAxis {...axis} /><Tooltip {...tip} />
                <ReferenceLine y={m.c.target} stroke="var(--muted-foreground)" strokeDasharray="4 4" label={{ value: L("Target", "लक्ष्य"), fontSize: 11, fill: "var(--muted-foreground)", position: "insideTopLeft" }} />
                <Area dataKey="acc" name={L("Accepted (cumulative)", "स्वीकृत (संचयी)")} stroke={series[0]} fill={series[0]} fillOpacity={0.1} strokeWidth={2} />
                <Area dataKey="pace" name={L("Even pace to target", "लक्ष्य तक समान गति")} stroke={series[4]} fill="transparent" strokeDasharray="4 4" strokeWidth={1.5} /></AreaChart>
            ) : (
              <BarChart data={trend === "daily" ? daily : weekly(daily, ["accepted", "flagged"])}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="label" {...axis} interval="preserveStartEnd" /><YAxis {...axis} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="accepted" name={L("Accepted", "स्वीकृत")} stackId="a" fill={series[0]} maxBarSize={28} /><Bar dataKey="flagged" name={L("Flagged", "फ़्लैग")} stackId="a" fill={series[2]} radius={[3, 3, 0, 0]} maxBarSize={28} /></BarChart>
            )}
          </ResponsiveContainer></ClientOnly>
        </ChartCard>
      </div>
      <Disclaimer />
    </div>
  );
}

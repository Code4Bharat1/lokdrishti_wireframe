// Digital Command Centre: consolidated view across all clients (Super Admin, Command Centre / Operations).
import { useState } from "react";
import { ClientOnly, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CalendarClock, CheckCircle2, CloudUpload, Download, Flag, Map as MapIcon, TrendingUp } from "lucide-react";
import { Header } from "@/components/campaign-management";
import { ChartCard, Kpi, Seg, Disclaimer, axis, n, pct, periodLabel, rangeFrom, selectCls, series, tip, weekly } from "@/components/dashboard-kit";
import { btn } from "@/components/module-views";
import { usePreview } from "@/lib/preview";
import { downloadCsv } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import { models, upDistricts, upPackages, deriveStatus, daysLeft, issueStats, fmtDate, type CampaignModel } from "@/data/demo";

const statusOf = (m: CampaignModel) => deriveStatus({ ...m.c, expiry: m.c.end });

export function CommandCentre() {
  const { L } = usePreview();
  const [range, setRange] = useState<"all" | "30" | "7">("all");
  const [client, setClient] = useState("All");
  const [campaign, setCampaign] = useState("All");
  const [district, setDistrict] = useState("All");
  const [vol, setVol] = useState<"daily" | "weekly">("daily");
  const from = rangeFrom(range);
  const ms = models.filter((m) => (client === "All" || m.c.candidate === client) && (campaign === "All" || m.c.id === campaign) && (district === "All" || m.client.district === district));

  const sum = (f: (m: CampaignModel) => number) => ms.reduce((s, m) => s + f(m), 0);
  const target = sum((m) => m.c.target), accepted = sum((m) => m.c.accepted);
  const inRange = sum((m) => m.daily.filter((d) => d.date >= from).reduce((s, d) => s + d.accepted, 0));
  const statuses = ms.map(statusOf);
  const count = (...s: string[]) => statuses.filter((x) => s.includes(x)).length;

  const days = [...new Set(ms.flatMap((m) => m.days))].filter((d) => d >= from).sort();
  const daily = days.map((date) => ({ date, label: fmtDate(date).slice(0, 6), Accepted: sum((m) => m.daily.find((d) => d.date === date)?.accepted ?? 0), Flagged: sum((m) => m.daily.find((d) => d.date === date)?.flagged ?? 0) }));
  const volume = vol === "daily" ? daily : weekly(daily, ["Accepted", "Flagged"]);
  const byClient = ms.map((m) => ({ name: m.c.candidate, pct: Math.round(pct(m.c.accepted, m.c.target)), status: statusOf(m) })).sort((a, b) => b.pct - a.pct);
  const byArea = upDistricts.map((d) => { const x = ms.filter((m) => m.client.district === d); const t = x.reduce((s, m) => s + m.c.target, 0), a = x.reduce((s, m) => s + m.c.accepted, 0); return { name: d, pct: Math.round(pct(a, t)), accepted: a, target: t }; }).filter((x) => x.target);
  const stats = issueStats(ms, 7);
  const topFreq = [...stats].sort((a, b) => b.freq - a.freq).slice(0, 5);
  const topPri = [...stats].filter((s) => s.freq >= 30).sort((a, b) => b.avg - a.avg).slice(0, 5);

  // Activity feed derived from the same data, newest first.
  const feed = [
    ...ms.filter((m) => statusOf(m) === "Completed").map((m) => ({ t: "09:58", icon: CheckCircle2, tone: "text-success", text: `${m.c.candidate}: ${L("target reached, collection auto-stopped", "लक्ष्य पूरा, संग्रह स्वतः रुका")}` })),
    ...ms.filter((m) => { const p = pct(m.c.accepted, m.c.target); return p >= 90 && p < 100; }).map((m) => ({ t: "10:41", icon: TrendingUp, tone: "text-warning", text: `${m.c.candidate}: ${Math.round(pct(m.c.accepted, m.c.target))}% ${L("of target", "लक्ष्य का")}` })),
    ...ms.filter((m) => statusOf(m) === "Expiring Soon").map((m) => ({ t: "08:30", icon: CalendarClock, tone: "text-warning", text: `${m.c.name} ${L("expires in", "समाप्त होगा")} ${daysLeft(m.c.end)} ${L("days", "दिन")}` })),
    ...upPackages.filter((p) => p.extensions.length && ms.some((m) => m.c.packageId === p.id)).map((p) => ({ t: L("Yesterday", "कल"), icon: CalendarClock, tone: "text-primary", text: `${p.id} ${L("extended to", "बढ़ाया गया")} ${fmtDate(p.expiry)} · ${p.extensions.at(-1)!.by}` })),
    ...ms.slice(0, 4).map((m, i) => ({ t: `10:${String(52 - i * 7)}`, icon: CloudUpload, tone: "text-muted-foreground", text: `${m.daily.at(-1)?.accepted ?? 0} ${L("surveys synced", "सर्वे सिंक हुए")} · ${m.c.name}` })),
    ...ms.slice(0, 3).map((m, i) => ({ t: `09:${String(40 - i * 9)}`, icon: Flag, tone: "text-destructive", text: `${m.daily.at(-1)?.flagged ?? 0} ${L("surveys flagged for review", "सर्वे समीक्षा हेतु फ़्लैग")} · ${m.c.candidate}` })),
  ].sort((a, b) => (/^\d/.test(b.t) ? b.t : "00").localeCompare(/^\d/.test(a.t) ? a.t : "00")).slice(0, 9);

  const exportCsv = () => { downloadCsv("command-centre", ms.map((m) => ({ campaign: m.c.name, candidate: m.c.candidate, district: m.client.district, target: m.c.target, accepted: m.c.accepted, completion: `${Math.round(pct(m.c.accepted, m.c.target))}%`, status: statusOf(m), flagged: m.flagged, sync_pending: m.syncPending }))); toast.success(L("CSV downloaded", "CSV डाउनलोड हुआ")); };

  return (
    <div className="space-y-5">
      <Header section="Overview" title="Digital Command Centre" desc={`Uttar Pradesh · ${periodLabel(from)}`}>
        <Link to="/monitoring/geographical-dashboard" className={btn}><MapIcon className="size-4" /> {L("Map", "मानचित्र")}</Link>
        <button className={btn} onClick={exportCsv}><Download className="size-4" /> {L("Export", "निर्यात")}</button>
      </Header>

      <div className="panel flex flex-wrap items-center gap-2 p-3">
        <Seg value={range} onChange={setRange} options={[["all", L("Campaign to date", "अभियान अब तक")], ["30", L("Last 30 days", "पिछले 30 दिन")], ["7", L("Last 7 days", "पिछले 7 दिन")]]} />
        <select value={client} onChange={(e) => { setClient(e.target.value); setCampaign("All"); }} className={selectCls} aria-label="Client"><option value="All">{L("All clients", "सभी क्लाइंट")}</option>{models.map((m) => <option key={m.c.id} value={m.c.candidate}>{m.client.account}</option>)}</select>
        <select value={campaign} onChange={(e) => setCampaign(e.target.value)} className={selectCls} aria-label="Campaign"><option value="All">{L("All campaigns", "सभी अभियान")}</option>{models.filter((m) => client === "All" || m.c.candidate === client).map((m) => <option key={m.c.id} value={m.c.id}>{m.c.name}</option>)}</select>
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className={selectCls} aria-label="District"><option value="All">{L("All districts", "सभी ज़िले")}</option>{upDistricts.map((d) => <option key={d}>{d}</option>)}</select>
        {(client !== "All" || campaign !== "All" || district !== "All" || range !== "all") && <button className="text-xs font-medium text-primary hover:underline" onClick={() => { setRange("all"); setClient("All"); setCampaign("All"); setDistrict("All"); }}>{L("Clear filters", "फ़िल्टर हटाएँ")}</button>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label={L("Clients", "क्लाइंट")} value={new Set(ms.map((m) => m.client.account)).size} sub={`${new Set(ms.map((m) => m.c.candidate)).size} ${L("candidates", "उम्मीदवार")}`} />
        <Kpi label={L("Active / expired campaigns", "सक्रिय / समाप्त अभियान")} value={<>{count("Active", "Expiring Soon")} <span className="text-base text-muted-foreground">/ {count("Expired")}</span></>} sub={`${count("Completed")} ${L("completed", "पूर्ण")} · ${count("Suspended")} ${L("suspended", "निलंबित")}`} />
        <Kpi label={L("Total survey target", "कुल सर्वे लक्ष्य")} value={n(target)} sub={`${n(Math.max(0, target - accepted))} ${L("remaining", "शेष")}`} />
        <Kpi label={L("Accepted responses", "स्वीकृत उत्तर")} value={n(range === "all" ? accepted : inRange)} sub={range === "all" ? L("campaign to date", "अभियान अब तक") : `${L("in period", "अवधि में")} · ${n(accepted)} ${L("total", "कुल")}`} />
        <Kpi label={L("Completion", "पूर्णता")} value={`${pct(accepted, target).toFixed(1)}%`} sub={<span className="mt-1 block h-1.5 rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${pct(accepted, target)}%` }} /></span>} />
        <Kpi label={L("Pending sync", "सिंक लंबित")} value={n(sum((m) => m.syncPending))} sub={L("records on volunteer phones", "स्वयंसेवक फ़ोन पर रिकॉर्ड")} tone="warning" />
        <Kpi label={L("Flagged records", "फ़्लैग रिकॉर्ड")} value={n(sum((m) => m.flagged))} sub={<Link to="/administration/data-quality" className="text-primary hover:underline">{L("Open review queue", "समीक्षा कतार खोलें")}</Link>} tone="destructive" />
        <Kpi label={L("Approaching expiry", "जल्द समाप्त")} value={count("Expiring Soon")} sub={L("within 7 days", "7 दिनों में")} tone={count("Expiring Soon") ? "warning" : undefined} />
        <Kpi label={L("Rejected", "अस्वीकृत")} value={n(sum((m) => m.rejected))} sub={L("failed validation rules", "सत्यापन नियम विफल")} />
        <Kpi label={L("Volunteers in field", "फ़ील्ड में स्वयंसेवक")} value={n(sum((m) => m.volunteers.filter((v) => v.active).length))} sub={`${n(sum((m) => m.volunteers.length))} ${L("assigned", "निर्धारित")}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title={L("Survey volume", "सर्वे संख्या")} sub={L("Accepted and flagged submissions", "स्वीकृत और फ़्लैग किए गए सर्वे")} action={<Seg value={vol} onChange={setVol} options={[["daily", L("Daily", "दैनिक")], ["weekly", L("Weekly", "साप्ताहिक")]]} />}>
          <ClientOnly><ResponsiveContainer height={260}><BarChart data={volume}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="label" {...axis} interval="preserveStartEnd" /><YAxis {...axis} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="Accepted" name={L("Accepted", "स्वीकृत")} stackId="a" fill={series[0]} maxBarSize={28} /><Bar dataKey="Flagged" name={L("Flagged", "फ़्लैग")} stackId="a" fill={series[2]} radius={[3, 3, 0, 0]} maxBarSize={28} /></BarChart></ResponsiveContainer></ClientOnly>
        </ChartCard>
        <ChartCard title={L("Recent activity", "हाल की गतिविधि")}>
          <ol className="space-y-3">
            {feed.map((f, i) => { const Icon = f.icon; return <li key={i} className="flex gap-2.5 text-sm"><Icon className={cn("mt-0.5 size-4 shrink-0", f.tone)} /><span className="min-w-0 flex-1">{f.text}</span><span className="shrink-0 text-xs text-muted-foreground">{f.t}</span></li>; })}
            {!feed.length && <li className="text-sm text-muted-foreground">{L("No activity for these filters.", "इन फ़िल्टर पर कोई गतिविधि नहीं।")}</li>}
          </ol>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={L("Progress by client", "क्लाइंट-वार प्रगति")} sub={L("% of survey target accepted", "सर्वे लक्ष्य का स्वीकृत %")}>
          <ClientOnly><ResponsiveContainer height={Math.max(160, byClient.length * 22 + 30)}><BarChart data={byClient} layout="vertical" margin={{ left: 8, right: 16 }}><CartesianGrid stroke="var(--border)" horizontal={false} /><XAxis type="number" domain={[0, 100]} unit="%" {...axis} /><YAxis type="category" dataKey="name" width={118} {...axis} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} formatter={(v) => [`${v}%`, L("Completion", "पूर्णता")]} />
            <Bar dataKey="pct" fill={series[0]} radius={[0, 3, 3, 0]} barSize={10} /></BarChart></ResponsiveContainer></ClientOnly>
        </ChartCard>
        <div className="grid gap-4">
          <ChartCard title={L("Progress by area", "क्षेत्र-वार प्रगति")} sub={L("District totals", "ज़िला योग")}>
            <ul className="space-y-2.5">
              {byArea.map((a) => (
                <li key={a.name} className="text-sm"><div className="flex justify-between"><span>{a.name}</span><span className="tabular-nums text-muted-foreground">{n(a.accepted)} / {n(a.target)} · <b className="text-foreground">{a.pct}%</b></span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, a.pct)}%` }} /></div></li>
              ))}
            </ul>
          </ChartCard>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {([[L("Most frequently reported issues", "सबसे अधिक बताए गए मुद्दे"), topFreq, (s: (typeof stats)[0]) => `${n(s.freq)} · ${s.prevalence.toFixed(0)}%`, (s: (typeof stats)[0]) => s.freq],
          [L("Highest average priority", "सर्वोच्च औसत प्राथमिकता"), topPri, (s: (typeof stats)[0]) => `${s.avg.toFixed(1)} / 10 · ${n(s.high)} ${L("high", "उच्च")}`, (s: (typeof stats)[0]) => s.avg * 10]] as const).map(([title, rows, label, val]) => (
          <ChartCard key={title} title={title} sub={L("Priority ≥ 7 counts as high · see Issue Analytics for method", "प्राथमिकता ≥ 7 उच्च · विधि हेतु मुद्दा विश्लेषण देखें")} action={<Link to="/candidate-workspace/issue-analytics" className="text-xs font-medium text-primary hover:underline">{L("Details", "विवरण")}</Link>}>
            <ol className="space-y-2.5">
              {rows.map((s, i) => { const max = Math.max(...rows.map(val)); return (
                <li key={s.issue} className="text-sm"><div className="flex justify-between gap-2"><span><span className="mr-2 text-xs tabular-nums text-muted-foreground">{i + 1}</span>{s.issue}</span><span className="tabular-nums text-muted-foreground">{label(s)}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(val(s) / max) * 100}%`, background: series[i === 0 ? 0 : 3] }} /></div></li>
              ); })}
            </ol>
          </ChartCard>
        ))}
      </div>
      {count("Expired") > 0 && <div className="flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="size-3.5" />{count("Expired")} {L("expired campaign(s) still count towards totals; their forms are closed.", "समाप्त अभियान योग में गिने गए हैं; उनके फ़ॉर्म बंद हैं।")}</div>}
      <Disclaimer />
    </div>
  );
}

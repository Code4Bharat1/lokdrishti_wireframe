// Issue Analytics: the five SOW measures per issue, with drill-down issue → area → records.
import { useMemo, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, LabelList } from "recharts";
import { ArrowDown, ArrowUp, ChevronRight, Info } from "lucide-react";
import { Header } from "@/components/campaign-management";
import { CandidatePicker, ChartCard, Disclaimer, axis, n, pct, periodLabel, selectCls, series, tip, useScopedModels, weekly } from "@/components/dashboard-kit";
import { usePreview } from "@/lib/preview";
import { seeded } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { issueStats, histogram, histMean, fmtDate, reportPeriod, type IssueStat } from "@/data/demo";

type Key = "freq" | "avg" | "high" | "spread" | "prevalence";

export function IssueAnalytics() {
  const { L } = usePreview();
  const [cand, setCand] = useState("All");
  const [threshold, setThreshold] = useState(7);
  const [sort, setSort] = useState<{ k: Key; dir: 1 | -1 }>({ k: "freq", dir: -1 });
  const [issue, setIssue] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const { ms } = useScopedModels(cand);
  const stats = useMemo(() => issueStats(ms, threshold), [ms, threshold]);
  const rows = [...stats].sort((a, b) => (a[sort.k] - b[sort.k]) * sort.dir);
  const respondents = ms.reduce((s, m) => s + m.areas.reduce((t, a) => t + a.responses, 0), 0);

  // Weekly mentions: each campaign's issue count spread over its weeks in proportion to accepted volume.
  const trendIssues = issue ? [issue] : [...stats].sort((a, b) => b.freq - a.freq).slice(0, 3).map((s) => s.issue);
  const trend = useMemo(() => {
    const per = ms.map((m) => ({ m, s: Object.fromEntries(issueStats([m], threshold).map((x) => [x.issue, x.freq])) }));
    const days = [...new Set(ms.flatMap((m) => m.days))].sort().map((date) => ({ date, ...Object.fromEntries(trendIssues.map((t) => [t, per.reduce((sum, { m, s }) => sum + (m.c.accepted ? ((m.daily.find((d) => d.date === date)?.accepted ?? 0) * s[t]!) / m.c.accepted : 0), 0)])) }));
    return weekly(days as ({ date: string } & Record<string, number>)[], trendIssues).map((w) => ({ ...w, ...Object.fromEntries(trendIssues.map((t) => [t, Math.round(w[t] as number)])) }));
  }, [ms, threshold, trendIssues.join()]);

  const head = (k: Key, label: string) => (
    <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => ({ k, dir: s.k === k && s.dir === -1 ? 1 : -1 }))}>{label}{sort.k === k && (sort.dir === -1 ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}</button>
    </th>
  );

  return (
    <div className="space-y-5">
      <Header section="Candidate Workspace" title="Issue Analytics" desc={`${L("Reporting period", "रिपोर्टिंग अवधि")}: ${periodLabel(reportPeriod.from)} · ${n(respondents)} ${L("respondents", "उत्तरदाता")}`}>
        <CandidatePicker value={cand} onChange={(v) => { setCand(v); setIssue(null); setArea(null); }} allowAll />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">{L("High priority ≥", "उच्च प्राथमिकता ≥")}<select value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className={selectCls}>{[6, 7, 8, 9].map((v) => <option key={v}>{v}</option>)}</select></label>
      </Header>
      <Disclaimer />

      <details className="panel group p-4 text-sm" open>
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold"><Info className="size-4 text-primary" />{L("How this is calculated", "यह कैसे गणना होता है")}<ChevronRight className="ml-auto size-4 transition-transform group-open:rotate-90" /></summary>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {([
            [L("Frequency", "आवृत्ति"), L("Number of respondents who reported the issue.", "मुद्दा बताने वाले उत्तरदाताओं की संख्या।")],
            [L("Average priority", "औसत प्राथमिकता"), L("Mean of the 1–10 urgency ratings given to the issue.", "मुद्दे को दी गई 1–10 तात्कालिकता रेटिंग का औसत।")],
            [L("High-priority mentions", "उच्च प्राथमिकता उल्लेख"), `${L("Ratings of", "रेटिंग")} ${threshold} ${L("or more (threshold is configurable).", "या अधिक (सीमा बदली जा सकती है)।")}`],
            [L("Geographical spread", "भौगोलिक फैलाव"), L("Number of surveyed Gram Panchayats / wards where it was reported.", "सर्वे किए गए ग्राम पंचायत / वार्ड जहाँ यह बताया गया।")],
            [L("Coverage-adjusted prevalence", "कवरेज-समायोजित व्यापकता"), L("Frequency ÷ respondents surveyed in the same areas.", "आवृत्ति ÷ उन्हीं क्षेत्रों में सर्वे किए गए उत्तरदाता।")],
          ] as const).map(([k, v]) => <div key={k} className="rounded-md bg-muted/50 p-3"><dt className="font-medium">{k}</dt><dd className="mt-0.5 text-xs text-muted-foreground">{v}</dd></div>)}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">{L("Only accepted surveys are counted. Ratings measure urgency only, so averages are comparable across issues.", "केवल स्वीकृत सर्वे गिने जाते हैं। रेटिंग केवल तात्कालिकता मापती है, इसलिए औसत तुलनीय हैं।")}</p>
      </details>

      <section className="panel">
        <div className="border-b px-5 py-3"><h2 className="text-sm font-semibold">{L("All issues", "सभी मुद्दे")}</h2><p className="text-xs text-muted-foreground">{L("Click an issue to drill down to areas and records", "क्षेत्र और रिकॉर्ड देखने के लिए मुद्दे पर क्लिक करें")}</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="px-3 py-2 font-medium">{L("Issue", "मुद्दा")}</th>{head("freq", L("Frequency", "आवृत्ति"))}{head("avg", L("Avg priority", "औसत प्राथमिकता"))}{head("high", `${L("High-priority", "उच्च प्राथमिकता")} (≥${threshold})`)}{head("spread", L("Spread", "फैलाव"))}{head("prevalence", L("Prevalence", "व्यापकता"))}</tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.issue} onClick={() => { setIssue(s.issue); setArea(null); }} className={cn("cursor-pointer border-b last:border-0 hover:bg-muted/50", issue === s.issue && "bg-accent/60")}>
                  <td className="px-3 py-2.5 font-medium">{s.issue}</td>
                  <td className="px-3 text-right tabular-nums">{n(s.freq)}</td>
                  <td className="px-3 text-right tabular-nums">{s.freq ? s.avg.toFixed(1) : "—"}</td>
                  <td className="px-3 text-right tabular-nums">{n(s.high)} <span className="text-xs text-muted-foreground">({s.freq ? Math.round(pct(s.high, s.freq)) : 0}%)</span></td>
                  <td className="px-3 text-right tabular-nums">{s.spread} / {s.locations}</td>
                  <td className="px-3"><div className="ml-auto flex w-32 items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, s.prevalence)}%` }} /></div><span className="w-9 text-right text-xs tabular-nums">{s.prevalence.toFixed(0)}%</span></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={L("Commonly reported vs most urgent", "आम तौर पर बताए गए बनाम सबसे ज़रूरी")} sub={L("Right = reported more often · Up = rated more urgent", "दाएँ = अधिक बार बताया · ऊपर = अधिक ज़रूरी")}>
          <ClientOnly><ResponsiveContainer height={300}><ScatterChart margin={{ top: 10, right: 30, bottom: 10 }}><CartesianGrid stroke="var(--border)" /><XAxis type="number" dataKey="freq" name={L("Frequency", "आवृत्ति")} {...axis} /><YAxis type="number" dataKey="avg" name={L("Avg priority", "औसत प्राथमिकता")} domain={[1, 10]} {...axis} /><ZAxis range={[80, 80]} /><Tooltip {...tip} cursor={{ strokeDasharray: "3 3" }} formatter={(v: number) => (Number.isInteger(v) ? n(v) : v.toFixed(1))} />
            <Scatter data={stats.filter((s) => s.freq)} fill={series[0]}><LabelList dataKey="issue" position="right" fontSize={10} fill="var(--muted-foreground)" /></Scatter></ScatterChart></ResponsiveContainer></ClientOnly>
        </ChartCard>
        <ChartCard title={L("Mentions over time", "समय के साथ उल्लेख")} sub={issue ? issue : L("Top 3 issues · weekly", "शीर्ष 3 मुद्दे · साप्ताहिक")}>
          <ClientOnly><ResponsiveContainer height={300}><LineChart data={trend}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} /><Tooltip {...tip} />
            {trendIssues.map((t, i) => <Line key={t} dataKey={t} stroke={series[i]} strokeWidth={2} dot={false} />)}</LineChart></ResponsiveContainer></ClientOnly>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">{trendIssues.map((t, i) => <span key={t} className="flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: series[i] }} />{t}</span>)}</div>
        </ChartCard>
      </div>

      {issue && <Drill issue={issue} area={area} setArea={setArea} onClose={() => setIssue(null)} threshold={threshold} stat={stats.find((s) => s.issue === issue)!} cand={cand} />}
    </div>
  );
}

function Drill({ issue, area, setArea, onClose, threshold, stat, cand }: { issue: string; area: string | null; setArea: (a: string | null) => void; onClose: () => void; threshold: number; stat: IssueStat; cand: string }) {
  const { L } = usePreview();
  const { ms } = useScopedModels(cand);
  const areas = ms.flatMap((m) => m.areas.map((a) => ({ m, a, x: a.issues[issue]! }))).filter((r) => r.x.count).sort((p, q) => pct(q.x.count, q.a.responses) - pct(p.x.count, p.a.responses));
  const picked = areas.find((r) => `${r.m.c.id}|${r.a.gp}` === area);
  const records = useMemo(() => {
    if (!picked) return [];
    const r = seeded(`${area}${issue}`), h = histogram(picked.x.count, picked.x.centre);
    const vols = picked.m.volunteers.filter((v) => v.areas.includes(picked.a.gp));
    return Array.from({ length: Math.min(12, picked.x.count) }, (_, i) => {
      let k = Math.floor(r() * picked.x.count), score = 1;
      for (; score <= 10 && k >= h[score - 1]!; score++) k -= h[score - 1]!;
      return { id: `SRV-${30000 + Math.floor(r() * 9000)}`, village: picked.a.villages[i % 3]!, volunteer: vols[i % Math.max(1, vols.length)]?.name ?? "—", date: picked.m.days[Math.floor(r() * picked.m.days.length)]!, score: Math.min(10, score) };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [area, issue]);
  return (
    <section className="panel">
      <div className="flex flex-wrap items-center gap-1.5 border-b px-5 py-3 text-sm">
        <button className="text-primary hover:underline" onClick={onClose}>{L("All issues", "सभी मुद्दे")}</button><ChevronRight className="size-3.5 text-muted-foreground" />
        <button className={cn(area ? "text-primary hover:underline" : "font-semibold")} onClick={() => setArea(null)}>{issue}</button>
        {picked && <><ChevronRight className="size-3.5 text-muted-foreground" /><span className="font-semibold">{picked.a.gp}</span></>}
        <span className="ml-auto text-xs text-muted-foreground">{n(stat.freq)} {L("respondents", "उत्तरदाता")} · {L("avg", "औसत")} {stat.avg.toFixed(1)}</span>
      </div>
      {!picked ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">{[L("Gram Panchayat / Ward", "ग्राम पंचायत / वार्ड"), L("Candidate", "उम्मीदवार"), L("Respondents", "उत्तरदाता"), L("Reporting", "बताने वाले"), L("Prevalence", "व्यापकता"), L("Avg priority", "औसत प्राथमिकता"), `≥${threshold}`].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>{areas.map(({ m, a, x }) => { const h = histogram(x.count, x.centre); return (
              <tr key={`${m.c.id}|${a.gp}`} onClick={() => setArea(`${m.c.id}|${a.gp}`)} className="cursor-pointer border-b last:border-0 hover:bg-muted/50">
                <td className="px-3 py-2.5 font-medium">{a.gp} <span className="text-xs font-normal text-muted-foreground">· {a.block}, {m.client.district}</span></td><td className="px-3 text-muted-foreground">{m.c.candidate}</td>
                <td className="px-3 tabular-nums">{n(a.responses)}</td><td className="px-3 tabular-nums">{n(x.count)}</td><td className="px-3 tabular-nums font-medium">{pct(x.count, a.responses).toFixed(0)}%</td>
                <td className="px-3 tabular-nums">{histMean(h).toFixed(1)}</td><td className="px-3 tabular-nums">{n(h.slice(threshold - 1).reduce((s, v) => s + v, 0))}</td>
              </tr>
            ); })}</tbody>
          </table>
        </div>
      ) : (
        <div className="p-4">
          <p className="mb-3 text-xs text-muted-foreground">{L("Showing", "दिखाए गए")} {records.length} {L("of", "में से")} {n(picked.x.count)} {L("records. Respondent names and mobiles are hidden; open Survey Responses with permission to see them.", "रिकॉर्ड। उत्तरदाता के नाम और मोबाइल छिपे हैं; अनुमति के साथ सर्वे उत्तर में देखें।")}</p>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">{[L("Survey ID", "सर्वे आईडी"), L("Village", "गाँव"), L("Volunteer", "स्वयंसेवक"), L("Collected", "संग्रहित"), L("Priority", "प्राथमिकता"), L("Status", "स्थिति")].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>{records.map((r, i) => (
              <tr key={i} className="border-b last:border-0"><td className="px-3 py-2 font-mono text-xs">{r.id}</td><td className="px-3">{r.village}</td><td className="px-3 text-muted-foreground">{r.volunteer}</td><td className="px-3 text-muted-foreground">{fmtDate(r.date)}</td>
                <td className="px-3"><span className={cn("rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums", r.score >= threshold ? "bg-destructive/10 text-destructive" : "bg-muted")}>{r.score}</span></td><td className="px-3"><span className="rounded bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">Accepted</span></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

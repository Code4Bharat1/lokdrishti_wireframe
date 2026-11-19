// Report catalogue: 17 standard reports, one filter bar, Generate / Export CSV / Export PDF.
// Every report is built from the same campaign models as the dashboards, so numbers match.
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BarChart3, ClipboardCheck, Download, FileText, Layers, Lock, MapPinned, Play, Printer, Users } from "lucide-react";
import { Header } from "@/components/campaign-management";
import { Disclaimer, n, pct, selectCls } from "@/components/dashboard-kit";
import { btn, btnPrimary, inputCls } from "@/components/module-views";
import { usePreview, isCandidateRole, scopedCandidate, canManage } from "@/lib/preview";
import { downloadCsv } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import { seeded } from "@/lib/modules";
import {
  models, upPackages, issueStats, boundaryFlags, dqRecords, deriveStatus, daysLeft, fmtDate, issueNames, reportPeriod, iso, TODAY, consentStatement, type CampaignModel,
} from "@/data/demo";

type Row = Record<string, string | number>;
type F = { client: string; candidate: string; campaign: string; package: string; from: string; to: string; district: string; constituency: string; block: string; gp: string; volunteer: string; issue: string; pmin: number; pmax: number; status: string; sync: string };
type Report = { id: number; name: string; group: string; desc: string; restricted?: boolean; build: (ms: CampaignModel[], f: F) => Row[] };

const st = (m: CampaignModel) => deriveStatus({ ...m.c, expiry: m.c.end });
const areaRows = (ms: CampaignModel[]) => ms.flatMap((m) => m.areas.map((a) => ({ m, a })));
const vols = (ms: CampaignModel[]) => ms.flatMap((m) => m.volunteers.map((v) => ({ m, v })));

export const reports: Report[] = [
  { id: 1, group: "Summary", name: "Executive survey summary", desc: "Headline totals across the selection.", build: (ms) => {
    const s = (f: (m: CampaignModel) => number) => ms.reduce((t, m) => t + f(m), 0), target = s((m) => m.c.target), acc = s((m) => m.c.accepted);
    return [["Campaigns", ms.length], ["Survey target", n(target)], ["Accepted", n(acc)], ["Completion", `${pct(acc, target).toFixed(1)}%`], ["Pending review (flagged)", n(s((m) => m.flagged))], ["Rejected", n(s((m) => m.rejected))], ["Sync pending", n(s((m) => m.syncPending))], ["Volunteers", n(s((m) => m.volunteers.length))], ["Top issue", [...issueStats(ms, 7)].sort((a, b) => b.freq - a.freq)[0]?.issue ?? "—"]].map(([metric, value]) => ({ metric: metric!, value: value! }));
  } },
  { id: 2, group: "Summary", name: "Client-wise survey progress", desc: "Target, accepted and completion per client account.", build: (ms) => ms.map((m) => ({ client: m.client.account, candidate: m.c.candidate, target: m.c.target, accepted: m.c.accepted, completion: `${pct(m.c.accepted, m.c.target).toFixed(1)}%`, campaign_status: st(m) })) },
  { id: 3, group: "Summary", name: "Candidate-wise survey summary", desc: "Per candidate: level, area, results and top issue.", build: (ms) => ms.map((m) => ({ candidate: m.c.candidate, party: m.client.party, level: m.client.level, district: m.client.district, constituency: m.client.ac, accepted: m.c.accepted, flagged: m.flagged, rejected: m.rejected, top_issue: [...issueStats([m], 7)].sort((a, b) => b.freq - a.freq)[0]!.issue })) },
  { id: 4, group: "Packages", name: "Package target & utilisation", desc: "Targets against accepted surveys per package.", build: (ms) => upPackages.filter((p) => !p.assignedTo || ms.some((m) => m.c.packageId === p.id)).map((p) => ({ package: p.id, name: p.name, candidate: p.assignedTo ?? "Unassigned", target: p.target, accepted: p.accepted, utilisation: `${pct(p.accepted, p.target).toFixed(0)}%`, price: p.price ? `₹${n(p.price)}` : "Zero-cost", package_status: deriveStatus(p) })) },
  { id: 5, group: "Packages", name: "Package expiry & extension", desc: "Original and revised deadlines, approvals.", build: (ms) => upPackages.filter((p) => ms.some((m) => m.c.packageId === p.id)).map((p) => ({ package: p.id, candidate: p.assignedTo ?? "", activation: fmtDate(p.activation), original_deadline: fmtDate(p.extensions[0]?.from ?? p.expiry), current_expiry: fmtDate(p.expiry), extensions: p.extensions.length, approved_by: p.extensions.at(-1)?.by ?? "—", days_left: daysLeft(p.expiry) < 0 ? "Expired" : daysLeft(p.expiry) })) },
  { id: 6, group: "Coverage", name: "Area-wise survey count", desc: "Accepted surveys by district, constituency and block.", build: (ms) => Object.values(areaRows(ms).reduce<Record<string, Row>>((acc, { m, a }) => { const k = `${m.client.district}|${m.client.ac}|${a.block}`; acc[k] ??= { district: m.client.district, constituency: m.client.ac, block: a.block, gps: 0, surveys: 0 }; acc[k]!["gps"] = (acc[k]!["gps"] as number) + 1; acc[k]!["surveys"] = (acc[k]!["surveys"] as number) + a.responses; return acc; }, {})) },
  { id: 7, group: "Coverage", name: "Village / ward-wise survey coverage", desc: "Each village against its share of the plan.", build: (ms) => areaRows(ms).flatMap(({ m, a }) => a.villages.map((v, i) => ({ district: m.client.district, block: a.block, gp: a.gp, village: v, candidate: m.c.candidate, surveys: a.byVillage[i]!, planned: Math.round(a.planned / 3), coverage: `${pct(a.byVillage[i]!, a.planned / 3).toFixed(0)}%` }))) },
  { id: 8, group: "Issues", name: "Issue frequency", desc: "Respondents reporting each issue, and prevalence.", build: (ms) => issueStats(ms, 7).sort((a, b) => b.freq - a.freq).map((s) => ({ issue: s.issue, frequency: s.freq, prevalence: `${s.prevalence.toFixed(1)}%`, spread: `${s.spread}/${s.locations}`, avg_priority: Number(s.avg.toFixed(1)) })) },
  { id: 9, group: "Issues", name: "Issue priority ranking", desc: "Issues ranked by average urgency rating.", build: (ms) => issueStats(ms, 7).filter((s) => s.freq).sort((a, b) => b.avg - a.avg).map((s, i) => ({ rank: i + 1, issue: s.issue, avg_priority: Number(s.avg.toFixed(1)), high_priority_7plus: s.high, frequency: s.freq })) },
  { id: 10, group: "Issues", name: "Location-wise issue comparison", desc: "Prevalence of the main issues in each area.", build: (ms) => areaRows(ms).map(({ m, a }) => ({ gp: a.gp, district: m.client.district, candidate: m.c.candidate, respondents: a.responses, ...Object.fromEntries(issueNames.slice(0, 5).map((i) => [i, `${pct(a.issues[i]!.count, a.responses).toFixed(0)}%`])) })) },
  { id: 11, group: "Field", name: "Volunteer productivity", desc: "Targets, completions, quality and sync per volunteer.", build: (ms) => vols(ms).map(({ m, v }) => ({ volunteer: v.name, id: v.id, candidate: m.c.candidate, district: m.client.district, target: v.target, accepted: v.accepted, flagged: v.flagged, rejected: v.rejected, sync: v.pending ? "Pending" : "Synced", pending: v.pending, avg_minutes: v.avgMin })) },
  { id: 12, group: "Field", name: "Daily & weekly survey activity", desc: "Accepted and flagged submissions per day.", build: (ms) => [...new Set(ms.flatMap((m) => m.days))].sort().map((date) => ({ date, accepted: ms.reduce((s, m) => s + (m.daily.find((d) => d.date === date)?.accepted ?? 0), 0), flagged: ms.reduce((s, m) => s + (m.daily.find((d) => d.date === date)?.flagged ?? 0), 0) })) },
  { id: 13, group: "Field", name: "Offline sync & failed upload", desc: "Records still on phones and failed attempts.", build: (ms) => vols(ms).filter(({ v }) => v.pending).map(({ m, v }) => { const r = seeded(v.id); return { volunteer: v.name, candidate: m.c.candidate, district: m.client.district, pending: v.pending, failed_attempts: Math.floor(r() * 4), last_sync: `${fmtDate(m.days.at(-1) ?? m.c.start)} ${String(8 + Math.floor(r() * 10)).padStart(2, "0")}:${String(Math.floor(r() * 60)).padStart(2, "0")}`, sync: r() < 0.3 ? "Failed" : "Pending" }; }) },
  { id: 14, group: "Quality", name: "Out-of-boundary surveys", desc: "GPS point outside the assigned area.", build: (ms) => boundaryFlags.filter((f) => ms.some((m) => m.c.candidate === f.candidate)).map((f) => ({ survey: f.id, candidate: f.candidate, district: f.district, volunteer: f.volunteer, distance_outside: f.distance, status: "Flagged for review" })) },
  { id: 15, group: "Quality", name: "Consent & eligibility compliance", desc: "Consent captured, declined and under-18 blocks.", build: (ms) => ms.map((m) => { const r = seeded(`consent-${m.c.id}`), done = m.c.accepted + m.flagged + m.rejected, declined = Math.round(done * (0.01 + r() * 0.03)), minors = Math.round(done * (0.004 + r() * 0.01)); return { candidate: m.c.candidate, approached: done + declined + minors, consent_declined: declined, under_18_blocked: minors, completed: done, consent_version: `v${consentStatement.version}`, consent_recorded: "100%" }; }) },
  { id: 16, group: "Detail", name: "Survey response detail", desc: "Respondent-level records with personal data.", restricted: true, build: (ms) => ms.flatMap((m) => { const r = seeded(`detail-${m.c.id}`); return Array.from({ length: 8 }, (_, i) => { const a = m.areas[i % m.areas.length]!, day = m.days[Math.floor(r() * m.days.length)] ?? m.c.start, mins = 540 + Math.floor(r() * 480); const fn = ["Kamla", "Ramesh", "Sunita", "Mohd.", "Geeta", "Raju", "Shabana", "Ramkali"][i]!, ln = ["Devi", "Yadav", "Verma", "Ishaq", "Pal", "Prajapati", "Bano", "Kushwaha"][(i + 3) % 8]!; return { survey: `SRV-${31000 + Math.floor(r() * 9000)}`, respondent: `${fn} ${ln}`, mobile: r() < 0.4 ? "—" : `98•••••${Math.floor(100 + r() * 899)}`, age: 18 + Math.floor(r() * 60), gp: a.gp, village: a.villages[i % 3]!, candidate: m.c.candidate, volunteer: m.volunteers[i % m.volunteers.length]!.name, surveyed_at: `${day} ${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`, synced_at: `${day} ${Math.floor(mins / 60) + 1}:${String(mins % 60).padStart(2, "0")}`, consent: `v${consentStatement.version}`, status: r() < 0.9 ? "Accepted" : "Flagged for review", sync: "Synced", priority: 1 + Math.floor(r() * 10) }; }); }) },
  { id: 17, group: "Quality", name: "Duplicate-flagged & exception", desc: "Everything in the review queue, by exception type.", build: (ms) => dqRecords.filter((d) => ms.some((m) => m.c.candidate === d.candidate)).map((d) => ({ survey: d.id, exception: d.kind, candidate: d.candidate, district: d.district, gp: d.gp, volunteer: d.volunteer, surveyed_at: d.surveyAt, synced_at: d.syncAt, detail: d.detail, status: d.status })) },
];
const groupIcon: Record<string, typeof FileText> = { Summary: FileText, Packages: Layers, Coverage: MapPinned, Issues: BarChart3, Field: Users, Quality: ClipboardCheck, Detail: Lock };

export const blank = (): F => ({ client: "All", candidate: "All", campaign: "All", package: "All", from: reportPeriod.from, to: iso(TODAY), district: "All", constituency: "All", block: "All", gp: "All", volunteer: "All", issue: "All", pmin: 1, pmax: 10, status: "All", sync: "All" });

// Row-level filters apply wherever the report has the matching column.
function applyRowFilters(rows: Row[], f: F): Row[] {
  const eq: [string, string][] = [["district", f.district], ["constituency", f.constituency], ["block", f.block], ["gp", f.gp], ["volunteer", f.volunteer], ["issue", f.issue], ["status", f.status], ["sync", f.sync]];
  return rows.filter((r) => eq.every(([k, v]) => v === "All" || !(k in r) || r[k] === v)
    && (!("date" in r) || (String(r["date"]) >= f.from && String(r["date"]) <= f.to))
    && (!("surveyed_at" in r) || (String(r["surveyed_at"]).slice(0, 10) >= f.from && String(r["surveyed_at"]).slice(0, 10) <= f.to))
    && (!("avg_priority" in r) || (Number(r["avg_priority"]) >= f.pmin && Number(r["avg_priority"]) <= f.pmax))
    && (!("priority" in r) || (Number(r["priority"]) >= f.pmin && Number(r["priority"]) <= f.pmax)));
}

function printTable(title: string, rows: Row[]) {
  const cols = Object.keys(rows[0] ?? {}), esc = (s: unknown) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  const w = window.open("", "_blank");
  if (!w) { toast.error("Allow pop-ups to export PDF"); return; }
  w.document.write(`<!doctype html><title>${esc(title)}</title><style>body{font:12px system-ui;margin:24px}h1{font-size:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:4px 6px;text-align:left}th{background:#f3f4f6}p{color:#666}</style><h1>${esc(title)}</h1><p>Lokdrishti · generated ${fmtDate(iso(TODAY))} · illustrative demo data · observed survey findings, not statistically representative.</p><table><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>${rows.map((r) => `<tr>${cols.map((c) => `<td>${esc(r[c])}</td>`).join("")}</tr>`).join("")}</table>`);
  w.document.close(); w.focus(); w.print();
}

export function ReportCatalogue() {
  const { L, role } = usePreview();
  const locked = isCandidateRole(role);
  const piiAllowed = canManage(role); // respondent-level detail: Lokdrishti admins only
  const [sel, setSel] = useState(1);
  const [f, setF] = useState<F>(() => ({ ...blank(), ...(locked ? { candidate: scopedCandidate } : {}) }));
  const [more, setMore] = useState(false);
  const [out, setOut] = useState<{ id: number; rows: Row[]; at: string } | null>(null);
  const set = (p: Partial<F>) => setF((x) => ({ ...x, ...p }));
  const report = reports.find((r) => r.id === sel)!;

  const ms = useMemo(() => models.filter((m) => (f.client === "All" || m.client.account === f.client) && (f.candidate === "All" || m.c.candidate === f.candidate) && (f.campaign === "All" || m.c.id === f.campaign) && (f.package === "All" || m.c.packageId === f.package) && (f.district === "All" || m.client.district === f.district) && (f.constituency === "All" || m.client.ac === f.constituency)), [f]);
  const opts = {
    client: [...new Set(models.map((m) => m.client.account))], candidate: models.map((m) => m.c.candidate), campaign: models.filter((m) => f.candidate === "All" || m.c.candidate === f.candidate).map((m) => [m.c.id, m.c.name] as const),
    package: models.map((m) => m.c.packageId), district: [...new Set(models.map((m) => m.client.district))], constituency: [...new Set(models.filter((m) => f.district === "All" || m.client.district === f.district).map((m) => m.client.ac))],
    block: [...new Set(ms.flatMap((m) => m.areas.map((a) => a.block)))], gp: [...new Set(ms.flatMap((m) => m.areas.filter((a) => f.block === "All" || a.block === f.block).map((a) => a.gp)))],
    volunteer: [...new Set(ms.flatMap((m) => m.volunteers.map((v) => v.name)))].sort(), issue: issueNames,
  };
  const blocked = report.restricted && !piiAllowed;
  const generate = () => { if (blocked) return; const rows = applyRowFilters(report.build(ms, f), f); setOut({ id: sel, rows, at: new Date().toTimeString().slice(0, 5) }); toast.success(`${report.name}: ${rows.length} ${L("rows", "पंक्तियाँ")}`); };
  const current = out?.id === sel ? out : null;
  const sel1 = (k: keyof F, label: string, options: readonly (string | readonly [string, string])[], disabled = false) => (
    <label className="grid gap-1 text-xs"><span className="font-medium text-muted-foreground">{label}</span>
      <select value={String(f[k])} disabled={disabled} onChange={(e) => set({ [k]: e.target.value, ...(k === "district" ? { constituency: "All", block: "All", gp: "All" } : k === "block" ? { gp: "All" } : k === "candidate" ? { campaign: "All" } : {}) } as Partial<F>)} className={cn(selectCls, "w-full disabled:opacity-60")}>
        <option value="All">{L("All", "सभी")}</option>{options.map((o) => (typeof o === "string" ? <option key={o}>{o}</option> : <option key={o[0]} value={o[0]}>{o[1]}</option>))}
      </select></label>
  );

  return (
    <div className="space-y-5">
      <Header section="Reports" title="Report Catalogue" desc={L("17 standard reports. Aggregate reports are preferred; respondent-level detail is restricted.", "17 मानक रिपोर्ट। समेकित रिपोर्ट को प्राथमिकता; उत्तरदाता-स्तर विवरण प्रतिबंधित।")} />
      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <nav className="panel h-fit p-2">
          {[...new Set(reports.map((r) => r.group))].map((g) => (
            <div key={g} className="mb-1">
              <div className="eyebrow px-2 pb-1 pt-2">{g}</div>
              {reports.filter((r) => r.group === g).map((r) => { const Icon = r.restricted ? Lock : groupIcon[g]!; return (
                <button key={r.id} onClick={() => setSel(r.id)} className={cn("flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-muted", sel === r.id && "bg-accent text-accent-foreground")}>
                  <span className="mt-0.5 w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{r.id}</span>
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 font-medium">{r.name}{r.restricted && <Icon className="size-3.5 text-warning" aria-label="Restricted" />}</span><span className="block text-xs text-muted-foreground">{r.desc}</span></span>
                </button>
              ); })}
            </div>
          ))}
        </nav>

        <div className="min-w-0 space-y-4">
          <section className="panel p-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {sel1("client", L("Client", "क्लाइंट"), opts.client, locked)}
              {sel1("candidate", L("Candidate", "उम्मीदवार"), opts.candidate, locked)}
              {sel1("campaign", L("Campaign", "अभियान"), opts.campaign)}
              {sel1("package", L("Package", "पैकेज"), opts.package)}
              <label className="grid gap-1 text-xs"><span className="font-medium text-muted-foreground">{L("From", "से")}</span><input type="date" value={f.from} min={reportPeriod.from} max={f.to} onChange={(e) => set({ from: e.target.value })} className={inputCls} /></label>
              <label className="grid gap-1 text-xs"><span className="font-medium text-muted-foreground">{L("To", "तक")}</span><input type="date" value={f.to} min={f.from} onChange={(e) => set({ to: e.target.value })} className={inputCls} /></label>
              {sel1("district", L("District", "ज़िला"), opts.district)}
              {sel1("constituency", L("Constituency", "निर्वाचन क्षेत्र"), opts.constituency)}
              {more && <>
                {sel1("block", L("Block / Tehsil", "ब्लॉक / तहसील"), opts.block)}
                {sel1("gp", L("GP / Ward / Village", "ग्राम पंचायत / वार्ड / गाँव"), opts.gp)}
                {sel1("volunteer", L("Volunteer", "स्वयंसेवक"), opts.volunteer)}
                {sel1("issue", L("Issue category", "मुद्दा श्रेणी"), opts.issue)}
                <label className="grid gap-1 text-xs"><span className="font-medium text-muted-foreground">{L("Priority range", "प्राथमिकता सीमा")}</span>
                  <div className="flex items-center gap-1.5"><input type="number" min={1} max={f.pmax} value={f.pmin} onChange={(e) => set({ pmin: Number(e.target.value) || 1 })} className={inputCls} />–<input type="number" min={f.pmin} max={10} value={f.pmax} onChange={(e) => set({ pmax: Number(e.target.value) || 10 })} className={inputCls} /></div></label>
                {sel1("status", L("Survey status", "सर्वे स्थिति"), ["Accepted", "Flagged for review", "Rejected"])}
                {sel1("sync", L("Sync status", "सिंक स्थिति"), ["Synced", "Pending", "Failed"])}
              </>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
              <button className="text-xs font-medium text-primary hover:underline" onClick={() => setMore(!more)}>{more ? L("Fewer filters", "कम फ़िल्टर") : L("More filters (7)", "अधिक फ़िल्टर (7)")}</button>
              <button className="text-xs text-muted-foreground hover:underline" onClick={() => { setF({ ...blank(), ...(locked ? { candidate: scopedCandidate } : {}) }); setOut(null); }}>{L("Reset", "रीसेट")}</button>
              <div className="ml-auto flex flex-wrap gap-2">
                <button className={btnPrimary} disabled={blocked} onClick={generate}><Play className="size-4" /> {L("Generate", "तैयार करें")}</button>
                <button className={btn} disabled={!current?.rows.length} onClick={() => { downloadCsv(report.name, current!.rows); toast.success(L("CSV exported", "CSV निर्यात हुआ")); }}><Download className="size-4" /> {L("Export CSV", "CSV निर्यात")}</button>
                <button className={btn} disabled={!current?.rows.length} onClick={() => printTable(report.name, current!.rows)}><Printer className="size-4" /> {L("Export PDF", "PDF निर्यात")}</button>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="flex flex-wrap items-center gap-2 border-b px-5 py-3">
              <div className="min-w-0 flex-1"><h2 className="flex items-center gap-2 text-sm font-semibold">{report.id}. {report.name}{report.restricted && <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[11px] font-medium text-warning"><Lock className="size-3" />{L("Restricted · PII", "प्रतिबंधित · व्यक्तिगत डेटा")}</span>}</h2><p className="text-xs text-muted-foreground">{report.desc}</p></div>
              {current && <span className="text-xs text-muted-foreground">{current.rows.length} {L("rows", "पंक्तियाँ")} · {L("generated", "तैयार")} {current.at}</span>}
            </div>
            {blocked ? (
              <div className="flex flex-col items-center gap-2 p-10 text-center text-sm"><Lock className="size-8 text-warning" /><div className="font-medium">{L("Respondent-level report", "उत्तरदाता-स्तर रिपोर्ट")}</div><p className="max-w-md text-muted-foreground">{L("Contains names, mobile numbers and ages. Only Lokdrishti administrators with the 'View respondent-level records' permission can generate it. Use the aggregate reports instead.", "इसमें नाम, मोबाइल नंबर और आयु हैं। केवल 'उत्तरदाता-स्तर रिकॉर्ड देखें' अनुमति वाले लोकदृष्टि एडमिन इसे बना सकते हैं। समेकित रिपोर्ट का उपयोग करें।")}</p></div>
            ) : !current ? (
              <div className="p-10 text-center text-sm text-muted-foreground">{L("Choose filters and press Generate.", "फ़िल्टर चुनें और 'तैयार करें' दबाएँ।")}</div>
            ) : current.rows.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">{L("No rows match these filters.", "इन फ़िल्टर से कोई पंक्ति नहीं मिली।")}</div>
            ) : (
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card"><tr className="border-b text-left text-xs text-muted-foreground">{Object.keys(current.rows[0]!).map((k) => <th key={k} className="whitespace-nowrap px-3 py-2 font-medium">{k.replace(/_/g, " ")}</th>)}</tr></thead>
                  <tbody>{current.rows.slice(0, 200).map((r, i) => <tr key={i} className="border-b last:border-0">{Object.values(r).map((v, j) => <td key={j} className="whitespace-nowrap px-3 py-2 tabular-nums">{v}</td>)}</tr>)}</tbody>
                </table>
                {current.rows.length > 200 && <p className="border-t px-4 py-2 text-xs text-muted-foreground">{L("Showing 200 rows; exports include all", "200 पंक्तियाँ दिखाई गईं; निर्यात में सभी")} {current.rows.length}.</p>}
              </div>
            )}
          </section>
          <p className="text-xs text-muted-foreground">{L("Scheduled email delivery and BI integrations are outside the base scope.", "निर्धारित ईमेल डिलीवरी और BI एकीकरण मूल दायरे में नहीं हैं।")}</p>
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}

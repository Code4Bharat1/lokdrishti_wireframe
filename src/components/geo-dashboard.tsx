// Geographical Dashboard: UP district map (coverage / responses / top issue), out-of-boundary pins,
// and drill-down District → Constituency → Block → Gram Panchayat/Ward → Village.
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, MapPinOff } from "lucide-react";
import { Header } from "@/components/campaign-management";
import { DistrictMap, type Feature } from "@/components/district-map";
import { ChartCard, Disclaimer, Kpi, Seg, n, pct } from "@/components/dashboard-kit";
import { usePreview } from "@/lib/preview";
import { cn } from "@/lib/utils";
import geo from "@/data/up-districts.json";
import { models, upAcs, issueStats, boundaryFlags, geoAttribution, type CampaignModel } from "@/data/demo";

type Layer = "coverage" | "responses" | "issues";
const fills = ["fill-map-0", "fill-map-1", "fill-map-2", "fill-map-3", "fill-map-4"];
const swatches = ["bg-map-0", "bg-map-1", "bg-map-2", "bg-map-3", "bg-map-4"];
const issueFill = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4", "fill-chart-5"];
const issueSwatch = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

type Node = { key: string; label: string; sub?: string; responses: number; planned: number; top?: string };
const sumNode = (key: string, label: string, ms: CampaignModel[], areas = ms.flatMap((m) => m.areas)): Node => {
  const top = issueStats(ms, 7).sort((a, b) => b.freq - a.freq)[0]?.issue;
  return { key, label, responses: areas.reduce((s, a) => s + a.responses, 0), planned: areas.reduce((s, a) => s + a.planned, 0), ...(top ? { top } : {}) };
};

export function GeoDashboard() {
  const { L } = usePreview();
  const [layer, setLayer] = useState<Layer>("coverage");
  const [path, setPath] = useState<string[]>([]); // [district, ac, block, gp]
  const byDistrict = Object.fromEntries([...new Set(models.map((m) => m.client.district))].map((d) => [d, sumNode(d, d, models.filter((m) => m.client.district === d))]));
  const active = Object.values(byDistrict);
  const val = (d: Node) => (layer === "responses" ? d.responses : pct(d.responses, d.planned));
  const vals = active.map(val), min = Math.min(...vals), max = Math.max(...vals);
  const bucket = (v: number) => Math.min(4, Math.floor(((v - min) / (max - min || 1)) * 5));
  const topIssues = [...new Set(active.map((d) => d.top!))];
  const fmt = (v: number) => (layer === "responses" ? n(v) : `${Math.round(v)}%`);

  // Drill-down levels
  const [district, ac, block, gp] = path;
  const inD = models.filter((m) => m.client.district === district);
  const inAc = inD.filter((m) => m.client.ac === ac);
  const areasInBlock = inAc.flatMap((m) => m.areas.filter((a) => a.block === block).map((a) => ({ m, a })));
  const level = path.length;
  const levelName = [L("District", "ज़िला"), L("Assembly Constituency", "विधानसभा क्षेत्र"), L("Block / Tehsil", "ब्लॉक / तहसील"), L("Gram Panchayat / Ward", "ग्राम पंचायत / वार्ड"), L("Village / Locality", "गाँव / मोहल्ला")][level]!;
  const nodes: (Node & { empty?: boolean })[] =
    level === 0 ? [...active].sort((a, b) => pct(a.responses, a.planned) - pct(b.responses, b.planned))
    : level === 1 ? upAcs[district!]!.map((x) => { const ms = inD.filter((m) => m.client.ac === x); return ms.length ? { ...sumNode(x, x, ms), sub: ms.map((m) => m.c.candidate).join(", ") } : { key: x, label: x, responses: 0, planned: 0, empty: true }; })
    : level === 2 ? [...new Set(inAc.flatMap((m) => m.areas.map((a) => a.block)))].map((b) => sumNode(b, b, inAc, inAc.flatMap((m) => m.areas.filter((a) => a.block === b))))
    : level === 3 ? areasInBlock.map(({ m, a }) => ({ key: a.gp, label: a.gp, sub: m.c.candidate, responses: a.responses, planned: a.planned, top: Object.entries(a.issues).sort((p, q) => q[1].count - p[1].count)[0]![0] }))
    : (() => { const x = areasInBlock.find(({ a }) => a.gp === gp)!; return x.a.villages.map((v, i) => ({ key: v, label: v, responses: x.a.byVillage[i]!, planned: Math.round(x.a.planned / 3) })); })();

  const lowCoverage = models.flatMap((m) => m.areas.map((a) => ({ m, a, p: pct(a.responses, a.planned) }))).filter((x) => x.p < 50).sort((a, b) => a.p - b.p).slice(0, 8);
  const pins = boundaryFlags.map((f) => ({ id: f.id, district: f.district, dLon: f.dLon, dLat: f.dLat, label: `${f.id} · ${f.candidate} · ${f.distance} ${L("outside boundary", "सीमा से बाहर")}` }));

  return (
    <div className="space-y-5">
      <Header section="Monitoring" title="Geographical Dashboard" desc={L("Survey coverage, responses and issues across Uttar Pradesh.", "उत्तर प्रदेश भर में सर्वे कवरेज, उत्तर और मुद्दे।")} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={L("Districts with campaigns", "अभियान वाले ज़िले")} value={`${active.length} / ${(geo as { features: unknown[] }).features.length}`} />
        <Kpi label={L("Gram Panchayats / wards surveyed", "सर्वे किए ग्राम पंचायत / वार्ड")} value={models.reduce((s, m) => s + m.areas.length, 0)} />
        <Kpi label={L("Low-coverage areas (<50%)", "कम कवरेज क्षेत्र (<50%)")} value={models.flatMap((m) => m.areas).filter((a) => pct(a.responses, a.planned) < 50).length} tone="warning" />
        <Kpi label={L("Out-of-boundary flags", "सीमा से बाहर फ़्लैग")} value={boundaryFlags.length} tone="destructive" />
      </div>

      <section className="panel flex flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3.5">
          <div><h2 className="text-sm font-semibold">{L("Uttar Pradesh", "उत्तर प्रदेश")}</h2><p className="text-xs text-muted-foreground">{L("Click a district to drill down · red pins are out-of-boundary surveys", "ड्रिल-डाउन के लिए ज़िले पर क्लिक करें · लाल पिन सीमा से बाहर के सर्वे हैं")}</p></div>
          <div className="ml-auto"><Seg value={layer} onChange={setLayer} options={[["coverage", L("Coverage", "कवरेज")], ["responses", L("Responses", "उत्तर")], ["issues", L("Issues", "मुद्दे")]]} /></div>
        </div>
        <div className="grid lg:grid-cols-[1fr_340px]">
          <DistrictMap geo={geo as unknown as { features: Feature[] }} selected={district ?? null} pins={pins} minH={460}
            onSelect={(name) => byDistrict[name] && setPath([name])}
            fillClass={(name) => { const d = byDistrict[name]; return !d ? "fill-muted" : layer === "issues" ? issueFill[topIssues.indexOf(d.top!) % 5]! : fills[bucket(val(d))]!; }}
            tooltip={(name) => { const d = byDistrict[name]; return (<><div className="font-semibold">{name}</div>{d ? <><div className="tabular-nums">{n(d.responses)} {L("responses", "उत्तर")} · {Math.round(pct(d.responses, d.planned))}% {L("coverage", "कवरेज")}</div><div className="text-muted-foreground">{L("Top issue", "शीर्ष मुद्दा")}: {d.top}</div></> : <div className="text-muted-foreground">{L("No active campaign", "कोई सक्रिय अभियान नहीं")}</div>}</>); }}
            legend={layer === "issues"
              ? <><div className="mb-1 font-medium">{L("Top issue", "शीर्ष मुद्दा")}</div>{topIssues.map((t, i) => <div key={t} className="flex items-center gap-1.5"><span className={cn("size-2.5 rounded-sm", issueSwatch[i % 5])} />{t}</div>)}<div className="mt-1 flex items-center gap-1.5 text-muted-foreground"><span className="size-2.5 rounded-sm bg-muted" />{L("No campaign", "अभियान नहीं")}</div></>
              : <><div className="mb-1 font-medium">{layer === "coverage" ? L("Coverage of plan", "योजना का कवरेज") : L("Responses", "उत्तर")}</div><div className="flex items-center gap-1.5 tabular-nums text-muted-foreground">{fmt(min)} {swatches.map((s) => <span key={s} className={cn("h-2.5 w-5 rounded-sm", s)} />)} {fmt(max)}</div></>} />

          <div className="border-t p-4 lg:border-l lg:border-t-0">
            <nav className="flex flex-wrap items-center gap-1 text-xs">
              <button className={cn(level ? "text-primary hover:underline" : "font-semibold")} onClick={() => setPath([])}>{L("Uttar Pradesh", "उत्तर प्रदेश")}</button>
              {path.map((p, i) => <span key={p} className="flex items-center gap-1"><ChevronRight className="size-3 text-muted-foreground" /><button className={cn(i < level - 1 ? "text-primary hover:underline" : "font-semibold")} onClick={() => setPath(path.slice(0, i + 1))}>{p}</button></span>)}
            </nav>
            <div className="eyebrow mt-3">{levelName}</div>
            <ul className="mt-2 max-h-[400px] space-y-1 overflow-y-auto">
              {nodes.map((x) => { const p = pct(x.responses, x.planned); return (
                <li key={x.key}>
                  <button disabled={x.empty || level >= 4} onClick={() => setPath([...path, x.key])} className="w-full rounded-md px-2 py-2 text-left hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent">
                    <div className="flex items-center justify-between gap-2 text-sm"><span className="font-medium">{x.label}</span>{x.empty ? <span className="text-xs text-muted-foreground">{L("No campaign", "अभियान नहीं")}</span> : <span className={cn("text-xs font-semibold tabular-nums", p < 50 && "text-destructive")}>{Math.round(p)}%</span>}</div>
                    {!x.empty && <><div className="mt-1 h-1 rounded-full bg-muted"><div className={cn("h-full rounded-full", p < 50 ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min(100, p)}%` }} /></div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{n(x.responses)} / {n(x.planned)}{x.top && ` · ${x.top}`}{x.sub && ` · ${x.sub}`}</div></>}
                  </button>
                </li>
              ); })}
            </ul>
          </div>
        </div>
        <p className="border-t px-5 py-2 text-[11px] text-muted-foreground">{geoAttribution} {L("Constituency, block and village boundaries aren't mapped yet; those levels drill down as lists.", "विधानसभा, ब्लॉक और गाँव की सीमाएँ अभी मानचित्र पर नहीं; ये स्तर सूची के रूप में दिखते हैं।")}</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={L("Low-coverage areas", "कम कवरेज क्षेत्र")} sub={L("Gram Panchayats / wards below 50% of their planned surveys", "नियोजित सर्वे के 50% से कम वाले ग्राम पंचायत / वार्ड")}>
          <ul className="divide-y text-sm">{lowCoverage.map(({ m, a, p }) => (
            <li key={m.c.id + a.gp} className="flex items-center gap-3 py-2"><div className="min-w-0 flex-1"><div className="font-medium">{a.gp} <span className="text-xs font-normal text-muted-foreground">· {a.block}, {m.client.district}</span></div><div className="text-xs text-muted-foreground">{m.c.candidate} · {n(a.responses)} / {n(a.planned)}</div></div><span className="text-sm font-semibold tabular-nums text-destructive">{Math.round(p)}%</span></li>
          ))}</ul>
        </ChartCard>
        <ChartCard title={L("Out-of-boundary survey flags", "सीमा से बाहर सर्वे फ़्लैग")} sub={L("GPS point outside the volunteer's assigned area. Missing GPS is never treated as out-of-boundary.", "GPS बिंदु स्वयंसेवक के निर्धारित क्षेत्र से बाहर। GPS न होने को सीमा से बाहर नहीं माना जाता।")} action={<Link to="/administration/data-quality" className="text-xs font-medium text-primary hover:underline">{L("Review queue", "समीक्षा कतार")}</Link>}>
          <ul className="divide-y text-sm">{boundaryFlags.slice(0, 8).map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-2"><MapPinOff className="size-4 shrink-0 text-destructive" /><div className="min-w-0 flex-1"><div><span className="font-mono text-xs">{f.id}</span> · {f.candidate}</div><div className="text-xs text-muted-foreground">{f.volunteer} · {f.district}</div></div><span className="text-xs tabular-nums text-muted-foreground">{f.distance}</span></li>
          ))}</ul>
        </ChartCard>
      </div>
      <Disclaimer />
    </div>
  );
}

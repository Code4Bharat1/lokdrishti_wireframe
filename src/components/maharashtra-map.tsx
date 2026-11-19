import { useState } from "react";
import { X } from "lucide-react";
import { DistrictMap } from "@/components/district-map";
import geo from "@/data/maharashtra-districts.json";
import { districtStats, type DistrictStats } from "@/data/demo";
import { cn } from "@/lib/utils";

type Layer = "coverage" | "projects" | "responses";
const layers: { id: Layer; label: string }[] = [
  { id: "coverage", label: "Coverage %" }, { id: "projects", label: "Projects" }, { id: "responses", label: "Responses" },
];
const divisions = ["All", "Konkan", "Pune", "Nashik", "Aurangabad", "Amravati", "Nagpur"];
const fills = ["fill-map-0", "fill-map-1", "fill-map-2", "fill-map-3", "fill-map-4"];
const swatches = ["bg-map-0", "bg-map-1", "bg-map-2", "bg-map-3", "bg-map-4"];

type Feature = { type: "Feature"; properties: { name: string }; geometry: GeoJSON.MultiPolygon };

export function MaharashtraMap() {
  const [layer, setLayer] = useState<Layer>("coverage");
  const [division, setDivision] = useState("All");
  const [selected, setSelected] = useState<DistrictStats | null>(null);

  const features = (geo as unknown as { features: Feature[] }).features;

  const values = features.map((f) => districtStats[f.properties.name]![layer]);
  const min = Math.min(...values), max = Math.max(...values);
  const bucket = (v: number) => Math.min(4, Math.floor(((v - min) / (max - min || 1)) * 5));

  const fmt = (v: number) => (layer === "coverage" ? `${v}%` : v.toLocaleString("en-IN"));

  return (
    <div className="panel flex flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold">Maharashtra Geographical Intelligence</h2>
          <p className="text-xs text-muted-foreground">District-wise research coverage · click a district for its profile</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select value={division} onChange={(e) => setDivision(e.target.value)} className="h-8 rounded-md border bg-card px-2 text-xs">
            {divisions.map((d) => <option key={d} value={d}>{d === "All" ? "All divisions" : `${d} division`}</option>)}
          </select>
          <div className="flex rounded-md border bg-muted p-0.5">
            {layers.map((l) => (
              <button key={l.id} onClick={() => setLayer(l.id)}
                className={cn("rounded px-2.5 py-1 text-xs font-medium text-muted-foreground", layer === l.id && "bg-card text-foreground shadow-card")}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative grid flex-1 lg:grid-cols-[1fr_280px]">
        <DistrictMap geo={geo as never} selected={selected?.name ?? null} onSelect={(n) => setSelected(districtStats[n]!)}
          fillClass={(n) => { const d = districtStats[n]!; return cn(fills[bucket(d[layer])], division !== "All" && d.division !== division && "opacity-20"); }}
          tooltip={(n) => { const d = districtStats[n]!; return (<><div className="font-semibold">{d.name}</div><div className="text-muted-foreground">{d.division} division</div><div className="mt-1 tabular-nums">{layers.find((l) => l.id === layer)!.label}: <b>{fmt(d[layer])}</b></div></>); }}
          legend={<><div className="mb-1 font-medium">{layers.find((l) => l.id === layer)!.label}</div><div className="flex items-center gap-1.5 tabular-nums text-muted-foreground">{fmt(min)} {swatches.map((s) => <span key={s} className={cn("h-2.5 w-5 rounded-sm", s)} />)} {fmt(max)}</div></>} />

        <div className="border-t p-5 lg:border-l lg:border-t-0">
          {selected ? (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="eyebrow">{selected.division} division</div>
                  <h3 className="mt-1 text-lg font-semibold">{selected.name}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-muted" aria-label="Close"><X className="size-4" /></button>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                {[["Projects", selected.projects], ["Surveys", selected.surveys], ["Responses", selected.responses.toLocaleString("en-IN")], ["Enumerators", selected.enumerators]].map(([k, v]) => (
                  <div key={k} className="rounded-md border bg-background p-3">
                    <dt className="text-[11px] text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 text-base font-semibold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Research coverage</span><span className="font-medium tabular-nums">{selected.coverage}%</span></div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${selected.coverage}%` }} /></div>
              </div>
              <div className="mt-4 rounded-md bg-accent p-3 text-xs text-accent-foreground">
                <div className="font-medium">Top public issue</div>
                <div className="mt-0.5">{selected.topIssue}</div>
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">Last updated {selected.updated} · demo data</p>
            </div>
          ) : (
            <div>
              <div className="eyebrow">Top districts by {layers.find((l) => l.id === layer)!.label.toLowerCase()}</div>
              <ol className="mt-3 space-y-1">
                {Object.values(districtStats).filter((d) => division === "All" || d.division === division)
                  .sort((a, b) => b[layer] - a[layer]).slice(0, 9).map((d, i) => (
                    <li key={d.name}>
                      <button onClick={() => setSelected(d)} className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted">
                        <span className="w-4 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                        <span className="flex-1 truncate">{d.name}</span>
                        <span className="text-xs font-medium tabular-nums">{fmt(d[layer])}</span>
                      </button>
                    </li>
                  ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

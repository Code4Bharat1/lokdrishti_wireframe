// Shared district choropleth: projection, zoom, hover tooltip and optional pins. Used by the Maharashtra and UP maps.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { geoCentroid, geoMercator, geoPath } from "d3-geo";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { select } from "d3-selection";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const W = 760, H = 520;
export type Feature = { type: "Feature"; properties: { name: string }; geometry: GeoJSON.MultiPolygon };
export type Pin = { id: string; district: string; dLon: number; dLat: number; label: string };

export function DistrictMap({ geo, fillClass, tooltip, selected, onSelect, pins, legend, minH = 420 }: {
  geo: { features: Feature[] }; fillClass: (name: string) => string; tooltip: (name: string) => ReactNode;
  selected?: string | null; onSelect?: (name: string) => void; pins?: Pin[]; legend?: ReactNode; minH?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown>>(null);
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null);
  const { path, proj, centroids } = useMemo(() => {
    const proj = geoMercator().fitExtent([[16, 16], [W - 16, H - 16]], geo as never);
    return { path: geoPath(proj), proj, centroids: Object.fromEntries(geo.features.map((f) => [f.properties.name, geoCentroid(f as never)])) };
  }, [geo]);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const g = select(gRef.current);
    const z = zoom<SVGSVGElement, unknown>().scaleExtent([1, 8]).translateExtent([[0, 0], [W, H]]).on("zoom", (e) => g.attr("transform", e.transform.toString()));
    select(svgRef.current).call(z);
    zoomRef.current = z;
  }, []);
  const zoomBy = (k: number) => svgRef.current && zoomRef.current && select(svgRef.current).call(zoomRef.current.scaleBy, k);
  const reset = () => svgRef.current && zoomRef.current && select(svgRef.current).call(zoomRef.current.transform, zoomIdentity);
  const at = (e: React.MouseEvent, name: string) => { const r = svgRef.current!.getBoundingClientRect(); setHover({ name, x: e.clientX - r.left, y: e.clientY - r.top }); };

  return (
    <div className="relative overflow-hidden" style={{ minHeight: minH }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-full w-full cursor-grab touch-none active:cursor-grabbing">
        <g ref={gRef}>
          {geo.features.map((f) => {
            const name = f.properties.name, sel = selected === name;
            return (
              <path key={name} d={path(f) ?? ""} className={cn(fillClass(name), "stroke-card transition-opacity hover:opacity-80", sel && "stroke-foreground")}
                strokeWidth={sel ? 1.6 : 0.7} vectorEffect="non-scaling-stroke" onMouseMove={(e) => at(e, name)} onMouseLeave={() => setHover(null)} onClick={() => onSelect?.(name)} />
            );
          })}
          {pins?.map((p) => {
            const c = centroids[p.district];
            const xy = c && proj([c[0] + p.dLon, c[1] + p.dLat]);
            return xy && (
              <g key={p.id} transform={`translate(${xy[0]},${xy[1]})`}>
                <circle r={5} className="fill-destructive stroke-card" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                <title>{p.label}</title>
              </g>
            );
          })}
        </g>
      </svg>
      {hover && <div className="pointer-events-none absolute z-10 rounded-md border bg-popover px-3 py-2 text-xs shadow-lg" style={{ left: hover.x + 14, top: hover.y + 14 }}>{tooltip(hover.name)}</div>}
      <div className="absolute left-4 top-4 flex flex-col overflow-hidden rounded-md border bg-card shadow-card">
        <button onClick={() => zoomBy(1.5)} className="grid size-8 place-items-center hover:bg-muted" aria-label="Zoom in"><Plus className="size-4" /></button>
        <button onClick={() => zoomBy(1 / 1.5)} className="grid size-8 place-items-center border-y hover:bg-muted" aria-label="Zoom out"><Minus className="size-4" /></button>
        <button onClick={reset} className="grid size-8 place-items-center hover:bg-muted" aria-label="Reset view"><RotateCcw className="size-3.5" /></button>
      </div>
      {legend && <div className="absolute bottom-4 left-4 rounded-md border bg-card/95 px-3 py-2 text-[11px] shadow-card">{legend}</div>}
    </div>
  );
}

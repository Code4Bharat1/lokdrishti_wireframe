// Data quality review queue (Supervisor, Operations, Super Admin). Decisions stay in page state and are listed as audit lines.
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Clock, CloudUpload, MapPinOff, MessageSquareWarning, X } from "lucide-react";
import { Header } from "@/components/campaign-management";
import { DistrictMap, type Feature } from "@/components/district-map";
import { btn } from "@/components/module-views";
import { usePreview, portals } from "@/lib/preview";
import { badgeClass } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import geo from "@/data/up-districts.json";
import { dqRecords, dqKinds, recordStatuses, type DqKind, type DqRecord } from "@/data/demo";

const features = (geo as unknown as { features: Feature[] }).features;
const kindHelp: Record<DqKind, [string, string]> = {
  "Out-of-area": ["GPS point falls outside the volunteer's assigned boundary.", "GPS बिंदु स्वयंसेवक की निर्धारित सीमा से बाहर है।"],
  "GPS unavailable": ["No location could be captured. This is not treated as out-of-area.", "स्थान दर्ज नहीं हो सका। इसे सीमा से बाहर नहीं माना जाता।"],
  "Potential duplicate": ["Matched on mobile number + campaign + time window. Review; never auto-deleted.", "मोबाइल नंबर + अभियान + समय-सीमा पर मेल। समीक्षा करें; स्वतः हटाया नहीं जाता।"],
  "Sync conflict": ["The phone copy differs from the copy the server already has.", "फ़ोन की प्रति सर्वर की प्रति से अलग है।"],
  "Synced after expiry": ["Collected before the campaign expired, received after. Original timestamps are kept.", "अभियान समाप्ति से पहले एकत्र, बाद में प्राप्त। मूल समय सुरक्षित।"],
};

export function DataQuality() {
  const { L, role } = usePreview();
  const [tab, setTab] = useState<DqKind>("Out-of-area");
  const [recs, setRecs] = useState<DqRecord[]>(dqRecords);
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const list = recs.filter((r) => r.kind === tab);
  const open = recs.find((r) => r.id === openId) ?? list[0];
  const pending = (k: DqKind) => recs.filter((r) => r.kind === k && r.status === "Flagged for review").length;
  const district = useMemo(() => ({ features: features.filter((f) => f.properties.name === open?.district) }), [open?.district]);

  const decide = (r: DqRecord, status: string) => {
    if (status === "Correction requested" && !note.trim()) { toast.error(L("Add a note for the volunteer", "स्वयंसेवक के लिए नोट जोड़ें")); return; }
    setRecs((all) => all.map((x) => (x.id === r.id ? { ...x, status } : x)));
    setLog((l) => [`${new Date().toTimeString().slice(0, 5)} · ${portals[role].user} · ${r.id}: Flagged for review → ${status}${note ? ` (“${note}”)` : ""}`, ...l]);
    toast.success(`${r.id}: ${status} · ${L("logged in Audit Log", "ऑडिट लॉग में दर्ज")}`);
    setNote("");
    const next = list.find((x) => x.id !== r.id && x.status === "Flagged for review");
    if (next) setOpenId(next.id);
  };

  return (
    <div className="space-y-5">
      <Header section="Administration" title="Data Quality" desc="Flagged surveys waiting for review — duplicates, out-of-boundary, missing GPS." />

      <div className="flex flex-wrap gap-1 border-b">
        {dqKinds.map((k) => (
          <button key={k} onClick={() => { setTab(k); setOpenId(null); }} className={cn("-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm", tab === k ? "border-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {k}<span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", pending(k) ? "bg-warning/15 text-warning" : "bg-muted")}>{pending(k)}</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{L(...kindHelp[tab])}</p>

      <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
        <section className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">{[L("Survey", "सर्वे"), L("Candidate · area", "उम्मीदवार · क्षेत्र"), L("Volunteer", "स्वयंसेवक"), L("Surveyed at", "सर्वे समय"), L("Synced at", "सिंक समय"), L("Status", "स्थिति")].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} onClick={() => setOpenId(r.id)} className={cn("cursor-pointer border-b last:border-0 hover:bg-muted/50", open?.id === r.id && "bg-accent/60")}>
                  <td className="px-3 py-2.5 font-mono text-xs">{r.id}</td>
                  <td className="px-3"><div>{r.candidate}</div><div className="text-xs text-muted-foreground">{r.gp} · {r.district}</div></td>
                  <td className="px-3 text-muted-foreground">{r.volunteer}</td>
                  <td className="whitespace-nowrap px-3 tabular-nums">{r.surveyAt}</td>
                  <td className="whitespace-nowrap px-3 tabular-nums text-muted-foreground">{r.syncAt}</td>
                  <td className="px-3"><span className={cn("whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium", badgeClass(r.status))}>{r.status}</span></td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">{L("Nothing to review.", "समीक्षा के लिए कुछ नहीं।")}</td></tr>}
            </tbody>
          </table>
        </section>

        {open && (
          <aside className="panel h-fit">
            <div className="border-b px-4 py-3"><div className="flex items-center gap-2"><span className="font-mono text-sm font-semibold">{open.id}</span><span className={cn("ml-auto rounded px-2 py-0.5 text-xs font-medium", badgeClass(open.status))}>{open.status}</span></div><div className="text-xs text-muted-foreground">{open.campaign}</div></div>
            <div className="h-56 border-b">
              {open.dLon !== undefined ? (
                <DistrictMap key={open.district} geo={district} minH={224} fillClass={() => "fill-map-1"} tooltip={(n) => n} pins={[{ id: open.id, district: open.district, dLon: open.dLon, dLat: open.dLat!, label: `${open.id} · ${open.village}` }]} />
              ) : (
                <div className="grid h-full place-items-center bg-muted/40 text-center text-sm text-muted-foreground"><div><MapPinOff className="mx-auto mb-1 size-6" />{L("No GPS point recorded", "कोई GPS बिंदु दर्ज नहीं")}</div></div>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3 p-4 text-sm">
              <div><dt className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{L("Survey timestamp", "सर्वे समय")}</dt><dd className="font-medium tabular-nums">{open.surveyAt}</dd></div>
              <div><dt className="flex items-center gap-1 text-xs text-muted-foreground"><CloudUpload className="size-3" />{L("Sync timestamp", "सिंक समय")}</dt><dd className="font-medium tabular-nums">{open.syncAt}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{L("Location", "स्थान")}</dt><dd>{open.village}, {open.gp}<br /><span className="text-xs text-muted-foreground">{open.district}</span></dd></div>
              <div><dt className="text-xs text-muted-foreground">{L("Volunteer", "स्वयंसेवक")}</dt><dd>{open.volunteer}</dd></div>
              <div className="col-span-2 rounded-md bg-muted/60 p-2.5 text-xs"><span className="font-medium">{open.kind}:</span> {open.detail}</div>
            </dl>
            {open.status === "Flagged for review" ? (
              <div className="space-y-2 border-t p-4">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={L("Note (required for a correction request)", "नोट (सुधार अनुरोध हेतु आवश्यक)")} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                <div className="flex flex-wrap gap-2">
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-success px-3 text-sm font-medium text-white hover:opacity-90" onClick={() => decide(open, "Accepted")}><Check className="size-4" /> {L("Accept", "स्वीकारें")}</button>
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-destructive px-3 text-sm font-medium text-white hover:opacity-90" onClick={() => decide(open, "Rejected")}><X className="size-4" /> {L("Reject", "अस्वीकारें")}</button>
                  <button className={btn} onClick={() => decide(open, "Correction requested")}><MessageSquareWarning className="size-4" /> {L("Request correction", "सुधार माँगें")}</button>
                </div>
              </div>
            ) : <p className="border-t p-4 text-xs text-muted-foreground">{L("Decision recorded. It can be changed by an administrator from the Audit Log.", "निर्णय दर्ज। एडमिनिस्ट्रेटर ऑडिट लॉग से बदल सकते हैं।")}</p>}
          </aside>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
        <section className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">{L("Record status legend", "रिकॉर्ड स्थिति सूची")}</h2>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {recordStatuses.map(([s, d], i) => <li key={s} className="flex gap-2 text-sm"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold">{i + 1}</span><div><span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", badgeClass(s))}>{s}</span><div className="mt-0.5 text-xs text-muted-foreground">{d}</div></div></li>)}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">{L("Reports always separate records saved on phones from records received and accepted by the server.", "रिपोर्ट में फ़ोन पर सहेजे और सर्वर द्वारा प्राप्त/स्वीकृत रिकॉर्ड हमेशा अलग दिखते हैं।")}</p>
        </section>
        <section className="panel p-4">
          <h2 className="mb-2 text-sm font-semibold">{L("Decisions this session", "इस सत्र के निर्णय")}</h2>
          {log.length ? <ul className="space-y-1.5 text-xs">{log.map((l, i) => <li key={i} className="font-mono">{l}</li>)}</ul> : <p className="text-xs text-muted-foreground">{L("None yet.", "अभी कोई नहीं।")}</p>}
        </section>
      </div>
    </div>
  );
}

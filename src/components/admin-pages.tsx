// Administration: notification centre, audit log, data & privacy, voter identification (in discovery).
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle, BadgeCheck, Bell, CalendarClock, CheckCircle2, CloudOff, Copy, Download, FileWarning, Fingerprint, IdCard, ListChecks, Lock, MapPinned, Plus, Search, ShieldAlert, TrendingUp, Upload, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/campaign-management";
import { btn, btnPrimary, inputCls } from "@/components/module-views";
import { usePreview, portals } from "@/lib/preview";
import { badgeClass, downloadCsv } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import { adminAlerts, alertTypes, auditEntries, dsrLog, consentVersions, fmtDate, iso, TODAY, addDays, type AlertType } from "@/data/demo";

const panel = (title: string, children: React.ReactNode, action?: React.ReactNode) => (
  <section className="panel"><div className="flex items-center gap-2 border-b px-5 py-3"><h2 className="flex-1 text-sm font-semibold">{title}</h2>{action}</div><div className="p-5">{children}</div></section>
);
const toneCls = { warning: "text-warning", success: "text-success", destructive: "text-destructive", primary: "text-primary" };
const typeIcon: Record<AlertType, typeof Bell> = { "Campaign nearing expiry": CalendarClock, "Target nearly reached": TrendingUp, "Target reached": CheckCircle2, "Campaign expired": Lock, "Extension approved": CalendarClock, "Sync failures": CloudOff, "Duplicates flagged": FileWarning, "Low coverage against plan": MapPinned };

/* ================= Notifications ================= */
export function NotificationCentre() {
  const { L } = usePreview();
  const [read, setRead] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<"All" | "Unread" | AlertType>("All");
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(alertTypes.map((t) => [t, true])));
  const [thr, setThr] = useState({ expiry: 7, target: 90, coverage: 50 });
  const shown = adminAlerts.filter((a) => on[a.type] && (filter === "All" || (filter === "Unread" ? !read.has(a.id) : a.type === filter)));
  const unread = adminAlerts.filter((a) => on[a.type] && !read.has(a.id)).length;
  return (
    <div className="space-y-5">
      <Header section="Administration" title="Notifications" desc={L("In-app alerts for campaigns, targets, sync and data quality.", "अभियान, लक्ष्य, सिंक और डेटा गुणवत्ता के लिए इन-ऐप अलर्ट।")}>
        <button className={btn} disabled={!unread} onClick={() => setRead(new Set(adminAlerts.map((a) => a.id)))}>{L("Mark all read", "सब पढ़ा हुआ करें")}</button>
      </Header>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="panel">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            {(["All", "Unread"] as const).map((k) => <button key={k} onClick={() => setFilter(k)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", filter === k ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>{k === "All" ? L("All", "सभी") : `${L("Unread", "अपठित")} ${unread}`}</button>)}
            <select value={alertTypes.includes(filter as AlertType) ? filter : ""} onChange={(e) => setFilter((e.target.value || "All") as AlertType)} className="ml-auto h-8 rounded-md border bg-card px-2 text-xs"><option value="">{L("All types", "सभी प्रकार")}</option>{alertTypes.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <ul className="divide-y">
            {shown.map((a) => { const Icon = typeIcon[a.type]; const isRead = read.has(a.id); return (
              <li key={a.id} className={cn("flex gap-3 px-4 py-3", !isRead && "bg-primary/[0.03]")}>
                <Icon className={cn("mt-0.5 size-5 shrink-0", toneCls[a.tone])} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className={cn("text-sm", !isRead && "font-semibold")}>{a.title}</span><span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{a.type}</span></div>
                  <div className="text-xs text-muted-foreground">{a.body}</div>
                  <div className="mt-1 flex gap-3 text-xs"><Link to={a.to} onClick={() => setRead((s) => new Set(s).add(a.id))} className="font-medium text-primary hover:underline">{L("Open", "खोलें")}</Link>{!isRead && <button className="text-muted-foreground hover:underline" onClick={() => setRead((s) => new Set(s).add(a.id))}>{L("Mark read", "पढ़ा हुआ")}</button>}</div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{a.time}</span>
              </li>
            ); })}
            {!shown.length && <li className="p-10 text-center text-sm text-muted-foreground">{L("No notifications.", "कोई सूचना नहीं।")}</li>}
          </ul>
        </section>
        <div className="space-y-4">
          {panel(L("In-app alerts", "इन-ऐप अलर्ट"), (
            <div className="space-y-3 text-sm">
              {alertTypes.map((t) => <label key={t} className="flex items-center justify-between gap-3">{t}<Switch checked={on[t]} onCheckedChange={(v) => setOn({ ...on, [t]: v })} /></label>)}
              <div className="grid grid-cols-3 gap-2 border-t pt-3 text-xs">
                <label className="grid gap-1">{L("Expiry warning (days)", "समाप्ति चेतावनी (दिन)")}<input type="number" min={1} value={thr.expiry} onChange={(e) => setThr({ ...thr, expiry: Number(e.target.value) })} className={inputCls} /></label>
                <label className="grid gap-1">{L("Nearly reached (%)", "लगभग पूर्ण (%)")}<input type="number" min={50} max={99} value={thr.target} onChange={(e) => setThr({ ...thr, target: Number(e.target.value) })} className={inputCls} /></label>
                <label className="grid gap-1">{L("Low coverage below (%)", "कम कवरेज (%) से नीचे")}<input type="number" min={1} max={99} value={thr.coverage} onChange={(e) => setThr({ ...thr, coverage: Number(e.target.value) })} className={inputCls} /></label>
              </div>
              <button className={cn(btnPrimary, "w-full justify-center")} onClick={() => toast.success(L("Alert settings saved", "अलर्ट सेटिंग सहेजी गई"))}>{L("Save", "सहेजें")}</button>
            </div>
          ))}
          {panel(L("Other channels", "अन्य चैनल"), (
            <div className="space-y-3 text-sm">
              {["Email", "SMS", "WhatsApp"].map((c) => <label key={c} className="flex items-center justify-between gap-3 opacity-60"><span>{c} <span className="ml-1 rounded bg-muted px-1.5 text-[11px] text-muted-foreground">{L("Not enabled", "सक्षम नहीं")}</span></span><Switch checked={false} disabled aria-label={`${c} not enabled`} /></label>)}
              <p className="text-xs text-muted-foreground">{L("Not in the base scope. Can be added once providers and costs are confirmed.", "मूल दायरे में नहीं। प्रदाता और लागत तय होने पर जोड़ा जा सकता है।")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= Audit log ================= */
const auditCats: Record<string, string[]> = {
  "Deadline changes": ["Deadline changed", "Target changed"], "Survey status": ["Survey status"], "Admin corrections": ["Admin correction", "Campaign status", "Volunteer status", "Client registered"],
  "Sync exceptions": ["Sync exception resolved"], "Access & privacy": ["Password reset", "Permission changed", "Data export", "Data subject request", "Consent statement", "Questionnaire activated"],
};
export function AuditLogPage() {
  const { L } = usePreview();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const rows = auditEntries.filter((e) => (cat === "All" || auditCats[cat]!.includes(e.action)) && Object.values(e).join(" ").toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-5">
      <Header section="Administration" title="Audit Log" desc="Who changed what, and when.">
        <button className={btn} onClick={() => { downloadCsv("audit-log", rows); toast.success(L("CSV downloaded", "CSV डाउनलोड हुआ")); }}><Download className="size-4" /> {L("Export", "निर्यात")}</button>
      </Header>
      <section className="panel">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative min-w-48 flex-1 sm:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L("Search user, record, value…", "उपयोगकर्ता, रिकॉर्ड, मान खोजें…")} className={cn(inputCls, "pl-9")} /></div>
          {["All", ...Object.keys(auditCats)].map((c) => <button key={c} onClick={() => setCat(c)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", cat === c ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>{c === "All" ? L("All", "सभी") : c}</button>)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">{[L("Date-time", "दिनांक-समय"), L("User", "उपयोगकर्ता"), L("Action", "कार्य"), L("Record", "रिकॉर्ड"), L("Previous value → new value", "पिछला मान → नया मान")].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>{rows.map((e, i) => (
              <tr key={i} className="border-b align-top last:border-0">
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted-foreground">{e.at}</td>
                <td className="px-3 py-2.5"><div className="font-medium">{e.user}</div><div className="text-xs text-muted-foreground">{e.role}</div></td>
                <td className="whitespace-nowrap px-3 py-2.5"><span className="rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground">{e.action}</span></td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{e.record}</td>
                <td className="px-3 py-2.5"><span className="text-muted-foreground line-through decoration-muted-foreground/40">{e.from}</span> <span className="text-muted-foreground">→</span> <span className="font-medium">{e.to}</span></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">{L("No entries match.", "कोई प्रविष्टि नहीं मिली।")}</td></tr>}</tbody>
          </table>
        </div>
        <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">{rows.length} {L("entries · entries can't be edited or deleted · demo data", "प्रविष्टियाँ · संपादित या हटाई नहीं जा सकतीं · डेमो डेटा")}</p>
      </section>
    </div>
  );
}

/* ================= Data & privacy ================= */
const retentionDefaults = [
  ["Respondent personal details (name, mobile)", 12, "Anonymise"], ["Survey answers and issue ratings", 36, "Archive"], ["Survey photos", 6, "Delete"],
  ["GPS coordinates", 12, "Generalise to village"], ["Consent records", 60, "Archive"], ["Audit log", 84, "Archive"], ["Volunteer accounts (after deactivation)", 12, "Delete"],
] as const;
const accessRoles = ["Super Administrator", "Command Centre / Operations", "Field Supervisor", "Candidate Administrator", "Candidate Team (view-only)", "Volunteer"] as const;
const accessRules = ["View respondent names & mobiles", "Export respondent-level data", "View survey photos", "View aggregate dashboards & reports"] as const;
const accessDefault: Record<string, boolean[]> = {
  "Super Administrator": [true, true, true, true], "Command Centre / Operations": [true, false, true, true], "Field Supervisor": [true, false, true, false],
  "Candidate Administrator": [false, false, false, true], "Candidate Team (view-only)": [false, false, false, true], Volunteer: [false, false, false, false],
};

export function DataPrivacy() {
  const { L, role } = usePreview();
  const [ret, setRet] = useState(retentionDefaults.map(([type, months, after]) => ({ type, months: months as number, after: after as string })));
  const [dsr, setDsr] = useState(dsrLog);
  const [dsrOpen, setDsrOpen] = useState(false);
  const [incident, setIncident] = useState(false);
  const [incidents, setIncidents] = useState<{ id: string; at: string; what: string; severity: string; status: string }[]>([{ id: "INC-001", at: "2026-10-30", what: "Volunteer phone lost in Varanasi (3 unsynced records)", severity: "Low", status: "Closed" }]);
  const [access, setAccess] = useState(accessDefault);
  return (
    <div className="space-y-5">
      <Header section="Administration" title="Data & Privacy" desc={L("Retention, data-subject requests, consent versions, incidents and access to respondent data.", "प्रतिधारण, डेटा-विषय अनुरोध, सहमति संस्करण, घटनाएँ और उत्तरदाता डेटा तक पहुँच।")}>
        <button className={cn(btn, "border-destructive/40 text-destructive")} onClick={() => setIncident(true)}><ShieldAlert className="size-4" /> {L("Report data incident", "डेटा घटना रिपोर्ट करें")}</button>
      </Header>
      <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{L("Lokdrishti approves the survey purpose, consent wording, retention policy and lawful basis. To be reviewed against Indian data-protection and election rules before go-live.", "सर्वे उद्देश्य, सहमति शब्दावली, प्रतिधारण नीति और वैध आधार लोकदृष्टि अनुमोदित करती है। लाइव होने से पहले भारतीय डेटा-संरक्षण और चुनाव नियमों के अनुसार समीक्षा होगी।")}</p>

      <div className="grid gap-4 xl:grid-cols-2">
        {panel(L("Retention period by data type", "डेटा प्रकार अनुसार प्रतिधारण अवधि"), (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="pb-2 font-medium">{L("Data type", "डेटा प्रकार")}</th><th className="pb-2 font-medium">{L("Months", "माह")}</th><th className="pb-2 font-medium">{L("Then", "फिर")}</th></tr></thead>
            <tbody>{ret.map((r, i) => (
              <tr key={r.type} className="border-t"><td className="py-2 pr-2">{r.type}</td>
                <td className="py-2 pr-2"><input type="number" min={1} value={r.months} onChange={(e) => setRet(ret.map((x, j) => (j === i ? { ...x, months: Number(e.target.value) } : x)))} className={cn(inputCls, "w-20")} /></td>
                <td className="py-2"><select value={r.after} onChange={(e) => setRet(ret.map((x, j) => (j === i ? { ...x, after: e.target.value } : x)))} className="h-9 rounded-md border bg-card px-2 text-sm">{["Delete", "Anonymise", "Archive", "Generalise to village"].map((o) => <option key={o}>{o}</option>)}</select></td></tr>
            ))}</tbody>
          </table>
        ), <button className={cn(btnPrimary, "h-8")} onClick={() => toast.success(L("Retention rules saved · logged in Audit Log", "प्रतिधारण नियम सहेजे · ऑडिट लॉग में दर्ज"))}>{L("Save", "सहेजें")}</button>)}

        {panel(L("Access to respondent-level data", "उत्तरदाता-स्तर डेटा तक पहुँच"), (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr><th />{accessRules.map((r) => <th key={r} className="px-1 pb-2 text-center font-medium text-muted-foreground">{r}</th>)}</tr></thead>
              <tbody>{accessRoles.map((ro) => (
                <tr key={ro} className="border-t"><td className="py-2 pr-2 text-sm">{ro}</td>
                  {accessRules.map((_, k) => <td key={k} className="text-center"><input type="checkbox" aria-label={`${ro}: ${accessRules[k]}`} disabled={ro === "Super Administrator" || ro === "Volunteer"} checked={access[ro]![k]} onChange={() => setAccess({ ...access, [ro]: access[ro]!.map((v, j) => (j === k ? !v : v)) })} /></td>)}</tr>
              ))}</tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">{L("Candidates never see other candidates' data. Volunteers see only their own unsynced records on the phone.", "उम्मीदवार कभी अन्य उम्मीदवारों का डेटा नहीं देखते। स्वयंसेवक फ़ोन पर केवल अपने बिना-सिंक रिकॉर्ड देखते हैं।")}</p>
          </div>
        ), <button className={cn(btnPrimary, "h-8")} onClick={() => toast.success(L("Access rules saved", "पहुँच नियम सहेजे"))}>{L("Save", "सहेजें")}</button>)}
      </div>

      {panel(L("Consent withdrawal & data-subject requests", "सहमति वापसी और डेटा-विषय अनुरोध"), (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">{[L("Request", "अनुरोध"), L("Type", "प्रकार"), L("Received", "प्राप्त"), L("Due", "देय"), L("Status", "स्थिति"), L("Notes", "टिप्पणी")].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>{dsr.map((d) => (
              <tr key={d.id} className="border-b last:border-0"><td className="px-3 py-2 font-mono text-xs">{d.id}</td><td className="px-3">{d.type}</td><td className="px-3 text-muted-foreground">{fmtDate(d.received)}</td><td className="px-3 text-muted-foreground">{fmtDate(d.due)}</td>
                <td className="px-3"><span className={cn("rounded px-2 py-0.5 text-xs font-medium", badgeClass(d.status))}>{d.status}</span></td><td className="px-3 text-muted-foreground">{d.note}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ), <button className={cn(btn, "h-8")} onClick={() => setDsrOpen(true)}><Plus className="size-4" /> {L("Log request", "अनुरोध दर्ज करें")}</button>)}

      <div className="grid gap-4 xl:grid-cols-2">
        {panel(L("Consent statement versions", "सहमति कथन संस्करण"), (
          <ol className="space-y-3">{consentVersions.map((c) => (
            <li key={c.v} className="border-l-2 pl-3 text-sm" style={{ borderColor: c.active ? "var(--success)" : "var(--border)" }}>
              <div className="flex items-center gap-2"><b>v{c.v}</b>{c.active && <span className="rounded bg-success/10 px-1.5 text-[11px] font-medium text-success">{L("Active", "सक्रिय")}</span>}<span className="ml-auto text-xs text-muted-foreground">{L("from", "से")} {fmtDate(c.from)}</span></div>
              <div className="text-xs">{c.note}</div><div className="text-xs text-muted-foreground">{c.by} · {c.responses.toLocaleString("en-IN")} {L("responses recorded under this version", "उत्तर इस संस्करण पर")}</div>
            </li>
          ))}</ol>
        ), <Link to="/campaign-management/questionnaire-builder" className="text-xs font-medium text-primary hover:underline">{L("Edit in Questionnaire Builder", "प्रश्नावली बिल्डर में बदलें")}</Link>)}
        {panel(L("Data incidents", "डेटा घटनाएँ"), (
          <ul className="divide-y text-sm">{incidents.map((x) => (
            <li key={x.id} className="flex items-center gap-3 py-2"><FileWarning className="size-4 shrink-0 text-destructive" /><div className="min-w-0 flex-1"><div>{x.what}</div><div className="text-xs text-muted-foreground"><span className="font-mono">{x.id}</span> · {fmtDate(x.at)} · {x.severity}</div></div><span className={cn("rounded px-2 py-0.5 text-xs font-medium", badgeClass(x.status))}>{x.status}</span></li>
          ))}</ul>
        ))}
      </div>

      {dsrOpen && <DsrDialog onClose={() => setDsrOpen(false)} onSave={(d) => { setDsr((all) => [{ ...d, id: `DSR-${String(all.length + 1).padStart(3, "0")}`, received: iso(TODAY), due: addDays(iso(TODAY), 30), status: "Open" }, ...all]); setDsrOpen(false); toast.success(L("Request logged", "अनुरोध दर्ज")); }} />}
      {incident && <IncidentDialog reporter={portals[role].user} onClose={() => setIncident(false)} onSave={(what, severity) => { setIncidents((all) => [{ id: `INC-${String(all.length + 1).padStart(3, "0")}`, at: iso(TODAY), what, severity, status: "Open" }, ...all]); setIncident(false); toast.success(L("Incident reported to the Lokdrishti data owner", "घटना लोकदृष्टि डेटा स्वामी को रिपोर्ट की गई")); }} />}
    </div>
  );
}

function DsrDialog({ onClose, onSave }: { onClose: () => void; onSave: (d: { type: string; note: string }) => void }) {
  const { L } = usePreview();
  const [type, setType] = useState("Consent withdrawal");
  const [note, setNote] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{L("Log a data-subject request", "डेटा-विषय अनुरोध दर्ज करें")}</DialogTitle></DialogHeader>
        <div className="grid gap-3 text-sm">
          <label className="grid gap-1"><span className="text-xs font-medium text-muted-foreground">{L("Type", "प्रकार")}</span><select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>{["Consent withdrawal", "Access request", "Correction", "Deletion"].map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="grid gap-1"><span className="text-xs font-medium text-muted-foreground">{L("Details (survey ID, how identity was verified)", "विवरण (सर्वे आईडी, पहचान कैसे सत्यापित)")}</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="rounded-md border bg-background p-2" /></label>
          <p className="text-xs text-muted-foreground">{L("Due date is set to 30 days. Withdrawal anonymises the record; aggregate counts already reported are not changed.", "देय तिथि 30 दिन। वापसी पर रिकॉर्ड अनाम होता है; पहले से रिपोर्ट की गई गिनती नहीं बदलती।")}</p>
        </div>
        <DialogFooter><button className={btn} onClick={onClose}>{L("Cancel", "रद्द करें")}</button><button className={btnPrimary} disabled={!note.trim()} onClick={() => onSave({ type, note })}>{L("Log request", "अनुरोध दर्ज करें")}</button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const incidentSteps = ["What happened", "Data affected", "Containment", "Notify & submit"];
function IncidentDialog({ reporter, onClose, onSave }: { reporter: string; onClose: () => void; onSave: (what: string, severity: string) => void }) {
  const { L } = usePreview();
  const [step, setStep] = useState(0);
  const [d, setD] = useState({ what: "", when: iso(TODAY), how: "Lost / stolen phone", data: new Set<string>(), records: "", contained: new Set<string>(), severity: "Medium" });
  const tog = (k: "data" | "contained", v: string) => setD((x) => { const s = new Set(x[k]); s.has(v) ? s.delete(v) : s.add(v); return { ...x, [k]: s }; });
  const ok = [!!d.what.trim(), d.data.size > 0, true, true][step];
  const summary = `Incident: ${d.what}\nWhen: ${fmtDate(d.when)} · Type: ${d.how}\nData: ${[...d.data].join(", ")} · Records: ${d.records || "unknown"}\nContainment: ${[...d.contained].join(", ") || "none yet"}\nSeverity: ${d.severity} · Reported by ${reporter}`;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldAlert className="size-5 text-destructive" />{L("Report a data incident", "डेटा घटना रिपोर्ट करें")}</DialogTitle></DialogHeader>
        <ol className="flex gap-1 overflow-x-auto">{incidentSteps.map((s, i) => <li key={s} className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs", i === step ? "border-destructive bg-destructive/10 font-medium text-destructive" : i < step ? "text-success" : "text-muted-foreground")}>{i + 1}. {s}</li>)}</ol>
        <div className="min-h-48 text-sm">
          {step === 0 && <div className="grid gap-3">
            <label className="grid gap-1"><span className="text-xs font-medium text-muted-foreground">{L("What happened?", "क्या हुआ?")}</span><textarea autoFocus value={d.what} onChange={(e) => setD({ ...d, what: e.target.value })} rows={3} className="rounded-md border bg-background p-2" /></label>
            <div className="grid grid-cols-2 gap-3"><label className="grid gap-1"><span className="text-xs font-medium text-muted-foreground">{L("When", "कब")}</span><input type="date" value={d.when} max={iso(TODAY)} onChange={(e) => setD({ ...d, when: e.target.value })} className={inputCls} /></label>
              <label className="grid gap-1"><span className="text-xs font-medium text-muted-foreground">{L("Type", "प्रकार")}</span><select value={d.how} onChange={(e) => setD({ ...d, how: e.target.value })} className={inputCls}>{["Lost / stolen phone", "Wrong person given access", "Data sent to wrong recipient", "Suspected unauthorised access", "Other"].map((o) => <option key={o}>{o}</option>)}</select></label></div>
          </div>}
          {step === 1 && <div className="grid gap-2">
            {["Respondent names", "Mobile numbers", "Ages", "GPS locations", "Survey answers", "Photos", "Volunteer accounts"].map((x) => <label key={x} className="flex items-center gap-2"><input type="checkbox" checked={d.data.has(x)} onChange={() => tog("data", x)} />{x}</label>)}
            <label className="mt-2 grid gap-1"><span className="text-xs font-medium text-muted-foreground">{L("Approx. records affected", "प्रभावित रिकॉर्ड (लगभग)")}</span><input type="number" min={0} value={d.records} onChange={(e) => setD({ ...d, records: e.target.value })} className={cn(inputCls, "w-32")} /></label>
          </div>}
          {step === 2 && <div className="grid gap-2">
            {["Suspended the user / volunteer login", "Revoked the device session", "Reset passwords", "Removed shared file or link", "Asked the recipient to delete"].map((x) => <label key={x} className="flex items-center gap-2"><input type="checkbox" checked={d.contained.has(x)} onChange={() => tog("contained", x)} />{x}</label>)}
            <label className="mt-2 grid gap-1"><span className="text-xs font-medium text-muted-foreground">{L("Severity", "गंभीरता")}</span><select value={d.severity} onChange={(e) => setD({ ...d, severity: e.target.value })} className={cn(inputCls, "w-40")}>{["Low", "Medium", "High"].map((o) => <option key={o}>{o}</option>)}</select></label>
          </div>}
          {step === 3 && <div className="grid gap-3">
            <textarea readOnly value={summary} rows={6} className="rounded-md border bg-muted/40 p-2 font-mono text-xs" />
            <div className="flex items-center gap-2"><button className={btn} onClick={() => { navigator.clipboard?.writeText(summary); toast.success(L("Copied", "कॉपी हुआ")); }}><Copy className="size-4" /> {L("Copy summary", "सारांश कॉपी करें")}</button></div>
            <p className="text-xs text-muted-foreground">{L("Submitting notifies the Lokdrishti data owner in-app and creates an audit entry. Any regulatory notification is decided by Lokdrishti under the documented process.", "जमा करने पर लोकदृष्टि डेटा स्वामी को इन-ऐप सूचना और ऑडिट प्रविष्टि। नियामक सूचना का निर्णय लोकदृष्टि प्रलेखित प्रक्रिया अनुसार करती है।")}</p>
          </div>}
        </div>
        <DialogFooter><button className={btn} onClick={() => (step ? setStep(step - 1) : onClose())}>{step ? L("Back", "पीछे") : L("Cancel", "रद्द करें")}</button>
          {step < 3 ? <button className={btnPrimary} disabled={!ok} onClick={() => setStep(step + 1)}>{L("Next", "आगे")}</button> : <button className="inline-flex h-9 items-center gap-2 rounded-md bg-destructive px-3 text-sm font-medium text-white" onClick={() => onSave(d.what, d.severity)}>{L("Submit incident", "घटना जमा करें")}</button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================= Voter identification (in discovery) ================= */
const voterOptions = [
  { icon: UserCheck, title: "Self-declared eligibility", hi: "स्व-घोषित पात्रता", state: "In base scope", desc: "Respondent confirms they are a registered voter in this area; recorded as a yes/no answer. No document is collected.", needs: ["Wording approved by Lokdrishti"] },
  { icon: IdCard, title: "Survey reference / ID field", hi: "सर्वे संदर्भ / आईडी फ़ील्ड", state: "In base scope", desc: "An optional free-text reference (e.g. household or booth number) captured by the volunteer, stored like other personal data.", needs: ["Field format agreed", "Retention rule set"] },
  { icon: Upload, title: "Authorised voter list upload", hi: "अधिकृत मतदाता सूची अपलोड", state: "Needs legal review", desc: "Lokdrishti uploads a voter list it is authorised to use; surveys can be matched to it for de-duplication only.", needs: ["Legal basis confirmed", "Privacy & security review", "Restricted access"] },
  { icon: Fingerprint, title: "External verification service", hi: "बाहरी सत्यापन सेवा", state: "Requires approval", desc: "Integration with a legally authorised verification service, only if one exists and is approved.", needs: ["Service availability", "Access approval", "Separate discovery & costing"] },
];
export function VoterIdentification() {
  const { L } = usePreview();
  const [shortlist, setShortlist] = useState<Set<string>>(new Set(["Self-declared eligibility"]));
  return (
    <div className="space-y-5">
      <Header section="Administration" title="Voter Identification" desc={L("Options under evaluation with Lokdrishti. Nothing here is switched on yet.", "लोकदृष्टि के साथ मूल्यांकन हेतु विकल्प। अभी कुछ भी चालू नहीं।")}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1.5 text-xs font-semibold text-warning"><ListChecks className="size-4" /> {L("In discovery", "खोज चरण में")}</span>
      </Header>
      <div role="note" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{L("Age check is not proof of voter registration. No EPIC/Aadhaar/government API access is assumed.", "आयु जाँच मतदाता पंजीकरण का प्रमाण नहीं है। EPIC/आधार/सरकारी API तक पहुँच नहीं मानी गई है।")}</div>
      <div className="grid gap-4 md:grid-cols-2">
        {voterOptions.map((o) => { const Icon = o.icon, on = shortlist.has(o.title); return (
          <section key={o.title} className={cn("panel flex flex-col p-5", on && "ring-2 ring-primary/40")}>
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground"><Icon className="size-5" /></div>
              <div className="min-w-0 flex-1"><h2 className="font-semibold">{L(o.title, o.hi)}</h2><span className={cn("mt-1 inline-block rounded px-2 py-0.5 text-[11px] font-medium", o.state === "In base scope" ? "bg-success/10 text-success" : "bg-warning/15 text-warning")}>{o.state}</span></div>
            </div>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{o.desc}</p>
            <div className="mt-3 text-xs"><div className="mb-1 font-medium">{L("Before it can be used", "उपयोग से पहले")}</div><ul className="space-y-0.5">{o.needs.map((x) => <li key={x} className="flex items-center gap-1.5 text-muted-foreground"><BadgeCheck className="size-3.5" />{x}</li>)}</ul></div>
            <label className="mt-4 flex items-center justify-between gap-3 border-t pt-3 text-sm">{L("Shortlist for discovery", "खोज हेतु चुनें")}<Switch checked={on} onCheckedChange={(v) => setShortlist((s) => { const n = new Set(s); v ? n.add(o.title) : n.delete(o.title); return n; })} /></label>
          </section>
        ); })}
      </div>
      <p className="text-xs text-muted-foreground">{L("Shortlisted options go to the discovery workshop. Any external integration needs separate technical discovery, access approval and a commercial assessment.", "चुने गए विकल्प खोज कार्यशाला में जाएँगे। किसी भी बाहरी एकीकरण के लिए अलग तकनीकी खोज, पहुँच अनुमोदन और व्यावसायिक आकलन चाहिए।")}</p>
    </div>
  );
}

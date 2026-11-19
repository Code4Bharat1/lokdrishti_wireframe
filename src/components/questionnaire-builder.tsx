// Questionnaire Builder (Lokdrishti). Extends the original survey builder: bilingual questions, conditional logic,
// bulk import with validation, versions, issue taxonomy, priority bands and campaign settings. Demo state only.
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Copy, Download, Eye, FileUp, GripVertical, History, Plus, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { btn, btnPrimary, inputCls } from "@/components/module-views";
import { downloadCsv } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import { usePreview, portals } from "@/lib/preview";
import {
  questionnaire, qTypes, issueTaxonomy, priorityBands, questionnaireVersions, consentStatement, upCampaigns, fmtDate, iso, TODAY,
  type Question, type QType, type Bi, type Band, type PhotoMode,
} from "@/data/demo";

const hasOptions = (t: QType) => ["Single select", "Dropdown", "Multi-select", "Conditional"].includes(t);
export const bandTone = ["bg-muted text-muted-foreground", "bg-primary/15 text-primary", "bg-warning/20 text-warning", "bg-destructive/15 text-destructive"];
const area = "w-full rounded-md border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring/30";

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: readonly T[]; onChange: (v: T) => void; label?: (v: T) => string }) {
  return (
    <div className="flex w-fit rounded-md border bg-muted p-0.5 text-xs font-medium">
      {options.map((o) => <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o} className={cn("rounded px-3 py-1.5 text-muted-foreground", value === o && "bg-card text-foreground shadow-card")}>{label ? label(o) : o}</button>)}
    </div>
  );
}
const Panel = ({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) => (
  <section className="panel"><div className="flex items-center gap-2 border-b px-4 py-3"><h2 className="flex-1 text-sm font-semibold">{title}</h2>{action}</div><div className="p-4">{children}</div></section>
);

export function QuestionnaireBuilder() {
  const { L } = usePreview();
  const [tab, setTab] = useState<"q" | "tax" | "pri" | "set">("q");
  const [qs, setQs] = useState<Question[]>(questionnaire);
  const [taxonomy, setTaxonomy] = useState(issueTaxonomy);
  const tabs = [["q", L("Questions", "प्रश्न")], ["tax", L("Issue taxonomy", "मुद्दा वर्गीकरण")], ["pri", L("Priority scale", "प्राथमिकता पैमाना")], ["set", L("Campaign settings", "अभियान सेटिंग")]] as const;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap rounded-md border bg-muted p-0.5 text-xs font-medium sm:w-fit">
        {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cn("flex-1 rounded px-4 py-1.5 text-muted-foreground", tab === k && "bg-card text-foreground shadow-card")}>{l}</button>)}
      </div>
      {tab === "q" && <QuestionsTab qs={qs} setQs={setQs} issues={taxonomy.map((c) => c.en)} />}
      {tab === "tax" && <TaxonomyTab qs={qs} setQs={setQs} taxonomy={taxonomy} setTaxonomy={setTaxonomy} />}
      {tab === "pri" && <PriorityTab />}
      {tab === "set" && <SettingsTab />}
    </div>
  );
}

/* ---------------- Questions ---------------- */
function QuestionsTab({ qs, setQs, issues }: { qs: Question[]; setQs: React.Dispatch<React.SetStateAction<Question[]>>; issues: string[] }) {
  const { L, role } = usePreview();
  const [drag, setDrag] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [versions, setVersions] = useState(questionnaireVersions);
  const upd = (id: number, p: Partial<Question>) => setQs((a) => a.map((q) => (q.id === id ? { ...q, ...p } : q)));
  const move = (from: number, to: number) => setQs((a) => { if (to < 0 || to >= a.length) return a; const b = [...a]; const [x] = b.splice(from, 1); b.splice(to, 0, x!); return b; });
  const add = (type: QType) => setQs((a) => [...a, { id: Date.now(), type, en: "", hi: "", options: hasOptions(type) ? [{ en: "Option 1", hi: "विकल्प 1" }, { en: "Option 2", hi: "विकल्प 2" }] : [], required: false, issue: "Other" }]);
  const active = versions.find((v) => v.active)!;
  const saveVersion = () => {
    const v = `v${versions.length + 1}`;
    setVersions((all) => [{ v, date: iso(TODAY), by: portals[role].user, changes: `${qs.length} questions; edited in builder`, active: true }, ...all.map((x) => ({ ...x, active: false }))]);
    toast.success(`${v} ${L("activated. New responses use this version.", "सक्रिय। नए उत्तर इसी संस्करण पर दर्ज होंगे।")}`);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <div className="panel flex flex-wrap items-center gap-2 p-3">
          <div className="min-w-0 flex-1"><div className="font-medium">Lucknow Central Issue Survey</div><div className="text-xs text-muted-foreground">{qs.length} {L("questions", "प्रश्न")} · {L("English + Hindi", "अंग्रेज़ी + हिन्दी")} · <span className="font-medium text-success">{active.v} {L("active", "सक्रिय")}</span></div></div>
          <button className={btn} onClick={() => setPreview(true)}><Eye className="size-4" /> {L("Preview", "पूर्वावलोकन")}</button>
          <button className={btn} onClick={() => setImporting(true)}><FileUp className="size-4" /> {L("Bulk import", "बल्क इम्पोर्ट")}</button>
          <button className={btnPrimary} onClick={saveVersion}><Check className="size-4" /> {L("Save as new version", "नए संस्करण के रूप में सहेजें")}</button>
        </div>
        {qs.map((q, i) => (
          <div key={q.id} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); }} onDragEnd={() => setDrag(null)}
            className={cn("transition-opacity", drag === i && "opacity-40")}>
            <QuestionCard q={q} index={i} earlier={qs.slice(0, i)} issues={issues} onChange={(p) => upd(q.id, p)} onMove={(d) => move(i, i + d)}
              onDuplicate={() => setQs((a) => [...a.slice(0, i + 1), { ...q, id: Date.now() }, ...a.slice(i + 1)])} onDelete={() => setQs((a) => a.filter((x) => x.id !== q.id))} />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <Panel title={L("Add question", "प्रश्न जोड़ें")}>
          <div className="grid gap-1.5">{qTypes.map((t) => <button key={t} onClick={() => add(t)} className="flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"><Plus className="size-3.5" /> {t}</button>)}</div>
        </Panel>
        <Panel title={L("Version history", "संस्करण इतिहास")} action={<History className="size-4 text-muted-foreground" />}>
          <ol className="space-y-3">
            {versions.map((v) => (
              <li key={v.v} className="border-l-2 pl-3 text-sm" style={{ borderColor: v.active ? "var(--success)" : "var(--border)" }}>
                <div className="flex items-center gap-2"><b>{v.v}</b>{v.active && <span className="rounded bg-success/10 px-1.5 text-[11px] font-medium text-success">{L("Active", "सक्रिय")}</span>}<span className="ml-auto text-xs text-muted-foreground">{fmtDate(v.date)}</span></div>
                <div className="text-xs text-muted-foreground">{v.by}</div>
                <div className="mt-0.5 text-xs">{v.changes}</div>
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-md bg-muted p-2 text-xs text-muted-foreground">{L("Responses stay linked to the version they were collected on.", "उत्तर उसी संस्करण से जुड़े रहते हैं जिस पर वे एकत्र किए गए थे।")}</p>
        </Panel>
      </div>
      {preview && <PreviewDialog qs={qs} onClose={() => setPreview(false)} />}
      {importing && <BulkImport onClose={() => setImporting(false)} onImport={(rows) => { setQs((a) => [...a, ...rows]); setImporting(false); }} />}
    </div>
  );
}

function QuestionCard({ q, index, earlier, issues, onChange, onMove, onDuplicate, onDelete }: { q: Question; index: number; earlier: Question[]; issues: string[]; onChange: (p: Partial<Question>) => void; onMove: (d: number) => void; onDuplicate: () => void; onDelete: () => void }) {
  const { L } = usePreview();
  const [lang, setLang] = useState<"en" | "hi">("en");
  const parent = earlier.find((x) => x.id === q.showIf?.q);
  const parentAnswers = parent ? (parent.type === "Yes / No" ? ["Yes", "No"] : parent.options.map((o) => o.en)) : [];
  const missingHi = !q.hi.trim();
  return (
    <div className="panel p-4">
      <div className="flex flex-wrap items-center gap-2">
        <GripVertical className="size-4 cursor-grab text-muted-foreground" aria-label={L("Drag to reorder", "क्रम बदलने के लिए खींचें")} />
        <span className="text-xs font-semibold text-muted-foreground">Q{index + 1}</span>
        <select value={q.type} onChange={(e) => { const type = e.target.value as QType; onChange({ type, options: hasOptions(type) && !q.options.length ? [{ en: "Option 1", hi: "विकल्प 1" }, { en: "Option 2", hi: "विकल्प 2" }] : q.options, ...(type === "Conditional" ? {} : { showIf: undefined }) }); }} className="h-8 rounded-md border bg-card px-2 text-xs">{qTypes.map((t) => <option key={t}>{t}</option>)}</select>
        <select value={q.issue} onChange={(e) => onChange({ issue: e.target.value })} className="h-8 rounded-md border bg-card px-2 text-xs" aria-label={L("Issue category", "मुद्दा श्रेणी")}>{issues.map((t) => <option key={t}>{t}</option>)}</select>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Switch checked={q.required} onCheckedChange={(v) => onChange({ required: v })} /> {L("Mandatory", "अनिवार्य")}</label>
        <div className="ml-auto flex gap-0.5">
          <button aria-label="Move up" onClick={() => onMove(-1)} className="rounded p-1.5 hover:bg-muted"><ArrowUp className="size-3.5" /></button>
          <button aria-label="Move down" onClick={() => onMove(1)} className="rounded p-1.5 hover:bg-muted"><ArrowDown className="size-3.5" /></button>
          <button aria-label="Duplicate" onClick={onDuplicate} className="rounded p-1.5 hover:bg-muted"><Copy className="size-3.5" /></button>
          <button aria-label="Delete" onClick={onDelete} className="rounded p-1.5 hover:bg-muted"><Trash2 className="size-3.5" /></button>
        </div>
      </div>
      {q.type === "Conditional" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-accent/60 px-3 py-2 text-xs">
          <span className="font-medium">{L("Show only if", "केवल तब दिखाएँ जब")}</span>
          <select value={q.showIf?.q ?? ""} onChange={(e) => { const p = earlier.find((x) => x.id === Number(e.target.value)); onChange({ showIf: p ? { q: p.id, equals: p.type === "Yes / No" ? "Yes" : p.options[0]?.en ?? "" } : undefined }); }} className="h-7 rounded border bg-card px-1.5">
            <option value="">{L("pick an earlier question", "पिछला प्रश्न चुनें")}</option>
            {earlier.filter((x) => x.type === "Yes / No" || hasOptions(x.type)).map((x) => <option key={x.id} value={x.id}>Q{earlier.indexOf(x) + 1}: {x.en.slice(0, 40)}</option>)}
          </select>
          {parent && <><span>=</span><select value={q.showIf!.equals} onChange={(e) => onChange({ showIf: { q: parent.id, equals: e.target.value } })} className="h-7 rounded border bg-card px-1.5">{parentAnswers.map((a) => <option key={a}>{a}</option>)}</select></>}
        </div>
      )}
      <div className="mt-3 flex gap-1 border-b text-xs font-medium">
        {(["en", "hi"] as const).map((l) => (
          <button key={l} onClick={() => setLang(l)} className={cn("-mb-px border-b-2 px-3 py-1.5", lang === l ? "border-primary text-foreground" : "border-transparent text-muted-foreground")}>
            {l === "en" ? "English" : "हिन्दी"}{l === "hi" && missingHi && <span className="ml-1 inline-block size-1.5 rounded-full bg-destructive align-middle" title="Missing Hindi text" />}
          </button>
        ))}
      </div>
      <input value={q[lang]} onChange={(e) => onChange({ [lang]: e.target.value })} lang={lang} placeholder={lang === "en" ? "Question text" : "प्रश्न का पाठ"} className={cn(inputCls, "mt-3")} />
      {hasOptions(q.type) && (
        <div className="mt-2 space-y-1.5 pl-1">
          {q.options.map((o, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <span className={cn("size-3 shrink-0 border", q.type === "Multi-select" ? "rounded-sm" : "rounded-full")} />
              <input value={o[lang]} lang={lang} onChange={(e) => onChange({ options: q.options.map((x, k) => (k === oi ? { ...x, [lang]: e.target.value } : x)) })} className="h-8 flex-1 rounded-md border bg-background px-2 text-sm" />
              <button aria-label="Remove option" onClick={() => onChange({ options: q.options.filter((_, k) => k !== oi) })} className="rounded p-1 hover:bg-muted"><X className="size-3.5" /></button>
            </div>
          ))}
          <button onClick={() => onChange({ options: [...q.options, { en: `Option ${q.options.length + 1}`, hi: `विकल्प ${q.options.length + 1}` }] })} className="text-xs font-medium text-primary hover:underline">+ {L("Add option", "विकल्प जोड़ें")}</button>
        </div>
      )}
      {q.type === "Numeric rating" && <div className="mt-2 flex gap-1">{Array.from({ length: 10 }, (_, i) => <span key={i} className="grid size-7 place-items-center rounded border text-xs text-muted-foreground">{i + 1}</span>)}</div>}
      {q.type === "Yes / No" && <div className="mt-2 flex gap-2 text-xs text-muted-foreground"><span className="rounded border px-3 py-1">{lang === "en" ? "Yes" : "हाँ"}</span><span className="rounded border px-3 py-1">{lang === "en" ? "No" : "नहीं"}</span></div>}
    </div>
  );
}

function PreviewDialog({ qs, onClose }: { qs: Question[]; onClose: () => void }) {
  const [lang, setLang] = useState<"en" | "hi">("hi");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Lucknow Central Issue Survey</DialogTitle></DialogHeader>
        <Seg value={lang} options={["en", "hi"] as const} onChange={setLang} label={(l) => (l === "en" ? "English" : "हिन्दी")} />
        <div className="space-y-5">
          {qs.map((q, i) => {
            const parent = qs.find((x) => x.id === q.showIf?.q);
            return (
              <div key={q.id}>
                {parent && <div className="mb-1 text-[11px] text-muted-foreground">↳ {lang === "en" ? "Shown if" : "तब दिखेगा जब"} Q{qs.indexOf(parent) + 1} = {q.showIf!.equals}</div>}
                <div className="text-sm font-medium">{i + 1}. {q[lang] || "—"}{q.required && <span className="text-destructive"> *</span>}</div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {q.type === "Yes / No" && (lang === "en" ? "Yes / No" : "हाँ / नहीं")}
                  {hasOptions(q.type) && q.options.map((o) => <span key={o.en}>○ {o[lang]}</span>)}
                  {q.type === "Numeric rating" && "1 – 10"}
                  {q.type === "Free text" && "________"}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Bulk import ---------------- */
type ImportRow = { row: number; type: string; en: string; hi: string; options: string; required: string; issue: string };
const csvCols = [{ key: "type", label: "type" }, { key: "en", label: "question_en" }, { key: "hi", label: "question_hi" }, { key: "options", label: "options (a=अ|b=ब)" }, { key: "required", label: "required (Y/N)" }, { key: "issue", label: "issue" }];

// Sample upload used when the file isn't a CSV (an .xlsx needs a parser this wireframe doesn't ship).
export function sampleRows(): ImportRow[] {
  const pairs = issueTaxonomy.flatMap((c) => c.subs.map((s) => [c, s] as const)).slice(0, 21);
  const types: QType[] = ["Numeric rating", "Yes / No", "Single select", "Dropdown", "Multi-select"];
  return pairs.map(([c, s], i) => {
    const type = types[i % types.length]!;
    return { row: i + 2, type: i === 4 ? "" : type, en: `How serious is the "${s}" problem in your area?`, hi: i === 16 ? "" : `आपके क्षेत्र में ${c.hi} (${s}) की समस्या कितनी गंभीर है?`,
      options: i === 12 ? "Yes=हाँ" : hasOptions(type) ? "Low=कम|Medium=मध्यम|High=अधिक" : "", required: "Y", issue: c.en };
  });
}
export function validateRow(r: ImportRow): string | null {
  if (!(qTypes as readonly string[]).includes(r.type)) return "Missing or unknown question type";
  if (!r.en.trim()) return "Missing English text";
  if (!r.hi.trim()) return "Missing Hindi text";
  const opts = r.options.split("|").filter(Boolean);
  if (hasOptions(r.type as QType) && (opts.length < 2 || opts.some((o) => !o.includes("=")))) return "Bad options: need 2+ options as English=हिन्दी";
  return null;
}
// ponytail: naive CSV split (no quoted commas); swap for a CSV parser if real templates need commas in text.
const parseCsv = (text: string): ImportRow[] => text.trim().split(/\r?\n/).slice(1).map((line, i) => { const [type = "", en = "", hi = "", options = "", required = "", issue = ""] = line.split(","); return { row: i + 2, type: type.trim(), en, hi, options, required, issue: issue.trim() || "Other" }; });

function BulkImport({ onClose, onImport }: { onClose: () => void; onImport: (q: Question[]) => void }) {
  const { L } = usePreview();
  const [file, setFile] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const checked = rows.map((r) => ({ r, err: validateRow(r) }));
  const valid = checked.filter((x) => !x.err);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setFile(f.name);
    setRows(f.name.toLowerCase().endsWith(".csv") ? parseCsv(await f.text()) : sampleRows());
  };
  const toQuestion = (r: ImportRow, i: number): Question => ({ id: Date.now() + i, type: r.type as QType, en: r.en, hi: r.hi, required: r.required.trim().toUpperCase() !== "N", issue: r.issue,
    options: r.options.split("|").filter(Boolean).map((o) => { const [en = "", hi = ""] = o.split("="); return { en, hi }; }) });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader><DialogTitle>{L("Bulk import questions", "प्रश्न बल्क इम्पोर्ट")}</DialogTitle></DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <label className={cn(btnPrimary, "cursor-pointer")}><FileUp className="size-4" /> {L("Upload Excel / CSV", "Excel / CSV अपलोड करें")}<input type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} /></label>
          <button className={btn} onClick={() => downloadCsv("questionnaire-import-template", sampleRows().slice(0, 3), csvCols)}><Download className="size-4" /> {L("Download template", "टेम्पलेट डाउनलोड करें")}</button>
          <button className={btn} onClick={() => { setFile("sample-questions.xlsx"); setRows(sampleRows()); }}>{L("Use sample file", "नमूना फ़ाइल उपयोग करें")}</button>
          {file && <span className="text-xs text-muted-foreground">{file} · {rows.length} {L("rows", "पंक्तियाँ")}</span>}
        </div>
        {rows.length > 0 ? (
          <div className="max-h-[50vh] overflow-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card"><tr className="border-b text-left text-muted-foreground">{["Row", "Type", "Question (EN)", "हिन्दी", "Options", "Result"].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {checked.map(({ r, err }) => (
                  <tr key={r.row} className={cn("border-b last:border-0", err ? "bg-destructive/5" : "bg-success/5")}>
                    <td className="px-2 py-1.5 font-mono">{r.row}</td>
                    <td className="px-2">{r.type || <i className="text-destructive">—</i>}</td>
                    <td className="max-w-56 truncate px-2" title={r.en}>{r.en}</td>
                    <td className="max-w-56 truncate px-2" title={r.hi}>{r.hi || <i className="text-destructive">—</i>}</td>
                    <td className="max-w-40 truncate px-2 text-muted-foreground">{r.options || "—"}</td>
                    <td className={cn("whitespace-nowrap px-2 font-medium", err ? "text-destructive" : "text-success")}>{err ?? "✓ Valid"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">{L("Upload a file to see the validation preview.", "सत्यापन पूर्वावलोकन देखने के लिए फ़ाइल अपलोड करें।")}</div>}
        <DialogFooter className="sm:justify-between">
          <span className="self-center text-xs text-muted-foreground">{rows.length > 0 && `${valid.length} ${L("valid", "मान्य")} · ${rows.length - valid.length} ${L("need correction", "सुधार आवश्यक")}`}</span>
          <div className="flex gap-2">
            <button className={btn} onClick={onClose}>{L("Cancel", "रद्द करें")}</button>
            <button className={btnPrimary} disabled={!valid.length} onClick={() => { onImport(valid.map((x, i) => toQuestion(x.r, i))); toast.success(`${valid.length} ${L("questions imported", "प्रश्न इम्पोर्ट हुए")}${rows.length > valid.length ? ` · ${rows.length - valid.length} ${L("rows skipped, fix and re-upload", "पंक्तियाँ छोड़ी गईं, सुधार कर फिर अपलोड करें")}` : ""}`); }}>
              {L(`Import ${valid.length} valid rows`, `${valid.length} मान्य पंक्तियाँ इम्पोर्ट करें`)}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Issue taxonomy ---------------- */
function TaxonomyTab({ qs, setQs, taxonomy, setTaxonomy }: { qs: Question[]; setQs: React.Dispatch<React.SetStateAction<Question[]>>; taxonomy: (Bi & { subs: string[] })[]; setTaxonomy: React.Dispatch<React.SetStateAction<(Bi & { subs: string[] })[]>> }) {
  const { L, lang } = usePreview();
  const [newCat, setNewCat] = useState("");
  const addSub = (i: number, s: string) => s.trim() && setTaxonomy((all) => all.map((c, j) => (j === i ? { ...c, subs: [...c.subs, s.trim()] } : c)));
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title={L("Categories & subcategories", "श्रेणियाँ और उप-श्रेणियाँ")}>
        <div className="divide-y">
          {taxonomy.map((c, i) => (
            <div key={c.en} className="py-3 first:pt-0">
              <div className="flex items-baseline gap-2"><span className="font-medium">{c.en}</span><span className="text-sm text-muted-foreground">{c.hi}</span><span className="ml-auto text-xs text-muted-foreground">{qs.filter((q) => q.issue === c.en).length} {L("questions", "प्रश्न")}</span></div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {c.subs.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground">{s}
                    <button aria-label={`Remove ${s}`} onClick={() => setTaxonomy((all) => all.map((x, j) => (j === i ? { ...x, subs: x.subs.filter((y) => y !== s) } : x)))}><X className="size-3" /></button></span>
                ))}
                <input placeholder={L("+ subcategory", "+ उप-श्रेणी")} onKeyDown={(e) => { if (e.key === "Enter") { addSub(i, e.currentTarget.value); e.currentTarget.value = ""; } }} className="h-6 w-28 rounded border bg-background px-1.5 text-xs" />
              </div>
            </div>
          ))}
        </div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!newCat.trim()) return; setTaxonomy((all) => [...all.slice(0, -1), { en: newCat.trim(), hi: "", subs: [] }, all.at(-1)!]); setNewCat(""); }}>
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder={L("New category", "नई श्रेणी")} className={inputCls} />
          <button className={btn}><Plus className="size-4" /> {L("Add", "जोड़ें")}</button>
        </form>
      </Panel>
      <Panel title={L("Question-to-issue mapping", "प्रश्न-मुद्दा मैपिंग")}>
        <table className="w-full text-sm">
          <tbody>
            {qs.map((q, i) => (
              <tr key={q.id} className="border-b last:border-0">
                <td className="py-2 pr-2 align-top text-xs font-semibold text-muted-foreground">Q{i + 1}</td>
                <td className="py-2 pr-3">{(lang === "hi" ? q.hi : q.en) || "—"}</td>
                <td className="py-2"><select value={q.issue} onChange={(e) => setQs((a) => a.map((x) => (x.id === q.id ? { ...x, issue: e.target.value } : x)))} className="h-8 w-44 rounded-md border bg-card px-2 text-xs">{taxonomy.map((c) => <option key={c.en} value={c.en}>{lang === "hi" && c.hi ? c.hi : c.en}</option>)}</select></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

/* ---------------- Priority scale ---------------- */
// Bands must tile 1–10 exactly: no gaps, no overlaps.
export function bandError(bands: Band[]): string | null {
  let next = 1;
  for (const b of bands) {
    if (b.from !== next) return `Band "${b.label}" should start at ${next}`;
    if (b.to < b.from) return `Band "${b.label}" ends before it starts`;
    next = b.to + 1;
  }
  return next === 11 ? null : "Bands must end at 10";
}

function PriorityTab() {
  const { L } = usePreview();
  const [bands, setBands] = useState<Band[]>(priorityBands);
  const [rated, setRated] = useState("Urgency: how soon this needs fixing");
  const [threshold, setThreshold] = useState(7);
  const err = bandError(bands);
  const set = (i: number, p: Partial<Band>) => setBands((all) => all.map((b, j) => (j === i ? { ...b, ...p } : b)));
  return (
    <div className="grid max-w-4xl gap-4">
      <Panel title={L("What is being rated", "किसकी रेटिंग हो रही है")}>
        <input value={rated} onChange={(e) => setRated(e.target.value)} list="rated-list" className={inputCls} />
        <datalist id="rated-list"><option value="Urgency: how soon this needs fixing" /><option value="Seriousness: how badly it affects the household" /></datalist>
        <p className="mt-2 text-xs text-muted-foreground">{L("Volunteers read this to respondents. Don't mix meanings (e.g. urgency and seriousness) in the same calculation.", "स्वयंसेवक यह उत्तरदाताओं को पढ़कर सुनाते हैं। एक ही गणना में अलग अर्थ (जैसे तात्कालिकता और गंभीरता) न मिलाएँ।")}</p>
      </Panel>
      <Panel title={L("Scale 1–10 and bands", "पैमाना 1–10 और श्रेणियाँ")}>
        <div className="flex overflow-hidden rounded-md border">
          {Array.from({ length: 10 }, (_, i) => { const bi = bands.findIndex((b) => i + 1 >= b.from && i + 1 <= b.to); return <div key={i} className={cn("flex-1 py-2 text-center text-sm font-semibold tabular-nums", bandTone[bi] ?? "bg-destructive/30")}>{i + 1}</div>; })}
        </div>
        <table className="mt-4 w-full text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="pb-2 font-medium">{L("From", "से")}</th><th className="pb-2 font-medium">{L("To", "तक")}</th><th className="pb-2 font-medium">{L("Label", "नाम")}</th><th /></tr></thead>
          <tbody>
            {bands.map((b, i) => (
              <tr key={i}>
                <td className="py-1 pr-2"><input type="number" min={1} max={10} value={b.from} onChange={(e) => set(i, { from: Number(e.target.value) })} className={cn(inputCls, "w-20")} /></td>
                <td className="py-1 pr-2"><input type="number" min={1} max={10} value={b.to} onChange={(e) => set(i, { to: Number(e.target.value) })} className={cn(inputCls, "w-20")} /></td>
                <td className="py-1 pr-2"><input value={b.label} onChange={(e) => set(i, { label: e.target.value })} className={inputCls} /></td>
                <td className="py-1"><span className={cn("rounded px-2 py-0.5 text-xs font-medium", bandTone[i])}>{b.from}–{b.to}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {err && <p className="mt-2 text-xs font-medium text-destructive">{err}</p>}
        <label className="mt-4 flex flex-wrap items-center gap-2 text-sm">{L("Count as a high-priority mention when the score is at least", "उच्च प्राथमिकता उल्लेख तब गिनें जब स्कोर कम से कम हो")}
          <select value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="h-8 rounded-md border bg-card px-2">{[6, 7, 8, 9].map((v) => <option key={v}>{v}</option>)}</select></label>
        <div className="mt-4 flex justify-end"><button className={btnPrimary} disabled={!!err} onClick={() => toast.success(L("Priority scale saved", "प्राथमिकता पैमाना सहेजा गया"))}>{L("Save scale", "पैमाना सहेजें")}</button></div>
      </Panel>
    </div>
  );
}

/* ---------------- Campaign settings ---------------- */
function SettingsTab() {
  const { L } = usePreview();
  const [campaign, setCampaign] = useState(upCampaigns[0]!.id);
  const [photo, setPhoto] = useState<PhotoMode>("Optional");
  const [lang, setLang] = useState<"en" | "hi">("hi");
  const [consent, setConsent] = useState(consentStatement);
  const [draft, setDraft] = useState<Bi>(consentStatement);
  const dirty = draft.en !== consent.en || draft.hi !== consent.hi;
  return (
    <div className="grid max-w-4xl gap-4">
      <Panel title={L("Campaign", "अभियान")}>
        <select value={campaign} onChange={(e) => setCampaign(e.target.value)} className={inputCls}>{upCampaigns.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.candidate}</option>)}</select>
      </Panel>
      <Panel title={L("Survey photo upload", "सर्वे फ़ोटो अपलोड")}>
        <Seg value={photo} options={["Off", "Optional", "Mandatory"] as const} onChange={(v) => { setPhoto(v); toast.success(`${L("Photo upload", "फ़ोटो अपलोड")}: ${v}`); }} />
        <p className="mt-2 text-xs text-muted-foreground">{{ Off: L("The photo step is hidden in the app.", "ऐप में फ़ोटो चरण छिपा रहेगा।"), Optional: L("Volunteers may skip the photo.", "स्वयंसेवक फ़ोटो छोड़ सकते हैं।"), Mandatory: L("A survey can't be submitted without a photo.", "फ़ोटो के बिना सर्वे जमा नहीं होगा।") }[photo]}</p>
      </Panel>
      <Panel title={L("Consent statement", "सहमति कथन")} action={<span className="rounded bg-success/10 px-2 py-0.5 text-xs font-medium text-success">v{consent.version} {L("active", "सक्रिय")}</span>}>
        <Seg value={lang} options={["hi", "en"] as const} onChange={setLang} label={(l) => (l === "en" ? "English" : "हिन्दी")} />
        <textarea value={draft[lang]} lang={lang} onChange={(e) => setDraft({ ...draft, [lang]: e.target.value })} rows={6} className={cn(area, "mt-3")} />
        <p className="mt-2 text-xs text-muted-foreground">{L("Each response records the consent version and timestamp. Wording is approved by Lokdrishti.", "हर उत्तर के साथ सहमति संस्करण और समय दर्ज होता है। शब्दावली लोकदृष्टि द्वारा अनुमोदित।")}</p>
        <div className="mt-3 flex justify-end gap-2">
          <button className={btn} disabled={!dirty} onClick={() => setDraft(consent)}>{L("Discard", "रद्द करें")}</button>
          <button className={btnPrimary} disabled={!dirty || !draft.en.trim() || !draft.hi.trim()} onClick={() => { const next = { ...draft, version: consent.version + 1 }; setConsent(next); setDraft(next); toast.success(`${L("Consent", "सहमति")} v${next.version} ${L("published", "प्रकाशित")}`); }}>
            {L(`Publish as v${consent.version + 1}`, `v${consent.version + 1} के रूप में प्रकाशित करें`)}
          </button>
        </div>
      </Panel>
    </div>
  );
}

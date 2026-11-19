// Volunteer mobile app preview (Android style, in a phone frame). Simulated: no device APIs, no network.
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Bell, Camera, Check, CheckCircle2, ChevronRight, CloudOff, CloudUpload, FileClock, Home, Lock, MapPin, MapPinOff,
  RefreshCw, Save, Signal, BatteryFull, Wifi, WifiOff, XCircle, Info, AlertTriangle, ClipboardList,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { btn, btnPrimary, inputCls } from "@/components/module-views";
import { bandTone } from "@/components/questionnaire-builder";
import { cn } from "@/lib/utils";
import { usePreview } from "@/lib/preview";
import { questionnaire, yesNo, issueTaxonomy, priorityBands, consentStatement, upCampaigns, fmtDate, daysLeft, bandFor, type PhotoMode, type Question } from "@/data/demo";

type Screen = "login" | "home" | "purpose" | "consent" | "declined" | "respondent" | "question" | "issues" | "photo" | "review" | "done" | "drafts" | "sync" | "expired" | "notifications";
type Survey = { name: string; mobile: string; age: string; consent: boolean; answers: Record<number, string | string[]>; issues: Record<string, number>; other: string; photo: boolean };
type Rec = { id: string; name: string; at: string; status: "Pending" | "Syncing" | "Synced" | "Failed"; syncedAt?: string; gps: boolean; reason?: string };

const campaign = upCampaigns[0]!; // Lucknow Central Issue Survey · Rajesh Verma
const blank = (): Survey => ({ name: "", mobile: "", age: "", consent: false, answers: {}, issues: {}, other: "", photo: false });
const sample = (): Survey => ({ ...blank(), name: "Sunita Devi", age: "34", consent: true });
const initialQueue: Rec[] = [
  { id: "SRV-30413", name: "Shabana", at: "10:34", status: "Pending", gps: true },
  { id: "SRV-30412", name: "Ramesh Yadav", at: "10:21", status: "Pending", gps: false },
  { id: "SRV-30411", name: "Kamla Devi", at: "10:05", status: "Pending", gps: true },
  { id: "SRV-30409", name: "Mohan Lal", at: "09:51", status: "Failed", gps: true, reason: "Server timeout" },
  { id: "SRV-30402", name: "Geeta", at: "09:12", status: "Synced", syncedAt: "09:40", gps: true },
  { id: "SRV-30401", name: "Raju Prajapati", at: "08:58", status: "Synced", syncedAt: "09:40", gps: true },
];
const visibleQs = (a: Survey["answers"]) => questionnaire.filter((q) => !q.showIf || a[q.showIf.q] === q.showIf.equals);
const answered = (v: string | string[] | undefined) => (Array.isArray(v) ? v.length > 0 : !!v && v.trim() !== "");
const now = () => new Date().toTimeString().slice(0, 5);

export function MobileAppPreview() {
  const { L, lang, setLang } = usePreview();
  const [screen, go] = useState<Screen>("login");
  const [online, setOnline] = useState(true);
  const [gps, setGps] = useState(true);
  const [photoMode, setPhotoMode] = useState<PhotoMode>("Optional");
  const [expired, setExpired] = useState(false);
  const [s, setS] = useState<Survey>(blank);
  const [qi, setQi] = useState(0);
  const [queue, setQueue] = useState<Rec[]>(initialQueue);
  const [drafts, setDrafts] = useState([{ id: "D1", survey: { ...sample(), answers: { 1: "Yes", 3: "Poor", 4: "4–8 hours" } }, qi: 4, saved: "10:48" }, { id: "D2", survey: { ...blank(), name: "Ram Prasad", consent: true }, qi: -1, saved: L("Yesterday", "कल") }]);
  const [last, setLast] = useState<Rec | null>(null);
  const [count, setCount] = useState(142);
  const set = (p: Partial<Survey>) => setS((x) => ({ ...x, ...p }));
  const qs = visibleQs(s.answers);
  const q = qs[Math.min(qi, qs.length - 1)]!;
  const pending = queue.filter((r) => r.status === "Pending").length;
  const failed = queue.filter((r) => r.status === "Failed").length;
  const ageN = Number(s.age);
  const underAge = s.age !== "" && ageN < 18;
  const mobileBad = s.mobile !== "" && !/^[6-9]\d{9}$/.test(s.mobile);

  const errors = [
    !s.consent && L("Consent not captured", "सहमति दर्ज नहीं"),
    !s.name.trim() && L("Respondent name is required", "उत्तरदाता का नाम आवश्यक है"),
    (!s.age || underAge) && L("Valid age (18+) is required", "मान्य आयु (18+) आवश्यक है"),
    ...qs.filter((x) => x.required && !answered(s.answers[x.id])).map((x) => `${L("Unanswered", "उत्तर नहीं")}: Q${qs.indexOf(x) + 1}`),
    photoMode === "Mandatory" && !s.photo && L("Photo is mandatory for this campaign", "इस अभियान के लिए फ़ोटो अनिवार्य है"),
  ].filter(Boolean) as string[];

  const startSurvey = () => { if (expired) return go("expired"); setS(blank()); setQi(0); go("purpose"); };
  const saveDraft = () => { setDrafts((d) => [{ id: `D${Date.now()}`, survey: s, qi: screen === "question" ? qi : -1, saved: now() }, ...d]); toast.success(L("Draft saved on device", "ड्राफ़्ट फ़ोन में सहेजा गया")); go("home"); };
  const submit = () => {
    const rec: Rec = { id: `SRV-${30414 + queue.length}`, name: s.name, at: now(), status: online ? "Synced" : "Pending", gps, ...(online ? { syncedAt: now() } : {}) };
    setQueue((all) => [rec, ...all]); setLast(rec); setCount((c) => c + 1); setS(blank()); setQi(0); go("done");
  };
  const syncIds = (ids: string[]) => {
    if (!online) { toast.error(L("No internet. Records stay queued on the phone.", "इंटरनेट नहीं। रिकॉर्ड फ़ोन में कतार में रहेंगे।")); return; }
    setQueue((all) => all.map((r) => (ids.includes(r.id) ? { ...r, status: "Syncing" } : r)));
    setTimeout(() => setQueue((all) => all.map((r) => (ids.includes(r.id) ? { ...r, status: "Synced", syncedAt: now(), gps: r.gps || gps } : r))), 1200);
  };
  const jump = (to: Screen) => { if (["question", "issues", "photo", "review"].includes(to) && !s.name) setS(sample()); go(to); };

  /* ---------- screens ---------- */
  const bar = (title: string, back?: Screen, right?: ReactNode) => (
    <div className="flex h-12 shrink-0 items-center gap-2 bg-primary px-2 text-primary-foreground">
      {back ? <button aria-label="Back" onClick={() => go(back)} className="grid size-9 place-items-center rounded-full hover:bg-white/10"><ArrowLeft className="size-5" /></button> : <span className="w-2" />}
      <div className="min-w-0 flex-1 truncate text-[15px] font-medium">{title}</div>{right}
    </div>
  );
  const draftBtn = <button aria-label={L("Save draft", "ड्राफ़्ट सहेजें")} onClick={saveDraft} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs hover:bg-white/10"><Save className="size-4" /> {L("Draft", "ड्राफ़्ट")}</button>;
  const gpsChip = !gps && <div className="mx-4 mt-3 flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-[11px] font-medium text-warning"><MapPinOff className="size-3.5 shrink-0" /> {L("GPS unavailable — location will be updated on sync", "GPS उपलब्ध नहीं — सिंक पर स्थान अपडेट होगा")}</div>;
  const foot = (children: ReactNode) => <div className="flex shrink-0 gap-2 border-t bg-card p-3">{children}</div>;
  const big = (extra = "") => cn(btnPrimary, "h-11 flex-1 justify-center rounded-full text-[15px]", extra);
  const ghost = cn(btn, "h-11 flex-1 justify-center rounded-full");

  const views: Record<Screen, () => ReactNode> = {
    login: () => (
      <div className="flex flex-1 flex-col justify-center gap-4 px-6">
        <div className="text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><ClipboardList className="size-7" /></div><div className="mt-3 text-xl font-semibold">Lokdrishti</div><div className="text-sm text-muted-foreground">{L("Volunteer survey app", "स्वयंसेवक सर्वे ऐप")}</div></div>
        <input defaultValue="VOL-1001" aria-label="Volunteer ID" className={cn(inputCls, "h-11")} />
        <input type="password" defaultValue="1234" aria-label="PIN" inputMode="numeric" className={cn(inputCls, "h-11")} />
        <button className={big("w-full flex-none")} onClick={() => go("home")}>{online ? L("Sign in", "साइन इन") : L("Sign in offline", "ऑफ़लाइन साइन इन")}</button>
        <div className="flex justify-center gap-1 text-xs">{(["en", "hi"] as const).map((l) => <button key={l} onClick={() => setLang(l)} className={cn("rounded-full border px-3 py-1", lang === l && "border-primary text-primary")}>{l === "en" ? "English" : "हिन्दी"}</button>)}</div>
        <p className="text-center text-[11px] text-muted-foreground">{L("Sign in and download assignments while online before going to areas with no network.", "बिना नेटवर्क वाले क्षेत्रों में जाने से पहले ऑनलाइन रहते हुए साइन इन करें और असाइनमेंट डाउनलोड करें।")}</p>
      </div>
    ),
    home: () => (
      <div className="flex-1 overflow-y-auto">
        {bar(L("Namaste, Amit", "नमस्ते, अमित"), undefined, <button aria-label="Notifications" onClick={() => go("notifications")} className="relative grid size-9 place-items-center rounded-full hover:bg-white/10"><Bell className="size-5" /><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-warning" /></button>)}
        <div className="space-y-3 p-4">
          <button onClick={() => go("sync")} className={cn("flex w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium", failed ? "bg-destructive/10 text-destructive" : pending ? "bg-warning/15 text-warning" : "bg-success/10 text-success")}>
            <CloudUpload className="size-4" /><span className="flex-1 text-left">{pending ? `${pending} ${L("pending upload", "अपलोड बाकी")}` : L("All synced", "सब सिंक हो गया")}{failed > 0 && ` · ${failed} ${L("failed", "विफल")}`}</span><ChevronRight className="size-4" />
          </button>
          <div className={cn("rounded-2xl border bg-card p-4", expired && "bg-muted/60")}>
            <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><div className="font-semibold">{campaign.name}</div><div className="text-xs text-muted-foreground">{campaign.candidate} · {L("Questionnaire", "प्रश्नावली")} v3</div></div>
              {expired ? <span className="rounded bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">{L("Expired", "समाप्त")}</span> : <span className="rounded bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">{L("Active", "सक्रिय")}</span>}</div>
            <div className="mt-2 flex flex-wrap gap-1">{campaign.areas.map((a) => <span key={a} className="rounded bg-accent px-1.5 py-0.5 text-[11px] text-accent-foreground">{a}</span>)}</div>
            <div className="mt-3 flex justify-between text-xs"><span>{L("My surveys", "मेरे सर्वे")}</span><span className="font-semibold tabular-nums">{count} / 200</span></div>
            <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, count / 2)}%` }} /></div>
            <div className="mt-2 text-[11px] text-muted-foreground">{expired ? `${L("Expired on", "समाप्त")} ${fmtDate("2026-11-10")}` : `${L("Valid till", "वैध")} ${fmtDate(campaign.end)} · ${daysLeft(campaign.end)} ${L("days left", "दिन शेष")}`}</div>
            <button className={big("mt-3 w-full")} onClick={startSurvey}>{expired ? <><Lock className="size-4" /> {L("Survey form closed", "सर्वे फ़ॉर्म बंद")}</> : L("Start new survey", "नया सर्वे शुरू करें")}</button>
          </div>
          <button onClick={() => go("drafts")} className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left text-sm"><FileClock className="size-5 text-muted-foreground" /><span className="flex-1">{L("Drafts", "ड्राफ़्ट")} ({drafts.length})</span><ChevronRight className="size-4 text-muted-foreground" /></button>
        </div>
      </div>
    ),
    purpose: () => (<>
      {bar(L("New survey", "नया सर्वे"), "home")}
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        <Info className="size-8 text-primary" />
        <h2 className="text-lg font-semibold">{L("About this survey", "इस सर्वे के बारे में")}</h2>
        <p className="text-sm leading-relaxed">{L("We are talking to households in Lucknow Central to understand the most important local problems, such as water, roads and electricity, and how urgent they are.", "हम लखनऊ मध्य के परिवारों से बात कर रहे हैं ताकि पानी, सड़क, बिजली जैसी प्रमुख स्थानीय समस्याओं और उनकी तात्कालिकता को समझा जा सके।")}</p>
        <div className="rounded-xl bg-muted p-3 text-sm">{L("About 8 minutes", "लगभग 8 मिनट")} · {questionnaire.length} {L("questions", "प्रश्न")}<br /><span className="text-xs text-muted-foreground">{L("Respondents must be 18 or older.", "उत्तरदाता की आयु 18 वर्ष या अधिक होनी चाहिए।")}</span></div>
      </div>
      {foot(<button className={big()} onClick={() => go("consent")}>{L("Continue", "आगे बढ़ें")}</button>)}
    </>),
    consent: () => (<>
      {bar(L("Consent", "सहमति"), "purpose")}
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{L("Read aloud", "पढ़कर सुनाएँ")} · {L("Consent", "सहमति")} v{consentStatement.version}</div>
        <p lang="hi" className="rounded-xl border bg-card p-3 text-[15px] leading-relaxed">{consentStatement.hi}</p>
        {lang === "en" && <p className="text-xs leading-relaxed text-muted-foreground">{consentStatement.en}</p>}
        <label className="flex items-start gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={s.consent} onChange={(e) => set({ consent: e.target.checked })} className="mt-0.5 size-5" /><span>{L("The respondent has heard the statement and agrees to take part.", "उत्तरदाता ने कथन सुना और भाग लेने के लिए सहमत है।")}</span></label>
      </div>
      {foot(<><button className={ghost} onClick={() => { set({ consent: false }); go("declined"); }}>{L("Declines", "असहमत")}</button><button className={big()} disabled={!s.consent} onClick={() => go("respondent")}>{L("Agree & continue", "सहमत, आगे बढ़ें")}</button></>)}
    </>),
    declined: () => (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <XCircle className="size-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{L("Survey ended", "सर्वे समाप्त")}</h2>
        <p className="text-sm text-muted-foreground">{L("The respondent declined consent. No answers were recorded.", "उत्तरदाता ने सहमति नहीं दी। कोई उत्तर दर्ज नहीं किया गया।")}</p>
        <button className={big("w-full flex-none")} onClick={() => go("home")}>{L("Back to home", "होम पर लौटें")}</button>
      </div>
    ),
    respondent: () => (<>
      {bar(L("Respondent details", "उत्तरदाता विवरण"), "consent", draftBtn)}
      {gpsChip}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <label className="grid gap-1 text-sm"><span className="font-medium">{L("Name", "नाम")} <span className="text-destructive">*</span></span><input value={s.name} onChange={(e) => set({ name: e.target.value })} className={cn(inputCls, "h-11")} /></label>
        <label className="grid gap-1 text-sm"><span className="font-medium">{L("Mobile (optional)", "मोबाइल (वैकल्पिक)")}</span><input value={s.mobile} inputMode="numeric" maxLength={10} onChange={(e) => set({ mobile: e.target.value.replace(/\D/g, "") })} className={cn(inputCls, "h-11", mobileBad && "border-destructive")} />{mobileBad && <span className="text-xs text-destructive">{L("Enter a 10-digit mobile number", "10 अंकों का मोबाइल नंबर दर्ज करें")}</span>}</label>
        <label className="grid gap-1 text-sm"><span className="font-medium">{L("Age", "आयु")} <span className="text-destructive">*</span></span><input value={s.age} inputMode="numeric" maxLength={3} onChange={(e) => set({ age: e.target.value.replace(/\D/g, "") })} className={cn(inputCls, "h-11 w-28", underAge && "border-destructive")} /></label>
        {underAge && <div role="alert" className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive"><AlertTriangle className="size-5 shrink-0" /><span lang="hi">उत्तरदाता की आयु 18 वर्ष या अधिक होनी चाहिए{lang === "en" && <span className="block text-xs font-normal">The respondent must be 18 or older. The survey can't continue.</span>}</span></div>}
        {gps && <div className="flex items-center gap-1.5 text-xs text-success"><MapPin className="size-3.5" /> {L("Location captured", "स्थान दर्ज")} · 26.8467, 80.9462 (±12 m)</div>}
      </div>
      {foot(<button className={big()} disabled={!s.name.trim() || !s.age || underAge || mobileBad} onClick={() => { setQi(0); go("question"); }}>{L("Start questions", "प्रश्न शुरू करें")}</button>)}
    </>),
    question: () => {
      const v = s.answers[q.id];
      const answer = (x: string | string[]) => set({ answers: { ...s.answers, [q.id]: x } });
      const pos = qs.indexOf(q);
      return (<>
        {bar(`${pos + 1} / ${qs.length}`, pos === 0 ? "respondent" : undefined, draftBtn)}
        <div className="h-1 shrink-0 bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${((pos + 1) / qs.length) * 100}%` }} /></div>
        {gpsChip}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {q.showIf && <div className="text-[11px] text-muted-foreground">↳ {L("Follow-up question", "अनुवर्ती प्रश्न")}</div>}
          <h2 className="text-lg font-semibold leading-snug">{L(q.en, q.hi)}{q.required && <span className="text-destructive"> *</span>}</h2>
          <AnswerInput q={q} v={v} onChange={answer} L={L} />
        </div>
        {foot(<>
          <button className={ghost} onClick={() => (pos === 0 ? go("respondent") : setQi(pos - 1))}>{L("Back", "पीछे")}</button>
          <button className={big()} disabled={q.required && !answered(v)} onClick={() => (pos === qs.length - 1 ? go("issues") : setQi(pos + 1))}>{L("Next", "आगे")}</button>
        </>)}
      </>);
    },
    issues: () => (<>
      {bar(L("Issues & priority", "मुद्दे और प्राथमिकता"), "question", draftBtn)}
      {gpsChip}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="text-sm font-medium">{L("Which problems did the respondent report?", "उत्तरदाता ने कौन सी समस्याएँ बताईं?")}</div>
        <div className="flex flex-wrap gap-2">
          {issueTaxonomy.map((c) => { const on = c.en in s.issues; return (
            <button key={c.en} onClick={() => { const n = { ...s.issues }; on ? delete n[c.en] : (n[c.en] = 5); set({ issues: n }); }} className={cn("rounded-full border px-3 py-1.5 text-sm", on ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{on && <Check className="mr-1 inline size-3.5" />}{L(c.en, c.hi)}</button>
          ); })}
        </div>
        {Object.keys(s.issues).length > 0 && <p className="text-xs text-muted-foreground">{L("Rate urgency: 1 = can wait, 10 = needs fixing now", "तात्कालिकता: 1 = रुक सकता है, 10 = तुरंत ठीक होना चाहिए")}</p>}
        {Object.entries(s.issues).map(([k, v]) => { const c = issueTaxonomy.find((x) => x.en === k)!; const bi = priorityBands.findIndex((b) => v >= b.from && v <= b.to); return (
          <div key={k} className="rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between text-sm"><span className="font-medium">{L(c.en, c.hi)}</span><span className={cn("rounded px-2 py-0.5 text-xs font-semibold tabular-nums", bandTone[bi])}>{v} · {bandFor(v)}</span></div>
            <input type="range" min={1} max={10} value={v} onChange={(e) => set({ issues: { ...s.issues, [k]: Number(e.target.value) } })} className="mt-2 w-full accent-[var(--primary)]" aria-label={`${c.en} priority`} />
          </div>
        ); })}
        <label className="grid gap-1 text-sm"><span className="font-medium">{L("Other problem", "अन्य समस्या")}</span><textarea value={s.other} onChange={(e) => set({ other: e.target.value })} rows={3} className="rounded-md border bg-background p-2 text-sm" placeholder={L("In the respondent's words", "उत्तरदाता के शब्दों में")} /></label>
      </div>
      {foot(<button className={big()} onClick={() => go(photoMode === "Off" ? "review" : "photo")}>{L("Next", "आगे")}</button>)}
    </>),
    photo: () => (<>
      {bar(L("Photo", "फ़ोटो"), "issues", draftBtn)}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="flex items-center gap-2 text-sm font-medium">{L("Survey photo", "सर्वे फ़ोटो")}<span className={cn("rounded px-2 py-0.5 text-[11px]", photoMode === "Mandatory" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>{photoMode === "Mandatory" ? L("Required", "अनिवार्य") : L("Optional", "वैकल्पिक")}</span></div>
        {s.photo
          ? <div className="grid aspect-[4/3] place-items-center rounded-xl bg-gradient-to-br from-muted to-accent text-center text-xs text-muted-foreground"><div><Camera className="mx-auto size-8" />IMG_{last?.id.slice(4) ?? "0423"}.jpg · {now()}</div></div>
          : <button onClick={() => set({ photo: true })} className="grid aspect-[4/3] w-full place-items-center rounded-xl border-2 border-dashed text-sm text-muted-foreground"><div><Camera className="mx-auto mb-1 size-8" />{L("Tap to take photo", "फ़ोटो लेने के लिए टैप करें")}</div></button>}
        {s.photo && <button className={cn(btn, "w-full justify-center")} onClick={() => set({ photo: false })}>{L("Retake", "फिर से लें")}</button>}
      </div>
      {foot(<>{photoMode === "Optional" && !s.photo && <button className={ghost} onClick={() => go("review")}>{L("Skip", "छोड़ें")}</button>}<button className={big()} disabled={photoMode === "Mandatory" && !s.photo} onClick={() => go("review")}>{L("Next", "आगे")}</button></>)}
    </>),
    review: () => (<>
      {bar(L("Review & submit", "जाँचें और जमा करें"), photoMode === "Off" ? "issues" : "photo", draftBtn)}
      {gpsChip}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {errors.length > 0 && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive"><div className="font-medium">{L("Fix before submitting", "जमा करने से पहले ठीक करें")}</div><ul className="mt-1 list-disc pl-5 text-xs">{errors.map((e) => <li key={e}>{e}</li>)}</ul></div>}
        <Card title={L("Respondent", "उत्तरदाता")} onEdit={() => go("respondent")} L={L}>{s.name || "—"} · {s.age || "—"} {L("yrs", "वर्ष")}{s.mobile && ` · ${s.mobile}`}<br /><span className="text-xs text-muted-foreground">{L("Consent", "सहमति")} v{consentStatement.version}: {s.consent ? "✓" : "✗"}</span></Card>
        <Card title={`${L("Answers", "उत्तर")} · ${qs.filter((x) => answered(s.answers[x.id])).length} / ${qs.length}`} onEdit={() => { setQi(0); go("question"); }} L={L}>
          <ul className="space-y-1 text-xs">{qs.map((x, i) => <li key={x.id} className="flex gap-2"><span className="text-muted-foreground">Q{i + 1}</span><span className={cn("flex-1 truncate", !answered(s.answers[x.id]) && x.required && "text-destructive")}>{[s.answers[x.id]].flat().filter(Boolean).join(", ") || "—"}</span></li>)}</ul>
        </Card>
        <Card title={L("Issues", "मुद्दे")} onEdit={() => go("issues")} L={L}>{Object.entries(s.issues).map(([k, v]) => `${k} (${v})`).join(", ") || "—"}{s.other && <div className="text-xs text-muted-foreground">“{s.other}”</div>}</Card>
        {photoMode !== "Off" && <Card title={L("Photo", "फ़ोटो")} onEdit={() => go("photo")} L={L}>{s.photo ? "✓ IMG attached" : "—"}</Card>}
        <Card title={L("Location", "स्थान")} L={L}>{gps ? "26.8467, 80.9462 (±12 m)" : <span className="text-warning">{L("Unavailable, will update on sync", "उपलब्ध नहीं, सिंक पर अपडेट होगा")}</span>}</Card>
      </div>
      {foot(<button className={big()} disabled={errors.length > 0} onClick={submit}>{online ? L("Submit", "जमा करें") : L("Save on device", "फ़ोन में सहेजें")}</button>)}
    </>),
    done: () => {
      const synced = last ? last.status === "Synced" : online;
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          {synced ? <CheckCircle2 className="size-14 text-success" /> : <CloudOff className="size-14 text-warning" />}
          <h2 className="text-lg font-semibold">{synced ? L("Synced successfully", "सफलतापूर्वक सिंक हुआ") : L("Saved on device (offline)", "फ़ोन में सहेजा गया (ऑफ़लाइन)")}</h2>
          <p className="text-sm text-muted-foreground">{synced ? L("The server has received this survey.", "सर्वर को यह सर्वे मिल गया है।") : L("It will upload automatically when the internet returns.", "इंटरनेट आने पर यह अपने-आप अपलोड होगा।")}</p>
          <div className="font-mono text-xs text-muted-foreground">{last?.id ?? "SRV-30420"}</div>
          {!(last?.gps ?? gps) && gpsChip}
          <button className={big("w-full flex-none")} onClick={startSurvey}>{L("Start another survey", "दूसरा सर्वे शुरू करें")}</button>
          <button className={cn(ghost, "w-full flex-none")} onClick={() => go("home")}>{L("Home", "होम")}</button>
        </div>
      );
    },
    drafts: () => (<>
      {bar(L("Drafts", "ड्राफ़्ट"), "home")}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {drafts.map((d) => (
          <div key={d.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <FileClock className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 text-sm"><div className="font-medium">{d.survey.name || L("Unnamed respondent", "बिना नाम")}</div><div className="text-xs text-muted-foreground">{d.qi >= 0 ? `Q${d.qi + 1} / ${visibleQs(d.survey.answers).length}` : L("Respondent details", "उत्तरदाता विवरण")} · {d.saved}</div></div>
            <button className={cn(btnPrimary, "h-8 rounded-full")} onClick={() => { if (expired) return go("expired"); setS(d.survey); setQi(Math.max(0, d.qi)); setDrafts((all) => all.filter((x) => x.id !== d.id)); go(d.qi >= 0 ? "question" : "respondent"); }}>{L("Resume", "जारी रखें")}</button>
          </div>
        ))}
        {drafts.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{L("No drafts", "कोई ड्राफ़्ट नहीं")}</p>}
      </div>
    </>),
    sync: () => (<>
      {bar(L("Sync queue", "सिंक कतार"), "home")}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        <button className={cn(btnPrimary, "h-10 w-full justify-center rounded-full")} disabled={!pending && !failed} onClick={() => syncIds(queue.filter((r) => r.status === "Pending" || r.status === "Failed").map((r) => r.id))}><RefreshCw className="size-4" /> {L("Sync now", "अभी सिंक करें")}</button>
        {queue.map((r) => (
          <div key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            <div className="flex items-center gap-2"><span className="font-medium">{r.name}</span><span className="font-mono text-[11px] text-muted-foreground">{r.id}</span>
              <span className={cn("ml-auto rounded px-2 py-0.5 text-[11px] font-medium", { Pending: "bg-warning/15 text-warning", Syncing: "bg-primary/10 text-primary", Synced: "bg-success/10 text-success", Failed: "bg-destructive/10 text-destructive" }[r.status])}>
                {r.status === "Syncing" && <RefreshCw className="mr-1 inline size-3 animate-spin" />}{L(r.status, { Pending: "लंबित", Syncing: "सिंक हो रहा", Synced: "सिंक हुआ", Failed: "विफल" }[r.status])}</span></div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{L("Collected", "संग्रह")} {r.at}{r.syncedAt && ` · ${L("synced", "सिंक")} ${r.syncedAt}`}</span>
              {!r.gps && <span className="flex items-center gap-0.5 text-warning"><MapPinOff className="size-3" />GPS</span>}
              {r.status === "Failed" && <button className="ml-auto rounded-full border border-destructive/40 px-2 py-0.5 font-medium text-destructive" onClick={() => syncIds([r.id])}>{L("Retry", "फिर कोशिश")}</button>}
            </div>
            {r.reason && r.status === "Failed" && <div className="mt-1 text-[11px] text-destructive">{r.reason}</div>}
          </div>
        ))}
      </div>
    </>),
    expired: () => (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <Lock className="size-12 text-destructive" />
        <h2 className="text-lg font-semibold">{L("Survey form closed", "सर्वे फ़ॉर्म बंद")}</h2>
        <p className="text-sm text-muted-foreground">{campaign.name} {L("expired on", "समाप्त हुआ")} {fmtDate("2026-11-10")}. {L("New surveys and drafts can't be opened. Ask your supervisor about an extension.", "नए सर्वे और ड्राफ़्ट नहीं खोले जा सकते। विस्तार के लिए अपने सुपरवाइज़र से बात करें।")}</p>
        <p className="text-xs text-muted-foreground">{L("Surveys already saved on the phone will still sync.", "फ़ोन में पहले से सहेजे सर्वे फिर भी सिंक होंगे।")}</p>
        <button className={big("w-full flex-none")} onClick={() => go("home")}>{L("Back to home", "होम पर लौटें")}</button>
      </div>
    ),
    notifications: () => (<>
      {bar(L("Notifications", "सूचनाएँ"), "home")}
      <div className="flex-1 divide-y overflow-y-auto">
        {([
          [ClipboardList, "text-primary", L("New assignment", "नया असाइनमेंट"), L("Ward 27, Lucknow Central added to your area", "वार्ड 27, लखनऊ मध्य आपके क्षेत्र में जोड़ा गया"), "9:02", "home"],
          [Info, "text-teal", L("Questionnaire changed", "प्रश्नावली बदली"), L("Version v3 downloaded. Drafts keep their version.", "संस्करण v3 डाउनलोड हुआ। ड्राफ़्ट अपना संस्करण रखते हैं।"), "8:45", "home"],
          [XCircle, "text-destructive", L("Sync failed", "सिंक विफल"), "SRV-30409 · Server timeout", "9:52", "sync"],
          [CheckCircle2, "text-success", L("Sync confirmed", "सिंक की पुष्टि"), L("2 surveys received by the server", "2 सर्वे सर्वर को मिले"), "9:40", "sync"],
        ] as const).map(([Icon, tone, title, body, time, to]) => (
          <button key={title} onClick={() => go(to)} className="flex w-full gap-3 p-4 text-left hover:bg-muted/50"><Icon className={cn("mt-0.5 size-5 shrink-0", tone)} /><div className="min-w-0 flex-1"><div className="text-sm font-medium">{title}</div><div className="text-xs text-muted-foreground">{body}</div></div><span className="text-[11px] text-muted-foreground">{time}</span></button>
        ))}
      </div>
    </>),
  };

  const tabs: [Screen, typeof Home, string][] = [["home", Home, L("Home", "होम")], ["drafts", FileClock, L("Drafts", "ड्राफ़्ट")], ["sync", CloudUpload, L("Sync", "सिंक")], ["notifications", Bell, L("Alerts", "सूचनाएँ")]];
  const showTabs = tabs.some(([k]) => k === screen);
  const jumps: [string, Screen, () => void][] = [
    [L("Login", "लॉगिन"), "login", () => {}], [L("Home", "होम"), "home", () => {}], [L("Purpose & consent", "उद्देश्य और सहमति"), "purpose", () => {}],
    [L("Respondent details (try age 16)", "उत्तरदाता विवरण (आयु 16 आज़माएँ)"), "respondent", () => {}], [L("Questions, one per screen", "प्रश्न, एक स्क्रीन पर एक"), "question", () => setQi(0)],
    [L("Issue selection & priority", "मुद्दा चयन और प्राथमिकता"), "issues", () => {}], [L("Photo capture", "फ़ोटो"), "photo", () => setPhotoMode((m) => (m === "Off" ? "Optional" : m))],
    [L("Review & submit", "जाँचें और जमा करें"), "review", () => {}], [L("Confirmation", "पुष्टि"), "done", () => setLast(null)], [L("Drafts", "ड्राफ़्ट"), "drafts", () => {}],
    [L("Sync queue", "सिंक कतार"), "sync", () => {}], [L("Offline + no GPS", "ऑफ़लाइन + GPS नहीं"), "respondent", () => { setOnline(false); setGps(false); }],
    [L("Expired campaign", "समाप्त अभियान"), "expired", () => setExpired(true)], [L("Notifications", "सूचनाएँ"), "notifications", () => {}],
  ];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[auto_1fr]">
      {/* Phone */}
      <div className="mx-auto w-[360px] max-w-full rounded-[2.6rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-xl">
        <div className="flex h-[720px] flex-col overflow-hidden rounded-[2rem] bg-background">
          <div className="flex h-7 shrink-0 items-center gap-1 bg-primary/90 px-5 text-[11px] font-medium text-primary-foreground">
            <span className="flex-1">10:42</span>
            {gps ? <MapPin className="size-3" /> : <MapPinOff className="size-3" />}<Signal className="size-3" />{online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}<BatteryFull className="size-3.5" />
          </div>
          {!online && screen !== "login" && <div className="flex shrink-0 items-center gap-1.5 bg-warning px-3 py-1 text-[11px] font-medium text-white"><CloudOff className="size-3.5" /> {L("Offline: surveys are saved on this phone", "ऑफ़लाइन: सर्वे इस फ़ोन में सहेजे जा रहे हैं")}</div>}
          <div className="flex min-h-0 flex-1 flex-col">{views[screen]()}</div>
          {showTabs && (
            <nav className="flex shrink-0 border-t bg-card">
              {tabs.map(([k, Icon, label]) => (
                <button key={k} onClick={() => go(k)} className={cn("relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]", screen === k ? "text-primary" : "text-muted-foreground")}>
                  <Icon className="size-5" />{label}{k === "sync" && pending + failed > 0 && <span className="absolute right-5 top-1 grid size-4 place-items-center rounded-full bg-warning text-[9px] font-semibold text-white">{pending + failed}</span>}
                </button>
              ))}
            </nav>
          )}
          <div className="flex h-5 shrink-0 items-center justify-center bg-card"><span className="h-1 w-24 rounded-full bg-foreground/30" /></div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-2 lg:max-w-3xl">
        <section className="panel">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">{L("Screens", "स्क्रीन")}</h2>
          <ol className="p-2">
            {jumps.map(([label, to, prep], i) => (
              <li key={label}><button onClick={() => { prep(); jump(to); }} className={cn("flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted", screen === to && "bg-muted font-medium")}>
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold tabular-nums">{i + 1}</span>{label}</button></li>
            ))}
          </ol>
        </section>
        <section className="panel h-fit">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">{L("Simulate device", "डिवाइस सिमुलेशन")}</h2>
          <div className="divide-y text-sm">
            <label className="flex items-center justify-between gap-3 px-4 py-3">{L("Internet connection", "इंटरनेट कनेक्शन")}<Switch checked={online} onCheckedChange={setOnline} /></label>
            <label className="flex items-center justify-between gap-3 px-4 py-3">{L("GPS available", "GPS उपलब्ध")}<Switch checked={gps} onCheckedChange={setGps} /></label>
            <label className="flex items-center justify-between gap-3 px-4 py-3">{L("Campaign expired", "अभियान समाप्त")}<Switch checked={expired} onCheckedChange={setExpired} /></label>
            <div className="flex items-center justify-between gap-3 px-4 py-3">{L("Photo upload", "फ़ोटो अपलोड")}
              <div className="flex rounded-md border bg-muted p-0.5 text-xs font-medium">{(["Off", "Optional", "Mandatory"] as const).map((m) => <button key={m} onClick={() => setPhotoMode(m)} className={cn("rounded px-2 py-1 text-muted-foreground", photoMode === m && "bg-card text-foreground shadow-card")}>{m}</button>)}</div>
            </div>
          </div>
          <p className="px-4 pb-4 text-xs text-muted-foreground">{L("Android-first app. Location is captured at submission only. No continuous tracking.", "Android-प्रथम ऐप। स्थान केवल जमा करते समय दर्ज होता है। लगातार ट्रैकिंग नहीं।")}</p>
        </section>
      </div>
    </div>
  );
}

function AnswerInput({ q, v, onChange, L }: { q: Question; v: string | string[] | undefined; onChange: (x: string | string[]) => void; L: (en: string, hi: string) => string }) {
  const opt = (selected: boolean) => cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left text-[15px]", selected ? "border-primary bg-primary/10 font-medium" : "bg-card");
  switch (q.type) {
    case "Yes / No":
      return <div className="grid grid-cols-2 gap-3">{yesNo.map((o) => <button key={o.en} onClick={() => onChange(o.en)} className={cn(opt(v === o.en), "justify-center py-4")}>{L(o.en, o.hi)}</button>)}</div>;
    case "Single select":
    case "Conditional":
      return <div className="grid gap-2">{q.options.map((o) => <button key={o.en} onClick={() => onChange(o.en)} className={opt(v === o.en)}><span className={cn("size-4 shrink-0 rounded-full border-2", v === o.en && "border-[5px] border-primary")} />{L(o.en, o.hi)}</button>)}</div>;
    case "Dropdown":
      return <select value={(v as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, "h-12 text-[15px]")}><option value="" disabled>{L("Choose…", "चुनें…")}</option>{q.options.map((o) => <option key={o.en} value={o.en}>{L(o.en, o.hi)}</option>)}</select>;
    case "Multi-select": {
      const arr = (v as string[]) ?? [];
      return <div className="grid gap-2">{q.options.map((o) => { const on = arr.includes(o.en); return <button key={o.en} onClick={() => onChange(on ? arr.filter((x) => x !== o.en) : [...arr, o.en])} className={opt(on)}><span className={cn("grid size-4 shrink-0 place-items-center rounded border-2", on && "border-primary bg-primary text-primary-foreground")}>{on && <Check className="size-3" />}</span>{L(o.en, o.hi)}</button>; })}</div>;
    }
    case "Numeric rating":
      return (<>
        <div className="grid grid-cols-5 gap-2">{Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => <button key={n} onClick={() => onChange(n)} className={cn("h-12 rounded-xl border text-base font-semibold tabular-nums", v === n ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{n}</button>)}</div>
        <div className="flex justify-between text-[11px] text-muted-foreground"><span>1 = {L("very low", "बहुत कम")}</span><span>10 = {L("very high", "बहुत अधिक")}</span></div>
      </>);
    case "Free text":
      return <textarea value={(v as string) ?? ""} onChange={(e) => onChange(e.target.value)} rows={5} className="w-full rounded-xl border bg-background p-3 text-[15px]" placeholder={L("Type the respondent's answer", "उत्तरदाता का उत्तर लिखें")} />;
  }
}

function Card({ title, children, onEdit, L }: { title: string; children: ReactNode; onEdit?: () => void; L: (en: string, hi: string) => string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">{title}{onEdit && <button onClick={onEdit} className="font-medium text-primary">{L("Edit", "बदलें")}</button>}</div>
      {children}
    </div>
  );
}

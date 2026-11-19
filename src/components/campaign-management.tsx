// Campaign Management screens (Lokdrishti, Uttar Pradesh). Illustrative demo data only; all changes stay in page state.
import { useMemo, useState, type ReactNode } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CalendarPlus, Check, CircleCheck, Copy, Lock, MoreHorizontal, PauseCircle, Plus, Search, TrendingUp, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { btn, btnPrimary, inputCls, Stat } from "@/components/module-views";
import { badgeClass } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import { usePreview, canManage, portals } from "@/lib/preview";
import {
  upClients, upPackages, upCampaigns, upVolunteers, upAcs, upBlocks, upDistricts, upVillages, parties, levels, pkgStatuses,
  deriveStatus, daysLeft, fmtDate, addDays, iso, TODAY, type Client, type Package, type Campaign,
} from "@/data/demo";

/* ---------------- shared bits ---------------- */
const n = (x: number) => x.toLocaleString("en-IN");
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 } };

export function Header({ section, title, desc, children }: { section: string; title: string; desc: string; children?: ReactNode }) {
  const { t } = usePreview();
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <div className="eyebrow">{t(section)}</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t(title)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(desc)} <span className="ml-1 rounded bg-warning/15 px-1.5 py-0.5 text-[11px] font-medium text-warning">{t("Demo data")}</span></p>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
function Chip({ s }: { s: string }) {
  const { t } = usePreview();
  return <span className={cn("whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium", badgeClass(s))}>{t(s)}</span>;
}
function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const { t } = usePreview();
  return <label className={cn("grid gap-1 text-sm", className)}><span className="text-xs font-medium text-muted-foreground">{t(label)}</span>{children}</label>;
}
function Progress({ v }: { v: number }) {
  return <div className="h-1.5 w-full rounded-full bg-muted"><div className={cn("h-full rounded-full", v >= 100 ? "bg-success" : v >= 90 ? "bg-warning" : "bg-primary")} style={{ width: `${Math.min(100, v)}%` }} /></div>;
}
function Banner({ tone, icon, children, action }: { tone: "warning" | "success" | "muted" | "destructive"; icon: ReactNode; children: ReactNode; action?: ReactNode }) {
  const cls = { warning: "border-warning/30 bg-warning/10 text-warning", success: "border-success/30 bg-success/10 text-success", destructive: "border-destructive/30 bg-destructive/10 text-destructive", muted: "bg-muted text-muted-foreground" }[tone];
  return <div className={cn("flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium", cls)}>{icon}<span className="min-w-0 flex-1">{children}</span>{action}</div>;
}
const daysLabel = (end: string, t: (s: string) => string) => { const d = daysLeft(end); return d < 0 ? t("Ended") : `${d} ${t("days")}`; };

/* Extend validity — shared by packages and campaigns. Recalculates days remaining live. */
function ExtendDialog({ open, title, end, onClose, onConfirm }: { open: boolean; title: string; end: string; onClose: () => void; onConfirm: (to: string, reason: string) => void }) {
  const { t } = usePreview();
  const base = daysLeft(end) < 0 ? iso(TODAY) : end; // an expired campaign extends from today
  const [days, setDays] = useState(15);
  const [reason, setReason] = useState("");
  const to = addDays(base, days);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("Extend validity")} · {title}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 rounded-md border p-3 text-sm">
            <div><div className="text-xs text-muted-foreground">{t("Current expiry")}</div><div className="font-medium">{fmtDate(end)}</div><div className="text-xs text-muted-foreground">{daysLabel(end, t)}</div></div>
            <div><div className="text-xs text-muted-foreground">{t("Revised expiry")}</div><div className="font-medium text-primary">{fmtDate(to)}</div><div className="text-xs text-muted-foreground">{daysLeft(to)} {t("days remaining")}</div></div>
          </div>
          <Field label="Extend by (days)">
            <div className="flex gap-2">
              <input type="number" min={1} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} className={cn(inputCls, "w-28")} />
              {[7, 15, 30].map((d) => <button key={d} type="button" onClick={() => setDays(d)} className={cn(btn, days === d && "border-primary text-primary")}>+{d}</button>)}
            </div>
          </Field>
          <Field label="Reason"><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="rounded-md border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring/30" placeholder={t("e.g. Additional wards added")} /></Field>
          <p className="text-xs text-muted-foreground">{t("The original and revised deadlines are both kept and written to the Audit Log.")}</p>
        </div>
        <DialogFooter>
          <button className={btn} onClick={onClose}>{t("Cancel")}</button>
          <button className={btnPrimary} disabled={!reason.trim()} onClick={() => onConfirm(to, reason.trim())}><CalendarPlus className="size-4" /> {t("Approve extension")}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================= CLIENTS & CANDIDATES ================= */
const pkgLabel = (id: string) => { const p = upPackages.find((x) => x.id === id); return p ? `${p.name} · ${n(p.target)}` : "—"; };

export function ClientsPage() {
  const { t, role } = usePreview();
  const manage = canManage(role);
  const [clients, setClients] = useState<Client[]>(upClients);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [form, setForm] = useState<Client | null>(null);
  const [wizard, setWizard] = useState(false);
  const shown = clients.filter((c) => (status === "All" || c.status === status) && Object.values(c).join(" ").toLowerCase().includes(q.toLowerCase()));
  const setClientStatus = (c: Client, s: Client["status"]) => { setClients((all) => all.map((x) => (x.id === c.id ? { ...x, status: s } : x))); toast.success(`${c.candidate}: ${t(s)} · ${t("logged in Audit Log")}`); };
  const save = (c: Client) => { setClients((all) => (all.some((x) => x.id === c.id) ? all.map((x) => (x.id === c.id ? c : x)) : [c, ...all])); setForm(null); toast.success(t("Client saved")); };
  const blank = (): Client => ({ id: `CL-${101 + clients.length}`, account: "", candidate: "", party: parties[0]!, level: levels[0]!, district: upDistricts[0]!, ac: upAcs[upDistricts[0]!]![0]!, block: upBlocks[upDistricts[0]!]![0]!, gp: "", contact: "", phone: "", packageId: "PKG-1019", start: iso(TODAY), end: addDays(iso(TODAY), 30), status: "Active" });

  return (
    <div className="space-y-5">
      <Header section="Campaign Management" title="Clients & Candidates" desc="Client accounts and candidates across Uttar Pradesh.">
        {manage && <><button className={btn} onClick={() => setForm(blank())}><Plus className="size-4" /> {t("Register client")}</button>
          <button className={btnPrimary} onClick={() => setWizard(true)}><UserPlus className="size-4" /> {t("Onboard candidate")}</button></>}
      </Header>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("Total clients")} value={clients.length} />
        {(["Active", "Suspended", "Inactive"] as const).map((s) => <Stat key={s} label={t(s)} value={clients.filter((c) => c.status === s).length} />)}
      </div>
      <div className="panel">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative min-w-48 flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search…")} className={cn(inputCls, "pl-9")} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border bg-card px-2 text-sm">
            {["All", "Active", "Suspended", "Inactive"].map((s) => <option key={s} value={s}>{t(s === "All" ? "All statuses" : s)}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              {["Account", "Candidate", "Party", "Level", "District", "Constituency", "Package", "Campaign dates", "Status"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{t(h)}</th>)}
              <th className="px-3 py-2 text-right font-medium">{t("Actions")}</th>
            </tr></thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-3 py-2.5"><div className="font-medium">{c.account}</div><div className="font-mono text-[11px] text-muted-foreground">{c.id}</div></td>
                  <td className="px-3">{c.candidate}</td>
                  <td className="px-3 text-muted-foreground">{c.party}</td>
                  <td className="px-3 text-muted-foreground">{t(c.level)}</td>
                  <td className="px-3 text-muted-foreground">{c.district}</td>
                  <td className="px-3 text-muted-foreground">{c.ac}</td>
                  <td className="whitespace-nowrap px-3 text-muted-foreground">{pkgLabel(c.packageId)}</td>
                  <td className="whitespace-nowrap px-3 text-muted-foreground">{fmtDate(c.start)} – {fmtDate(c.end)}</td>
                  <td className="px-3"><Chip s={c.status} /></td>
                  <td className="px-3 text-right">
                    {manage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><button className="rounded p-1.5 hover:bg-muted" aria-label={`Actions for ${c.candidate}`}><MoreHorizontal className="size-4" /></button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setForm(c)}>{t("Edit")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {c.status !== "Active" && <DropdownMenuItem onSelect={() => setClientStatus(c, "Active")}>{t("Activate")}</DropdownMenuItem>}
                          {c.status === "Active" && <DropdownMenuItem onSelect={() => setClientStatus(c, "Suspended")}>{t("Suspend")}</DropdownMenuItem>}
                          {c.status !== "Inactive" && <DropdownMenuItem className="text-destructive" onSelect={() => setClientStatus(c, "Inactive")}>{t("Deactivate")}</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">{t("No records match your search.")}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">{shown.length} {t("records")} · {t("demo data")}</div>
      </div>
      {form && <ClientForm initial={form} isNew={!clients.some((c) => c.id === form.id)} onClose={() => setForm(null)} onSave={save} />}
      {wizard && <OnboardWizard clients={clients} onClose={() => setWizard(false)} onDone={(c) => { setClients((all) => [c, ...all]); setWizard(false); }} />}
    </div>
  );
}

function ClientForm({ initial, isNew, onClose, onSave }: { initial: Client; isNew: boolean; onClose: () => void; onSave: (c: Client) => void }) {
  const { t } = usePreview();
  const [d, setD] = useState(initial);
  const set = (p: Partial<Client>) => setD((x) => ({ ...x, ...p }));
  const badDates = d.end <= d.start;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{t(isNew ? "Register client" : "Edit client")}</DialogTitle></DialogHeader>
        <form id="client-form" className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1" onSubmit={(e) => { e.preventDefault(); if (!badDates) onSave(d); }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Account name"><input required value={d.account} onChange={(e) => set({ account: e.target.value })} className={inputCls} placeholder="Verma Campaign Office" /></Field>
            <Field label="Candidate name"><input required value={d.candidate} onChange={(e) => set({ candidate: e.target.value })} className={inputCls} /></Field>
            <Field label="Party"><select value={d.party} onChange={(e) => set({ party: e.target.value })} className={inputCls}>{parties.map((p) => <option key={p}>{p}</option>)}</select></Field>
            <Field label="Candidate level"><select value={d.level} onChange={(e) => set({ level: e.target.value })} className={inputCls}>{levels.map((l) => <option key={l} value={l}>{t(l)}</option>)}</select></Field>
          </div>
          <fieldset className="grid gap-3 rounded-md border p-3 sm:grid-cols-3">
            <legend className="px-1 text-xs font-semibold text-muted-foreground">{t("Area")}</legend>
            <Field label="State"><input value="Uttar Pradesh" disabled className={cn(inputCls, "bg-muted")} /></Field>
            <Field label="District"><select value={d.district} onChange={(e) => { const k = e.target.value; set({ district: k, ac: upAcs[k]![0]!, block: upBlocks[k]![0]! }); }} className={inputCls}>{upDistricts.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Constituency"><select value={d.ac} onChange={(e) => set({ ac: e.target.value })} className={inputCls}>{upAcs[d.district]!.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Block / Tehsil"><select value={d.block} onChange={(e) => set({ block: e.target.value })} className={inputCls}>{upBlocks[d.district]!.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Gram Panchayat / Ward" className="sm:col-span-2"><input list="gp-list" value={d.gp} onChange={(e) => set({ gp: e.target.value })} className={inputCls} placeholder={t("Type or pick")} /><datalist id="gp-list">{upVillages.map((v) => <option key={v} value={v} />)}</datalist></Field>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Primary contact"><input required value={d.contact} onChange={(e) => set({ contact: e.target.value })} className={inputCls} /></Field>
            <Field label="Contact mobile"><input type="tel" pattern="[+0-9 ]{10,15}" value={d.phone} onChange={(e) => set({ phone: e.target.value })} className={inputCls} placeholder="+91 98xxxxxxxx" /></Field>
            <Field label="Package"><select value={d.packageId} onChange={(e) => set({ packageId: e.target.value })} className={inputCls}>{upPackages.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.name} ({n(p.target)})</option>)}</select></Field>
            <Field label="Status"><select value={d.status} onChange={(e) => set({ status: e.target.value as Client["status"] })} className={inputCls}>{["Active", "Suspended", "Inactive"].map((s) => <option key={s} value={s}>{t(s)}</option>)}</select></Field>
            <Field label="Campaign start"><input type="date" value={d.start} onChange={(e) => set({ start: e.target.value })} className={inputCls} /></Field>
            <Field label="Campaign end"><input type="date" value={d.end} onChange={(e) => set({ end: e.target.value })} className={cn(inputCls, badDates && "border-destructive")} />{badDates && <span className="text-xs text-destructive">{t("End date must be after the start date.")}</span>}</Field>
          </div>
        </form>
        <DialogFooter><button className={btn} onClick={onClose}>{t("Cancel")}</button><button form="client-form" className={btnPrimary} disabled={badDates}>{t("Save")}</button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- 8-step onboarding wizard ---------- */
const steps = ["Profile", "Link to client", "Assign package", "Campaign validity", "Authorised areas", "Logins & volunteers", "Access permissions", "Activate"];
const permList: [string, boolean][] = [["View candidate dashboard", true], ["View issue analytics", true], ["Download aggregate reports", true], ["View volunteer performance", true], ["View respondent-level records (names, mobiles)", false], ["Access other candidates' data", false]];
type Login = { name: string; user: string; role: "Candidate Administrator" | "Candidate Team (view-only)" };

function OnboardWizard({ clients, onClose, onDone }: { clients: Client[]; onClose: () => void; onDone: (c: Client) => void }) {
  const { t } = usePreview();
  const [step, setStep] = useState(0);
  const [w, setW] = useState({
    name: "", party: parties[0]!, level: levels[3]!, mobile: "",
    clientMode: "new" as "new" | "existing", clientId: clients[0]?.id ?? "", account: "",
    packageId: "", start: iso(TODAY), validity: 30, extAllowed: true,
    district: upDistricts[0]!, areas: new Set<string>(),
    logins: [] as Login[], vols: new Set<string>(),
    perms: Object.fromEntries(permList) as Record<string, boolean>,
  });
  const set = (p: Partial<typeof w>) => setW((x) => ({ ...x, ...p }));
  const toggle = (key: "areas" | "vols", v: string) => setW((x) => { const s = new Set(x[key]); s.has(v) ? s.delete(v) : s.add(v); return { ...x, [key]: s }; });
  const freePkgs = upPackages.filter((p) => !p.assignedTo);
  const pkg = upPackages.find((p) => p.id === w.packageId);
  const end = addDays(w.start, w.validity);
  const userId = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ".");
  const account = w.clientMode === "new" ? w.account : clients.find((c) => c.id === w.clientId)?.account ?? "";
  const acs = upAcs[w.district]!;
  const vols = upVolunteers.filter((v) => v.district === w.district);

  const ok = [
    !!w.name.trim(), !!account.trim(), !!w.packageId, w.validity > 0, [...w.areas].some((a) => !a.includes("|")),
    w.logins.length > 0 && w.logins.every((l) => l.user.trim()), true, true,
  ][step];
  const next = () => {
    if (step === 0 && w.logins.length === 0) set({ logins: [{ name: w.name, user: userId(w.name), role: "Candidate Administrator" }] });
    if (step === 2 && pkg) set({ validity: pkg.validity });
    setStep((s) => s + 1);
  };
  const finish = () => {
    const firstAc = [...w.areas].find((a) => !a.includes("|")) ?? acs[0]!;
    onDone({ id: `CL-${101 + clients.length}`, account, candidate: w.name, party: w.party, level: w.level, district: w.district, ac: firstAc, block: upBlocks[w.district]![0]!, gp: "", contact: w.name, phone: w.mobile, packageId: w.packageId, start: w.start, end, status: "Active" });
    toast.success(`${w.name}: ${t("campaign activated")}`);
  };
  const instructions = `Lokdrishti login\nPortal: Candidate Portal\n${w.logins.map((l) => `${l.name} (${l.role}): ${l.user}`).join("\n")}\nTemporary password is set on first sign-in.\nCampaign: ${fmtDate(w.start)} – ${fmtDate(end)}`;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader><DialogTitle>{t("Onboard candidate")}</DialogTitle></DialogHeader>
        <ol className="flex gap-1 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <li key={s} className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs", i === step ? "border-primary bg-primary/10 font-medium text-primary" : i < step ? "text-success" : "text-muted-foreground")}>
              <span className={cn("grid size-4 place-items-center rounded-full text-[10px]", i < step ? "bg-success text-white" : "bg-muted")}>{i < step ? <Check className="size-3" /> : i + 1}</span>{t(s)}
            </li>
          ))}
        </ol>
        <div className="max-h-[55vh] min-h-64 overflow-y-auto pr-1 text-sm">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Candidate name"><input autoFocus value={w.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} /></Field>
              <Field label="Mobile"><input type="tel" value={w.mobile} onChange={(e) => set({ mobile: e.target.value })} className={inputCls} placeholder="+91 98xxxxxxxx" /></Field>
              <Field label="Party"><select value={w.party} onChange={(e) => set({ party: e.target.value })} className={inputCls}>{parties.map((p) => <option key={p}>{p}</option>)}</select></Field>
              <Field label="Candidate level"><select value={w.level} onChange={(e) => set({ level: e.target.value })} className={inputCls}>{levels.map((l) => <option key={l} value={l}>{t(l)}</option>)}</select></Field>
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-3">
              {(["new", "existing"] as const).map((m) => (
                <label key={m} className={cn("flex items-start gap-3 rounded-md border p-3", w.clientMode === m && "border-primary")}>
                  <input type="radio" name="cm" checked={w.clientMode === m} onChange={() => set({ clientMode: m })} className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium">{t(m === "new" ? "Create a new client account" : "Link to an existing client account")}</div>
                    {w.clientMode === m && (m === "new"
                      ? <input value={w.account} onChange={(e) => set({ account: e.target.value })} placeholder={t("Account name")} className={cn(inputCls, "mt-2")} />
                      : <select value={w.clientId} onChange={(e) => set({ clientId: e.target.value })} className={cn(inputCls, "mt-2")}>{clients.map((c) => <option key={c.id} value={c.id}>{c.account} ({c.id})</option>)}</select>)}
                  </div>
                </label>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-2">
              <p className="text-xs text-muted-foreground">{t("Unassigned packages. Create more under Survey Packages.")}</p>
              {freePkgs.map((p) => (
                <label key={p.id} className={cn("flex items-center gap-3 rounded-md border p-3", w.packageId === p.id && "border-primary bg-primary/5")}>
                  <input type="radio" name="pkg" checked={w.packageId === p.id} onChange={() => set({ packageId: p.id })} />
                  <div className="flex-1"><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.id} · {n(p.target)} {t("surveys")} · {p.validity} {t("days")} · {p.price ? `₹${n(p.price)}` : t("Zero-cost")}</div></div>
                </label>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Activation date"><input type="date" value={w.start} onChange={(e) => set({ start: e.target.value })} className={inputCls} /></Field>
              <Field label="Validity (days)"><input type="number" min={1} value={w.validity} onChange={(e) => set({ validity: Number(e.target.value) || 0 })} className={inputCls} /></Field>
              <div className="rounded-md border bg-muted/50 p-3 sm:col-span-2"><span className="text-muted-foreground">{t("Expiry / cut-off date")}:</span> <b>{fmtDate(end)}</b> · {daysLeft(end)} {t("days remaining")}</div>
              <label className="flex items-center justify-between gap-3 rounded-md border p-3 sm:col-span-2">{t("Allow validity extension")}<Switch checked={w.extAllowed} onCheckedChange={(v) => set({ extAllowed: v })} /></label>
              <p className="text-xs text-muted-foreground sm:col-span-2">{t("Pending sign-off: whether 'activation deadline' means the last date to activate or the last date to complete surveys.")}</p>
            </div>
          )}
          {step === 4 && (
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="State"><input value="Uttar Pradesh" disabled className={cn(inputCls, "bg-muted")} /></Field>
                <Field label="District"><select value={w.district} onChange={(e) => set({ district: e.target.value, areas: new Set(), vols: new Set() })} className={inputCls}>{upDistricts.map((x) => <option key={x}>{x}</option>)}</select></Field>
              </div>
              <div className="rounded-md border p-3">
                <div className="mb-2 text-xs text-muted-foreground">{t("Assembly Constituency")} → {t("Block / Tehsil")} → {t("Gram Panchayat / Ward")}</div>
                {acs.map((ac) => (
                  <div key={ac} className="py-1">
                    <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={w.areas.has(ac)} onChange={() => toggle("areas", ac)} />{ac}</label>
                    {w.areas.has(ac) && upBlocks[w.district]!.map((b) => (
                      <div key={b} className="ml-6 border-l pl-3">
                        <label className="flex items-center gap-2 py-0.5"><input type="checkbox" checked={w.areas.has(`${ac}|${b}`)} onChange={() => toggle("areas", `${ac}|${b}`)} />{b}</label>
                        {w.areas.has(`${ac}|${b}`) && (
                          <div className="ml-6 flex flex-wrap gap-x-4 gap-y-1 border-l py-1 pl-3 text-xs">
                            {upVillages.slice(0, 6).map((g) => <label key={g} className="flex items-center gap-1.5"><input type="checkbox" checked={w.areas.has(`${ac}|${b}|${g}`)} onChange={() => toggle("areas", `${ac}|${b}|${g}`)} />{g}</label>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">{w.areas.size} {t("areas selected")}</div>
            </div>
          )}
          {step === 5 && (
            <div className="grid gap-4">
              <section>
                <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">{t("Candidate logins")}</h3>
                  <button type="button" className={btn} onClick={() => set({ logins: [...w.logins, { name: "", user: "", role: "Candidate Team (view-only)" }] })}><Plus className="size-4" /> {t("Add team login")}</button></div>
                <div className="grid gap-2">
                  {w.logins.map((l, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr]">
                      <input value={l.name} placeholder={t("Name")} onChange={(e) => set({ logins: w.logins.map((x, j) => (j === i ? { ...x, name: e.target.value, user: x.user || userId(e.target.value) } : x)) })} className={inputCls} />
                      <input value={l.user} placeholder={t("Username")} onChange={(e) => set({ logins: w.logins.map((x, j) => (j === i ? { ...x, user: e.target.value } : x)) })} className={cn(inputCls, "font-mono text-xs")} />
                      <select value={l.role} onChange={(e) => set({ logins: w.logins.map((x, j) => (j === i ? { ...x, role: e.target.value as Login["role"] } : x)) })} className={inputCls}>
                        {(["Candidate Administrator", "Candidate Team (view-only)"] as const).map((r) => <option key={r} value={r}>{t(r)}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">{t("Assign volunteers from master list")} · {w.district}</h3>
                <p className="mb-2 text-xs text-muted-foreground">{t("Inactive volunteers can't be assigned to new campaigns.")}</p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {vols.map((v) => (
                    <label key={v.id} className={cn("flex items-center gap-2 rounded-md border px-3 py-2", !v.active && "opacity-50")}>
                      <input type="checkbox" disabled={!v.active} checked={w.vols.has(v.id)} onChange={() => toggle("vols", v.id)} />
                      <span className="flex-1">{v.name} <span className="text-xs text-muted-foreground">· {v.block} · {v.gp}</span></span>
                      {!v.active && <Chip s="Inactive" />}
                    </label>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{w.vols.size} {t("volunteers selected")}</div>
              </section>
            </div>
          )}
          {step === 6 && (
            <div className="divide-y rounded-md border">
              {permList.map(([p]) => (
                <label key={p} className="flex items-center justify-between gap-4 px-4 py-3">{t(p)}<Switch checked={w.perms[p]} onCheckedChange={(v) => set({ perms: { ...w.perms, [p]: v } })} /></label>
              ))}
            </div>
          )}
          {step === 7 && (
            <div className="grid gap-4">
              <dl className="grid gap-x-6 gap-y-2 rounded-md border p-4 sm:grid-cols-2">
                {([["Candidate", `${w.name} · ${w.party} · ${t(w.level)}`], ["Client", account], ["Package", pkg ? `${pkg.name} · ${n(pkg.target)}` : "—"], ["Validity", `${fmtDate(w.start)} – ${fmtDate(end)}`], ["Authorised areas", `${w.district} · ${w.areas.size}`], ["Logins", String(w.logins.length)], ["Volunteers", String(w.vols.size)], ["Permissions", `${Object.values(w.perms).filter(Boolean).length} / ${permList.length}`]] as const).map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-muted-foreground">{t(k)}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
              <Field label="Login instructions">
                <textarea readOnly value={instructions} rows={6} className="rounded-md border bg-muted/40 p-2 font-mono text-xs" />
              </Field>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={btn} onClick={() => { navigator.clipboard?.writeText(instructions); toast.success(t("Copied")); }}><Copy className="size-4" /> {t("Copy instructions")}</button>
                <span className="text-xs text-muted-foreground">{t("SMS, WhatsApp and email delivery are outside the base scope. Share manually.")}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <span className="self-center text-xs text-muted-foreground">{t("Step")} {step + 1} / {steps.length}</span>
          <div className="flex gap-2">
            <button className={btn} onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>{t(step === 0 ? "Cancel" : "Back")}</button>
            {step < steps.length - 1
              ? <button className={btnPrimary} disabled={!ok} onClick={next}>{t("Next")}</button>
              : <button className={btnPrimary} onClick={finish}><Check className="size-4" /> {t("Activate campaign")}</button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================= SURVEY PACKAGES ================= */
export function PackagesPage() {
  const { t, role } = usePreview();
  const manage = canManage(role);
  const [pkgs, setPkgs] = useState<Package[]>(upPackages);
  const [tab, setTab] = useState<"list" | "use">("list");
  const [chip, setChip] = useState("All");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [extending, setExtending] = useState<string | null>(null);
  const withStatus = pkgs.map((p) => ({ ...p, status: deriveStatus(p) }));
  const shown = withStatus.filter((p) => (chip === "All" || p.status === chip) && `${p.id} ${p.name} ${p.assignedTo ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const open = withStatus.find((p) => p.id === detail);
  const ext = pkgs.find((p) => p.id === extending);
  const extend = (p: Package, to: string, reason: string) => {
    setPkgs((all) => all.map((x) => (x.id === p.id ? { ...x, expiry: to, validity: x.validity + daysLeft(to) - daysLeft(x.expiry), extensions: [...x.extensions, { from: x.expiry, to, by: portals[role].user, on: iso(TODAY), reason }] } : x)));
    setExtending(null);
    toast.success(`${p.id}: ${t("expiry extended to")} ${fmtDate(to)}`);
  };

  return (
    <div className="space-y-5">
      <Header section="Campaign Management" title="Survey Packages" desc="Configurable survey packages with targets, validity and extensions.">
        {manage && <button className={btnPrimary} onClick={() => setCreating(true)}><Plus className="size-4" /> {t("Create package")}</button>}
      </Header>
      <div className="flex rounded-md border bg-muted p-0.5 text-xs font-medium sm:w-fit">
        {([["list", "Packages"], ["use", "Utilisation"]] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cn("flex-1 rounded px-4 py-1.5 text-muted-foreground", tab === k && "bg-card text-foreground shadow-card")}>{t(l)}</button>)}
      </div>

      {tab === "list" ? (
        <div className="panel">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            {["All", ...pkgStatuses].map((s) => {
              const count = s === "All" ? withStatus.length : withStatus.filter((p) => p.status === s).length;
              return <button key={s} onClick={() => setChip(s)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", chip === s ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>{t(s)} <span className="tabular-nums opacity-70">{count}</span></button>;
            })}
            <div className="relative ml-auto min-w-48 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search…")} className={cn(inputCls, "pl-9")} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground">{["Package", "Assigned to", "Target", "Accepted", "% achieved", "Activation", "Expiry", "Days left", "Price", "Status"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{t(h)}</th>)}</tr></thead>
              <tbody>
                {shown.map((p) => {
                  const pc = pctOf(p.accepted, p.target);
                  return (
                    <tr key={p.id} onClick={() => setDetail(p.id)} className="cursor-pointer border-b last:border-0 hover:bg-muted/50">
                      <td className="px-3 py-2.5"><div className="font-medium">{p.name}</div><div className="font-mono text-[11px] text-muted-foreground">{p.id}</div></td>
                      <td className="px-3 text-muted-foreground">{p.assignedTo ?? "—"}</td>
                      <td className="px-3 tabular-nums">{n(p.target)}</td>
                      <td className="px-3 tabular-nums">{n(p.accepted)}</td>
                      <td className="px-3"><div className="flex min-w-28 items-center gap-2"><Progress v={pc} /><span className="w-9 text-xs tabular-nums">{pc}%</span></div></td>
                      <td className="whitespace-nowrap px-3 text-muted-foreground">{fmtDate(p.activation)}</td>
                      <td className="whitespace-nowrap px-3 text-muted-foreground">{fmtDate(p.expiry)}{p.extensions.length > 0 && <span className="ml-1 rounded bg-accent px-1 text-[10px] text-accent-foreground">{t("extended")}</span>}</td>
                      <td className="whitespace-nowrap px-3 tabular-nums text-muted-foreground">{daysLabel(p.expiry, t)}</td>
                      <td className="whitespace-nowrap px-3 text-muted-foreground">{p.price ? `₹${n(p.price)}` : t("Zero-cost")}</td>
                      <td className="px-3"><Chip s={p.status} /></td>
                    </tr>
                  );
                })}
                {shown.length === 0 && <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">{t("No records match your search.")}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : <Utilisation pkgs={withStatus} />}

      <Sheet open={!!open} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {open && (() => {
            const pc = pctOf(open.accepted, open.target);
            const original = open.extensions[0]?.from ?? open.expiry;
            return (<>
              <SheetHeader><SheetTitle className="flex items-center gap-2">{open.name} <Chip s={open.status} /></SheetTitle><div className="font-mono text-xs text-muted-foreground">{open.id}{open.assignedTo && ` · ${open.assignedTo}`}</div></SheetHeader>
              <div className="space-y-5 px-4 pb-6">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {([["Target", n(open.target)], ["Accepted", n(open.accepted)], ["Remaining", n(Math.max(0, open.target - open.accepted))], ["% achieved", `${pc}%`], ["Days remaining", daysLabel(open.expiry, t)], ["Validity (days)", String(open.validity)]] as const).map(([k, v]) => (
                    <div key={k} className="rounded-md border p-3"><div className="text-xs text-muted-foreground">{t(k)}</div><div className="mt-0.5 text-lg font-semibold tabular-nums">{v}</div></div>
                  ))}
                </div>
                <Progress v={pc} />
                <dl className="divide-y rounded-md border text-sm">
                  {([["Activation date", fmtDate(open.activation)], ["Original deadline", fmtDate(original)], ["Current expiry", fmtDate(open.expiry)], ["Price", open.price ? `₹${n(open.price)}` : t("Zero-cost")], ["Maximum target cap", open.maxCap ? n(open.maxCap) : "—"], ["Extension allowed", t(open.extensionAllowed ? "Yes" : "No")]] as const).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-3 py-2"><dt className="text-muted-foreground">{t(k)}</dt><dd className="font-medium">{v}</dd></div>
                  ))}
                </dl>
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{t("Extension history")}</h3>
                    {manage && <button className={btnPrimary} disabled={!open.extensionAllowed || open.status === "Draft"} onClick={() => setExtending(open.id)}><CalendarPlus className="size-4" /> {t("Extend validity")}</button>}
                  </div>
                  {!open.extensionAllowed && <p className="mb-2 text-xs text-muted-foreground">{t("Extensions are switched off for this package.")}</p>}
                  {open.extensions.length ? (
                    <div className="overflow-x-auto rounded-md border"><table className="w-full text-xs">
                      <thead><tr className="border-b text-left text-muted-foreground">{["Original → Revised", "Approved by", "Date", "Reason"].map((h) => <th key={h} className="px-3 py-2 font-medium">{t(h)}</th>)}</tr></thead>
                      <tbody>{open.extensions.map((e, i) => <tr key={i} className="border-b last:border-0"><td className="whitespace-nowrap px-3 py-2">{fmtDate(e.from)} → <b>{fmtDate(e.to)}</b></td><td className="px-3">{e.by}</td><td className="whitespace-nowrap px-3">{fmtDate(e.on)}</td><td className="px-3 text-muted-foreground">{e.reason}</td></tr>)}</tbody>
                    </table></div>
                  ) : <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">{t("No extensions yet.")}</p>}
                </section>
              </div>
            </>);
          })()}
        </SheetContent>
      </Sheet>
      {ext && <ExtendDialog open title={ext.name} end={ext.expiry} onClose={() => setExtending(null)} onConfirm={(to, r) => extend(ext, to, r)} />}
      {creating && <CreatePackage nextId={`PKG-${1001 + pkgs.length}`} onClose={() => setCreating(false)} onSave={(p) => { setPkgs((all) => [p, ...all]); setCreating(false); toast.success(`${p.name} ${t("created")}`); }} />}
    </div>
  );
}

function CreatePackage({ nextId, onClose, onSave }: { nextId: string; onClose: () => void; onSave: (p: Package) => void }) {
  const { t } = usePreview();
  const [p, setP] = useState({ name: "", target: 5000, validity: 30, activation: iso(TODAY), expiry: addDays(iso(TODAY), 30), price: 0, zero: true, ext: true, cap: "", status: "Draft" as "Draft" | "Active" });
  const set = (x: Partial<typeof p>) => setP((o) => ({ ...o, ...x }));
  const capBad = p.cap !== "" && Number(p.cap) < p.target;
  const datesBad = p.expiry <= p.activation;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{t("Create package")}</DialogTitle></DialogHeader>
        <form id="pkg-form" className="grid max-h-[65vh] gap-3 overflow-y-auto pr-1" onSubmit={(e) => {
          e.preventDefault(); if (capBad || datesBad) return;
          onSave({ id: nextId, name: p.name, target: p.target, accepted: 0, validity: p.validity, activation: p.activation, expiry: p.expiry, price: p.zero ? 0 : p.price, extensionAllowed: p.ext, ...(p.cap ? { maxCap: Number(p.cap) } : {}), ...(p.status === "Draft" ? { held: "Draft" as const } : {}), extensions: [] });
        }}>
          <Field label="Package name"><input required autoFocus value={p.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} placeholder="MLA Standard 5K" /></Field>
          <Field label="Survey target">
            <input type="number" min={1} required value={p.target} onChange={(e) => set({ target: Number(e.target.value) || 0 })} className={inputCls} />
            <div className="flex flex-wrap gap-1.5">{[2000, 4000, 5000, 6000].map((v) => <button key={v} type="button" onClick={() => set({ target: v })} className={cn("rounded-full border px-2.5 py-0.5 text-xs", p.target === v ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>{n(v)}</button>)}</div>
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Validity (days)"><input type="number" min={1} value={p.validity} onChange={(e) => { const v = Number(e.target.value) || 1; set({ validity: v, expiry: addDays(p.activation, v) }); }} className={inputCls} /></Field>
            <Field label="Activation date"><input type="date" value={p.activation} onChange={(e) => set({ activation: e.target.value, expiry: addDays(e.target.value, p.validity) })} className={inputCls} /></Field>
            <Field label="Expiry / cut-off date"><input type="date" value={p.expiry} onChange={(e) => set({ expiry: e.target.value })} className={cn(inputCls, datesBad && "border-destructive")} /></Field>
          </div>
          <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 text-sm">{t("Zero-cost package (₹0)")}<Switch checked={p.zero} onCheckedChange={(v) => set({ zero: v })} /></label>
            <Field label="Price (₹)"><input type="number" min={0} disabled={p.zero} value={p.zero ? 0 : p.price} onChange={(e) => set({ price: Number(e.target.value) || 0 })} className={cn(inputCls, p.zero && "bg-muted")} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">{t("Extension allowed")}<Switch checked={p.ext} onCheckedChange={(v) => set({ ext: v })} /></label>
            <Field label="Maximum target cap (optional)"><input type="number" min={0} value={p.cap} onChange={(e) => set({ cap: e.target.value })} className={cn(inputCls, capBad && "border-destructive")} placeholder={t("No cap")} />{capBad && <span className="text-xs text-destructive">{t("Cap can't be below the target.")}</span>}</Field>
          </div>
          <Field label="Status"><select value={p.status} onChange={(e) => set({ status: e.target.value as "Draft" | "Active" })} className={inputCls}>{["Draft", "Active"].map((s) => <option key={s} value={s}>{t(s)}</option>)}</select></Field>
          <p className="text-xs text-muted-foreground">{t("Payment gateway and invoicing are outside the base scope; price is for reference.")}</p>
        </form>
        <DialogFooter><button className={btn} onClick={onClose}>{t("Cancel")}</button><button form="pkg-form" className={btnPrimary} disabled={capBad || datesBad}>{t("Create package")}</button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Utilisation({ pkgs }: { pkgs: (Package & { status: string })[] }) {
  const { t } = usePreview();
  const count = (f: (p: Package & { status: string }) => boolean) => pkgs.filter(f).length;
  const paid = count((p) => p.price > 0);
  const chart = pkgs.filter((p) => p.assignedTo).map((p) => ({ name: p.assignedTo!, [t("Target")]: p.target, [t("Accepted")]: p.accepted }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("Packages created")} value={pkgs.length} />
        <Stat label={t("Assigned")} value={count((p) => !!p.assignedTo)} />
        <Stat label={t("Extensions granted")} value={pkgs.reduce((s, p) => s + p.extensions.length, 0)} />
        <Stat label={t("Paid / zero-cost")} value={`${paid} / ${pkgs.length - paid}`} />
        <Stat label={t("Active")} value={count((p) => p.status === "Active" || p.status === "Expiring Soon")} />
        <Stat label={t("Expired")} value={count((p) => p.status === "Expired")} />
        <Stat label={t("Total target")} value={n(pkgs.reduce((s, p) => s + p.target, 0))} />
        <Stat label={t("Total accepted")} value={n(pkgs.reduce((s, p) => s + p.accepted, 0))} />
      </div>
      <section className="panel">
        <h2 className="border-b px-5 py-3.5 text-sm font-semibold">{t("Target vs accepted surveys, by candidate")}</h2>
        <div className="p-4">
          <ClientOnly><ResponsiveContainer height={chart.length * 26 + 40}>
            <BarChart data={chart} layout="vertical" barGap={2} margin={{ left: 8, right: 16 }}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
              <YAxis type="category" dataKey="name" width={120} fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
              <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey={t("Target")} fill="var(--muted-foreground)" fillOpacity={0.25} radius={[0, 3, 3, 0]} barSize={8} />
              <Bar dataKey={t("Accepted")} fill="var(--chart-1)" radius={[0, 3, 3, 0]} barSize={8} />
            </BarChart>
          </ResponsiveContainer></ClientOnly>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-muted-foreground/25" />{t("Target")}</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: "var(--chart-1)" }} />{t("Accepted")}</span></div>
        </div>
      </section>
    </div>
  );
}

/* ================= CAMPAIGNS ================= */
export function CampaignsPage() {
  const { t, role } = usePreview();
  const manage = canManage(role);
  const [camps, setCamps] = useState<Campaign[]>(upCampaigns);
  const [cand, setCand] = useState("All");
  const [chip, setChip] = useState("All");
  const [extending, setExtending] = useState<string | null>(null);
  const [raising, setRaising] = useState<string | null>(null);
  const rows = useMemo(() => camps.map((c) => ({ ...c, status: deriveStatus({ ...c, expiry: c.end }), pc: pctOf(c.accepted, c.target) })), [camps]);
  const shown = rows.filter((c) => (cand === "All" || c.candidate === cand) && (chip === "All" || c.status === chip));
  const near = rows.filter((c) => c.pc >= 90 && c.pc < 100 && c.status !== "Expired").length;
  const done = rows.filter((c) => c.status === "Completed").length;
  const ext = camps.find((c) => c.id === extending);
  const raise = camps.find((c) => c.id === raising);
  const update = (id: string, p: Partial<Campaign>) => setCamps((all) => all.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const askAdmin = <span className="text-[11px] opacity-80">{t("Ask an administrator")}</span>;

  return (
    <div className="space-y-5">
      <Header section="Campaign Management" title="Campaigns" desc="Survey campaigns by candidate, with target progress." />
      {(near > 0 || done > 0) && (
        <div className="grid gap-2 md:grid-cols-2">
          {near > 0 && <Banner tone="warning" icon={<TrendingUp className="size-4" />}>{near} {t("campaigns are at 90% or more of their target.")}</Banner>}
          {done > 0 && <Banner tone="success" icon={<CircleCheck className="size-4" />}>{done} {t("campaigns reached target; collection auto-stopped.")}</Banner>}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <select value={cand} onChange={(e) => setCand(e.target.value)} className="h-9 rounded-md border bg-card px-2 text-sm" aria-label={t("Candidate")}>
          <option value="All">{t("All candidates")}</option>
          {[...new Set(camps.map((c) => c.candidate))].map((c) => <option key={c}>{c}</option>)}
        </select>
        {["All", "Active", "Expiring Soon", "Expired", "Completed", "Suspended"].map((s) => (
          <button key={s} onClick={() => setChip(s)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", chip === s ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>{t(s)} <span className="opacity-70">{s === "All" ? rows.length : rows.filter((c) => c.status === s).length}</span></button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {shown.map((c) => {
          const pkg = upPackages.find((p) => p.id === c.packageId);
          const expired = c.status === "Expired";
          return (
            <article key={c.id} className={cn("panel flex flex-col", expired && "bg-muted/40")}>
              <div className="flex items-start gap-2 border-b px-4 py-3">
                <div className="min-w-0 flex-1"><div className="truncate font-semibold">{c.name}</div><div className="text-xs text-muted-foreground">{c.candidate} · <span className="font-mono">{c.id}</span></div></div>
                <Chip s={c.status} />
              </div>
              <div className={cn("flex flex-1 flex-col gap-3 p-4", expired && "opacity-60")}>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {([["Package", pkg?.name ?? "—"], ["Questionnaire", c.questionnaire], ["Volunteers", String(c.volunteers)], ["Days remaining", daysLabel(c.end, t)]] as const).map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{t(k)}</dt><dd className="font-medium">{v}</dd></div>)}
                </dl>
                <div className="flex flex-wrap gap-1">{c.areas.map((a) => <span key={a} className="rounded bg-accent px-1.5 py-0.5 text-[11px] text-accent-foreground">{a}</span>)}</div>
                <div>
                  <div className="mb-1 flex justify-between text-xs"><span className="tabular-nums">{n(c.accepted)} / {n(c.target)}</span><span className="font-medium tabular-nums">{c.pc}%</span></div>
                  <Progress v={c.pc} />
                </div>
              </div>
              <div className="px-4 pb-4">
                {expired ? (
                  <Banner tone="destructive" icon={<Lock className="size-4" />} action={manage ? <button className="rounded border border-current px-2 py-0.5" onClick={() => setExtending(c.id)}>{t("Extend")}</button> : askAdmin}>
                    {t("Survey form closed — campaign expired on")} {fmtDate(c.end)}. {t("Extend to reopen.")}
                  </Banner>
                ) : c.status === "Completed" ? (
                  <Banner tone="success" icon={<CircleCheck className="size-4" />} action={manage ? <button className="rounded border border-current px-2 py-0.5" onClick={() => setRaising(c.id)}>{t("Increase target")}</button> : askAdmin}>
                    {t("Target reached — collection auto-stopped.")}
                  </Banner>
                ) : c.status === "Suspended" ? (
                  <Banner tone="muted" icon={<PauseCircle className="size-4" />}>{t("Campaign suspended by an administrator.")}</Banner>
                ) : c.pc >= 90 ? (
                  <Banner tone="warning" icon={<AlertTriangle className="size-4" />}>{t("Target nearly reached")} — {n(c.target - c.accepted)} {t("surveys left. Collection stops automatically at target.")}</Banner>
                ) : c.status === "Expiring Soon" ? (
                  <Banner tone="warning" icon={<AlertTriangle className="size-4" />} action={manage ? <button className="rounded border border-current px-2 py-0.5" onClick={() => setExtending(c.id)}>{t("Extend")}</button> : undefined}>{t("Expires on")} {fmtDate(c.end)}.</Banner>
                ) : null}
              </div>
            </article>
          );
        })}
        {shown.length === 0 && <div className="panel p-10 text-center text-sm text-muted-foreground lg:col-span-2">{t("No campaigns match these filters.")}</div>}
      </div>
      {ext && <ExtendDialog open title={ext.name} end={ext.end} onClose={() => setExtending(null)} onConfirm={(to) => { update(ext.id, { end: to }); setExtending(null); toast.success(`${ext.name}: ${t("reopened until")} ${fmtDate(to)}`); }} />}
      {raise && <IncreaseTarget c={raise} onClose={() => setRaising(null)} onConfirm={(target) => { update(raise.id, { target }); setRaising(null); toast.success(`${raise.name}: ${t("target raised to")} ${n(target)} · ${t("collection resumed")}`); }} />}
    </div>
  );
}

function IncreaseTarget({ c, onClose, onConfirm }: { c: Campaign; onClose: () => void; onConfirm: (target: number) => void }) {
  const { t } = usePreview();
  const [target, setTarget] = useState(c.target + 1000);
  const bad = target <= c.accepted;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("Increase target")} · {c.name}</DialogTitle></DialogHeader>
        <div className="grid gap-3 text-sm">
          <div className="rounded-md border p-3">{t("Accepted")}: <b>{n(c.accepted)}</b> · {t("Current target")}: <b>{n(c.target)}</b></div>
          <Field label="New target">
            <input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value) || 0)} className={cn(inputCls, bad && "border-destructive")} />
            <div className="flex gap-1.5">{[500, 1000, 2000].map((d) => <button key={d} type="button" onClick={() => setTarget(c.target + d)} className={cn(btn, "h-7 text-xs")}>+{n(d)}</button>)}</div>
          </Field>
          {bad ? <p className="text-xs text-destructive">{t("New target must be above the accepted count.")}</p>
            : <p className="text-xs text-muted-foreground">{t("New progress")}: {pctOf(c.accepted, target)}% · {t("Volunteers can start new surveys again.")}</p>}
        </div>
        <DialogFooter><button className={btn} onClick={onClose}>{t("Cancel")}</button><button className={btnPrimary} disabled={bad} onClick={() => onConfirm(target)}>{t("Increase target")}</button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

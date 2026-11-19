import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Radar, ArrowRight, ShieldCheck, MonitorDot, ClipboardCheck, UserSquare, Eye, Smartphone, type LucideIcon } from "lucide-react";
import { usePreview, portals, homeFor, initials, type Role } from "@/lib/preview";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Lokdrishti" }, { name: "description", content: "Choose a role to preview its Lokdrishti portal." }] }),
  component: LoginPage,
});

const groups: { title: string; roles: [Role, LucideIcon][] }[] = [
  { title: "Lokdrishti team", roles: [["Super Administrator", ShieldCheck], ["Command Centre / Operations", MonitorDot], ["Field Supervisor", ClipboardCheck]] },
  { title: "Candidate", roles: [["Candidate Administrator", UserSquare], ["Candidate Team (view-only)", Eye]] },
  { title: "Field", roles: [["Volunteer", Smartphone]] },
];

function LoginPage() {
  const { setRole, lang, setLang, t } = usePreview();
  const navigate = useNavigate();
  const signIn = (r: Role) => { setRole(r); navigate({ to: homeFor(r) }); };
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground"><Radar className="size-5" /></div>
          <div className="leading-tight"><div className="text-lg font-semibold">Lokdrishti</div><div className="text-xs text-muted-foreground">{t("Political Survey, Geofencing & Digital Command Centre")}</div></div>
          <div className="ml-auto flex rounded-md border bg-muted p-0.5" role="group" aria-label="Language">
            {(["en", "hi"] as const).map((l) => <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={cn("rounded px-2.5 py-1 text-xs font-medium text-muted-foreground", lang === l && "bg-card text-foreground shadow-card")}>{l === "en" ? "English" : "हिन्दी"}</button>)}
          </div>
        </div>
        <h1 className="mt-10 text-2xl font-semibold tracking-tight">{t("Sign in to your portal")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("Each role has its own portal and only sees its own screens. Preview only, no real authentication.")}</p>

        {groups.map((g) => (
          <section key={g.title} className="mt-8">
            <div className="eyebrow">{t(g.title)}</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.roles.map(([r, Icon]) => {
                const p = portals[r];
                return (
                  <button key={r} onClick={() => signIn(r)} className="panel group flex flex-col p-5 text-left transition-colors hover:border-ring/40">
                    <span className={cn("mb-4 h-1 w-10 rounded-full", p.bar)} />
                    <div className="flex items-center gap-3">
                      <div className={cn("grid size-10 place-items-center rounded-md", p.chip)}><Icon className="size-5" /></div>
                      <div className="min-w-0"><div className="font-semibold">{t(p.portal)}</div><div className="text-xs text-muted-foreground">{t(r)}</div></div>
                    </div>
                    <p className="mt-3 flex-1 text-sm text-muted-foreground">{t(p.blurb)}</p>
                    <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs">
                      <span className={cn("grid size-6 place-items-center rounded-full text-[10px] font-semibold", p.chip)}>{initials(p.user)}</span>
                      <span className="min-w-0 flex-1 truncate"><span className="font-medium">{p.user}</span> <span className="text-muted-foreground">· {p.login}</span></span>
                      <span className="inline-flex items-center gap-1 font-medium text-primary">{t("Sign in")} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        <p className="mt-10 text-xs text-muted-foreground">{t("Volunteers sign in on the Android app; this preview shows it in a phone frame.")} · <span className="rounded bg-warning/15 px-1.5 py-0.5 font-medium text-warning">{t("Demo data")}</span></p>
      </div>
    </div>
  );
}

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Bell, ChevronDown, ChevronRight, PanelLeftClose, PanelLeft, Search, Settings, Radar, Menu, LogOut, User, Repeat } from "lucide-react";
import { overview, sections as allSections, findNav, legacySections } from "@/lib/nav";
import { adminAlerts } from "@/data/demo";
import { PreviewProvider, usePreview, canSee, homeFor, isCandidateRole, scopedCandidate, portals, initials } from "@/lib/preview";

// Sidebar sections visible to the current preview role.
function useSections() {
  const { role } = usePreview();
  return allSections.map((s) => ({ ...s, items: s.items.filter((i) => canSee(role, i.path)) })).filter((s) => s.items.length);
}
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";

// Bell shows the latest Lokdrishti admin alerts; the full list is in Administration › Notifications.
const initialNotes = adminAlerts.slice(0, 5).map((a) => ({ id: a.id, title: a.title, body: a.body, time: a.time, to: a.to }));

function SidebarNav({ collapsed, path, onNavigate }: { collapsed: boolean; path: string; onNavigate?: () => void }) {
  const { role, t } = usePreview();
  const sections = useSections();
  const activeSection = sections.find((s) => s.items.some((i) => i.path === path))?.title;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (t: string) => open[t] ?? (t === activeSection || !legacySections.has(t));
  const [legacyOpen, setLegacyOpen] = useState(false);
  const showLegacy = legacyOpen || (!!activeSection && legacySections.has(activeSection));
  const main = sections.filter((s) => !legacySections.has(s.title));
  const legacy = sections.filter((s) => legacySections.has(s.title));
  const Icon0 = overview.icon;
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3 text-[13px]">
      {canSee(role, "/") && (<>
        <Link to="/" onClick={onNavigate} className={cn("flex h-9 items-center gap-2.5 rounded-md px-2.5 font-medium hover:bg-sidebar-accent", collapsed && "justify-center", path === "/" && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary")}>
          <Icon0 className="size-4" />{!collapsed && t("Dashboard")}
        </Link>
        <div className="my-3 h-px bg-sidebar-border" />
      </>)}
      {[...main, ...(legacy.length ? [null] : []), ...(showLegacy ? legacy : [])].map((s) => {
        if (!s) return collapsed ? <div key="legacy" className="my-3 h-px bg-sidebar-border" /> : (
          <button key="legacy" onClick={() => setLegacyOpen(!showLegacy)} aria-expanded={showLegacy} className="mb-1 mt-4 flex w-full items-center gap-2 border-t border-sidebar-border px-2.5 pt-3 text-[11px] font-semibold uppercase tracking-wide text-sidebar-muted hover:text-sidebar-accent-foreground">
            <span className="flex-1 text-left">{t("Research Suite (legacy)")}</span>
            {showLegacy ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
        );
        const Icon = s.icon;
        const sectionActive = s.title === activeSection;
        const firstItem = s.items[0];
        if (collapsed && firstItem)
          return (
            <Link key={s.title} to={firstItem.path} title={s.title} className={cn("mb-0.5 flex h-9 items-center justify-center rounded-md hover:bg-sidebar-accent", sectionActive && "bg-sidebar-accent text-sidebar-accent-foreground")}>
              <Icon className="size-4" />
            </Link>
          );
        return (
          <div key={s.title} className="mb-0.5">
            <Button variant="ghost" aria-expanded={isOpen(s.title)} onClick={() => setOpen((o) => ({ ...o, [s.title]: !isOpen(s.title) }))} className={cn("flex h-auto min-h-8 w-full items-center gap-2.5 whitespace-normal rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", sectionActive && "text-sidebar-accent-foreground")}>
              <Icon className="size-4 shrink-0 opacity-80" />
              <span className="flex-1">{t(s.title)}</span>
              {isOpen(s.title) ? <ChevronDown className="size-3.5 opacity-60" /> : <ChevronRight className="size-3.5 opacity-60" />}
            </Button>
            {isOpen(s.title) && (
              <div className="mb-1 ml-[18px] border-l border-sidebar-border pl-2">
                {s.items.map((i) => (
                   <Link key={i.path} to={i.path} onClick={onNavigate} className={cn("block rounded-md px-2.5 py-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", path === i.path && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                    {t(i.title)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  const { role, t } = usePreview();
  return (
    <div className="relative flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
      <div className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Radar className="size-4" /></div>
      {!collapsed && (<div className="leading-tight"><div className="text-sm font-semibold text-sidebar-accent-foreground">Lokdrishti</div><div className="text-[11px] text-sidebar-muted">{t(portals[role].portal)}</div></div>)}
      <span className={cn("absolute inset-x-0 bottom-0 h-0.5", portals[role].bar)} />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return <PreviewProvider><Shell>{children}</Shell></PreviewProvider>;
}

function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return path === "/login" ? <>{children}</> : <PortalShell path={path}>{children}</PortalShell>;
}

function PortalShell({ children, path }: { children: ReactNode; path: string }) {
  const navigate = useNavigate();
  const { role, lang, setLang, t } = usePreview();
  const me = portals[role];
  const sections = useSections();
  // Leaving a screen the role can't see → jump to that role's home screen.
  useEffect(() => { if (!canSee(role, path)) navigate({ to: homeFor(role) }); }, [role, path, navigate]);
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [notes, setNotes] = useState(initialNotes.map((n) => ({ ...n, read: false })));
  const crumb = findNav(path);
  const unread = notes.filter((n) => !n.read).length;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setSearch((s) => !s); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex", collapsed ? "w-16" : "w-64")}>
        <Brand collapsed={collapsed} />
        <SidebarNav collapsed={collapsed} path={path} />
        <button onClick={() => setCollapsed((c) => !c)} className="flex h-11 items-center gap-2 border-t border-sidebar-border px-5 text-xs text-sidebar-muted hover:text-sidebar-accent-foreground">
          {collapsed ? <PanelLeft className="size-4" /> : <><PanelLeftClose className="size-4" /> Collapse</>}
        </button>
      </aside>

      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="flex w-72 flex-col border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Brand />
          <SidebarNav collapsed={false} path={path} onNavigate={() => setMobile(false)} />
        </SheetContent>
      </Sheet>

      <CommandDialog open={search} onOpenChange={setSearch}>
        <CommandInput placeholder="Jump to a module…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          {[...(canSee(role, "/") ? [overview] : []), ...sections].map((s) => (
            <CommandGroup key={s.title} heading={t(s.title)}>
              {s.items.map((i) => (
                <CommandItem key={i.path} value={`${s.title} ${i.title}`} onSelect={() => { setSearch(false); navigate({ to: i.path }); }}>{t(i.title)}</CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur md:px-6">
          <button className="grid size-9 place-items-center rounded-md hover:bg-muted md:hidden" aria-label="Open menu" onClick={() => setMobile(true)}><Menu className="size-5" /></button>
          <button onClick={() => setSearch(true)} className="relative flex h-9 w-full max-w-md items-center rounded-md border bg-background pl-9 pr-14 text-left text-sm text-muted-foreground hover:border-ring/40">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <span className="truncate">{t("Search modules…")}</span>
            <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border bg-card px-1.5 text-[10px] sm:block">⌘K</kbd>
          </button>
          <span className={cn("hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium lg:inline", me.chip)}>{t(me.portal)}</span>
          {isCandidateRole(role) && <span className="hidden shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium xl:inline">{t("Viewing:")} {scopedCandidate} {t("only")}</span>}
          <div className="ml-auto flex items-center gap-1">
            <div className="mx-1 flex rounded-md border bg-muted p-0.5" role="group" aria-label="Language">
              {(["en", "hi"] as const).map((l) => <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={cn("rounded px-2 py-1 text-xs font-medium text-muted-foreground", lang === l && "bg-card text-foreground shadow-card")}>{l === "en" ? "English" : "हिन्दी"}</button>)}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative grid size-9 place-items-center rounded-md hover:bg-muted" aria-label="Notifications">
                  <Bell className="size-4" />
                  {unread > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">{unread}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b px-4 py-2.5"><span className="text-sm font-semibold">Notifications</span>
                  <button className="text-xs font-medium text-primary hover:underline" onClick={() => setNotes((n) => n.map((x) => ({ ...x, read: true })))}>{t("Mark all read")}</button></div>
                {notes.map((n) => (
                  <Link key={n.id} to={n.to} onClick={() => setNotes((all) => all.map((x) => (x.id === n.id ? { ...x, read: true } : x)))} className="flex gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
                    <div className="min-w-0 flex-1"><div className="text-sm font-medium">{n.title}</div><div className="text-xs text-muted-foreground">{n.body} · {n.time}</div></div>
                  </Link>
                ))}
                <Link to="/administration/notifications" className="block border-t px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted">{t("View all notifications")}</Link>
              </PopoverContent>
            </Popover>
            {role === "Super Administrator" && <Link to="/$" params={{ _splat: "administration/system-settings" }} className="grid size-9 place-items-center rounded-md hover:bg-muted" aria-label="Settings"><Settings className="size-4" /></Link>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 flex items-center gap-2.5 rounded-md border-l py-1 pl-3 pr-1 hover:bg-muted">
                  <div className={cn("grid size-8 place-items-center rounded-full text-xs font-semibold", me.chip)}>{initials(me.user)}</div>
                  <div className="hidden text-left leading-tight lg:block"><div className="text-sm font-medium">{me.user}</div><div className="text-[11px] text-muted-foreground">{t(role)}</div></div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal"><div className="text-sm font-medium">{me.user}</div><div className="text-xs text-muted-foreground">{me.login}</div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                {role === "Super Administrator" && <DropdownMenuItem onSelect={() => navigate({ to: "/$", params: { _splat: "administration/users-and-roles" } })}><User className="size-4" /> {t("Users & Roles")}</DropdownMenuItem>}
                <DropdownMenuItem onSelect={() => navigate({ to: "/login" })}><Repeat className="size-4" /> {t("Switch role")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { toast(t("Signed out (preview)")); navigate({ to: "/login" }); }}><LogOut className="size-4" /> {t("Sign out")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex items-center gap-1.5 px-4 pt-5 text-xs text-muted-foreground md:px-6">
          <Link to={homeFor(role)} className="hover:text-foreground">{t("Home")}</Link>
          {crumb && crumb.item.path !== "/" && (<><ChevronRight className="size-3" /> <span>{t(crumb.section.title)}</span><ChevronRight className="size-3" /> <span className="text-foreground">{t(crumb.item.title)}</span></>)}
          {path === "/" && (<><ChevronRight className="size-3" /><span className="text-foreground">{t("Dashboard")}</span></>)}
        </div>
        <main className="min-w-0 flex-1 px-4 pb-10 pt-3 md:px-6">{children}</main>
      </div>
    </div>
  );
}

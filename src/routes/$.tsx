import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { findNav, sections } from "@/lib/nav";
import { modules } from "@/lib/modules";
import { usePreview } from "@/lib/preview";
import { MaharashtraMap } from "@/components/maharashtra-map";
import { AiToolView, AnalyticsView, KanbanView, PermissionsView, SettingsView, TableView } from "@/components/module-views";
import { QuestionnaireBuilder } from "@/components/questionnaire-builder";

export const Route = createFileRoute("/$")({
  loader: ({ location }) => {
    // Forgive trailing slashes and bare section URLs (e.g. /campaign-management) instead of 404ing.
    const path = location.pathname.replace(/\/+$/, "") || "/"; // look up without the slash; redirecting here loops
    const section = sections.find((s) => s.items[0]?.path.startsWith(`${path}/`));
    if (section) throw redirect({ href: section.items[0]!.path });
    const nav = findNav(path);
    if (!nav || !modules[path]) throw notFound();
    return { path, section: nav.section.title, title: nav.item.title };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.title} · Lokdrishti` : "Lokdrishti";
    const d = loaderData ? modules[loaderData.path]?.desc ?? "" : "Political research platform for Maharashtra.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: ModulePage,
});

function ModulePage() {
  const { path, section, title } = Route.useLoaderData();
  const { role, t } = usePreview();
  const mod = modules[path]!;
  return (
    <div key={path + role} className="space-y-5">
      <div>
        <div className="eyebrow">{t(section)}</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t(title)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(mod.desc)} <span className="ml-1 rounded bg-warning/15 px-1.5 py-0.5 text-[11px] font-medium text-warning">{t("Demo data")}</span></p>
      </div>
      {mod.kind === "table" && <TableView title={title} mod={mod} />}
      {mod.kind === "analytics" && <AnalyticsView title={title} mod={mod} />}
      {mod.kind === "kanban" && <KanbanView title={title} mod={mod} />}
      {mod.kind === "settings" && <SettingsView mod={mod} />}
      {mod.kind === "permissions" && <PermissionsView />}
      {mod.kind === "ai" && <AiToolView mod={mod} />}
      {mod.kind === "builder" && <QuestionnaireBuilder />}
      {mod.kind === "map" && <MaharashtraMap />}
    </div>
  );
}

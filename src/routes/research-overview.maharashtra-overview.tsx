import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Briefcase, ClipboardList, Inbox, CheckCircle2, Users, FileText, Download, Plus, Bot } from "lucide-react";
import { ClientOnly } from "@tanstack/react-router";
import { MaharashtraMap } from "@/components/maharashtra-map";
import { kpis, collection, categories, completion, activity, publicIssues, districtStats } from "@/data/demo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import { downloadCsv } from "@/lib/ui-helpers";

export const Route = createFileRoute("/research-overview/maharashtra-overview")({
  head: () => ({
    meta: [
      { title: "Maharashtra Overview · Lokdrishti" },
      { name: "description", content: "Research intelligence overview for Maharashtra: surveys, field operations, district coverage and public issues." },
      { property: "og:title", content: "Lokdrishti – Research Dashboard" },
      { property: "og:description", content: "Political research and intelligence platform for Maharashtra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const icons = { briefcase: Briefcase, clipboard: ClipboardList, inbox: Inbox, check: CheckCircle2, users: Users, file: FileText };
const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 } };

function Dashboard() {
  const byDistrict = Object.values(districtStats).sort((a, b) => b.surveys - a.surveys).slice(0, 8);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Research Intelligence Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Maharashtra · 1 May – 31 Oct 2026 · <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[11px] font-medium text-warning">Illustrative demo data</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { downloadCsv("dashboard-districts", Object.values(districtStats)); toast.success("Dashboard data downloaded"); }} className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium hover:bg-muted"><Download className="size-4" /> Export</button>
          <Link to="/ai-intelligence/ai-research-assistant" className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium hover:bg-muted"><Bot className="size-4" /> Ask AI</Link>
          <Link to="/$" params={{ _splat: "research-management/survey-builder" }} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="size-4" /> New survey</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => {
          const Icon = icons[k.icon as keyof typeof icons];
          return (
            <div key={k.label} className="panel p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{k.value}</div>
              <div className="mt-1 flex items-end justify-between">
                <span className={cn("text-xs font-medium", k.negative ? "text-destructive" : "text-success")}>{k.delta} <span className="font-normal text-muted-foreground">vs prev.</span></span>
                <div className="h-7 w-16">
                  <ClientOnly>
                    <ResponsiveContainer><LineChart data={k.trend.map((v) => ({ v }))}><Line dataKey="v" dot={false} strokeWidth={1.5} stroke={k.negative ? "var(--destructive)" : "var(--primary)"} isAnimationActive={false} /></LineChart></ResponsiveContainer>
                  </ClientOnly>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <MaharashtraMap />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Survey collection over time" sub="Responses collected vs validated" className="xl:col-span-2">
          <ClientOnly>
            <ResponsiveContainer height={240}>
              <AreaChart data={collection}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip {...tip} />
                <Area dataKey="responses" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.1} strokeWidth={2} />
                <Area dataKey="validated" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ClientOnly>
        </Card>
        <Card title="Research categories" sub="Share of active projects">
          <ClientOnly>
            <ResponsiveContainer height={170}>
              <PieChart><Pie data={categories} dataKey="value" innerRadius={48} outerRadius={75} paddingAngle={2} stroke="none">
                {categories.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}</Pie><Tooltip {...tip} /></PieChart>
            </ResponsiveContainer>
          </ClientOnly>
          <ul className="mt-2 space-y-1.5 text-xs">
            {categories.map((c, i) => (
              <li key={c.name} className="flex items-center gap-2"><span className="size-2 rounded-sm" style={{ background: pieColors[i] }} />{c.name}<span className="ml-auto tabular-nums text-muted-foreground">{c.value}%</span></li>
            ))}
          </ul>
        </Card>
        <Card title="Research activity by district" sub="Surveys conducted, top 8" className="xl:col-span-2">
          <ClientOnly>
            <ResponsiveContainer height={240}>
              <BarChart data={byDistrict}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="surveys" fill="var(--chart-1)" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </ClientOnly>
        </Card>
        <Card title="Survey completion rates" sub="Active surveys">
          <ul className="space-y-3.5">
            {completion.map((c) => (
              <li key={c.survey}>
                <div className="flex justify-between text-xs"><span className="truncate">{c.survey}</span><span className="font-medium tabular-nums">{c.rate}%</span></div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className={cn("h-full rounded-full", c.rate >= 80 ? "bg-success" : c.rate >= 70 ? "bg-primary" : "bg-warning")} style={{ width: `${c.rate}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Recent research projects" className="xl:col-span-2" pad={false}>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="px-5 py-2 font-medium">Project</th><th className="font-medium">District</th><th className="font-medium">Lead</th><th className="pr-5 font-medium">Status</th></tr></thead>
            <tbody>
              {activity.projects.map((p) => (
                <tr key={p.name} className="cursor-pointer border-b last:border-0 hover:bg-muted/50" onClick={() => toast(p.name, { description: `${p.district} · Lead: ${p.owner} · ${p.status}` })}>
                  <td className="px-5 py-2.5 font-medium">{p.name}</td><td className="text-muted-foreground">{p.district}</td><td className="text-muted-foreground">{p.owner}</td>
                  <td className="pr-5"><Status s={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Pending approvals" pad={false}>
          <Approvals />
        </Card>
        <Card title="Public issue overview" className="xl:col-span-2" pad={false}>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="px-5 py-2 font-medium">Issue category</th><th className="font-medium">Location</th><th className="font-medium">Records</th><th className="pr-5 font-medium">Last updated</th></tr></thead>
            <tbody>
              {publicIssues.map((p) => (
                <tr key={p.category} className="cursor-pointer border-b last:border-0 hover:bg-muted/50" onClick={() => toast(p.category, { description: `${p.records} research records in ${p.location}` })}>
                  <td className="px-5 py-2.5"><span className={cn("mr-2 inline-block size-1.5 rounded-full align-middle", p.level === "high" ? "bg-destructive" : p.level === "medium" ? "bg-warning" : "bg-success")} />{p.category}</td>
                  <td className="text-muted-foreground">{p.location}</td><td className="tabular-nums">{p.records}</td><td className="pr-5 text-muted-foreground">{p.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Recently uploaded datasets" pad={false}>
          <ul>
            {activity.datasets.map((d) => (
              <li key={d.name} onClick={() => toast.success(`Downloading ${d.name}`)} className="flex cursor-pointer items-center gap-3 border-b px-5 py-3 last:border-0 hover:bg-muted/50">
                <div className="grid size-8 place-items-center rounded-md bg-teal/10 text-teal"><FileText className="size-4" /></div>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{d.name}</div><div className="text-xs text-muted-foreground">{d.size} · {d.when}</div></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, sub, children, className, pad = true }: { title: string; sub?: string; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn("panel", className)}>
      <div className="border-b px-5 py-3.5"><h2 className="text-sm font-semibold">{title}</h2>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

function Status({ s }: { s: string }) {
  const c = s === "Active" ? "bg-success/10 text-success" : s === "Review" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground";
  return <span className={cn("rounded px-2 py-0.5 text-xs font-medium", c)}>{s}</span>;
}

function Approvals() {
  const [items, setItems] = useState(activity.approvals);
  const decide = (item: string, ok: boolean) => { setItems((a) => a.filter((x) => x.item !== item)); toast.success(`${item} ${ok ? "approved" : "rejected"}`); };
  if (!items.length) return <div className="px-5 py-8 text-center text-sm text-muted-foreground">All caught up. <Link to="/$" params={{ _splat: "research-operations/approvals" }} className="text-primary hover:underline">View all approvals</Link></div>;
  return (
    <ul>
      {items.map((a) => (
        <li key={a.item} className="flex items-center gap-2 border-b px-5 py-3 last:border-0">
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{a.item}</div><div className="text-xs text-muted-foreground">{a.by} · {a.age} ago</div></div>
          <button onClick={() => decide(a.item, true)} className="rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success hover:bg-success/20">Approve</button>
          <button onClick={() => decide(a.item, false)} className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20">Reject</button>
        </li>
      ))}
    </ul>
  );
}

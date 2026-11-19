import { useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Users, MapPin, MessageSquare, CheckCircle2, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { voterSnapshots, voterIssueLabels, voterSchemeLabels } from "@/data/demo";
import { downloadCsv } from "@/lib/ui-helpers";

const colors = ["var(--teal)", "var(--warning)", "var(--primary)", "var(--chart-4)"];

function Breakdown({ title, labels, values }: { title: string; labels: string[]; values: number[] }) {
  return <section className="min-w-0 border-t pt-5">
    <h2 className="mb-4 text-sm font-semibold">{title}</h2>
    <div className="space-y-4">{labels.map((label, i) => <div key={label}>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span>{label}</span><span className="font-semibold tabular-nums">{values[i]}%</span></div>
      <svg role="img" aria-label={`${label}: ${values[i]} percent`} viewBox="0 0 100 2" preserveAspectRatio="none" className="h-2 w-full rounded-sm"><rect width="100" height="2" fill="var(--muted)" /><rect width={values[i]} height="2" fill={colors[i % colors.length]} /></svg>
    </div>)}</div>
  </section>;
}

export function VoterIntelligenceDashboard() {
  const [area, setArea] = useState("Maharashtra");
  const [wave, setWave] = useState("October 2026");
  const snapshot = voterSnapshots.find((s) => s.area === area && s.wave === wave);
  if (!snapshot) return <p>No survey snapshot available.</p>;
  const issues = voterIssueLabels.map((issue, i) => ({ issue, share: snapshot.issues[i] ?? 0 })).sort((a, b) => b.share - a.share);
  const exportData = () => downloadCsv(`illustrative-voter-intelligence-${area}-${wave}`, [
    { area, wave, metric: "Survey responses", value: snapshot.sample, unit: "responses", source: "Illustrative demo data" },
    { area, wave, metric: "Constituencies surveyed", value: snapshot.constituencies, unit: "constituencies", source: "Illustrative demo data" },
    ...[{ metric: "Positive incumbent sentiment", value: snapshot.positive }, { metric: "Negative incumbent sentiment", value: snapshot.negative }, { metric: "Neutral / undecided", value: snapshot.neutral }, { metric: "Service satisfaction", value: snapshot.satisfaction }, ...issues.map((i) => ({ metric: i.issue, value: i.share }))].map((r) => ({ area, wave, ...r, unit: "percent", source: "Illustrative demo data" })),
  ]);
  const metrics = [
    { label: "Survey responses", value: snapshot.sample.toLocaleString("en-IN"), note: "Aggregate sample", icon: Users },
    { label: "Constituencies surveyed", value: snapshot.constituencies, note: `${area} coverage`, icon: MapPin },
    { label: "Neutral / undecided", value: `${snapshot.neutral}%`, note: "Incumbent sentiment", icon: MessageSquare },
    { label: "Service satisfaction", value: `${snapshot.satisfaction}%`, note: "Satisfied respondents", icon: CheckCircle2 },
  ];
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><div className="flex items-center gap-2 text-xs font-medium text-teal"><Vote className="size-4" /> Voter & Candidate Intelligence</div><h1 className="mt-2 text-2xl font-semibold">Voter Intelligence Dashboard</h1><p className="mt-2 text-xs text-muted-foreground">{area} · {wave} <span className="ml-2 inline-block rounded bg-warning/15 px-2 py-1 font-medium text-warning">Illustrative demo data</span></p></div>
      <Button variant="outline" onClick={exportData}><Download /> Export snapshot</Button>
    </div>

    <div className="flex flex-wrap items-end gap-4 border-y py-4">
      <div className="w-full sm:w-52"><label id="voter-area-label" className="mb-2 block text-xs font-medium">Geography</label><Select value={area} onValueChange={setArea}><SelectTrigger aria-labelledby="voter-area-label"><SelectValue /></SelectTrigger><SelectContent>{["Maharashtra", "Pune", "Nagpur"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
      <div className="w-full sm:w-52"><label id="voter-wave-label" className="mb-2 block text-xs font-medium">Survey wave</label><Select value={wave} onValueChange={setWave}><SelectTrigger aria-labelledby="voter-wave-label"><SelectValue /></SelectTrigger><SelectContent>{["October 2026", "September 2026"].map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent></Select></div>
      <p className="text-xs text-muted-foreground sm:ml-auto">Fictional, aggregate survey snapshots · not a forecast</p>
    </div>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map((m) => <div key={m.label} className="rounded-md border bg-card p-4"><div className="flex items-start justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">{m.label}</span><m.icon className="size-4 shrink-0 text-teal" /></div><div className="mt-3 text-2xl font-semibold tabular-nums">{m.value}</div><p className="mt-1 text-[11px] text-muted-foreground">{m.note}</p></div>)}</div>

    <Tabs defaultValue="overview" className="min-w-0">
      <TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="sample">Sample profile</TabsTrigger><TabsTrigger value="policy">Policy impact</TabsTrigger></TabsList>
      <TabsContent value="overview" className="mt-6 space-y-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="min-w-0 border-t pt-5"><h2 className="text-sm font-semibold">Incumbent sentiment</h2><p className="mt-1 text-xs text-muted-foreground">Respondent assessment of the sitting government</p>
            <div className="my-6 flex items-baseline gap-2"><span className="text-3xl font-semibold tabular-nums text-teal">{snapshot.positive - snapshot.negative > 0 ? "+" : ""}{snapshot.positive - snapshot.negative}</span><span className="text-xs text-muted-foreground">net sentiment · percentage points</span></div>
            <div className="grid grid-cols-3 gap-2 border-y py-4">{[{ label: "Positive", value: snapshot.positive, color: "text-teal" }, { label: "Negative", value: snapshot.negative, color: "text-destructive" }, { label: "Neutral / undecided", value: snapshot.neutral, color: "text-warning" }].map((s) => <div key={s.label}><div className={`text-xl font-semibold tabular-nums ${s.color}`}>{s.value}%</div><div className="mt-1 text-xs text-muted-foreground">{s.label}</div></div>)}</div><p className="mt-3 text-xs text-muted-foreground">Positive minus negative responses. Sentiment is not vote intention.</p>
          </section>
          <section className="min-w-0 border-t pt-5"><h2 className="text-sm font-semibold">Top public issues</h2><p className="mt-1 text-xs text-muted-foreground">Share selecting each issue as their highest priority</p><div className="mt-5 h-64"><ClientOnly fallback={<div className="h-64 bg-muted" />}><ResponsiveContainer width="100%" height="100%"><BarChart data={issues} layout="vertical" margin={{ left: 0, right: 20 }}><CartesianGrid horizontal={false} stroke="var(--border)" /><XAxis type="number" domain={[0, 40]} unit="%" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" /><YAxis type="category" dataKey="issue" width={116} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" /><Tooltip formatter={(value) => [`${value}%`, "Respondents"]} /><Bar dataKey="share" fill="var(--teal)" radius={[0, 3, 3, 0]} barSize={18} isAnimationActive={false} /></BarChart></ResponsiveContainer></ClientOnly></div></section>
        </div>
        <section className="border-t pt-5"><h2 className="text-sm font-semibold">Historical turnout comparison</h2><p className="mt-1 text-xs text-muted-foreground">Illustrative assembly-election turnout · not official election results</p><div className="mt-4 flex flex-wrap gap-8"><div><span className="text-xs text-muted-foreground">2019</span><div className="mt-1 text-2xl font-semibold">{snapshot.turnout2019}%</div></div><div><span className="text-xs text-muted-foreground">2024</span><div className="mt-1 text-2xl font-semibold">{snapshot.turnout2024}%</div></div><div><span className="text-xs text-muted-foreground">Change</span><div className="mt-1 text-2xl font-semibold text-teal">+{(snapshot.turnout2024 - snapshot.turnout2019).toFixed(1)} pts</div></div></div></section>
      </TabsContent>
      <TabsContent value="sample" className="mt-6"><div className="grid gap-8 lg:grid-cols-3"><Breakdown title="Respondents by age" labels={["18–25", "26–40", "41–60", "61+"]} values={snapshot.ages} /><Breakdown title="Respondents by gender" labels={["Women", "Men", "Other / not stated"]} values={snapshot.gender} /><Breakdown title="Settlement profile" labels={["Rural", "Urban", "Peri-urban"]} values={snapshot.settlement} /></div><p className="mt-6 border-t pt-4 text-xs text-muted-foreground">Sample composition only; these figures do not represent the full electorate or infer any group’s political preferences.</p></TabsContent>
      <TabsContent value="policy" className="mt-6"><div className="grid gap-8 lg:grid-cols-2"><Breakdown title="Scheme awareness" labels={voterSchemeLabels} values={snapshot.schemes} /><section className="border-t pt-5"><h2 className="text-sm font-semibold">Public service assessment</h2><div className="my-5 text-4xl font-semibold text-teal">{snapshot.satisfaction}%</div><p className="text-sm">Respondents satisfied with local public services</p><p className="mt-4 text-xs leading-relaxed text-muted-foreground">Awareness measures recognition, not benefit receipt. Satisfaction is a separate survey measure and does not establish a scheme’s effect on voting.</p></section></div></TabsContent>
    </Tabs>
    <footer className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">Illustrative research only · No live voter records connected · No individual political profiles · Sample figures are unweighted and carry no validated margin of error.</footer>
  </div>;
}
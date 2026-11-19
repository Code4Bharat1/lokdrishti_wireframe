// Module definitions for every sub-module. All rows are illustrative demo data.
import { districtStats, upClients, upVillages as villages, upVolunteerNames as upVolunteers } from "@/data/demo";

export type Rand = () => number;
export function seeded(name: string): Rand {
  let h = 2166136261;
  for (const c of name) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export type ColType = "text" | "badge" | "number" | "progress" | "date" | "mono" | "strong";
export type Col = { key: string; label: string; type?: ColType };
type Gen = readonly (string | number)[] | ((r: Rand, i: number) => string | number);
export type Row = Record<string, string | number> & { _id: string };

export type TableModule = { kind: "table"; desc: string; cols: Col[]; gen: Record<string, Gen>; count?: number; newLabel?: string; approvals?: boolean };
export type AnalyticsModule = { kind: "analytics"; desc: string; stats: [string, string, string][]; line: { title: string; series: string[] }; bar: { title: string; labels: readonly string[] }; table?: TableModule };
export type KanbanModule = { kind: "kanban"; desc: string; columns: string[]; gen: Record<string, Gen>; count?: number };
export type SettingsModule = { kind: "settings"; desc: string; groups: { title: string; fields: { label: string; type: "text" | "switch" | "select"; value: string | boolean; options?: string[] }[] }[] };
export type AiToolModule = { kind: "ai"; desc: string; placeholder: string; instruction: string; examples: string[]; action: string };
export type Module = TableModule | AnalyticsModule | KanbanModule | SettingsModule | AiToolModule | { kind: "map"; desc: string } | { kind: "builder"; desc: string } | { kind: "permissions"; desc: string };

/* ---------- pools ---------- */
const districts = Object.keys(districtStats);
const people = ["Rohan Deshmukh", "Sneha Iyer", "Prakash Wankhede", "Meera Sawant", "Amol Joshi", "Kavita Patil", "Vikas Meshram", "Pooja Kulkarni", "Sachin Gaikwad", "Neha Shinde", "Rahul Pawar", "Asha More", "Tushar Jadhav", "Priya Bhosale", "Nitin Chavan", "Swati Kale"];
const parties = ["BJP", "INC", "Shiv Sena", "Shiv Sena (UBT)", "NCP", "NCP (SP)", "MNS", "VBA", "Independent"];
const divisions = ["Konkan", "Pune", "Nashik", "Aurangabad", "Amravati", "Nagpur"];
const topics = ["Water scarcity", "Farm distress", "Urban transport", "Healthcare", "Employment", "Housing", "Power supply", "Education", "Roads", "Women safety"];
const pick = (a: readonly (string | number)[]) => (r: Rand) => a[Math.floor(r() * a.length)]!;
const num = (a: number, b: number) => (r: Rand) => Math.round(a + r() * (b - a));
const date = (r: Rand) => `${String(1 + Math.floor(r() * 28)).padStart(2, "0")} ${["Jun", "Jul", "Aug", "Sep", "Oct"][Math.floor(r() * 5)]} 2026`;
const id = (p: string) => (_: Rand, i: number) => `${p}-${String(1001 + i)}`;
const D = pick(districts), P = pick(people);

export function genRows(seed: string, gen: Record<string, Gen>, count = 24): Row[] {
  const r = seeded(seed);
  return Array.from({ length: count }, (_, i) => {
    const row: Row = { _id: `${seed}-${i}` };
    for (const [k, g] of Object.entries(gen)) row[k] = typeof g === "function" ? g(r, i) : pick(g)(r);
    return row;
  });
}

const T = (desc: string, cols: [string, string, ColType?][], gen: Record<string, Gen>, extra: Partial<TableModule> = {}): TableModule => ({
  kind: "table", desc, cols: cols.map(([key, label, type]) => (type ? { key, label, type } : { key, label })), gen, ...extra,
});

const projects = T("All research projects across divisions.", [["id", "ID", "mono"], ["name", "Project", "strong"], ["district", "District"], ["lead", "Lead"], ["progress", "Progress", "progress"], ["status", "Status", "badge"], ["due", "Due", "date"]],
  { id: id("PRJ"), name: pick(["Drought Impact Study", "Civic Issues Survey", "Farmer Panel Wave 3", "Coastal Livelihoods", "Youth Aspirations", "Women Voter Study", "Urban Mobility Audit", "Scheme Reach Assessment"]), district: D, lead: P, progress: num(5, 100), status: ["Active", "Active", "Planning", "Review", "Completed"], due: date },
  { newLabel: "New project" });

const issueTable = (area: string, items: string[]) => T(`${area} research records by district.`, [["id", "ID", "mono"], ["title", "Topic", "strong"], ["district", "District"], ["records", "Records", "number"], ["severity", "Severity", "badge"], ["updated", "Updated", "date"]],
  { id: id(area.slice(0, 3).toUpperCase()), title: pick(items), district: D, records: num(8, 240), severity: ["High", "Medium", "Low"], updated: date }, { newLabel: "Add record" });

/* ---------- Uttar Pradesh pools (Lokdrishti screens). Fictional candidates, generic party labels. ---------- */
const C = (i: number) => upClients[i % upClients.length]!;

/* ---------- module map, keyed by path ---------- */
export const modules: Record<string, Module> = {
  /* Campaign Management (Lokdrishti, Uttar Pradesh) */
  "/campaign-management/volunteers": T("Volunteer master list with assigned areas and status.", [["id", "ID", "mono"], ["name", "Name", "strong"], ["candidate", "Candidate"], ["district", "District"], ["block", "Block / Tehsil"], ["gp", "Gram Panchayat / Ward"], ["surveys", "Surveys", "number"], ["target", "Target", "number"], ["pending", "Sync pending", "number"], ["status", "Status", "badge"]],
    { id: id("VOL"), name: pick(upVolunteers), candidate: (_, i) => C(i * 5).candidate, district: (_, i) => C(i * 5).district, block: (_, i) => C(i * 5).block, gp: pick(villages), surveys: num(12, 320), target: [150, 200, 250, 300], pending: [0, 0, 0, 2, 5, 11], status: ["Active", "Active", "Active", "Active", "Inactive"] }, { count: 40, newLabel: "Add volunteer" }),



  /* Administration additions */


  /* Research Management */
  "/research-management/all-surveys": T("Every survey across projects, with live status.", [["id", "ID", "mono"], ["name", "Survey", "strong"], ["district", "District"], ["responses", "Responses", "number"], ["target", "Target", "number"], ["status", "Status", "badge"], ["updated", "Updated", "date"]],
    { id: id("SRV"), name: pick(["Voter Sentiment Tracker", "Water Access Survey", "Scheme Awareness", "Youth Employment", "Urban Civic Issues", "Farm Income Panel", "Healthcare Access", "Women Safety Perception"]), district: D, responses: num(120, 9000), target: num(2000, 10000), status: ["Live", "Live", "Draft", "Paused", "Closed"], updated: date }, { newLabel: "New survey" }),
  "/research-management/survey-builder": { kind: "builder", desc: "Design questionnaires with skip-ready question types." },
  "/research-management/survey-templates": T("Reusable, validated questionnaire templates.", [["name", "Template", "strong"], ["category", "Category", "badge"], ["questions", "Questions", "number"], ["used", "Times used", "number"], ["owner", "Owner"], ["updated", "Updated", "date"]],
    { name: pick(["Pre-poll Voter Sentiment", "Household Amenities", "Scheme Beneficiary Check", "Candidate Image", "Issue Prioritisation", "Media Consumption", "Exit Interview"]), category: ["Electoral", "Governance", "Issues", "Media"], questions: num(8, 45), used: num(1, 60), owner: P, updated: date }, { newLabel: "New template" }),
  "/research-management/research-projects": projects,
  "/research-management/survey-responses": T("Individual responses with validation status.", [["id", "Response", "mono"], ["survey", "Survey", "strong"], ["district", "District"], ["enumerator", "Enumerator"], ["duration", "Minutes", "number"], ["status", "Validation", "badge"], ["date", "Collected", "date"]],
    { id: id("RSP"), survey: pick(["Voter Sentiment Tracker", "Water Access Survey", "Scheme Awareness", "Youth Employment"]), district: D, enumerator: P, duration: num(4, 32), status: ["Validated", "Validated", "Validated", "Pending", "Flagged"], date }, { count: 40 }),
  "/research-management/research-archive": T("Completed studies preserved for reference.", [["name", "Study", "strong"], ["year", "Year", "number"], ["district", "Region"], ["sample", "Sample", "number"], ["type", "Type", "badge"]],
    { name: pick(["Assembly Pre-poll Study", "Municipal Issues Audit", "Lok Sabha Tracker", "Rural Distress Report", "Zilla Parishad Survey"]), year: pick([2019, 2020, 2021, 2022, 2023, 2024, 2025]), district: D, sample: num(800, 24000), type: ["Survey", "Panel", "Qualitative", "Mixed"] }),

  /* Field Operations */
  "/field-operations/field-dashboard": { kind: "analytics", desc: "Live view of field operations today.", stats: [["Researchers active", "842", "+36"], ["Interviews today", "6,214", "+9%"], ["Avg. interview", "14.2 min", "−0.8"], ["Flagged", "2.1%", "−0.4 pts"]], line: { title: "Interviews per hour", series: ["Interviews"] }, bar: { title: "Interviews by division", labels: divisions } },
  "/field-operations/enumerators": T("Field enumerators and performance.", [["id", "ID", "mono"], ["name", "Name", "strong"], ["district", "District"], ["supervisor", "Supervisor"], ["interviews", "Interviews", "number"], ["quality", "Quality", "progress"], ["status", "Status", "badge"]],
    { id: id("ENM"), name: P, district: D, supervisor: P, interviews: num(20, 900), quality: num(62, 99), status: ["Active", "Active", "Active", "On leave", "Inactive"] }, { newLabel: "Add enumerator", count: 36 }),
  "/field-operations/supervisors": T("Supervisors and their teams.", [["name", "Name", "strong"], ["division", "Division"], ["team", "Team size", "number"], ["districts", "Districts", "number"], ["approval", "Approval rate", "progress"], ["status", "Status", "badge"]],
    { name: P, division: pick(divisions), team: num(6, 40), districts: num(1, 6), approval: num(70, 99), status: ["Active", "Active", "Busy"] }, { newLabel: "Add supervisor" }),
  "/field-operations/assignments": { kind: "kanban", desc: "Move field assignments through their stages.", columns: ["Assigned", "In field", "Under review", "Completed"], gen: { title: pick(["Ward 14 door-to-door", "Village cluster B", "Market intercepts", "Booth-level sample", "Farmer group FGD", "College campus intercept"]), district: D, owner: P, due: date } },
  "/field-operations/field-locations": { kind: "map", desc: "Where field teams are working, by district." },
  "/field-operations/fieldwork-monitoring": { kind: "analytics", desc: "Quality signals from ongoing fieldwork.", stats: [["GPS-verified", "96.4%", "+0.6 pts"], ["Audio checks", "1,120", "+84"], ["Duplicates caught", "37", "−12"], ["Back-checks", "8.2%", "+1.0 pts"]], line: { title: "Flag rate over time", series: ["Flags", "Resolved"] }, bar: { title: "Flags by reason", labels: ["Too short", "GPS mismatch", "Straight-lining", "Duplicate", "Missing audio"] },
    table: T("", [["enumerator", "Enumerator", "strong"], ["district", "District"], ["reason", "Flag", "badge"], ["when", "When", "date"]], { enumerator: P, district: D, reason: ["Too short", "GPS mismatch", "Duplicate"], when: date }, { count: 10 }) },

  /* Geographical Intelligence */
  "/geographical-intelligence/maharashtra-map": { kind: "map", desc: "Interactive district-level research map." },
  "/geographical-intelligence/district-explorer": T("All districts with research coverage.", [["name", "District", "strong"], ["division", "Division"], ["projects", "Projects", "number"], ["surveys", "Surveys", "number"], ["responses", "Responses", "number"], ["coverage", "Coverage", "progress"]],
    { name: (_, i) => districts[i]!, division: (_, i) => districtStats[districts[i]!]!.division, projects: (_, i) => districtStats[districts[i]!]!.projects, surveys: (_, i) => districtStats[districts[i]!]!.surveys, responses: (_, i) => districtStats[districts[i]!]!.responses, coverage: (_, i) => districtStats[districts[i]!]!.coverage }, { count: districts.length }),
  "/geographical-intelligence/taluka-explorer": T("Talukas with research activity.", [["taluka", "Taluka", "strong"], ["district", "District"], ["villages", "Villages", "number"], ["surveys", "Surveys", "number"], ["coverage", "Coverage", "progress"]],
    { taluka: pick(["Haveli", "Mulshi", "Baramati", "Junnar", "Niphad", "Sinnar", "Paithan", "Kalamb", "Wani", "Hinganghat", "Karad", "Miraj", "Kankavli", "Dapoli"]), district: D, villages: num(40, 220), surveys: num(1, 30), coverage: num(10, 95) }, { count: 30 }),
  "/geographical-intelligence/assembly-constituencies": T("Assembly constituencies (288 total) — sample shown.", [["no", "AC No.", "mono"], ["name", "Constituency", "strong"], ["district", "District"], ["category", "Reserved", "badge"], ["electors", "Electors", "number"], ["surveys", "Surveys", "number"]],
    { no: (_, i) => i * 9 + 3, name: pick(["Kasba Peth", "Kothrud", "Worli", "Mahim", "Nagpur South West", "Baramati", "Karad South", "Aurangabad East", "Nashik Central", "Latur City", "Solapur City North", "Thane"]), district: D, category: ["General", "General", "General", "SC", "ST"], electors: num(240000, 420000), surveys: num(0, 12) }, { count: 32 }),
  "/geographical-intelligence/parliamentary-constituencies": T("All 48 Lok Sabha constituencies — sample shown.", [["no", "PC No.", "mono"], ["name", "Constituency", "strong"], ["division", "Division"], ["segments", "Assembly segments", "number"], ["electors", "Electors", "number"], ["surveys", "Surveys", "number"]],
    { no: (_, i) => i + 1, name: pick(["Pune", "Mumbai South", "Nagpur", "Baramati", "Shirur", "Nashik", "Aurangabad", "Kolhapur", "Thane", "Solapur", "Amravati", "Satara"]), division: pick(divisions), segments: [6], electors: num(1700000, 2400000), surveys: num(1, 20) }),
  "/geographical-intelligence/municipal-wards": T("Municipal corporation wards under study.", [["ward", "Ward", "mono"], ["corporation", "Corporation", "strong"], ["population", "Population", "number"], ["issue", "Top issue", "badge"], ["surveys", "Surveys", "number"]],
    { ward: (_, i) => `W-${String(i + 1).padStart(3, "0")}`, corporation: pick(["BMC", "PMC", "NMC Nagpur", "TMC Thane", "PCMC", "NMC Nashik", "KDMC"]), population: num(40000, 90000), issue: pick(topics), surveys: num(0, 8) }, { count: 30 }),

  /* Political & Public Database */
  "/political-and-public-database/election-records": T("Historical election results (demo values).", [["year", "Year", "number"], ["type", "Election", "badge"], ["constituency", "Constituency", "strong"], ["winner", "Winning party"], ["margin", "Margin", "number"], ["turnout", "Turnout", "progress"]],
    { year: pick([2009, 2014, 2019, 2024]), type: ["Assembly", "Lok Sabha"], constituency: pick(["Kothrud", "Worli", "Baramati", "Nagpur South West", "Karad South", "Nashik Central", "Latur City", "Thane"]), winner: pick(parties), margin: num(500, 90000), turnout: num(48, 78) }, { count: 32 }),
  "/political-and-public-database/public-representatives": T("Elected representatives (placeholder names).", [["name", "Name", "strong"], ["role", "Role", "badge"], ["constituency", "Constituency"], ["party", "Party"], ["since", "Since", "number"]],
    { name: P, role: ["MLA", "MP", "Corporator", "ZP Member"], constituency: D, party: pick(parties), since: pick([2014, 2017, 2019, 2022, 2024]) }, { newLabel: "Add representative" }),
  "/political-and-public-database/political-parties": T("Parties active in Maharashtra.", [["name", "Party", "strong"], ["type", "Type", "badge"], ["mlas", "MLAs (demo)", "number"], ["districts", "Strong districts", "number"], ["research", "Research records", "number"]],
    { name: (_, i) => parties[i]!, type: (_, i) => (i < 2 ? "National" : i < 8 ? "State" : "Other"), mlas: num(0, 130), districts: num(0, 20), research: num(10, 900) }, { count: parties.length }),
  "/political-and-public-database/constituency-profiles": T("Demographic and research profiles.", [["name", "Constituency", "strong"], ["district", "District"], ["urban", "Urban share", "progress"], ["literacy", "Literacy", "progress"], ["issue", "Top issue", "badge"]],
    { name: pick(["Kasba Peth", "Kothrud", "Worli", "Baramati", "Karad South", "Latur City", "Wani", "Sinnar"]), district: D, urban: num(5, 100), literacy: num(62, 95), issue: pick(topics) }),
  "/political-and-public-database/development-projects": T("Public development projects being tracked.", [["name", "Project", "strong"], ["district", "District"], ["dept", "Department"], ["budget", "Budget (₹ Cr)", "number"], ["progress", "Progress", "progress"], ["status", "Status", "badge"]],
    { name: pick(["Metro Line extension", "Irrigation canal", "District hospital", "Rural roads package", "Water supply scheme", "Smart city works", "School upgrade"]), district: D, dept: pick(["PWD", "Water Resources", "Health", "Urban Dev.", "Rural Dev."]), budget: num(5, 4000), progress: num(0, 100), status: ["On track", "Delayed", "Completed", "Not started"] }, { newLabel: "Add project" }),
  "/political-and-public-database/government-schemes": T("Central and state schemes and their reach.", [["name", "Scheme", "strong"], ["level", "Level", "badge"], ["sector", "Sector"], ["awareness", "Awareness (survey)", "progress"], ["reach", "Reported reach", "progress"]],
    { name: (_, i) => ["Ladki Bahin Yojana", "PM-KISAN", "PMAY", "Jal Jeevan Mission", "Mahatma Phule Jan Arogya", "Ujjwala", "Shiv Bhojan", "MGNREGA", "Swachh Bharat", "Ayushman Bharat"][i]!, level: (_, i) => ([0, 4, 6].includes(i) ? "State" : "Central"), sector: pick(["Women", "Agriculture", "Housing", "Water", "Health", "Livelihood"]), awareness: num(30, 95), reach: num(15, 80) }, { count: 10 }),

  /* Analytics */
  "/analytics-and-intelligence/analytics-dashboard": { kind: "analytics", desc: "Cross-project analytics summary.", stats: [["Responses analysed", "6.42L", "+8.4%"], ["Avg. margin of error", "±2.8%", "−0.3"], ["Weighted samples", "41", "+6"], ["Reports produced", "128", "+14"]], line: { title: "Responses by month", series: ["Collected", "Validated"] }, bar: { title: "Responses by division", labels: divisions } },
  "/analytics-and-intelligence/survey-comparison": { kind: "analytics", desc: "Compare results across survey waves.", stats: [["Waves compared", "3", ""], ["Common questions", "24", ""], ["Significant shifts", "7", "+2"], ["Sample overlap", "18%", ""]], line: { title: "Satisfaction index across waves", series: ["Wave 1", "Wave 2", "Wave 3"] }, bar: { title: "Top issue mentions — latest wave", labels: topics.slice(0, 6) } },
  "/analytics-and-intelligence/research-trends": { kind: "analytics", desc: "How research topics are moving over time.", stats: [["Rising topics", "5", "+2"], ["Declining", "3", ""], ["New studies", "22", "+4"], ["Coverage", "71%", "+3 pts"]], line: { title: "Topic mentions over time", series: ["Water", "Jobs", "Prices"] }, bar: { title: "Studies by category", labels: ["Electoral", "Governance", "Issues", "Schemes", "Media"] } },
  "/analytics-and-intelligence/statistical-analysis": { kind: "analytics", desc: "Weighting, significance and confidence summaries.", stats: [["Design effect", "1.42", ""], ["Confidence", "95%", ""], ["Margin of error", "±2.6%", ""], ["Response rate", "38%", "+2 pts"]], line: { title: "Margin of error by sample size", series: ["MoE"] }, bar: { title: "Sample by age group", labels: ["18–25", "26–35", "36–45", "46–60", "60+"] } },
  "/analytics-and-intelligence/public-issue-analysis": { kind: "analytics", desc: "Which issues matter most, and where.", stats: [["Issues tracked", "64", "+5"], ["Top issue", "Water", ""], ["Districts reporting", "35", ""], ["Mentions", "1.2L", "+11%"]], line: { title: "Issue mentions over time", series: ["Water", "Farm distress", "Jobs"] }, bar: { title: "Mentions by issue", labels: topics.slice(0, 7) } },
  "/analytics-and-intelligence/data-quality": { kind: "analytics", desc: "Completeness and consistency of research data.", stats: [["Validated", "91.6%", "+1.2 pts"], ["Missing values", "1.8%", "−0.5 pts"], ["Duplicates", "0.4%", "−0.1 pts"], ["Outliers", "212", "−30"]], line: { title: "Validation rate over time", series: ["Validated", "Flagged"] }, bar: { title: "Issues by type", labels: ["Missing", "Duplicate", "Outlier", "Inconsistent", "Too fast"] } },

  /* AI */
  "/ai-intelligence/research-summaries": { kind: "ai", desc: "Turn long notes or findings into a clear summary.", action: "Summarise", placeholder: "Paste survey findings, field notes or a report section…", instruction: "Summarise the following research material for a political research team. Use: Key findings (bullets), What it means, Caveats. Do not invent numbers.", examples: ["62% of respondents in Bid named water as their top concern; 18% named farm prices. Women respondents more likely to mention tanker delays."] },
  "/ai-intelligence/document-intelligence": { kind: "ai", desc: "Extract entities, figures and claims from a document.", action: "Analyse", placeholder: "Paste the text of a document, press note or report…", instruction: "Analyse this document. Return sections: Summary, People & organisations mentioned, Places, Numbers & claims (with whether they need verification), Questions for follow-up research.", examples: ["The district collector announced that 142 villages in Osmanabad will receive tanker supply from next week, while the irrigation department said dam storage stands at 11%."] },
  "/ai-intelligence/ai-insights": { kind: "ai", desc: "Ask for insights and next steps on a research question.", action: "Generate insights", placeholder: "Describe your research question or data…", instruction: "Act as a senior political research analyst. Give: Insights, Hypotheses to test, Suggested survey questions, Risks/biases. Be neutral and non-partisan.", examples: ["Youth employment perceptions in Nashik vs Pune urban areas ahead of municipal elections"] },

  /* Public issues */
  "/public-issues-and-governance/issue-tracker": T("Public issues logged from research and field.", [["id", "ID", "mono"], ["issue", "Issue", "strong"], ["district", "District"], ["category", "Category"], ["records", "Records", "number"], ["status", "Status", "badge"], ["updated", "Updated", "date"]],
    { id: id("ISS"), issue: pick(["Tanker delays", "Pothole complaints", "PHC staff shortage", "Crop insurance claims", "Bus frequency", "Load-shedding", "School teacher vacancy"]), district: D, category: pick(topics), records: num(5, 400), status: ["Open", "Open", "Monitoring", "Resolved"], updated: date }, { newLabel: "Log issue" }),
  "/public-issues-and-governance/infrastructure-research": issueTable("Infrastructure", ["Rural road condition", "Bridge safety", "Bus stand facilities", "Street lighting", "Drainage"]),
  "/public-issues-and-governance/healthcare-research": issueTable("Healthcare", ["PHC availability", "Ambulance response", "Medicine stock", "Maternal care", "Doctor vacancies"]),
  "/public-issues-and-governance/education-research": issueTable("Education", ["Teacher shortage", "Mid-day meals", "School toilets", "Dropout rates", "Digital classrooms"]),
  "/public-issues-and-governance/governance-tracker": T("Governance commitments and delivery.", [["promise", "Commitment", "strong"], ["dept", "Department"], ["district", "Area"], ["progress", "Progress", "progress"], ["status", "Status", "badge"]],
    { promise: pick(["24x7 water supply", "New district hospital", "Farm loan relief", "Metro expansion", "Skill centres", "Road resurfacing"]), dept: pick(["Urban Dev.", "Health", "Agriculture", "PWD", "Skills"]), district: D, progress: num(0, 100), status: ["On track", "Delayed", "Delivered", "Not started"] }),

  /* News */
  "/news-intelligence/news-dashboard": { kind: "analytics", desc: "Media coverage at a glance.", stats: [["Articles today", "1,284", "+6%"], ["Sources", "212", ""], ["Positive tone", "31%", "+2 pts"], ["Negative tone", "27%", "−1 pts"]], line: { title: "Coverage volume", series: ["Articles"] }, bar: { title: "Coverage by topic", labels: topics.slice(0, 6) },
    table: T("", [["headline", "Headline", "strong"], ["source", "Source"], ["tone", "Tone", "badge"], ["date", "Date", "date"]], { headline: pick(["Water tankers deployed in drought-hit villages", "Metro work speeds up in Pune", "Farmers seek higher MSP", "New health centres announced"]), source: pick(["Loksatta", "Times of India", "Lokmat", "Maharashtra Times", "Indian Express"]), tone: ["Positive", "Neutral", "Negative"], date }, { count: 8 }) },
  "/news-intelligence/news-archive": T("Archived articles linked to research.", [["headline", "Headline", "strong"], ["source", "Source"], ["topic", "Topic", "badge"], ["district", "District"], ["date", "Date", "date"]],
    { headline: pick(["Drought review meeting held", "Civic body passes budget", "Protest over crop insurance", "School results announced", "Road project delayed"]), source: pick(["Loksatta", "Times of India", "Lokmat", "Sakal", "Indian Express"]), topic: pick(topics), district: D, date }, { count: 40 }),
  "/news-intelligence/topic-monitoring": T("Topics and keywords being watched.", [["topic", "Topic", "strong"], ["keywords", "Keywords", "number"], ["mentions", "Mentions (7d)", "number"], ["trend", "Trend", "badge"], ["owner", "Owner"]],
    { topic: (_, i) => topics[i]!, keywords: num(3, 25), mentions: num(40, 3000), trend: ["Rising", "Stable", "Falling"], owner: P }, { count: topics.length, newLabel: "Add topic" }),
  "/news-intelligence/media-analytics": { kind: "analytics", desc: "Tone and reach of media coverage.", stats: [["Share of voice", "—", ""], ["Avg. tone", "+0.06", "+0.02"], ["Marathi media", "58%", ""], ["Reach (est.)", "4.1 Cr", "+7%"]], line: { title: "Tone over time", series: ["Positive", "Negative"] }, bar: { title: "Articles by outlet", labels: ["Loksatta", "Lokmat", "TOI", "Sakal", "IE", "MT"] } },

  /* Research Operations */
  "/research-operations/research-projects": projects,
  "/research-operations/task-management": { kind: "kanban", desc: "Team tasks across research projects.", columns: ["To do", "In progress", "Review", "Done"], gen: { title: pick(["Finalise questionnaire", "Translate to Marathi", "Brief field team", "Clean dataset", "Draft report", "Weighting check", "Client presentation"]), district: D, owner: P, due: date } },
  "/research-operations/team-members": T("Everyone on the research team.", [["name", "Name", "strong"], ["role", "Role", "badge"], ["team", "Team"], ["projects", "Projects", "number"], ["email", "Email"]],
    { name: P, role: ["Analyst", "Researcher", "Field lead", "Data scientist", "Manager"], team: pick(["Analytics", "Field", "Research", "Reports"]), projects: num(1, 8), email: (r) => `user${Math.floor(r() * 900 + 100)}@rajneeti.in` }, { newLabel: "Invite member" }),
  "/research-operations/approvals": T("Items waiting for your decision.", [["item", "Item", "strong"], ["type", "Type", "badge"], ["by", "Requested by"], ["when", "Submitted", "date"], ["status", "Status", "badge"]],
    { item: pick(["Questionnaire v4", "Dataset upload", "Field budget", "Report draft", "New enumerator batch"]), type: ["Questionnaire", "Dataset", "Budget", "Report"], by: P, when: date, status: ["Pending"] }, { approvals: true, count: 12 }),
  "/research-operations/activity-logs": T("Recent actions across the platform.", [["when", "When", "date"], ["user", "User", "strong"], ["action", "Action", "badge"], ["target", "Target"]],
    { when: date, user: P, action: ["Created", "Updated", "Approved", "Exported", "Deleted"], target: pick(["Survey SRV-1004", "Dataset Pune W2", "Report Q3", "Project PRJ-1012", "User role"]) }, { count: 40 }),

  /* Reports */
  "/reports/report-generator": { kind: "ai", desc: "Draft a structured research report with AI.", action: "Generate report", placeholder: "Describe the report: topic, region, audience, key findings to include…", instruction: "Draft a structured political research report with: Title, Executive summary, Methodology (placeholder if unknown), Key findings, District-level observations, Recommendations, Limitations. Do not invent statistics; mark placeholders as [data needed].", examples: ["Brief on drinking water concerns in Marathwada for a policy team, based on our Wave 2 survey"] },
  "/reports/presentation-generator": { kind: "ai", desc: "Turn findings into a slide-by-slide outline.", action: "Create outline", placeholder: "What should the presentation cover?", instruction: "Create a presentation outline of 8-10 slides. For each slide give: Slide N — Title, 3 bullets, and a suggested chart. Do not invent numbers.", examples: ["Youth employment survey results for Nashik, for a client review meeting"] },
  "/reports/scheduled-reports": T("Reports that run automatically.", [["name", "Report", "strong"], ["frequency", "Frequency", "badge"], ["recipients", "Recipients", "number"], ["next", "Next run", "date"], ["status", "Status", "badge"]],
    { name: pick(["Weekly Field Summary", "Monthly Media Review", "Daily Response Count", "Quarterly Issue Brief"]), frequency: ["Daily", "Weekly", "Monthly"], recipients: num(1, 20), next: date, status: ["Active", "Active", "Paused"] }, { count: 8, newLabel: "Schedule report" }),

  /* Knowledge */
  "/knowledge-repository/document-library": T("Documents shared across the organisation.", [["name", "Document", "strong"], ["type", "Type", "badge"], ["size", "Size"], ["owner", "Owner"], ["updated", "Updated", "date"]],
    { name: pick(["Census 2011 district tables", "Field manual v3", "Assembly delimitation notes", "Scheme guidelines", "Sampling SOP"]), type: ["PDF", "DOCX", "XLSX"], size: (r) => `${(r() * 20 + 0.2).toFixed(1)} MB`, owner: P, updated: date }, { newLabel: "Upload document" }),
  "/knowledge-repository/historical-research": T("Past research studies and findings.", [["title", "Study", "strong"], ["year", "Year", "number"], ["region", "Region"], ["method", "Method", "badge"], ["sample", "Sample", "number"]],
    { title: pick(["Rural Distress Study", "Urban Voter Panel", "Women Voter Study", "Caste & Mobility Study", "Migration Survey"]), year: pick([2014, 2016, 2018, 2019, 2021, 2023]), region: pick(divisions), method: ["Survey", "Panel", "FGD", "Mixed"], sample: num(500, 30000) }),
  "/knowledge-repository/dataset-repository": T("Clean datasets ready for analysis.", [["name", "Dataset", "strong"], ["rows", "Rows", "number"], ["format", "Format", "badge"], ["source", "Source"], ["updated", "Updated", "date"]],
    { name: pick(["Assembly results 2024", "Pune ward survey W2", "PMAY sample Nashik", "Booth-level turnout", "Village amenities"]), rows: num(1000, 900000), format: ["CSV", "Parquet", "XLSX"], source: pick(["Internal", "ECI", "Census", "Partner"]), updated: date }, { newLabel: "Add dataset" }),
  "/knowledge-repository/research-sources": T("Reference sources and how reliable they are.", [["name", "Source", "strong"], ["type", "Type", "badge"], ["reliability", "Reliability", "progress"], ["url", "Website"]],
    { name: (_, i) => ["Election Commission of India", "Census of India", "Maharashtra Economic Survey", "NFHS", "data.gov.in", "CEO Maharashtra", "PRS Legislative", "Lokniti-CSDS"][i]!, type: ["Official", "Official", "Official", "Official", "Official", "Official", "Research", "Research"], reliability: num(80, 99), url: (_, i) => ["eci.gov.in", "censusindia.gov.in", "mahades.maharashtra.gov.in", "rchiips.org/nfhs", "data.gov.in", "ceo.maharashtra.gov.in", "prsindia.org", "lokniti.org"][i]! }, { count: 8, newLabel: "Add source" }),

  /* Administration */
  "/administration/users-and-roles": T("Who can sign in and what they can do.", [["name", "Name", "strong"], ["email", "Email"], ["role", "Role", "badge"], ["last", "Last active", "date"], ["status", "Status", "badge"]],
    { name: P, email: (r) => `user${Math.floor(r() * 900 + 100)}@rajneeti.in`, role: ["Admin", "Analyst", "Researcher", "Field lead", "Viewer"], last: date, status: ["Active", "Active", "Invited", "Suspended"] }, { newLabel: "Invite user" }),
  "/administration/organization-settings": { kind: "settings", desc: "Organisation profile and defaults.", groups: [{ title: "Organisation", fields: [{ label: "Organisation name", type: "text", value: "Rajneeti Research Pvt. Ltd." }, { label: "Head office", type: "text", value: "Pune, Maharashtra" }, { label: "Default language", type: "select", value: "English", options: ["English", "Marathi", "Hindi"] }] }, { title: "Research defaults", fields: [{ label: "Default confidence level", type: "select", value: "95%", options: ["90%", "95%", "99%"] }, { label: "Require approval before publishing reports", type: "switch", value: true }] }] },
  "/administration/permissions": { kind: "permissions", desc: "Control what each role can do." },
  "/administration/security-and-audit": T("Sign-ins and sensitive actions.", [["when", "When", "date"], ["user", "User", "strong"], ["event", "Event", "badge"], ["ip", "IP address", "mono"], ["location", "Location"]],
    { when: date, user: P, event: ["Sign-in", "Sign-in", "Export", "Role change", "Failed sign-in"], ip: (r) => `103.${num(10, 250)(r)}.${num(1, 250)(r)}.${num(1, 250)(r)}`, location: pick(["Pune", "Mumbai", "Nagpur", "Nashik"]) }, { count: 30 }),
  "/administration/system-settings": { kind: "settings", desc: "Platform-wide configuration.", groups: [{ title: "Data", fields: [{ label: "Data retention (months)", type: "text", value: "36" }, { label: "Auto-validate responses", type: "switch", value: true }] }, { title: "Security", fields: [{ label: "Two-step sign-in for admins", type: "switch", value: true }, { label: "Session timeout", type: "select", value: "8 hours", options: ["1 hour", "8 hours", "24 hours"] }] }] },
};

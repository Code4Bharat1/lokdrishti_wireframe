import {
  LayoutDashboard, ClipboardList, Users, Map, Landmark, BarChart3, Bot, AlertTriangle,
  Newspaper, Briefcase, FileText, Library, Shield, Vote, Megaphone, UserSquare, Smartphone, Activity, type LucideIcon,
} from "lucide-react";

export type NavItem = { title: string; path: string };
export type NavSection = { title: string; icon: LucideIcon; items: NavItem[] };

const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const raw: [string, LucideIcon, string[]][] = [
  ["Voter & Candidate Intelligence", Vote, ["Voter Intelligence Dashboard"]],
  ["Campaign Management", Megaphone, ["Clients & Candidates", "Survey Packages", "Campaigns", "Questionnaire Builder", "Volunteers"]],
  ["Candidate Workspace", UserSquare, ["Candidate Dashboard", "Issue Analytics"]],
  ["Field App", Smartphone, ["Mobile App Preview"]],
  ["Monitoring", Activity, ["Geographical Dashboard", "Volunteer Performance"]],
  ["Research Overview", LayoutDashboard, ["Maharashtra Overview"]],
  ["Research Management", ClipboardList, ["All Surveys", "Survey Builder", "Survey Templates", "Research Projects", "Survey Responses", "Research Archive"]],
  ["Field Operations", Users, ["Field Dashboard", "Enumerators", "Supervisors", "Assignments", "Field Locations", "Fieldwork Monitoring"]],
  ["Geographical Intelligence", Map, ["Maharashtra Map", "District Explorer", "Taluka Explorer", "Assembly Constituencies", "Parliamentary Constituencies", "Municipal Wards"]],
  ["Political & Public Database", Landmark, ["Election Records", "Public Representatives", "Political Parties", "Constituency Profiles", "Development Projects", "Government Schemes"]],
  ["Analytics & Intelligence", BarChart3, ["Analytics Dashboard", "Survey Comparison", "Research Trends", "Statistical Analysis", "Public Issue Analysis", "Data Quality"]],
  ["AI Intelligence", Bot, ["AI Research Assistant", "Research Summaries", "Document Intelligence", "AI Insights"]],
  ["Public Issues & Governance", AlertTriangle, ["Issue Tracker", "Infrastructure Research", "Healthcare Research", "Education Research", "Governance Tracker"]],
  ["News Intelligence", Newspaper, ["News Dashboard", "News Archive", "Topic Monitoring", "Media Analytics"]],
  ["Research Operations", Briefcase, ["Research Projects", "Task Management", "Team Members", "Approvals", "Activity Logs"]],
  ["Reports", FileText, ["Report Catalogue", "Report Generator", "Presentation Generator", "Scheduled Reports"]],
  ["Knowledge Repository", Library, ["Document Library", "Historical Research", "Dataset Repository", "Research Sources"]],
  ["Administration", Shield, ["Users & Roles", "Organization Settings", "Permissions", "Notifications", "Data Quality", "Audit Log", "Data & Privacy", "Voter Identification", "Security & Audit", "System Settings"]],
];

// Original Maharashtra research modules — kept, but folded under "Research Suite (legacy)" in the sidebar.
export const legacySections = new Set(["Research Overview", "Voter & Candidate Intelligence", "Research Management", "Field Operations", "Geographical Intelligence", "Political & Public Database", "Analytics & Intelligence", "AI Intelligence", "Public Issues & Governance", "News Intelligence", "Research Operations", "Knowledge Repository"]);

export const overview: NavSection = { title: "Overview", icon: LayoutDashboard, items: [{ title: "Dashboard", path: "/" }] };

export const sections: NavSection[] = raw.map(([title, icon, items]) => ({
  title,
  icon,
  items: items.map((i) => ({ title: i, path: `/${slug(title)}/${slug(i)}` })),
}));

export function findNav(path: string) {
  for (const s of [overview, ...sections]) {
    const item = s.items.find((i) => i.path === path);
    if (item) return { section: s, item };
  }
  return null;
}

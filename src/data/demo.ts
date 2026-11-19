// Illustrative demo data only — not real research figures.
import geo from "./maharashtra-districts.json";

function seeded(name: string) {
  let h = 2166136261;
  for (const c of name) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const divisions: Record<string, string> = {
  Mumbai: "Konkan", "Mumbai Suburban": "Konkan", Thane: "Konkan", Raigarh: "Konkan", Ratnagiri: "Konkan", Sindhudurg: "Konkan",
  Pune: "Pune", Satara: "Pune", Sangli: "Pune", Kolhapur: "Pune", Solapur: "Pune",
  Nashik: "Nashik", Dhule: "Nashik", Nandurbar: "Nashik", Jalgaon: "Nashik", Ahmadnagar: "Nashik",
  Aurangabad: "Aurangabad", Jalna: "Aurangabad", Bid: "Aurangabad", Latur: "Aurangabad", Osmanabad: "Aurangabad", Nanded: "Aurangabad", Parbhani: "Aurangabad", Hingoli: "Aurangabad",
  Amravati: "Amravati", Akola: "Amravati", Washim: "Amravati", Buldana: "Amravati", Yavatmal: "Amravati",
};

export type DistrictStats = {
  name: string; division: string; projects: number; surveys: number; responses: number;
  coverage: number; enumerators: number; topIssue: string; updated: string;
};

const issues = ["Water scarcity", "Farm distress", "Roads", "Healthcare access", "Employment", "Urban housing", "Power supply", "Education quality"];

export const districtStats: Record<string, DistrictStats> = Object.fromEntries(
  (geo as { features: { properties: { name: string } }[] }).features.map((f) => {
    const n = f.properties.name;
    const r = seeded(n);
    const projects = Math.round(3 + r() * 22);
    return [n, {
      name: n,
      division: divisions[n] ?? "Nagpur",
      projects,
      surveys: Math.round(projects * (1.5 + r() * 2)),
      responses: Math.round(1800 + r() * 26000),
      coverage: Math.round(28 + r() * 70),
      enumerators: Math.round(6 + r() * 60),
      topIssue: issues[Math.floor(r() * issues.length)]!,
      updated: `${Math.ceil(r() * 28)} Oct 2026`,
    }];
  }),
);

export const kpis = [
  { label: "Research Projects", value: "184", delta: "+12", trend: [12, 14, 13, 16, 15, 18, 20, 22], icon: "briefcase" },
  { label: "Active Surveys", value: "47", delta: "+5", trend: [30, 34, 33, 38, 41, 40, 44, 47], icon: "clipboard" },
  { label: "Total Responses", value: "6.42L", delta: "+8.4%", trend: [40, 44, 48, 51, 55, 58, 61, 64], icon: "inbox" },
  { label: "Validated Responses", value: "91.6%", delta: "+1.2 pts", trend: [86, 87, 88, 88, 89, 90, 91, 91.6], icon: "check" },
  { label: "Field Researchers", value: "1,248", delta: "−34", trend: [1300, 1290, 1295, 1280, 1270, 1262, 1255, 1248], icon: "users", negative: true },
  { label: "Research Documents", value: "9,312", delta: "+412", trend: [80, 82, 84, 86, 88, 89, 91, 93], icon: "file" },
];

export const collection = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m, i) => ({
  month: m, responses: [62, 71, 88, 94, 112, 128][i]! * 1000, validated: [56, 64, 80, 86, 103, 118][i]! * 1000,
}));

export const categories = [
  { name: "Voter sentiment", value: 34 }, { name: "Public issues", value: 26 },
  { name: "Governance", value: 18 }, { name: "Schemes", value: 13 }, { name: "Media", value: 9 },
];

export const completion = [
  { survey: "Urban Mobility – Pune", rate: 92 }, { survey: "Farm Income – Marathwada", rate: 78 },
  { survey: "Ladki Bahin Awareness", rate: 85 }, { survey: "Water Access – Vidarbha", rate: 64 },
  { survey: "Youth Employment – Nashik", rate: 71 },
];

export const activity = {
  projects: [
    { name: "Marathwada Drought Impact Study", district: "Bid", status: "Active", owner: "R. Deshmukh" },
    { name: "Mumbai Suburban Civic Issues 2026", district: "Mumbai Suburban", status: "Active", owner: "S. Iyer" },
    { name: "Vidarbha Cotton Farmer Panel – Wave 3", district: "Yavatmal", status: "Review", owner: "P. Wankhede" },
    { name: "Konkan Coastal Livelihoods", district: "Ratnagiri", status: "Planning", owner: "M. Sawant" },
  ],
  approvals: [
    { item: "Questionnaire v4 – Nagpur Urban", by: "A. Joshi", age: "2h" },
    { item: "Dataset upload – Solapur Wave 2", by: "K. Patil", age: "5h" },
    { item: "Field budget – Gadchiroli", by: "V. Meshram", age: "1d" },
  ],
  datasets: [
    { name: "Assembly results 2024 (cleaned)", size: "4.2 MB", when: "Today" },
    { name: "Pune ward-level survey W2", size: "18.7 MB", when: "Yesterday" },
    { name: "PMAY beneficiary sample – Nashik", size: "2.1 MB", when: "29 Oct" },
  ],
};

export const publicIssues = [
  { category: "Water & Irrigation", location: "Marathwada", records: 412, updated: "30 Oct 2026", level: "high" },
  { category: "Agriculture & MSP", location: "Vidarbha", records: 356, updated: "29 Oct 2026", level: "high" },
  { category: "Urban Transport", location: "Mumbai MMR", records: 288, updated: "31 Oct 2026", level: "medium" },
  { category: "Public Health", location: "Gadchiroli", records: 174, updated: "27 Oct 2026", level: "medium" },
  { category: "School Infrastructure", location: "Nandurbar", records: 132, updated: "25 Oct 2026", level: "low" },
];

// Aggregate, fictional survey snapshots; no individual voter records or inferred affiliations.
export const voterSnapshots = [
  { area: "Maharashtra", wave: "October 2026", sample: 12480, constituencies: 48, positive: 38, negative: 34, neutral: 28, satisfaction: 54, turnout2019: 61.4, turnout2024: 66.1, issues: [32, 25, 19, 14, 10], ages: [22, 31, 29, 18], gender: [48, 51, 1], settlement: [54, 34, 12], schemes: [76, 62, 58] },
  { area: "Maharashtra", wave: "September 2026", sample: 10920, constituencies: 42, positive: 36, negative: 35, neutral: 29, satisfaction: 51, turnout2019: 61.4, turnout2024: 66.1, issues: [29, 27, 20, 15, 9], ages: [21, 32, 30, 17], gender: [47, 52, 1], settlement: [56, 32, 12], schemes: [72, 59, 55] },
  { area: "Pune", wave: "October 2026", sample: 2640, constituencies: 8, positive: 42, negative: 30, neutral: 28, satisfaction: 59, turnout2019: 60.2, turnout2024: 63.8, issues: [24, 21, 31, 16, 8], ages: [27, 34, 24, 15], gender: [49, 50, 1], settlement: [29, 56, 15], schemes: [71, 65, 52] },
  { area: "Pune", wave: "September 2026", sample: 2310, constituencies: 7, positive: 39, negative: 31, neutral: 30, satisfaction: 56, turnout2019: 60.2, turnout2024: 63.8, issues: [25, 23, 28, 17, 7], ages: [26, 33, 25, 16], gender: [48, 51, 1], settlement: [31, 54, 15], schemes: [68, 61, 49] },
  { area: "Nagpur", wave: "October 2026", sample: 1860, constituencies: 6, positive: 35, negative: 39, neutral: 26, satisfaction: 48, turnout2019: 61.8, turnout2024: 65.2, issues: [30, 29, 18, 15, 8], ages: [24, 30, 28, 18], gender: [48, 51, 1], settlement: [42, 46, 12], schemes: [74, 57, 61] },
  { area: "Nagpur", wave: "September 2026", sample: 1620, constituencies: 5, positive: 33, negative: 40, neutral: 27, satisfaction: 45, turnout2019: 61.8, turnout2024: 65.2, issues: [28, 30, 17, 16, 9], ages: [23, 31, 27, 19], gender: [47, 52, 1], settlement: [44, 44, 12], schemes: [70, 54, 58] },
];
export const voterIssueLabels = ["Water & irrigation", "Employment", "Roads & transport", "Healthcare", "Education"];
export const voterSchemeLabels = ["Ladki Bahin", "PM-KISAN", "PMAY housing"];

/* ================= Lokdrishti · Uttar Pradesh (illustrative) =================
   Fictional candidates, generic party labels. Real district / constituency names are geography only. */
export const TODAY = new Date("2026-11-12");
export const upAcs: Record<string, string[]> = {
  Lucknow: ["Lucknow Central", "Sarojini Nagar", "Bakshi Ka Talab"], Varanasi: ["Varanasi Cantt", "Rohaniya", "Pindra"],
  Prayagraj: ["Phulpur", "Soraon", "Handia"], Gorakhpur: ["Gorakhpur Rural", "Campierganj", "Chauri Chaura"],
  "Kanpur Nagar": ["Kalyanpur", "Bithoor", "Ghatampur"], Ayodhya: ["Ayodhya", "Milkipur", "Rudauli"],
  Bareilly: ["Bareilly Cantt", "Aonla", "Nawabganj"], Agra: ["Agra Rural", "Fatehpur Sikri", "Etmadpur"],
};
export const upBlocks: Record<string, string[]> = {
  Lucknow: ["Chinhat", "Mohanlalganj"], Varanasi: ["Sevapuri", "Kashi Vidyapeeth"], Prayagraj: ["Phulpur", "Saidabad"], Gorakhpur: ["Pipraich", "Sardarnagar"],
  "Kanpur Nagar": ["Bidhnoo", "Kalyanpur"], Ayodhya: ["Masodha", "Sohawal"], Bareilly: ["Bhojipura", "Fatehganj West"], Agra: ["Bichpuri", "Akola"],
};
export const upDistricts = Object.keys(upAcs);
export const upVillages = ["Rampur", "Sultanpur Kalan", "Bhawanipur", "Kishanpur", "Narayanpur", "Madhopur", "Chandpur", "Ward 12", "Ward 27", "Shivpuri"];
export const upVolunteerNames = ["Amit Kumar", "Saurabh Yadav", "Ritu Sharma", "Imran Ali", "Neha Pal", "Vikas Gautam", "Shivani Mishra", "Arjun Singh", "Kajal Verma", "Rahul Maurya", "Farhan Siddiqui", "Anita Devi", "Gaurav Tripathi", "Sapna Rawat", "Manoj Prajapati", "Komal Shukla"];
export const upIssues = ["Drinking water", "Roads", "Drainage", "Electricity", "Healthcare", "Education", "Employment"];
export const parties = ["Party A", "Party B", "Independent"];
export const levels = ["Gram Panchayat", "Ward", "Block Pramukh", "MLA"];

const DAY = 86400000;
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (isoDate: string, n: number) => iso(new Date(new Date(isoDate).getTime() + n * DAY));
export const daysLeft = (isoDate: string) => Math.ceil((new Date(isoDate).getTime() - TODAY.getTime()) / DAY);
export const fmtDate = (isoDate: string) => new Date(isoDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export type PkgStatus = "Draft" | "Active" | "Expiring Soon" | "Expired" | "Suspended" | "Completed";
export const pkgStatuses: PkgStatus[] = ["Draft", "Active", "Expiring Soon", "Expired", "Suspended", "Completed"];
// Status is derived so dates, counts and chips never contradict each other.
export function deriveStatus(x: { held?: "Draft" | "Suspended"; accepted: number; target: number; expiry: string }): PkgStatus {
  if (x.held) return x.held;
  if (x.accepted >= x.target) return "Completed";
  const d = daysLeft(x.expiry);
  return d < 0 ? "Expired" : d <= 7 ? "Expiring Soon" : "Active";
}

export type Extension = { from: string; to: string; by: string; on: string; reason: string };
export type Package = { id: string; name: string; target: number; accepted: number; validity: number; activation: string; expiry: string; price: number; extensionAllowed: boolean; maxCap?: number; held?: "Draft" | "Suspended"; assignedTo?: string; extensions: Extension[] };
export type Client = { id: string; account: string; candidate: string; party: string; level: string; district: string; ac: string; block: string; gp: string; contact: string; phone: string; packageId: string; start: string; end: string; status: "Active" | "Suspended" | "Inactive" };
export type Campaign = { id: string; name: string; candidate: string; packageId: string; questionnaire: string; areas: string[]; volunteers: number; target: number; accepted: number; start: string; end: string; held?: "Draft" | "Suspended" };

const candidates = ["Rajesh Verma", "Sunita Yadav", "Anil Mishra", "Kavita Singh", "Arif Khan", "Pooja Tiwari", "Ramesh Chauhan", "Neelam Gupta", "Deepak Pandey", "Shabnam Ansari", "Vinod Kushwaha", "Rekha Maurya", "Ajay Srivastava", "Meena Rajbhar", "Sanjay Nishad", "Priti Saxena", "Harish Pal", "Anjali Dwivedi"];
const targets = [5000, 2000, 4000, 6000, 2000, 5000, 4000, 6000];
// Demo scenarios: #0 nearly at target, #1 target reached, #2 expired, #3 expiring soon, #4 suspended.
const scenario: Record<number, { accepted?: number; end?: string; held?: "Suspended" }> = {
  0: { accepted: 4620, end: "2026-11-24" }, 1: { accepted: 2000 }, 2: { end: "2026-11-04" }, 3: { end: "2026-11-16" }, 4: { held: "Suspended" },
};

export const upClients: Client[] = candidates.map((candidate, i) => {
  const district = upDistricts[i % upDistricts.length]!;
  const start = addDays("2026-10-05", (i * 3) % 20);
  return {
    id: `CL-${101 + i}`, account: `${candidate.split(" ")[1]} Campaign Office`, candidate, party: parties[i % 3]!, level: levels[(i * 3) % 4]!,
    district, ac: upAcs[district]![i % 3]!, block: upBlocks[district]![i % 2]!, gp: upVillages[i % upVillages.length]!,
    contact: `${candidate.split(" ")[0]} (Office)`, phone: `+91 98${String(10000000 + i * 7919).slice(0, 8)}`,
    packageId: `PKG-${1001 + i}`, start, end: scenario[i]?.end ?? addDays(start, 45 + (i % 3) * 15), status: i === 4 ? "Suspended" : i === 17 ? "Inactive" : "Active",
  };
});

export const upPackages: Package[] = [
  ...upClients.map((c, i): Package => {
    const target = targets[i % targets.length]!;
    return {
      id: c.packageId, name: `${c.level} ${target / 1000}K`, target, accepted: scenario[i]?.accepted ?? Math.round(target * (((i * 37) % 80) + 8) / 100),
      validity: Math.round((new Date(c.end).getTime() - new Date(c.start).getTime()) / DAY), activation: c.start, expiry: c.end,
      price: i % 3 === 0 ? 0 : [75000, 150000, 200000][i % 3]!, extensionAllowed: i % 4 !== 2, ...(i % 5 === 1 ? { maxCap: target + 500 } : {}),
      ...(scenario[i]?.held ? { held: scenario[i]!.held } : {}), assignedTo: c.candidate,
      extensions: i === 0 ? [{ from: "2026-11-04", to: "2026-11-24", by: "Admin (Lokdrishti)", on: "2026-11-02", reason: "Monsoon delay in field start" }] : i === 6 ? [{ from: "2026-11-10", to: "2026-11-25", by: "Ops – Shalini", on: "2026-11-08", reason: "Additional wards added" }] : [],
    };
  }),
  ...["Pilot 1K", "Ward 3K", "MLA Plus 8K"].map((name, i): Package => ({ id: `PKG-${1019 + i}`, name, target: [1000, 3000, 8000][i]!, accepted: 0, validity: 30, activation: "2026-12-01", expiry: "2026-12-31", price: i === 0 ? 0 : 120000, extensionAllowed: true, held: "Draft", extensions: [] })),
];

export const upCampaigns: Campaign[] = upClients.map((c, i) => {
  const p = upPackages[i]!;
  return {
    id: `CMP-${1001 + i}`, name: `${c.ac} Issue Survey`, candidate: c.candidate, packageId: p.id, questionnaire: `v${2 + (i % 3)}`,
    areas: [c.ac, c.block, c.gp], volunteers: 6 + ((i * 7) % 18), target: p.target, accepted: p.accepted, start: c.start, end: c.end, ...(p.held ? { held: p.held } : {}),
  };
});

export const upVolunteers = Array.from({ length: 40 }, (_, i) => {
  const c = upClients[(i * 5) % upClients.length]!;
  return { id: `VOL-${1001 + i}`, name: upVolunteerNames[i % upVolunteerNames.length]!, district: c.district, block: c.block, gp: upVillages[(i * 3) % upVillages.length]!, candidate: c.candidate, active: i % 5 !== 4 };
});

/* ---------- Questionnaire (illustrative; final wording is approved by Lokdrishti) ---------- */
export const qTypes = ["Yes / No", "Single select", "Dropdown", "Multi-select", "Free text", "Numeric rating", "Conditional"] as const;
export type QType = (typeof qTypes)[number];
export type Bi = { en: string; hi: string };
export type Question = Bi & { id: number; type: QType; options: Bi[]; required: boolean; issue: string; showIf?: { q: number; equals: string } | undefined };

const o = (pairs: string): Bi[] => pairs.split("|").map((p) => { const [en, hi] = p.split("="); return { en: en!, hi: hi! }; });
export const questionnaire: Question[] = [
  { id: 1, type: "Yes / No", en: "Does your household get regular drinking water supply?", hi: "क्या आपके घर में नियमित पेयजल आपूर्ति होती है?", options: [], required: true, issue: "Drinking water" },
  { id: 2, type: "Conditional", en: "What is your main water source?", hi: "आपका मुख्य जल स्रोत क्या है?", options: o("Hand pump=हैंडपंप|Tanker=टैंकर|Well=कुआँ|Other=अन्य"), required: true, issue: "Drinking water", showIf: { q: 1, equals: "No" } },
  { id: 3, type: "Single select", en: "How is the road to your house?", hi: "आपके घर तक की सड़क की स्थिति कैसी है?", options: o("Good=अच्छी|Average=औसत|Poor=खराब|No pucca road=पक्की सड़क नहीं"), required: true, issue: "Roads" },
  { id: 4, type: "Dropdown", en: "How many hours of electricity do you get daily?", hi: "आपको प्रतिदिन कितने घंटे बिजली मिलती है?", options: o("0–4 hours=0–4 घंटे|4–8 hours=4–8 घंटे|8–16 hours=8–16 घंटे|16–24 hours=16–24 घंटे"), required: true, issue: "Electricity" },
  { id: 5, type: "Yes / No", en: "Is there an open drain near your house?", hi: "क्या आपके घर के पास खुली नाली है?", options: [], required: true, issue: "Drainage & sanitation" },
  { id: 6, type: "Single select", en: "How far is the nearest health centre?", hi: "निकटतम स्वास्थ्य केंद्र कितनी दूर है?", options: o("Under 2 km=2 किमी से कम|2–5 km=2–5 किमी|5–10 km=5–10 किमी|Over 10 km=10 किमी से अधिक"), required: true, issue: "Healthcare" },
  { id: 7, type: "Numeric rating", en: "How satisfied are you with the local government school?", hi: "स्थानीय सरकारी स्कूल से आप कितने संतुष्ट हैं?", options: [], required: true, issue: "Education" },
  { id: 8, type: "Multi-select", en: "Which government services are hard to access?", hi: "किन सरकारी सेवाओं तक पहुँच कठिन है?", options: o("Ration card=राशन कार्ड|Pension=पेंशन|Caste / income certificate=जाति / आय प्रमाण पत्र|Ayushman card=आयुष्मान कार्ड"), required: false, issue: "Government services" },
  { id: 9, type: "Yes / No", en: "Is any adult in your household looking for work?", hi: "क्या आपके परिवार में कोई वयस्क काम की तलाश में है?", options: [], required: true, issue: "Employment" },
  { id: 10, type: "Dropdown", en: "How do you usually travel to the block office?", hi: "आप आमतौर पर ब्लॉक कार्यालय कैसे जाते हैं?", options: o("Bus=बस|Shared auto=साझा ऑटो|Own vehicle=अपना वाहन|On foot=पैदल"), required: false, issue: "Public transport" },
  { id: 11, type: "Numeric rating", en: "How safe do you feel in your locality at night?", hi: "रात में अपने इलाके में आप कितना सुरक्षित महसूस करते हैं?", options: [], required: true, issue: "Safety" },
  { id: 12, type: "Free text", en: "Anything else you would like to tell us?", hi: "आप हमें और क्या बताना चाहेंगे?", options: [], required: false, issue: "Other" },
];
export const yesNo: Bi[] = o("Yes=हाँ|No=नहीं");

export const issueTaxonomy: (Bi & { subs: string[] })[] = [
  { en: "Drinking water", hi: "पेयजल", subs: ["Supply hours", "Water quality", "Hand pump repair"] },
  { en: "Roads", hi: "सड़कें", subs: ["Potholes", "No pucca road", "Street lights"] },
  { en: "Drainage & sanitation", hi: "जल निकासी व स्वच्छता", subs: ["Open drains", "Waterlogging", "Garbage collection"] },
  { en: "Electricity", hi: "बिजली", subs: ["Power cuts", "Low voltage", "Billing"] },
  { en: "Healthcare", hi: "स्वास्थ्य", subs: ["PHC distance", "Doctor availability", "Medicines"] },
  { en: "Education", hi: "शिक्षा", subs: ["Teacher shortage", "School building", "Mid-day meal"] },
  { en: "Employment", hi: "रोज़गार", subs: ["Youth jobs", "MGNREGA work", "Skill training"] },
  { en: "Public transport", hi: "सार्वजनिक परिवहन", subs: ["Bus frequency", "Last-mile connectivity"] },
  { en: "Government services", hi: "सरकारी सेवाएँ", subs: ["Ration card", "Pension", "Certificates"] },
  { en: "Safety", hi: "सुरक्षा", subs: ["Street lighting", "Policing"] },
  { en: "Other", hi: "अन्य", subs: [] },
];

export type Band = { from: number; to: number; label: string };
export const priorityBands: Band[] = [{ from: 1, to: 3, label: "Low" }, { from: 4, to: 6, label: "Moderate" }, { from: 7, to: 8, label: "High" }, { from: 9, to: 10, label: "Very high" }];
export const bandFor = (v: number, bands: Band[] = priorityBands) => bands.find((b) => v >= b.from && v <= b.to)?.label ?? "—";

export const questionnaireVersions = [
  { v: "v3", date: "2026-11-02", by: "Vivek Agarwal", changes: "Q2 made conditional on Q1 = No; added Q12 (free text)", active: true },
  { v: "v2", date: "2026-10-20", by: "Shalini Rastogi", changes: "Added Q11 (night safety); Hindi wording fix on Q3", active: false },
  { v: "v1", date: "2026-10-12", by: "Vivek Agarwal", changes: "Initial questionnaire, 10 questions", active: false },
];

export const consentStatement: Bi & { version: number } = {
  version: 2,
  en: "Hello, I am conducting a survey on behalf of Lokdrishti to understand the main problems in your area. Your name, age and optional mobile number will be recorded and seen only by the authorised team. Taking part is voluntary and you may stop at any time. Do you agree to take part?",
  hi: "नमस्ते, मैं लोकदृष्टि की ओर से आपके क्षेत्र की प्रमुख समस्याओं को समझने के लिए एक सर्वे कर रहा/रही हूँ। आपका नाम, उम्र और वैकल्पिक मोबाइल नंबर दर्ज किया जाएगा और केवल अधिकृत टीम ही इसे देख सकेगी। भाग लेना स्वैच्छिक है और आप कभी भी रुक सकते हैं। क्या आप भाग लेने के लिए सहमत हैं?",
};
export type PhotoMode = "Off" | "Optional" | "Mandatory";

/* ---------- Analytics model (aggregate, illustrative) ----------
   One deterministic model per campaign so every dashboard agrees:
   campaign accepted → split across volunteers → each volunteer across their areas and days. */
export const geoAttribution = "District boundaries: DataMeet India community, Census 2011 (CC BY 4.0), simplified; 71 districts, names updated.";
export const reportPeriod = { from: "2026-10-05", to: iso(TODAY) };
export const issueNames = issueTaxonomy.map((x) => x.en);

// Integers that sum exactly to `total`, proportional to weights (largest remainder).
export function split(total: number, w: number[]): number[] {
  const s = w.reduce((a, b) => a + b, 0) || 1;
  const raw = w.map((x) => (x / s) * total), out = raw.map(Math.floor);
  const rem = total - out.reduce((a, b) => a + b, 0);
  raw.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0]).slice(0, rem).forEach(([, i]) => (out[i] = out[i]! + 1));
  return out;
}
// Priority histogram (1–10) for n mentions centred near `centre`.
export function histogram(n: number, centre: number): number[] {
  return split(n, Array.from({ length: 10 }, (_, k) => Math.exp(-((k + 1 - centre) ** 2) / (2 * 2.2 ** 2))));
}
export const histMean = (h: number[]) => { const n = h.reduce((a, b) => a + b, 0); return n ? h.reduce((s, v, k) => s + v * (k + 1), 0) / n : 0; };

const gpPool = ["Rampur", "Sultanpur Kalan", "Bhawanipur", "Kishanpur", "Narayanpur", "Madhopur", "Chandpur", "Shivpuri", "Ward 12", "Ward 27", "Ward 8", "Ward 31", "Bhitauli", "Dhanuwa", "Semra", "Pahadpur", "Gopalpur", "Lalpur"];
const villagePool = ["Bhatpurwa", "Kotwa", "Gauri", "Asti", "Mahona", "Sikandarpur", "Bharawan", "Itaunja", "Purwa", "Tikra", "Majhgawan", "Nandpur", "Kaithi", "Belwa", "Sarai", "Dhaurahra", "Amausi", "Barauli"];
const firsts = ["Amit", "Saurabh", "Ritu", "Imran", "Neha", "Vikas", "Shivani", "Arjun", "Kajal", "Rahul", "Farhan", "Anita", "Gaurav", "Sapna", "Manoj", "Komal", "Pankaj", "Rubina", "Deepak", "Seema"];
const lasts = ["Kumar", "Yadav", "Sharma", "Ali", "Pal", "Gautam", "Mishra", "Singh", "Verma", "Maurya", "Siddiqui", "Devi", "Tripathi", "Rawat", "Prajapati", "Shukla"];
// Base issue profile: share of respondents mentioning it, and typical urgency.
const issueBase: Record<string, [number, number]> = {
  "Drinking water": [0.46, 7.6], Roads: [0.41, 6.4], "Drainage & sanitation": [0.33, 7.1], Electricity: [0.27, 6.0], Healthcare: [0.22, 7.8], Education: [0.16, 5.6],
  Employment: [0.31, 7.0], "Public transport": [0.12, 4.8], "Government services": [0.18, 5.9], Safety: [0.09, 6.6], Other: [0.06, 5.0],
};

export type Area = { gp: string; block: string; villages: string[]; responses: number; planned: number; byVillage: number[]; issues: Record<string, { count: number; centre: number }> };
export type FieldVolunteer = { id: string; name: string; campaign: string; candidate: string; district: string; areas: string[]; target: number; accepted: number; flagged: number; rejected: number; pending: number; avgMin: number; daily: number[]; byArea: Record<string, number>; active: boolean };
export type CampaignModel = { c: Campaign; client: Client; days: string[]; daily: { date: string; accepted: number; flagged: number }[]; areas: Area[]; volunteers: FieldVolunteer[]; flagged: number; rejected: number; syncPending: number };

function buildModel(c: Campaign, idx: number): CampaignModel {
  const client = upClients[idx]!, r = seeded(c.id);
  const last = c.end < iso(TODAY) ? c.end : iso(TODAY);
  const days: string[] = [];
  for (let d = c.start; d <= last; d = addDays(d, 1)) days.push(d);
  const dayW = days.map((d, i) => (i < 2 ? 0.4 : new Date(d).getDay() === 0 ? 0.6 : 0.7 + r() * 0.6));
  // Areas: 6 Gram Panchayats / wards in the candidate's constituency.
  const gps = [...gpPool].sort(() => r() - 0.5).slice(0, 6);
  const areaNames = gps.map((g) => g);
  // Volunteers and their 1–2 areas.
  const vW = Array.from({ length: c.volunteers }, () => 0.6 + r() * 0.8);
  const vAcc = split(c.accepted, vW);
  const volunteers: FieldVolunteer[] = vW.map((_, i) => {
    const mine = r() < 0.4 ? [areaNames[i % 6]!, areaNames[(i + 1) % 6]!] : [areaNames[i % 6]!];
    const byAreaArr = split(vAcc[i]!, mine.map(() => 0.5 + r()));
    const flagged = Math.round(vAcc[i]! * (0.02 + r() * 0.06));
    return {
      id: `${c.id.replace("CMP", "FV")}-${String(i + 1).padStart(2, "0")}`, name: `${firsts[Math.floor(r() * firsts.length)]} ${lasts[Math.floor(r() * lasts.length)]}`,
      campaign: c.id, candidate: c.candidate, district: client.district, areas: mine, target: Math.ceil(c.target / c.volunteers), accepted: vAcc[i]!, flagged,
      rejected: Math.round(flagged * 0.35), pending: r() < 0.6 ? 0 : Math.floor(r() * 9), avgMin: Math.round((6 + r() * 9) * 10) / 10,
      daily: split(vAcc[i]!, dayW), byArea: Object.fromEntries(mine.map((a, k) => [a, byAreaArr[k]!])), active: r() > 0.08,
    };
  });
  const areas: Area[] = areaNames.map((gp, k) => {
    const responses = volunteers.reduce((s, v) => s + (v.byArea[gp] ?? 0), 0);
    const villages = [...villagePool].sort(() => r() - 0.5).slice(0, 3);
    const issues = Object.fromEntries(issueNames.map((name) => {
      const [share, urgency] = issueBase[name]!;
      const f = share * (0.45 + r() * 1.1);
      return [name, { count: f < 0.07 ? 0 : Math.round(responses * Math.min(0.9, f)), centre: Math.min(9.5, Math.max(2, urgency + (r() - 0.5) * 2)) }];
    }));
    return { gp, block: upBlocks[client.district]![k % 2]!, villages, responses, planned: Math.round(c.target / 6), byVillage: split(responses, villages.map(() => 0.5 + r())), issues };
  });
  const daily = days.map((date, d) => {
    const accepted = volunteers.reduce((s, v) => s + v.daily[d]!, 0);
    return { date, accepted, flagged: Math.round(accepted * (0.03 + r() * 0.04)) };
  });
  const flagged = volunteers.reduce((s, v) => s + v.flagged, 0);
  return { c, client, days, daily, areas, volunteers, flagged, rejected: Math.round(flagged * 0.35), syncPending: Math.floor(r() * 45) };
}
export const models: CampaignModel[] = upCampaigns.map(buildModel);

export type IssueStat = { issue: string; freq: number; avg: number; high: number; spread: number; locations: number; prevalence: number; hist: number[] };
// The five SOW measures, computed from area-level counts.
export function issueStats(ms: CampaignModel[], threshold: number, areaFilter?: string): IssueStat[] {
  const areas = ms.flatMap((m) => m.areas).filter((a) => !areaFilter || a.gp === areaFilter);
  const respondents = areas.reduce((s, a) => s + a.responses, 0);
  return issueNames.map((issue) => {
    const hist = Array<number>(10).fill(0);
    let freq = 0, spread = 0;
    for (const a of areas) {
      const x = a.issues[issue]!;
      if (!x.count) continue;
      freq += x.count; spread++;
      histogram(x.count, x.centre).forEach((v, k) => (hist[k] = hist[k]! + v));
    }
    return { issue, freq, avg: histMean(hist), high: hist.slice(threshold - 1).reduce((a, b) => a + b, 0), spread, locations: areas.length, prevalence: respondents ? (freq / respondents) * 100 : 0, hist };
  });
}
// Out-of-boundary flags: offset from the district centroid, in degrees.
export const boundaryFlags = models.flatMap((m, i) => (i % 3 === 2 ? [] : [0, 1].slice(0, 1 + (i % 2)).map((k) => {
  const r = seeded(`${m.c.id}-oob-${k}`);
  return { id: `SRV-${21000 + i * 7 + k}`, district: m.client.district, candidate: m.c.candidate, dLon: (r() - 0.5) * 0.5, dLat: (r() - 0.5) * 0.4, volunteer: m.volunteers[k]?.name ?? "—", distance: `${(0.4 + r() * 3).toFixed(1)} km` };
})));

/* ---------- Data quality review queue (derived from the same models) ---------- */
export const recordStatuses = [
  ["Draft", "Started on the phone, not finished"], ["Saved offline", "Complete, stored on the phone"], ["Pending sync", "Waiting for internet to upload"], ["Syncing", "Uploading now"],
  ["Synced / Submitted", "Received by the server"], ["Flagged for review", "A validation rule needs a human decision"], ["Accepted", "Counts towards targets and reports"], ["Rejected", "Excluded under a defined rule"],
] as const;
export const dqKinds = ["Out-of-area", "GPS unavailable", "Potential duplicate", "Sync conflict", "Synced after expiry"] as const;
export type DqKind = (typeof dqKinds)[number];
export type DqRecord = { id: string; kind: DqKind; campaign: string; candidate: string; district: string; gp: string; village: string; volunteer: string; surveyAt: string; syncAt: string; dLon?: number; dLat?: number; detail: string; status: string };

const stamp = (day: string, min: number) => `${day} ${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
export const dqRecords: DqRecord[] = models.flatMap((m, i) => {
  const r = seeded(`dq-${m.c.id}`), last = m.days.at(-1) ?? m.c.start;
  const base = (k: number, kind: DqKind, extra: Partial<DqRecord> & { detail: string }): DqRecord => {
    const a = m.areas[(i + k) % m.areas.length]!, day = m.days[Math.max(0, m.days.length - 1 - k * 2)] ?? last, at = 9 * 60 + Math.floor(r() * 480);
    return { id: `SRV-${40000 + i * 31 + k * 7}`, kind, campaign: m.c.name, candidate: m.c.candidate, district: m.client.district, gp: a.gp, village: a.villages[k % 3]!, volunteer: m.volunteers[k % m.volunteers.length]!.name, surveyAt: stamp(day, at), syncAt: stamp(day, Math.min(1439, at + 20 + Math.floor(r() * 300))), status: "Flagged for review", ...extra };
  };
  const out: DqRecord[] = boundaryFlags.filter((f) => f.candidate === m.c.candidate).map((f, k) => ({ ...base(k, "Out-of-area", { detail: `${f.distance} outside the ${m.areas[(i + k) % 6]!.gp} boundary` }), id: f.id, dLon: f.dLon, dLat: f.dLat }));
  if (i < 10) out.push(base(1, "GPS unavailable", { detail: ["No GPS fix (indoors)", "Location permission denied", "Low accuracy (±420 m)"][i % 3]! }));
  if (i < 6) {
    const mobile = `98${String(Math.floor(r() * 900 + 100))}•••${String(Math.floor(r() * 900 + 100))}`;
    const a = base(2, "Potential duplicate", { detail: `Same mobile ${mobile} + same campaign within ${6 + Math.floor(r() * 40)} h`, dLon: (r() - 0.5) * 0.1, dLat: (r() - 0.5) * 0.1 });
    out.push(a, { ...a, id: `SRV-${40500 + i * 13}`, volunteer: m.volunteers[(i + 3) % m.volunteers.length]!.name, detail: `Matches ${a.id}: ${a.detail.toLowerCase()}` });
  }
  if (i % 4 === 1) out.push(base(3, "Sync conflict", { detail: "Edited on the phone after the server accepted v1 (fields: Q4, issues)", dLon: (r() - 0.5) * 0.1, dLat: (r() - 0.5) * 0.1 }));
  if (m.c.end < iso(TODAY)) for (let k = 0; k < 3; k++) {
    out.push({ ...base(k, "Synced after expiry", { detail: `Collected before expiry (${fmtDate(m.c.end)}), received after it`, dLon: (r() - 0.5) * 0.1, dLat: (r() - 0.5) * 0.1 }), id: `SRV-${40900 + i * 5 + k}`, surveyAt: stamp(addDays(m.c.end, -k), 600 + k * 45), syncAt: stamp(addDays(m.c.end, 1 + k), 540 + k * 20) });
  }
  return out;
});

/* ---------- Admin alerts (in-app) ---------- */
export const alertTypes = ["Campaign nearing expiry", "Target nearly reached", "Target reached", "Campaign expired", "Extension approved", "Sync failures", "Duplicates flagged", "Low coverage against plan"] as const;
export type AlertType = (typeof alertTypes)[number];
export type AdminAlert = { id: number; type: AlertType; title: string; body: string; time: string; to: string; tone: "warning" | "success" | "destructive" | "primary" };
export const adminAlerts: AdminAlert[] = (() => {
  const out: Omit<AdminAlert, "id">[] = [];
  for (const m of models) {
    const p = (m.c.accepted / m.c.target) * 100, st = deriveStatus({ ...m.c, expiry: m.c.end }), d = daysLeft(m.c.end);
    if (st === "Expiring Soon") out.push({ type: "Campaign nearing expiry", title: `${m.c.name} expires in ${d} days`, body: `${m.c.candidate} · ${Math.round(p)}% of target`, time: "08:30", to: "/campaign-management/campaigns", tone: "warning" });
    if (p >= 90 && p < 100) out.push({ type: "Target nearly reached", title: `${m.c.candidate} at ${Math.round(p)}% of target`, body: `${(m.c.target - m.c.accepted).toLocaleString("en-IN")} surveys left · collection stops at target`, time: "10:41", to: "/campaign-management/campaigns", tone: "warning" });
    if (st === "Completed") out.push({ type: "Target reached", title: `${m.c.candidate} reached target`, body: "Collection auto-stopped. Increase the target to continue.", time: "09:58", to: "/campaign-management/campaigns", tone: "success" });
    if (st === "Expired") out.push({ type: "Campaign expired", title: `${m.c.name} expired on ${fmtDate(m.c.end)}`, body: "Survey form closed for volunteers. Offline records can still sync.", time: "Yesterday", to: "/campaign-management/campaigns", tone: "destructive" });
    const low = m.areas.filter((a) => a.responses / a.planned < 0.5);
    if (low.length && out.filter((x) => x.type === "Low coverage against plan").length < 3) out.push({ type: "Low coverage against plan", title: `${low.length} low-coverage area(s) · ${m.c.candidate}`, body: low.map((a) => a.gp).join(", "), time: "07:00", to: "/monitoring/geographical-dashboard", tone: "warning" });
  }
  for (const p of upPackages.filter((x) => x.extensions.length)) out.push({ type: "Extension approved", title: `${p.id} extended to ${fmtDate(p.expiry)}`, body: `Approved by ${p.extensions.at(-1)!.by}`, time: fmtDate(p.extensions.at(-1)!.on).slice(0, 6), to: "/campaign-management/survey-packages", tone: "primary" });
  out.push({ type: "Sync failures", title: "3 phones failed to upload in the last hour", body: "Server timeout · records stay on the phones and are retried", time: "10:52", to: "/reports/report-catalogue", tone: "destructive" });
  out.push({ type: "Duplicates flagged", title: `${dqRecords.filter((x) => x.kind === "Potential duplicate").length} potential duplicates flagged`, body: "Matched on mobile number + campaign + time window", time: "09:15", to: "/administration/data-quality", tone: "warning" });
  return out.map((x, id) => ({ ...x, id }));
})();

/* ---------- Audit log ---------- */
export const auditEntries = [
  ["2026-11-12 10:44", "Vivek Agarwal", "Super Administrator", "Deadline changed", "PKG-1001", "Expiry 04 Nov 2026", "Expiry 24 Nov 2026 (reason: monsoon delay)"],
  ["2026-11-12 10:31", "Nazia Parveen", "Field Supervisor", "Survey status", "SRV-40002", "Flagged for review (Out-of-area)", "Accepted (GPS drift near boundary)"],
  ["2026-11-12 10:18", "Nazia Parveen", "Field Supervisor", "Survey status", "SRV-40500", "Flagged for review (Potential duplicate)", "Rejected (duplicate of SRV-40014)"],
  ["2026-11-12 09:57", "Shalini Rastogi", "Command Centre / Operations", "Sync exception resolved", "SRV-40070", "Sync conflict (phone v2 vs server v1)", "Server v1 kept; phone edits attached as a note"],
  ["2026-11-12 09:40", "Shalini Rastogi", "Command Centre / Operations", "Admin correction", "SRV-39811", "Village: Kotwa", "Village: Gauri (volunteer typo, confirmed by phone)"],
  ["2026-11-11 18:22", "Vivek Agarwal", "Super Administrator", "Campaign status", "CMP-1005", "Active", "Suspended (client request)"],
  ["2026-11-11 17:05", "Vivek Agarwal", "Super Administrator", "Target changed", "CMP-1002", "Target 2,000", "Target 2,500 (collection resumed)"],
  ["2026-11-11 16:48", "Shalini Rastogi", "Command Centre / Operations", "Sync exception resolved", "SRV-40902", "Synced after expiry (04 Nov)", "Accepted: collected 03 Nov, before expiry"],
  ["2026-11-11 15:30", "Vivek Agarwal", "Super Administrator", "Questionnaire activated", "QNR Lucknow Central", "v2", "v3 (Q2 conditional on Q1 = No)"],
  ["2026-11-11 12:12", "Vivek Agarwal", "Super Administrator", "Consent statement", "Consent", "v1", "v2 published"],
  ["2026-11-11 11:02", "Nazia Parveen", "Field Supervisor", "Volunteer status", "VOL-1015", "Active", "Inactive (left the team)"],
  ["2026-11-10 19:40", "Vivek Agarwal", "Super Administrator", "Password reset", "rajesh.verma", "—", "Temporary password issued"],
  ["2026-11-10 16:15", "Shalini Rastogi", "Command Centre / Operations", "Data export", "Report: Village / Ward coverage", "—", "CSV, 108 rows, aggregate only"],
  ["2026-11-10 14:03", "Vivek Agarwal", "Super Administrator", "Permission changed", "Candidate Team · R. Verma", "Download aggregate reports: Off", "On"],
  ["2026-11-10 11:20", "Shalini Rastogi", "Command Centre / Operations", "Sync exception resolved", "SRV-40031", "Failed upload ×3 (timeout)", "Uploaded on retry"],
  ["2026-11-08 09:11", "Shalini Rastogi", "Command Centre / Operations", "Deadline changed", "PKG-1007", "Expiry 10 Nov 2026", "Expiry 25 Nov 2026 (additional wards added)"],
  ["2026-11-06 13:45", "Vivek Agarwal", "Super Administrator", "Data subject request", "DSR-003", "Received", "Completed: SRV-38712 anonymised"],
  ["2026-11-05 10:00", "Vivek Agarwal", "Super Administrator", "Client registered", "CL-118", "—", "Dwivedi Campaign Office (Agra)"],
].map(([at, user, role, action, record, from, to]) => ({ at: at!, user: user!, role: role!, action: action!, record: record!, from: from!, to: to! }));

/* ---------- Privacy ---------- */
export const dsrLog = [
  { id: "DSR-001", type: "Consent withdrawal", received: "2026-10-28", due: "2026-11-27", status: "Completed", note: "Respondent called the helpline; 1 survey anonymised" },
  { id: "DSR-002", type: "Access request", received: "2026-11-02", due: "2026-12-02", status: "In progress", note: "Verifying identity via the campaign office" },
  { id: "DSR-003", type: "Deletion", received: "2026-11-04", due: "2026-12-04", status: "Completed", note: "SRV-38712 anonymised; audit entry kept" },
  { id: "DSR-004", type: "Correction", received: "2026-11-10", due: "2026-12-10", status: "Open", note: "Wrong age recorded (42, not 24)" },
];
export const consentVersions = [
  { v: 2, from: "2026-11-11", by: "Vivek Agarwal", note: "Added voluntary-participation sentence; Hindi wording simplified", active: true, responses: 4210 },
  { v: 1, from: "2026-10-05", by: "Vivek Agarwal", note: "Initial statement approved by Lokdrishti", active: false, responses: 38920 },
];

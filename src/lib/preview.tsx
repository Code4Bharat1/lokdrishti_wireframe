// Preview-only role switcher and English/Hindi toggle. No auth: switching role just filters what the wireframe shows.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const roles = [
  "Super Administrator",
  "Command Centre / Operations",
  "Field Supervisor",
  "Candidate Administrator",
  "Candidate Team (view-only)",
  "Volunteer",
] as const;
export type Role = (typeof roles)[number];
export type Lang = "en" | "hi";

// Fictional candidate the candidate roles are scoped to.
export const scopedCandidate = "Rajesh Verma";

const adminOnly = ["/administration/data-and-privacy", "/administration/voter-identification", "/administration/users-and-roles", "/administration/organization-settings", "/administration/permissions", "/administration/system-settings"];
const allowList: Partial<Record<Role, string[]>> = {
  "Field Supervisor": ["/campaign-management/volunteers", "/monitoring/volunteer-performance", "/campaign-management/campaigns", "/administration/data-quality", "/field-app/mobile-app-preview"],
  "Candidate Administrator": ["/candidate-workspace/candidate-dashboard", "/candidate-workspace/issue-analytics", "/reports/report-catalogue", "/campaign-management/volunteers"],
  "Candidate Team (view-only)": ["/candidate-workspace/candidate-dashboard", "/candidate-workspace/issue-analytics", "/reports/report-catalogue"],
  Volunteer: ["/field-app/mobile-app-preview"],
};

// Each role signs in to its own portal: name, colour and a fictional demo user.
export const portals: Record<Role, { portal: string; blurb: string; user: string; login: string; chip: string; bar: string }> = {
  "Super Administrator": { portal: "Admin Portal", blurb: "Clients, packages, users, permissions and all reports.", user: "Vivek Agarwal", login: "admin@lokdrishti.in", chip: "bg-primary/10 text-primary", bar: "bg-primary" },
  "Command Centre / Operations": { portal: "Digital Command Centre", blurb: "Monitor every client, campaign, location and exception.", user: "Shalini Rastogi", login: "ops@lokdrishti.in", chip: "bg-teal/15 text-teal", bar: "bg-teal" },
  "Field Supervisor": { portal: "Field Supervisor Console", blurb: "Assigned volunteers, campaigns and the review queue.", user: "Nazia Parveen", login: "supervisor.lko@lokdrishti.in", chip: "bg-warning/15 text-warning", bar: "bg-warning" },
  "Candidate Administrator": { portal: "Candidate Portal", blurb: "Your campaign's progress, issues, volunteers and reports.", user: "Rajesh Verma", login: "rajesh.verma", chip: "bg-success/15 text-success", bar: "bg-success" },
  "Candidate Team (view-only)": { portal: "Candidate Portal · View only", blurb: "Dashboards and reports, no edit or admin actions.", user: "Manish Verma", login: "team.rverma", chip: "bg-success/10 text-success", bar: "bg-success/60" },
  Volunteer: { portal: "Volunteer App", blurb: "Door-to-door survey app with offline collection.", user: "Amit Kumar", login: "VOL-1001", chip: "bg-accent text-accent-foreground", bar: "bg-muted-foreground" },
};
export const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2);
export const canManage = (r: Role) => r === "Super Administrator" || r === "Command Centre / Operations";

export function canSee(role: Role, path: string) {
  if (role === "Super Administrator" || path === "/login") return true;
  if (role === "Command Centre / Operations") return !adminOnly.includes(path);
  return allowList[role]!.includes(path);
}
export const homeFor = (role: Role) => allowList[role]?.[0] ?? "/";
export const isCandidateRole = (r: Role) => r.startsWith("Candidate");

/* Hindi labels for the new screens and shell chrome. Missing keys fall back to English. */
const hi: Record<string, string> = {
  // shell
  Dashboard: "डैशबोर्ड", "Search modules…": "मॉड्यूल खोजें…", Notifications: "सूचनाएँ", Role: "भूमिका", Home: "होम",
  "Viewing:": "देख रहे हैं:", only: "केवल", "Preview role": "पूर्वावलोकन भूमिका", "Demo data": "डेमो डेटा",
  "Super Administrator": "सुपर एडमिनिस्ट्रेटर", "Command Centre / Operations": "कमांड सेंटर / ऑपरेशंस", "Field Supervisor": "फ़ील्ड सुपरवाइज़र",
  "Candidate Administrator": "उम्मीदवार एडमिनिस्ट्रेटर", "Candidate Team (view-only)": "उम्मीदवार टीम (केवल देखें)", Volunteer: "स्वयंसेवक",
  // sections & items
  "Campaign Management": "अभियान प्रबंधन", "Clients & Candidates": "क्लाइंट और उम्मीदवार", "Survey Packages": "सर्वे पैकेज", Campaigns: "अभियान", Volunteers: "स्वयंसेवक",
  "Candidate Workspace": "उम्मीदवार कार्यक्षेत्र", "Candidate Dashboard": "उम्मीदवार डैशबोर्ड", "Issue Analytics": "मुद्दा विश्लेषण",
  "Field App": "फ़ील्ड ऐप", "Mobile App Preview": "मोबाइल ऐप पूर्वावलोकन",
  Administration: "प्रशासन", "Data Quality": "डेटा गुणवत्ता", Reports: "रिपोर्ट", "All Reports": "सभी रिपोर्ट", "Report Catalogue": "रिपोर्ट सूची", "Data & Privacy": "डेटा और गोपनीयता", "Voter Identification": "मतदाता पहचान", "Audit Log": "ऑडिट लॉग",
  // table chrome
  "Search…": "खोजें…", Export: "निर्यात", "Export data": "डेटा निर्यात", "Total records": "कुल रिकॉर्ड", Actions: "कार्रवाई", Previous: "पिछला", Next: "अगला",
  Page: "पृष्ठ", of: "का", records: "रिकॉर्ड", "demo data": "डेमो डेटा", "No records match your search.": "कोई रिकॉर्ड नहीं मिला।",
  Approve: "स्वीकारें", Reject: "अस्वीकारें", Edit: "संपादित करें", Copy: "कॉपी", Delete: "हटाएँ", Save: "सहेजें", Cancel: "रद्द करें",
  "3 months": "3 माह", "6 months": "6 माह", "12 months": "12 माह",
  // columns
  ID: "आईडी", Client: "क्लाइंट", Candidate: "उम्मीदवार", Party: "दल", Level: "स्तर", District: "ज़िला", "Assembly Constituency": "विधानसभा क्षेत्र",
  Package: "पैकेज", Status: "स्थिति", Target: "लक्ष्य", "Validity (days)": "वैधता (दिन)", Activation: "सक्रियण", Expiry: "समाप्ति", "Price (₹)": "मूल्य (₹)",
  Utilisation: "उपयोग", Extensions: "विस्तार", Campaign: "अभियान", Accepted: "स्वीकृत", Progress: "प्रगति", Start: "आरंभ", End: "समाप्ति",
  Name: "नाम", "Block / Tehsil": "ब्लॉक / तहसील", "Gram Panchayat / Ward": "ग्राम पंचायत / वार्ड", Surveys: "सर्वे", "Sync pending": "सिंक लंबित",
  "Survey ID": "सर्वे आईडी", Flag: "फ़्लैग", Collected: "संग्रहित", Synced: "सिंक हुआ", When: "कब", User: "उपयोगकर्ता", Action: "कार्य", Record: "रिकॉर्ड",
  Change: "परिवर्तन", Report: "रिपोर्ट", Format: "प्रारूप", Created: "बनाया", Project: "परियोजना", Author: "लेखक",
  // buttons
  "Register client": "क्लाइंट पंजीकृत करें", "New package": "नया पैकेज", "New campaign": "नया अभियान", "Add volunteer": "स्वयंसेवक जोड़ें", "New report": "नई रिपोर्ट",
  // descriptions
  "Client accounts and candidates across Uttar Pradesh.": "उत्तर प्रदेश भर के क्लाइंट खाते और उम्मीदवार।",
  "Configurable survey packages with targets, validity and extensions.": "लक्ष्य, वैधता और विस्तार सहित कॉन्फ़िगर करने योग्य सर्वे पैकेज।",
  "Survey campaigns by candidate, with target progress.": "उम्मीदवार-वार सर्वे अभियान और लक्ष्य प्रगति।",
  "Volunteer master list with assigned areas and status.": "निर्धारित क्षेत्र और स्थिति सहित स्वयंसेवक सूची।",
  "Package, target and survey progress for one candidate.": "एक उम्मीदवार का पैकेज, लक्ष्य और सर्वे प्रगति।",
  "Most reported and highest-priority public issues.": "सबसे अधिक बताए गए और उच्च प्राथमिकता वाले जन मुद्दे।",
  "Flagged surveys waiting for review — duplicates, out-of-boundary, missing GPS.": "समीक्षा हेतु फ़्लैग किए गए सर्वे — डुप्लिकेट, सीमा से बाहर, GPS अनुपलब्ध।",
  "Who changed what, and when.": "किसने क्या बदला, और कब।",
  "Volunteer survey app, as seen on an Android phone.": "स्वयंसेवक सर्वे ऐप, Android फ़ोन पर।",
  "Generated research reports.": "तैयार की गई रिपोर्ट।",
  // stats & charts
  "Survey target": "सर्वे लक्ष्य", Flagged: "फ़्लैग किए गए", "Survey trend": "सर्वे रुझान", "Add record": "रिकॉर्ड जोड़ें", "Remaining": "शेष", "Days remaining": "शेष दिन", "Surveys per day": "प्रति दिन सर्वे",
  "Accepted surveys by block": "ब्लॉक-वार स्वीकृत सर्वे", "Issues tracked": "ट्रैक किए गए मुद्दे", "Top issue": "शीर्ष मुद्दा",
  "Avg. priority": "औसत प्राथमिकता", "High-priority mentions": "उच्च प्राथमिकता उल्लेख", "Mentions over time": "समय के साथ उल्लेख",
  "Respondents reporting each issue": "प्रत्येक मुद्दा बताने वाले उत्तरदाता",
  "Drinking water": "पेयजल", Roads: "सड़कें", Drainage: "जल निकासी", Electricity: "बिजली", Healthcare: "स्वास्थ्य", Education: "शिक्षा", Employment: "रोज़गार",
};

/* Portals, login and Campaign Management screens. */
const hi2: Record<string, string> = {
  "Admin Portal": "एडमिन पोर्टल", "Digital Command Centre": "डिजिटल कमांड सेंटर", "Field Supervisor Console": "फ़ील्ड सुपरवाइज़र कंसोल", "Candidate Portal": "उम्मीदवार पोर्टल",
  "Candidate Portal · View only": "उम्मीदवार पोर्टल · केवल देखें", "Volunteer App": "स्वयंसेवक ऐप",
  "Clients, packages, users, permissions and all reports.": "क्लाइंट, पैकेज, उपयोगकर्ता, अनुमतियाँ और सभी रिपोर्ट।",
  "Monitor every client, campaign, location and exception.": "हर क्लाइंट, अभियान, स्थान और अपवाद की निगरानी।",
  "Assigned volunteers, campaigns and the review queue.": "निर्धारित स्वयंसेवक, अभियान और समीक्षा कतार।",
  "Your campaign's progress, issues, volunteers and reports.": "आपके अभियान की प्रगति, मुद्दे, स्वयंसेवक और रिपोर्ट।",
  "Dashboards and reports, no edit or admin actions.": "डैशबोर्ड और रिपोर्ट, संपादन या एडमिन कार्य नहीं।",
  "Door-to-door survey app with offline collection.": "ऑफ़लाइन संग्रह सहित घर-घर सर्वे ऐप।",
  "Lokdrishti team": "लोकदृष्टि टीम", Field: "फ़ील्ड", "Sign in to your portal": "अपने पोर्टल में साइन इन करें", "Sign in": "साइन इन",
  "Each role has its own portal and only sees its own screens. Preview only, no real authentication.": "हर भूमिका का अपना पोर्टल है और वह केवल अपनी स्क्रीन देखती है। केवल पूर्वावलोकन, वास्तविक प्रमाणीकरण नहीं।",
  "Political Survey, Geofencing & Digital Command Centre": "राजनीतिक सर्वे, जियोफ़ेंसिंग और डिजिटल कमांड सेंटर",
  "Volunteers sign in on the Android app; this preview shows it in a phone frame.": "स्वयंसेवक Android ऐप पर साइन इन करते हैं; यह पूर्वावलोकन उसे फ़ोन फ़्रेम में दिखाता है।",
  "Research Suite (legacy)": "रिसर्च सुइट (पुराना)", "Switch role": "भूमिका बदलें", "View all notifications": "सभी सूचनाएँ देखें", "Mark all read": "सब पढ़ा हुआ करें", "Sign out": "साइन आउट", "Signed out (preview)": "साइन आउट (पूर्वावलोकन)", "Users & Roles": "उपयोगकर्ता और भूमिकाएँ",
  // clients
  "Onboard candidate": "उम्मीदवार जोड़ें", "Total clients": "कुल क्लाइंट", Active: "सक्रिय", Suspended: "निलंबित", Inactive: "निष्क्रिय", "All statuses": "सभी स्थितियाँ",
  Account: "खाता", Constituency: "निर्वाचन क्षेत्र", "Campaign dates": "अभियान तिथियाँ", Activate: "सक्रिय करें", Suspend: "निलंबित करें", Deactivate: "निष्क्रिय करें",
  "logged in Audit Log": "ऑडिट लॉग में दर्ज", "Client saved": "क्लाइंट सहेजा गया", "Edit client": "क्लाइंट संपादित करें", "Account name": "खाते का नाम", "Candidate name": "उम्मीदवार का नाम",
  "Candidate level": "उम्मीदवार स्तर", Area: "क्षेत्र", State: "राज्य", "Type or pick": "लिखें या चुनें", "Primary contact": "प्राथमिक संपर्क", "Contact mobile": "संपर्क मोबाइल",
  "Campaign start": "अभियान आरंभ", "Campaign end": "अभियान समाप्ति", "End date must be after the start date.": "समाप्ति तिथि आरंभ तिथि के बाद होनी चाहिए।",
  "Gram Panchayat": "ग्राम पंचायत", Ward: "वार्ड", "Block Pramukh": "ब्लॉक प्रमुख", MLA: "विधायक",
  // wizard
  Profile: "प्रोफ़ाइल", "Link to client": "क्लाइंट से जोड़ें", "Assign package": "पैकेज दें", "Campaign validity": "अभियान वैधता", "Authorised areas": "अधिकृत क्षेत्र",
  "Logins & volunteers": "लॉगिन और स्वयंसेवक", "Access permissions": "पहुँच अनुमतियाँ",
  "View candidate dashboard": "उम्मीदवार डैशबोर्ड देखें", "View issue analytics": "मुद्दा विश्लेषण देखें", "Download aggregate reports": "समेकित रिपोर्ट डाउनलोड करें",
  "View volunteer performance": "स्वयंसेवक प्रदर्शन देखें", "View respondent-level records (names, mobiles)": "उत्तरदाता-स्तर रिकॉर्ड देखें (नाम, मोबाइल)", "Access other candidates' data": "अन्य उम्मीदवारों का डेटा देखें",
  Mobile: "मोबाइल", "Create a new client account": "नया क्लाइंट खाता बनाएँ", "Link to an existing client account": "मौजूदा क्लाइंट खाते से जोड़ें",
  "Unassigned packages. Create more under Survey Packages.": "अनिर्धारित पैकेज। और पैकेज सर्वे पैकेज में बनाएँ।", surveys: "सर्वे", days: "दिन", "Zero-cost": "निःशुल्क",
  "Activation date": "सक्रियण तिथि", "Expiry / cut-off date": "समाप्ति / अंतिम तिथि", "days remaining": "दिन शेष", "Allow validity extension": "वैधता विस्तार की अनुमति",
  "Pending sign-off: whether 'activation deadline' means the last date to activate or the last date to complete surveys.": "स्वीकृति लंबित: 'सक्रियण समय-सीमा' का अर्थ सक्रिय करने की अंतिम तिथि है या सर्वे पूरा करने की।",
  "areas selected": "क्षेत्र चुने गए", "Candidate logins": "उम्मीदवार लॉगिन", "Add team login": "टीम लॉगिन जोड़ें", Username: "यूज़रनेम",
  "Assign volunteers from master list": "मास्टर सूची से स्वयंसेवक दें", "Inactive volunteers can't be assigned to new campaigns.": "निष्क्रिय स्वयंसेवक नए अभियानों में नहीं जोड़े जा सकते।",
  "volunteers selected": "स्वयंसेवक चुने गए", Validity: "वैधता", Logins: "लॉगिन", Permissions: "अनुमतियाँ", "Login instructions": "लॉगिन निर्देश", "Copy instructions": "निर्देश कॉपी करें", Copied: "कॉपी हो गया",
  "SMS, WhatsApp and email delivery are outside the base scope. Share manually.": "SMS, WhatsApp और ईमेल भेजना मूल दायरे में नहीं है। स्वयं साझा करें।",
  Step: "चरण", Back: "पीछे", "Activate campaign": "अभियान सक्रिय करें", "campaign activated": "अभियान सक्रिय हुआ",
  // packages
  "Create package": "पैकेज बनाएँ", Packages: "पैकेज", "Assigned to": "किसे दिया", "% achieved": "% प्राप्त", "Days left": "शेष दिन", Price: "मूल्य", extended: "विस्तारित",
  "Original deadline": "मूल समय-सीमा", "Current expiry": "वर्तमान समाप्ति", "Revised expiry": "संशोधित समाप्ति", "Maximum target cap": "अधिकतम लक्ष्य सीमा", "Extension allowed": "विस्तार अनुमत", Yes: "हाँ", No: "नहीं",
  "Extension history": "विस्तार इतिहास", "Extend validity": "वैधता बढ़ाएँ", "Extensions are switched off for this package.": "इस पैकेज के लिए विस्तार बंद है।",
  "Original → Revised": "मूल → संशोधित", "Approved by": "स्वीकृतकर्ता", Date: "तिथि", Reason: "कारण", "No extensions yet.": "अभी कोई विस्तार नहीं।", "expiry extended to": "समाप्ति बढ़ाई गई",
  created: "बनाया गया", "Package name": "पैकेज का नाम", "Zero-cost package (₹0)": "निःशुल्क पैकेज (₹0)", "Maximum target cap (optional)": "अधिकतम लक्ष्य सीमा (वैकल्पिक)", "No cap": "कोई सीमा नहीं",
  "Cap can't be below the target.": "सीमा लक्ष्य से कम नहीं हो सकती।", "Payment gateway and invoicing are outside the base scope; price is for reference.": "पेमेंट गेटवे और इनवॉइसिंग मूल दायरे में नहीं; मूल्य संदर्भ हेतु है।",
  Draft: "ड्राफ़्ट", "Expiring Soon": "जल्द समाप्त", Expired: "समाप्त", Completed: "पूर्ण", "Packages created": "बनाए गए पैकेज", Assigned: "निर्धारित", "Extensions granted": "दिए गए विस्तार",
  "Paid / zero-cost": "सशुल्क / निःशुल्क", "Total target": "कुल लक्ष्य", "Total accepted": "कुल स्वीकृत", "Target vs accepted surveys, by candidate": "उम्मीदवार-वार लक्ष्य बनाम स्वीकृत सर्वे",
  "Extend by (days)": "कितने दिन बढ़ाएँ", "e.g. Additional wards added": "जैसे अतिरिक्त वार्ड जोड़े गए", "The original and revised deadlines are both kept and written to the Audit Log.": "मूल और संशोधित दोनों समय-सीमाएँ सुरक्षित रहती हैं और ऑडिट लॉग में दर्ज होती हैं।",
  "Approve extension": "विस्तार स्वीकृत करें", Ended: "समाप्त",
  // campaigns
  "campaigns are at 90% or more of their target.": "अभियान अपने लक्ष्य के 90% या अधिक पर हैं।", "campaigns reached target; collection auto-stopped.": "अभियानों ने लक्ष्य पाया; संग्रह स्वतः रुका।",
  "All candidates": "सभी उम्मीदवार", Questionnaire: "प्रश्नावली", Extend: "बढ़ाएँ", "Survey form closed — campaign expired on": "सर्वे फ़ॉर्म बंद — अभियान समाप्त हुआ", "Extend to reopen.": "फिर खोलने के लिए बढ़ाएँ।",
  "Increase target": "लक्ष्य बढ़ाएँ", "Target reached — collection auto-stopped.": "लक्ष्य पूरा — संग्रह स्वतः रुका।", "Campaign suspended by an administrator.": "अभियान एडमिनिस्ट्रेटर द्वारा निलंबित।",
  "Target nearly reached": "लक्ष्य लगभग पूरा", "surveys left. Collection stops automatically at target.": "सर्वे शेष। लक्ष्य पर संग्रह स्वतः रुकेगा।", "Expires on": "समाप्ति", "No campaigns match these filters.": "इन फ़िल्टर से कोई अभियान नहीं मिला।",
  "reopened until": "तक फिर खोला गया", "target raised to": "लक्ष्य बढ़ाया गया", "collection resumed": "संग्रह फिर शुरू", "Current target": "वर्तमान लक्ष्य", "New target": "नया लक्ष्य",
  "New target must be above the accepted count.": "नया लक्ष्य स्वीकृत संख्या से अधिक होना चाहिए।", "New progress": "नई प्रगति", "Volunteers can start new surveys again.": "स्वयंसेवक फिर से नए सर्वे शुरू कर सकते हैं।",
  "Ask an administrator": "एडमिनिस्ट्रेटर से कहें", "Questionnaire Builder": "प्रश्नावली बिल्डर", Monitoring: "निगरानी", "Geographical Dashboard": "भौगोलिक डैशबोर्ड", "Volunteer Performance": "स्वयंसेवक प्रदर्शन", "Research Overview": "शोध अवलोकन", "Maharashtra Overview": "महाराष्ट्र अवलोकन", Overview: "अवलोकन", "Bilingual questions, conditional logic, versions, issue taxonomy and priority scale.": "द्विभाषी प्रश्न, शर्तीय तर्क, संस्करण, मुद्दा वर्गीकरण और प्राथमिकता पैमाना।", "Survey Builder": "सर्वे बिल्डर",
};

// L(en, hi): inline bilingual text for new screens, so long strings don't need dictionary keys.
type Ctx = { role: Role; setRole: (r: Role) => void; lang: Lang; setLang: (l: Lang) => void; t: (s: string) => string; L: (en: string, hi: string) => string; readOnly: boolean };
const PreviewCtx = createContext<Ctx>({ role: "Super Administrator", setRole: () => {}, lang: "en", setLang: () => {}, t: (s) => s, L: (en) => en, readOnly: false });

const load = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const store = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked: preview just won't persist */ } };

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("Super Administrator");
  const [lang, setLangState] = useState<Lang>("en");
  // Restore after mount so server and client render the same first frame.
  useEffect(() => {
    const r = load("ld-role"), l = load("ld-lang");
    if (r && (roles as readonly string[]).includes(r)) setRoleState(r as Role);
    if (l === "en" || l === "hi") setLangState(l);
  }, []);
  const setRole = (r: Role) => { setRoleState(r); store("ld-role", r); };
  const setLang = (l: Lang) => { setLangState(l); store("ld-lang", l); };
  const t = (s: string) => (lang === "hi" ? hi[s] ?? hi2[s] ?? s : s);
  return <PreviewCtx.Provider value={{ role, setRole, lang, setLang, t, L: (en, hi) => (lang === "hi" ? hi : en), readOnly: role === "Candidate Team (view-only)" }}>{children}</PreviewCtx.Provider>;
}
export const usePreview = () => useContext(PreviewCtx);

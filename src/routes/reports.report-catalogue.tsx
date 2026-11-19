import { createFileRoute } from "@tanstack/react-router";
import { ReportCatalogue } from "@/components/reports";

export const Route = createFileRoute("/reports/report-catalogue")({
  head: () => ({ meta: [{ title: "Report Catalogue · Lokdrishti" }, { name: "description", content: "17 standard survey reports with filters and CSV/PDF export (illustrative demo data)." }] }),
  component: ReportCatalogue,
});

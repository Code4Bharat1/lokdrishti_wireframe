import { createFileRoute } from "@tanstack/react-router";
import { GeoDashboard } from "@/components/geo-dashboard";

export const Route = createFileRoute("/monitoring/geographical-dashboard")({
  head: () => ({ meta: [{ title: "Geographical Dashboard · Lokdrishti" }, { name: "description", content: "Uttar Pradesh coverage map with drill-down (illustrative demo data)." }] }),
  component: GeoDashboard,
});

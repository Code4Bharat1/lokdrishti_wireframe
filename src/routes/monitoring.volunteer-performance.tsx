import { createFileRoute } from "@tanstack/react-router";
import { VolunteerPerformance } from "@/components/volunteer-performance";

export const Route = createFileRoute("/monitoring/volunteer-performance")({
  head: () => ({ meta: [{ title: "Volunteer Performance · Lokdrishti" }, { name: "description", content: "Volunteer targets, activity, quality and sync status (illustrative demo data)." }] }),
  component: VolunteerPerformance,
});

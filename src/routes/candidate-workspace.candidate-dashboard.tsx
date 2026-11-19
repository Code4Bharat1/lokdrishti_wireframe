import { createFileRoute } from "@tanstack/react-router";
import { CandidateDashboard } from "@/components/candidate-dashboard";

export const Route = createFileRoute("/candidate-workspace/candidate-dashboard")({
  head: () => ({ meta: [{ title: "Candidate Dashboard · Lokdrishti" }, { name: "description", content: "One candidate's package, coverage, issues, volunteers and trends (illustrative demo data)." }] }),
  component: CandidateDashboard,
});

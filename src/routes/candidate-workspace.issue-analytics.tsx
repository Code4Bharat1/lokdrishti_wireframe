import { createFileRoute } from "@tanstack/react-router";
import { IssueAnalytics } from "@/components/issue-analytics";

export const Route = createFileRoute("/candidate-workspace/issue-analytics")({
  head: () => ({ meta: [{ title: "Issue Analytics · Lokdrishti" }, { name: "description", content: "Frequency, priority, spread and prevalence of reported issues (illustrative demo data)." }] }),
  component: IssueAnalytics,
});

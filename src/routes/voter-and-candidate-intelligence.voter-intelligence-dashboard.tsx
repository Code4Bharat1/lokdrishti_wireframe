import { createFileRoute } from "@tanstack/react-router";
import { VoterIntelligenceDashboard } from "@/components/voter-intelligence-dashboard";

export const Route = createFileRoute("/voter-and-candidate-intelligence/voter-intelligence-dashboard")({
  head: () => ({ meta: [
    { title: "Voter Intelligence Dashboard · Lokdrishti" },
    { name: "description", content: "Aggregate voter sentiment, public issues, survey sample profiles and policy awareness across Maharashtra. Illustrative research dashboard." },
    { property: "og:title", content: "Voter Intelligence Dashboard · Lokdrishti" },
    { property: "og:description", content: "Maharashtra voter research: aggregate sentiment, public priorities and survey coverage." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: VoterIntelligenceDashboard,
});
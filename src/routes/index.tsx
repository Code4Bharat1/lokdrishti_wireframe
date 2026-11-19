import { createFileRoute } from "@tanstack/react-router";
import { CommandCentre } from "@/components/command-centre";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Digital Command Centre · Lokdrishti" }, { name: "description", content: "Consolidated survey progress, issues and field activity across Uttar Pradesh (illustrative demo data)." }] }),
  component: CommandCentre,
});

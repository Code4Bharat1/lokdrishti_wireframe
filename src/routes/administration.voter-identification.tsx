import { createFileRoute } from "@tanstack/react-router";
import { VoterIdentification } from "@/components/admin-pages";

export const Route = createFileRoute("/administration/voter-identification")({
  head: () => ({ meta: [{ title: "Voter Identification · Lokdrishti" }, { name: "description", content: "Voter identification options in discovery (illustrative demo data)." }] }),
  component: VoterIdentification,
});

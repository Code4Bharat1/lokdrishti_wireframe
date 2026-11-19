import { createFileRoute } from "@tanstack/react-router";
import { ClientsPage } from "@/components/campaign-management";

export const Route = createFileRoute("/campaign-management/clients-and-candidates")({
  head: () => ({ meta: [{ title: "Clients & Candidates · Lokdrishti" }, { name: "description", content: "Lokdrishti campaign management (illustrative demo data)." }] }),
  component: ClientsPage,
});

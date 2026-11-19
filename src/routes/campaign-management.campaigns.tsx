import { createFileRoute } from "@tanstack/react-router";
import { CampaignsPage } from "@/components/campaign-management";

export const Route = createFileRoute("/campaign-management/campaigns")({
  head: () => ({ meta: [{ title: "Campaigns · Lokdrishti" }, { name: "description", content: "Lokdrishti campaign management (illustrative demo data)." }] }),
  component: CampaignsPage,
});

import { createFileRoute } from "@tanstack/react-router";
import { PackagesPage } from "@/components/campaign-management";

export const Route = createFileRoute("/campaign-management/survey-packages")({
  head: () => ({ meta: [{ title: "Survey Packages · Lokdrishti" }, { name: "description", content: "Lokdrishti campaign management (illustrative demo data)." }] }),
  component: PackagesPage,
});

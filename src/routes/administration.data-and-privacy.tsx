import { createFileRoute } from "@tanstack/react-router";
import { DataPrivacy } from "@/components/admin-pages";

export const Route = createFileRoute("/administration/data-and-privacy")({
  head: () => ({ meta: [{ title: "Data & Privacy · Lokdrishti" }, { name: "description", content: "Retention, data-subject requests, consent versions and incidents (illustrative demo data)." }] }),
  component: DataPrivacy,
});

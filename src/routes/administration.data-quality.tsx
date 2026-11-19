import { createFileRoute } from "@tanstack/react-router";
import { DataQuality } from "@/components/data-quality";

export const Route = createFileRoute("/administration/data-quality")({
  head: () => ({ meta: [{ title: "Data Quality · Lokdrishti" }, { name: "description", content: "Review queue for flagged survey records (illustrative demo data)." }] }),
  component: DataQuality,
});

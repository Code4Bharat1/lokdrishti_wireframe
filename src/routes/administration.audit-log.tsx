import { createFileRoute } from "@tanstack/react-router";
import { AuditLogPage } from "@/components/admin-pages";

export const Route = createFileRoute("/administration/audit-log")({
  head: () => ({ meta: [{ title: "Audit Log · Lokdrishti" }, { name: "description", content: "Who changed what, and when (illustrative demo data)." }] }),
  component: AuditLogPage,
});

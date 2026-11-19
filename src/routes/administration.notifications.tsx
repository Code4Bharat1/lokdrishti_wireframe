import { createFileRoute } from "@tanstack/react-router";
import { NotificationCentre } from "@/components/admin-pages";

export const Route = createFileRoute("/administration/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Lokdrishti" }, { name: "description", content: "In-app notification centre (illustrative demo data)." }] }),
  component: NotificationCentre,
});

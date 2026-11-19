import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/campaign-management";
import { MobileAppPreview } from "@/components/mobile-app";

export const Route = createFileRoute("/field-app/mobile-app-preview")({
  head: () => ({ meta: [{ title: "Mobile App Preview · Lokdrishti" }, { name: "description", content: "Volunteer survey app with offline collection, shown in an Android phone frame (illustrative)." }] }),
  component: () => (
    <div className="space-y-5">
      <Header section="Field App" title="Mobile App Preview" desc="Volunteer survey app, as seen on an Android phone." />
      <MobileAppPreview />
    </div>
  ),
});

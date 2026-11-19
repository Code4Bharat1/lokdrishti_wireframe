import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/campaign-management";
import { QuestionnaireBuilder } from "@/components/questionnaire-builder";

export const Route = createFileRoute("/campaign-management/questionnaire-builder")({
  head: () => ({ meta: [{ title: "Questionnaire Builder · Lokdrishti" }, { name: "description", content: "Bilingual questionnaires, bulk import, versions, issue taxonomy and priority scale (illustrative)." }] }),
  component: () => (
    <div className="space-y-5">
      <Header section="Campaign Management" title="Questionnaire Builder" desc="Bilingual questions, conditional logic, versions, issue taxonomy and priority scale." />
      <QuestionnaireBuilder />
    </div>
  ),
});

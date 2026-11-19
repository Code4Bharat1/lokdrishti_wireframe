import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { createResponsesCall } from "@/lib/ai/responses";

const SYSTEM = `You are the AI Research Assistant inside "Lokdrishti", a political research and intelligence platform focused on Maharashtra, India.
Help political researchers, strategists and analysts: survey design, questionnaire wording, sampling, interpreting results, district/constituency context, public issues, governance and schemes, and report drafting.
Be neutral and non-partisan. Clearly separate verified facts from estimates; say when you are unsure or when data may be outdated. Never invent figures or sources. Prefer concise, structured answers with headings and bullet points.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "AI is not configured." }, { status: 500 });
        const { messages } = (await request.json()) as { messages: UIMessage[] };
        const call = createResponsesCall(
          request,
          { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" },
          await convertToModelMessages(messages),
          SYSTEM,
        );
        return call.response();
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai-intelligence/ai-research-assistant")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant · Lokdrishti" },
      { name: "description", content: "Ask questions about Maharashtra political research, survey design and public issues." },
      { property: "og:title", content: "AI Research Assistant · Lokdrishti" },
      { property: "og:description", content: "AI-powered research assistant for Maharashtra political research." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Assistant,
});

const prompts = [
  "Draft a 10-question voter sentiment survey for Pune urban wards",
  "What sampling approach suits a district-level study in Vidarbha?",
  "Summarise key public issues typically raised in Marathwada",
  "How should I weight responses by age and gender?",
];

function Assistant() {
  const { messages, sendMessage, status, stop, error } = useChat({ transport: new DefaultChatTransport({ api: "/api/chat" }) });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-4xl flex-col">
      <div className="mb-4">
        <div className="eyebrow">AI Intelligence</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">AI Research Assistant</h1>
      </div>
      <div className="panel flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="grid size-12 place-items-center rounded-md bg-teal text-teal-foreground"><ScanSearch className="size-5" /></div>
              <h2 className="mt-4 font-semibold">Ask about research, surveys or Maharashtra</h2>
              <p className="mt-1 text-sm text-muted-foreground">Answers are AI-generated — verify facts before using them in reports.</p>
              <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {prompts.map((p) => (
                  <button key={p} onClick={() => send(p)} className="rounded-md border bg-background p-3 text-left text-sm hover:border-primary/40 hover:bg-accent">{p}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            return m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] whitespace-pre-wrap rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground">{text}</div>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <div className="grid size-7 shrink-0 place-items-center rounded-md bg-teal text-teal-foreground"><ScanSearch className="size-3.5" /></div>
                <div className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed">{text || <span className="text-muted-foreground">Analysing…</span>}</div>
              </div>
            );
          })}
          {status === "submitted" && <div className="text-sm text-muted-foreground">Analysing…</div>}
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">The assistant couldn't respond. Please try again.</div>}
          <div ref={endRef} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t p-3">
          <div className="flex items-end gap-2 rounded-md border bg-background p-2 focus-within:ring-2 focus-within:ring-ring/30">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask a research question…" className="flex-1 resize-none bg-transparent px-1 text-sm outline-none" />
            <button type={busy ? "button" : "submit"} onClick={busy ? () => stop() : undefined}
              className={cn("grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40")}
              disabled={!busy && !input.trim()} aria-label={busy ? "Stop" : "Send"}>
              {busy ? <Square className="size-3.5" /> : <ArrowUp className="size-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

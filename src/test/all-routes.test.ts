import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, isNotFound } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { overview, sections } from "@/lib/nav";

// Every sidebar item, plus every internal link target written in the source, must resolve (no 404).
function linkTargets(): string[] {
  const files: string[] = [];
  const walk = (d: string) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && !f.includes("routeTree") && !f.includes(".test.") && files.push(p); });
  walk("src");
  const out = new Set<string>();
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    for (const m of s.matchAll(/\bto(?:=|: )"(\/[^"$]*)"/g)) out.add(m[1]!);
    for (const m of s.matchAll(/_splat: "([^"]+)"/g)) out.add(`/${m[1]}`);
  }
  return [...out];
}

const paths = [...new Set([...[overview, ...sections].flatMap((s) => s.items.map((i) => i.path)), "/login", ...linkTargets()])];

async function load(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }), context: { queryClient: new QueryClient() } });
  await router.load();
  return router.state;
}

describe("routing", () => {
  it.each(paths)("%s resolves", async (path) => {
    const state = await load(path);
    expect(state.matches.some((m) => isNotFound(m.error) || !!m.error), path).toBe(false);
  });
  it("an unknown path is a 404 (sanity check of the test itself)", async () => {
    const state = await load("/campaign-management/does-not-exist");
    expect(state.matches.some((m) => isNotFound(m.error) || !!m.error)).toBe(true);
  });
});

describe("forgiving URLs", () => {
  it.each([
    ["/campaign-management", "/campaign-management/clients-and-candidates"],
    ["/administration", "/administration/users-and-roles"],
    ["/reports/report-generator/", "/reports/report-generator"],
    ["/administration/audit-log/", "/administration/audit-log"],
    ["/campaign-management/campaigns/", "/campaign-management/campaigns"],
  ])("%s → %s", async (from, to) => {
    const state = await load(from);
    expect(state.location.pathname.replace(/\/$/, "")).toBe(to);
    expect(state.matches.some((m) => isNotFound(m.error) || !!m.error)).toBe(false);
  });
});

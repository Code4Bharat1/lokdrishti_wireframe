import { describe, expect, it } from "vitest";
import { reports, blank } from "@/components/reports";
import { models } from "@/data/demo";

describe("report catalogue", () => {
  it("has the 17 SOW reports, one restricted", () => {
    expect(reports).toHaveLength(17);
    expect(reports.filter((r) => r.restricted).map((r) => r.name)).toEqual(["Survey response detail"]);
  });
  it.each(reports.map((r) => [r.name, r] as const))("%s builds rows", (_, r) => {
    expect(r.build(models, blank()).length).toBeGreaterThan(0);
  });
});

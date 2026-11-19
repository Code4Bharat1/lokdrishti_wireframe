import { describe, expect, it } from "vitest";
import { models, issueStats, split, upDistricts } from "@/data/demo";
import geo from "@/data/up-districts.json";

describe("analytics model", () => {
  it("split always sums to the total", () => {
    expect(split(100, [1, 1, 1]).reduce((a, b) => a + b)).toBe(100);
    expect(split(7, [0.2, 5, 1.3, 0])).toEqual(expect.arrayContaining([0]));
  });
  it("campaign, volunteer, area and daily totals agree", () => {
    for (const m of models) {
      const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
      expect(sum(m.volunteers.map((v) => v.accepted))).toBe(m.c.accepted);
      expect(sum(m.areas.map((a) => a.responses))).toBe(m.c.accepted);
      expect(sum(m.daily.map((d) => d.accepted))).toBe(m.c.accepted);
      for (const a of m.areas) expect(sum(a.byVillage)).toBe(a.responses);
    }
  });
  it("issue measures are internally consistent", () => {
    for (const s of issueStats(models, 7)) {
      expect(s.hist.reduce((a, b) => a + b, 0)).toBe(s.freq);
      expect(s.high).toBeLessThanOrEqual(s.freq);
      expect(s.spread).toBeLessThanOrEqual(s.locations);
      expect(s.prevalence).toBeLessThanOrEqual(100);
    }
  });
  it("every demo district exists on the UP map", () => {
    const names = new Set((geo as { features: { properties: { name: string } }[] }).features.map((f) => f.properties.name));
    expect(upDistricts.filter((d) => !names.has(d))).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { bandError, sampleRows, validateRow } from "@/components/questionnaire-builder";
import { priorityBands } from "@/data/demo";

describe("questionnaire rules", () => {
  it("sample import has 18 valid rows and 3 invalid ones with reasons", () => {
    const errs = sampleRows().map(validateRow);
    expect(errs.filter((e) => !e)).toHaveLength(18);
    expect(errs.filter(Boolean).sort()).toEqual(["Bad options: need 2+ options as English=हिन्दी", "Missing Hindi text", "Missing or unknown question type"]);
  });
  it("priority bands must tile 1–10", () => {
    expect(bandError(priorityBands)).toBeNull();
    expect(bandError([{ from: 1, to: 3, label: "Low" }, { from: 5, to: 10, label: "High" }])).toMatch(/start at 4/);
    expect(bandError([{ from: 1, to: 8, label: "Low" }])).toMatch(/end at 10/);
  });
});

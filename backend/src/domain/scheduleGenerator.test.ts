import { describe, it, expect } from "vitest";
import { generateSchedule, seededDraw } from "./scheduleGenerator";

describe("generateSchedule", () => {
  it("produces positions × cycles obligations for a two-hand member", () => {
    const positions = Array.from({ length: 11 }, (_, i) => ({
      ordinal: i + 1,
      memberId: i < 10 ? `m${i}` : "m0",
    }));
    const { cycles, obligations } = generateSchedule({
      positions,
      amountKobo: 500000n,
      frequency: "monthly",
      startDate: new Date("2026-01-31"),
    });
    expect(cycles).toHaveLength(11);
    expect(obligations).toHaveLength(121);
  });

  it("clamps month-end dates correctly", () => {
    const { cycles } = generateSchedule({
      positions: [{ ordinal: 1, memberId: "a" }, { ordinal: 2, memberId: "b" }],
      amountKobo: 10000n,
      frequency: "monthly",
      startDate: new Date("2026-01-31"),
    });
    expect(cycles[1].dueDate.getDate()).toBe(28);
  });
});

describe("seededDraw", () => {
  it("is reproducible for the same seed", () => {
    const ids = ["a", "b", "c", "d", "e"];
    expect(seededDraw(ids, "seed-123")).toEqual(seededDraw(ids, "seed-123"));
  });
});
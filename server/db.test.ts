import { describe, it, expect } from "vitest";
import { toKstDay } from "./db";

describe("toKstDay 경계", () => {
  it("KST 23:30은 같은 날짜", () => {
    expect(toKstDay(new Date("2026-12-03T14:30:00Z"))).toBe("2026-12-03");
  });

  it("KST 00:30은 다음 날짜", () => {
    expect(toKstDay(new Date("2026-12-03T15:30:00Z"))).toBe("2026-12-04");
  });

  it("KST 20:00은 같은 날짜 (60011 저장 형태)", () => {
    expect(toKstDay(new Date("2026-12-04T11:00:00Z"))).toBe("2026-12-04");
  });
});

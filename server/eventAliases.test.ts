import { describe, it, expect } from "vitest";
import { canonicalEventName, EVENT_NAME_ALIASES } from "./eventAliases";

describe("canonicalEventName", () => {
  it("maps the comicw calendar short name to the curated official name", () => {
    expect(canonicalEventName("AGF KOREA 2026")).toBe("Anime X Game Festival 2026");
  });

  it("trims surrounding whitespace before alias lookup", () => {
    expect(canonicalEventName("  AGF KOREA 2026  ")).toBe("Anime X Game Festival 2026");
  });

  it("passes through names without an alias unchanged", () => {
    expect(canonicalEventName("코믹월드 339 일산")).toBe("코믹월드 339 일산");
  });

  it("keeps the alias table curated (every alias target differs from its key)", () => {
    for (const [alias, canonical] of Object.entries(EVENT_NAME_ALIASES)) {
      expect(canonical).not.toBe(alias);
    }
  });
});

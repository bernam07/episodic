import { describe, expect, it } from "vitest";
import { isValidListTitle, MAX_LIST_TITLE } from "@/domain/entities/List";

describe("isValidListTitle", () => {
  it("accepts a trimmed title within range", () => {
    expect(isValidListTitle("Best sci-fi")).toBe(true);
    expect(isValidListTitle("  padded  ")).toBe(true);
    expect(isValidListTitle("a")).toBe(true);
    expect(isValidListTitle("x".repeat(MAX_LIST_TITLE))).toBe(true);
  });

  it("rejects empty, whitespace-only, or overlong titles", () => {
    expect(isValidListTitle("")).toBe(false);
    expect(isValidListTitle("   ")).toBe(false);
    expect(isValidListTitle("x".repeat(MAX_LIST_TITLE + 1))).toBe(false);
  });
});

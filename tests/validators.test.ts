import { describe, expect, it } from "vitest";
import { isValidRating, MAX_RATING, MIN_RATING } from "@/domain/entities/Review";
import {
  isValidAvatarFile,
  isValidEmail,
  isValidUsername,
  MAX_AVATAR_BYTES,
} from "@/domain/usecases/auth/AuthUseCases";

describe("isValidRating", () => {
  it("accepts half-star values within range", () => {
    expect(isValidRating(0.5)).toBe(true);
    expect(isValidRating(3)).toBe(true);
    expect(isValidRating(4.5)).toBe(true);
    expect(isValidRating(MIN_RATING)).toBe(true);
    expect(isValidRating(MAX_RATING)).toBe(true);
  });

  it("rejects values outside 0.5–5", () => {
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(5.5)).toBe(false);
    expect(isValidRating(-1)).toBe(false);
  });

  it("rejects fractions that are not half-steps", () => {
    expect(isValidRating(4.3)).toBe(false);
    expect(isValidRating(1.1)).toBe(false);
  });
});

describe("isValidUsername", () => {
  it("accepts 3–24 chars of letters, numbers and underscore", () => {
    expect(isValidUsername("berna")).toBe(true);
    expect(isValidUsername("a_b_2")).toBe(true);
    expect(isValidUsername("abc")).toBe(true);
  });

  it("trims before validating", () => {
    expect(isValidUsername("  berna  ")).toBe(true);
  });

  it("rejects too short, too long, or illegal characters", () => {
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("a".repeat(25))).toBe(false);
    expect(isValidUsername("has space")).toBe(false);
    expect(isValidUsername("dash-not-ok")).toBe(false);
    expect(isValidUsername("emoji😀")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("berna.dev@example.com")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isValidAvatarFile", () => {
  it("accepts jpeg, png and webp within the size limit", () => {
    expect(isValidAvatarFile("image/jpeg", 1024)).toBe(true);
    expect(isValidAvatarFile("image/png", 1024)).toBe(true);
    expect(isValidAvatarFile("image/webp", MAX_AVATAR_BYTES)).toBe(true);
  });

  it("rejects other types, empty files and oversize files", () => {
    expect(isValidAvatarFile("image/gif", 1024)).toBe(false);
    expect(isValidAvatarFile("application/pdf", 1024)).toBe(false);
    expect(isValidAvatarFile("image/png", 0)).toBe(false);
    expect(isValidAvatarFile("image/png", MAX_AVATAR_BYTES + 1)).toBe(false);
  });
});

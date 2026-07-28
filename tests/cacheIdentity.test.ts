import { describe, expect, it } from "vitest";
import { shouldResetCache } from "@/presentation/utils/cacheIdentity";

const ALICE = "11111111-1111-1111-1111-111111111111";
const BOB = "22222222-2222-2222-2222-222222222222";

describe("shouldResetCache", () => {
  it("resets when a different user signs in (the cross-account leak)", () => {
    expect(shouldResetCache(ALICE, BOB)).toBe(true);
  });

  it("resets on sign-out so the next visitor never sees cached data", () => {
    expect(shouldResetCache(ALICE, null)).toBe(true);
  });

  it("does not reset on a token refresh for the same user", () => {
    expect(shouldResetCache(ALICE, ALICE)).toBe(false);
  });

  it("does not reset on the first identity of the session", () => {
    expect(shouldResetCache(undefined, ALICE)).toBe(false);
    expect(shouldResetCache(undefined, null)).toBe(false);
  });

  it("resets when signing in after a signed-out start", () => {
    expect(shouldResetCache(null, ALICE)).toBe(true);
  });
});

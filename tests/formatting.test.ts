import { describe, expect, it } from "vitest";
import { hasAired } from "@/domain/entities/Episode";
import { releaseYear } from "@/domain/entities/Series";
import { initials } from "@/domain/entities/Social";
import { plural, pluralize } from "@/presentation/utils/plural";

describe("pluralize", () => {
  it("returns the singular for exactly one", () => {
    expect(pluralize(1, "follower")).toBe("follower");
  });

  it("returns the plural for zero and many", () => {
    expect(pluralize(0, "follower")).toBe("followers");
    expect(pluralize(2, "follower")).toBe("followers");
  });

  it("honours an irregular plural form", () => {
    expect(pluralize(1, "person", "people")).toBe("person");
    expect(pluralize(3, "person", "people")).toBe("people");
  });
});

describe("plural", () => {
  it("prefixes the count", () => {
    expect(plural(1, "follower")).toBe("1 follower");
    expect(plural(5, "follower")).toBe("5 followers");
    expect(plural(3, "person", "people")).toBe("3 people");
  });
});

describe("releaseYear", () => {
  it("takes the year from the air date", () => {
    expect(releaseYear({ firstAirDate: "2008-01-20" })).toBe("2008");
  });

  it("is null when there is no air date", () => {
    expect(releaseYear({ firstAirDate: null })).toBeNull();
  });
});

describe("initials", () => {
  it("uses the first letters of a two-word display name", () => {
    expect(initials({ username: "walterw", displayName: "Walter White" })).toBe("WW");
  });

  it("falls back to the first two letters of a single word", () => {
    expect(initials({ username: "heisenberg", displayName: null })).toBe("HE");
  });

  it("prefers the display name over the username", () => {
    expect(initials({ username: "jp", displayName: "Jesse Pinkman" })).toBe("JP");
  });
});

describe("hasAired", () => {
  const now = new Date("2024-06-15T00:00:00Z");

  it("is true for a past air date", () => {
    expect(hasAired({ airDate: "2024-01-01" }, now)).toBe(true);
  });

  it("is false for a future air date", () => {
    expect(hasAired({ airDate: "2024-12-31" }, now)).toBe(false);
  });

  it("is false when the air date is unknown", () => {
    expect(hasAired({ airDate: null }, now)).toBe(false);
  });
});

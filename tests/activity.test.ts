import { describe, expect, it } from "vitest";
import { activityVerb, type ActivityEvent } from "@/domain/entities/Activity";

function event(overrides: Partial<ActivityEvent>): ActivityEvent {
  return {
    actorId: "a",
    username: "greta",
    displayName: "Greta",
    avatarUrl: null,
    eventType: "started",
    seriesId: "s",
    tmdbId: 1,
    seriesName: "Show",
    posterPath: null,
    occurredAt: new Date().toISOString(),
    episodeCount: null,
    rating: null,
    reviewBody: null,
    ...overrides,
  };
}

describe("activityVerb", () => {
  it("phrases start and finish milestones", () => {
    expect(activityVerb(event({ eventType: "started" }))).toBe("started watching");
    expect(activityVerb(event({ eventType: "finished" }))).toBe("finished");
    expect(activityVerb(event({ eventType: "reviewed" }))).toBe("reviewed");
  });

  it("pluralises the progress episode count", () => {
    expect(activityVerb(event({ eventType: "progress", episodeCount: 1 }))).toBe("watched 1 episode of");
    expect(activityVerb(event({ eventType: "progress", episodeCount: 4 }))).toBe("watched 4 episodes of");
  });

  it("treats a missing progress count as zero", () => {
    expect(activityVerb(event({ eventType: "progress", episodeCount: null }))).toBe("watched 0 episodes of");
  });
});

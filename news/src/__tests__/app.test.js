import { describe, it, expect, vi } from "vitest";
import { safeUrl } from "../Components/fallbackData";
import { CircuitBreaker } from "../core/circuitBreaker";
import { searchSortService } from "../services/searchSortService";

describe("Security: safeUrl Helper", () => {
  it("allows valid https and http URLs", () => {
    expect(safeUrl("https://thehindu.com/news")).toBe("https://thehindu.com/news");
    expect(safeUrl("http://example.com/feed.xml")).toBe("http://example.com/feed.xml");
  });

  it("blocks javascript: and invalid schemes", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("#");
    expect(safeUrl("data:text/html,<script>alert(1)</script>")).toBe("#");
    expect(safeUrl("vbscript:msgbox(1)")).toBe("#");
  });

  it("handles null, undefined, empty, or non-string inputs safely", () => {
    expect(safeUrl("")).toBe("#");
    expect(safeUrl(null)).toBe("#");
    expect(safeUrl(undefined)).toBe("#");
    expect(safeUrl(12345)).toBe("#");
    expect(safeUrl("not-a-valid-url")).toBe("#");
  });
});

describe("Reliability: CircuitBreaker Timeout and State", () => {
  it("clears timeout on successful execution without leaking timers", async () => {
    const cb = new CircuitBreaker("TestService", { timeoutMs: 1000 });
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const result = await cb.execute(
      async () => "success_data",
      () => "fallback"
    );

    expect(result).toBe("success_data");
    expect(cb.state).toBe("CLOSED");
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("routes to fallback and trips open on failures", async () => {
    const cb = new CircuitBreaker("FailingService", {
      failureThreshold: 2,
      timeoutMs: 100,
    });

    const fallbackFn = vi.fn((err) => `fallback_${err.circuitState}`);

    await cb.execute(async () => {
      throw new Error("500 Internal Error");
    }, fallbackFn);
    expect(cb.state).toBe("CLOSED");
    expect(cb.failureCount).toBe(1);

    await cb.execute(async () => {
      throw new Error("500 Internal Error");
    }, fallbackFn);
    expect(cb.state).toBe("OPEN");

    // Once open, does not call actionFn
    const actionSpy = vi.fn();
    const result = await cb.execute(actionSpy, fallbackFn);
    expect(actionSpy).not.toHaveBeenCalled();
    expect(result).toBe("fallback_OPEN");
  });
});

describe("Search & Sort: searchSortService", () => {
  const sampleArticles = [
    {
      title: "India GDP growth surges to 7.8%",
      description: "Strong domestic manufacturing and services sector output.",
      source: { name: "The Hindu" },
      publishedAt: "2026-10-10T12:00:00Z",
    },
    {
      title: "Global central banks navigate macro interest rates",
      description: "Federal Reserve policy decision shifts international currency markets.",
      source: { name: "BBC World" },
      publishedAt: "2026-10-10T08:00:00Z",
    },
  ];

  it("filters articles by keyword query", () => {
    const results = searchSortService.queryAndSort(sampleArticles, { searchQuery: "GDP" });
    expect(results.length).toBe(1);
    expect(results[0].title).toContain("India GDP");
  });

  it("returns all articles when query is empty", () => {
    const results = searchSortService.queryAndSort(sampleArticles, { searchQuery: "" });
    expect(results.length).toBe(2);
  });

  it("sorts articles correctly by date", () => {
    const sortedDesc = searchSortService.queryAndSort(sampleArticles, { sortBy: "publishedAt" });
    expect(sortedDesc[0].title).toContain("India GDP");

    const sortedAsc = searchSortService.queryAndSort(sampleArticles, { sortBy: "oldest" });
    expect(sortedAsc[0].title).toContain("Global central banks");
  });

  it("groups articles by date key", () => {
    const groups = searchSortService.groupArticlesByDate(sampleArticles);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].articles.length).toBe(2);
  });
});

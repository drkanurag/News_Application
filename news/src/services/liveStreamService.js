import { CircuitBreaker } from "../core/circuitBreaker";
import { eventBus, EVENTS } from "../core/eventBus";
import { CATEGORY_FALLBACK_IMAGES } from "../Components/fallbackData";
import { healthMonitorService } from "./healthMonitorService";

/**
 * Real-Time Global Live Wire & Server-Sent Events (SSE) Microservice
 *
 * Capabilities:
 * 1. Connects to `/api/live-stream` via EventSource (Server-Sent Events) for
 *    real-time push updates every 8 seconds from Google News `when:1h` Global Wire,
 *    BBC, NDTV, Al Jazeera, The Hindu, TechCrunch, The Verge, CNBC, ESPN, and NewsAPI.
 * 2. Runs a 12-second browser-side delta poller fallback so new stories appear
 *    automatically in real time even on static hosts.
 * 3. Isolates all network and parsing errors via CircuitBreaker + EventBus.
 */

const LIVE_RSS_FEEDS = {
  general: [
    {
      url: "https://feeds.bbci.co.uk/news/world/rss.xml",
      sourceName: "BBC World News",
    },
    {
      url: "https://feeds.feedburner.com/ndtvnews-top-stories",
      sourceName: "NDTV Live",
    },
    {
      url: "https://www.aljazeera.com/xml/rss/all.xml",
      sourceName: "Al Jazeera Live",
    },
  ],
  technology: [
    {
      url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
      sourceName: "BBC Technology",
    },
    {
      url: "https://techcrunch.com/feed/",
      sourceName: "TechCrunch Live",
    },
  ],
  business: [
    {
      url: "https://feeds.bbci.co.uk/news/business/rss.xml",
      sourceName: "BBC Business",
    },
  ],
  science: [
    {
      url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
      sourceName: "BBC Science & Environment",
    },
  ],
  health: [
    {
      url: "https://feeds.bbci.co.uk/news/health/rss.xml",
      sourceName: "BBC Health",
    },
  ],
  sports: [
    {
      url: "https://feeds.bbci.co.uk/sport/rss.xml",
      sourceName: "BBC Sport",
    },
    {
      url: "https://www.espn.com/espn/rss/news",
      sourceName: "ESPN Live",
    },
  ],
  entertainment: [
    {
      url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
      sourceName: "BBC Entertainment & Arts",
    },
  ],
};

function stripHtml(html = "") {
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function optimizeImage(url, category) {
  if (!url) {
    return (
      CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.general
    );
  }
  return String(url).replace("/standard/240/", "/standard/624/");
}

function normalizePubDate(pubDate) {
  if (!pubDate) return new Date().toISOString();
  const normalized = String(pubDate).includes("T")
    ? String(pubDate)
    : `${String(pubDate).trim().replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function isPublishedWithinMinutes(isoDate, minutes = 35) {
  const ts = new Date(isoDate).getTime();
  if (isNaN(ts)) return false;
  const ageMs = Date.now() - ts;
  return ageMs >= -60000 && ageMs <= minutes * 60 * 1000;
}

class LiveStreamService {
  constructor() {
    this.hotCache = new Map();
    this.activeEventSource = null;
    this.pollTimer = null;
    this.circuitBreaker = new CircuitBreaker("realtime-stream-service", {
      failureThreshold: 3,
      cooldownMs: 25000,
      timeoutMs: 3800,
    });
  }

  /**
   * Fetch live breaking wire stories for a category & country edition.
   */
  async fetchLiveCategoryStream(
    category = "general",
    country = "us",
    force = false
  ) {
    const cacheKey = `${country}:${category}`;
    const cached = this.hotCache.get(cacheKey);
    if (!force && cached && Date.now() - cached.ts < 15000) {
      return cached.items;
    }

    const feeds = [...(LIVE_RSS_FEEDS[category] || LIVE_RSS_FEEDS.general)];
    if (country === "in" && category === "general") {
      feeds.reverse();
    }

    return this.circuitBreaker.execute(
      async () => {
        const requests = feeds.map(async (feed) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3200);
          try {
            const encoded = encodeURIComponent(feed.url);
            const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encoded}`;
            const res = await fetch(endpoint, { signal: controller.signal });
            const data = await res.json();
            if (data.status !== "ok" || !Array.isArray(data.items)) {
              return [];
            }

            return data.items.map((item) => {
              const cleanDesc = stripHtml(
                item.description || item.content || ""
              );
              const rawImg =
                item.thumbnail ||
                item.enclosure?.link ||
                item.enclosure?.thumbnail ||
                "";
              const pubIso = normalizePubDate(item.pubDate);

              return {
                source: {
                  id: feed.sourceName.toLowerCase().replace(/\s+/g, "-"),
                  name: feed.sourceName,
                },
                author: item.author || feed.sourceName,
                title: stripHtml(item.title || "Breaking Live Update"),
                description:
                  cleanDesc ||
                  "Live breaking report updated in real time from the newsroom.",
                content: stripHtml(item.content || item.description || ""),
                url: item.link || item.guid || "https://www.bbc.com/news",
                urlToImage: optimizeImage(rawImg, category),
                publishedAt: pubIso,
                category,
                isRealtimeStream: true,
                isJustIn: isPublishedWithinMinutes(pubIso, 35),
              };
            });
          } finally {
            clearTimeout(timer);
          }
        });

        const settled = await Promise.allSettled(requests);
        const merged = settled
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => r.value);

        if (merged.length > 0) {
          this.hotCache.set(cacheKey, { ts: Date.now(), items: merged });
        }

        healthMonitorService.reportStatus("realtime-stream-service", {
          name: "Real-Time Live Stream Service",
          domain: "Live Breaking Wire",
          status: merged.length > 0 ? "HEALTHY" : "DEGRADED",
          message:
            merged.length > 0
              ? `Streaming ${merged.length} real-time global wire stories`
              : "Live wire returned 0 items",
        });

        return merged;
      },
      () => cached?.items || []
    );
  }

  /**
   * Subscribe to continuous real-time push updates via Server-Sent Events (/api/live-stream)
   * with automatic 10-second live delta polling fallback.
   */
  subscribeToRealtimePush({
    category = "general",
    country = "us",
    query = "",
    onRealtimeArticles,
  } = {}) {
    this.unsubscribeRealtimePush();

    const params = new URLSearchParams({
      category,
      country,
      q: query.trim(),
    });

    // 1. Connect to Server-Sent Events (SSE) real-time push stream if available
    if (typeof window !== "undefined" && "EventSource" in window) {
      try {
        const es = new EventSource(`/api/live-stream?${params.toString()}`);
        this.activeEventSource = es;

        es.addEventListener("realtime_feed", (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (
              payload?.status === "ok" &&
              Array.isArray(payload.articles) &&
              payload.articles.length > 0
            ) {
              healthMonitorService.reportStatus("realtime-stream-service", {
                name: "Real-Time Live Stream Service",
                domain: "Live Breaking Wire (SSE Push)",
                status: "HEALTHY",
                message: `Live SSE stream active • ${payload.articles.length} global stories synced`,
              });
              if (onRealtimeArticles) {
                onRealtimeArticles(payload.articles, {
                  source: "sse",
                  lastSyncedAt:
                    payload.lastSyncedAt || new Date().toISOString(),
                });
              }
              eventBus.emit(EVENTS.REALTIME_PUSH_RECEIVED, {
                count: payload.articles.length,
                timestamp: new Date().toISOString(),
              });
            }
          } catch {
            // Ignore malformed frame
          }
        });

        es.onerror = () => {
          // Close SSE quietly; fallback 10s poller below continues seamlessly
          try {
            es.close();
          } catch {
            // Ignore
          }
        };
      } catch {
        // Fallback to poller
      }
    }

    // 2. High-frequency 10-second delta poller so new stories arrive even without SSE
    this.pollTimer = setInterval(async () => {
      try {
        const edgeRes = await fetch(
          `/api/fast-news?${params.toString()}&force=0`
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        if (
          edgeRes?.status === "ok" &&
          Array.isArray(edgeRes.articles) &&
          edgeRes.articles.length > 0
        ) {
          if (onRealtimeArticles) {
            onRealtimeArticles(edgeRes.articles, {
              source: "edge-poll",
              lastSyncedAt: edgeRes.lastSyncedAt || new Date().toISOString(),
            });
          }
          return;
        }

        const wireItems = await this.fetchLiveCategoryStream(
          category,
          country,
          true
        );
        if (wireItems.length > 0 && onRealtimeArticles) {
          onRealtimeArticles(wireItems, {
            source: "rss-poll",
            lastSyncedAt: new Date().toISOString(),
          });
        }
      } catch {
        // Isolated polling error
      }
    }, 10000);

    return () => this.unsubscribeRealtimePush();
  }

  unsubscribeRealtimePush() {
    if (this.activeEventSource) {
      try {
        this.activeEventSource.close();
      } catch {
        // Ignore
      }
      this.activeEventSource = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}

export const liveStreamService = new LiveStreamService();

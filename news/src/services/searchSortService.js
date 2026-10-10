import { formatDateHeading, getLocalDateKey } from "../Components/fallbackData";
import { healthMonitorService } from "./healthMonitorService";

/**
 * Search, Date-Filtering & Chronological Ranking Microservice
 *
 * Isolates all keyword tokenization, date-range filtering, sorting, and
 * chronological date-grouping logic with fault guards.
 */

class SearchSortService {
  resolveDateBounds(datePreset = "all", customFrom = "", customTo = "") {
    const now = new Date();
    const todayKey = getLocalDateKey(now.toISOString());

    if (datePreset === "today") {
      return { fromKey: todayKey, toKey: todayKey };
    }

    if (datePreset === "yesterday") {
      const yest = new Date(now.getTime() - 86400000);
      const yKey = getLocalDateKey(yest.toISOString());
      return { fromKey: yKey, toKey: yKey };
    }

    if (datePreset === "7d") {
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      return {
        fromKey: getLocalDateKey(weekAgo.toISOString()),
        toKey: todayKey,
      };
    }

    if (datePreset === "30d") {
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      return {
        fromKey: getLocalDateKey(monthAgo.toISOString()),
        toKey: todayKey,
      };
    }

    if (datePreset === "custom") {
      return {
        fromKey: customFrom || "",
        toKey: customTo || "",
      };
    }

    return { fromKey: "", toKey: "" };
  }

  queryAndSort(
    articles = [],
    {
      searchQuery = "",
      sortBy = "publishedAt",
      datePreset = "all",
      customFromDate = "",
      customToDate = "",
    } = {}
  ) {
    if (!Array.isArray(articles)) return [];

    try {
      const q = String(searchQuery || "").trim().toLowerCase();
      const { fromKey, toKey } = this.resolveDateBounds(
        datePreset,
        customFromDate,
        customToDate
      );

      const filtered = articles.filter((item) => {
        if (!item) return false;

        // Keyword filter
        if (q) {
          const haystack = `${item.title || ""} ${item.description || ""} ${
            item.source?.name || ""
          } ${item.author || ""}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        // Date filter
        if (fromKey || toKey) {
          const itemDateKey =
            item.dateKey || getLocalDateKey(item.publishedAt);
          if (fromKey && itemDateKey < fromKey) return false;
          if (toKey && itemDateKey > toKey) return false;
        }

        return true;
      });

      const sorted = [...filtered].sort((a, b) => {
        if (sortBy === "title") {
          return String(a?.title || "").localeCompare(String(b?.title || ""));
        }
        if (sortBy === "source") {
          return String(a?.source?.name || "").localeCompare(
            String(b?.source?.name || "")
          );
        }
        const dateA = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        const safeA = isNaN(dateA) ? 0 : dateA;
        const safeB = isNaN(dateB) ? 0 : dateB;

        if (sortBy === "oldest") {
          return safeA - safeB;
        }
        return safeB - safeA;
      });

      return sorted;
    } catch (err) {
      healthMonitorService.reportStatus("search-indexing-service", {
        status: "DEGRADED",
        message: `Search/Date filter recovered from error: ${err?.message}`,
      });
      return articles;
    }
  }

  groupArticlesByDate(articles = []) {
    if (!Array.isArray(articles) || articles.length === 0) return [];
    const groupsMap = new Map();

    for (const article of articles) {
      const key = article.dateKey || getLocalDateKey(article.publishedAt);
      if (!groupsMap.has(key)) {
        groupsMap.set(key, []);
      }
      groupsMap.get(key).push(article);
    }

    return Array.from(groupsMap.entries()).map(([dateKey, items]) => ({
      dateKey,
      heading: formatDateHeading(dateKey),
      count: items.length,
      articles: items,
    }));
  }
}

export const searchSortService = new SearchSortService();

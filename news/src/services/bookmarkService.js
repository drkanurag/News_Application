import { eventBus, EVENTS } from "../core/eventBus";
import { healthMonitorService } from "./healthMonitorService";

/**
 * Bookmark Persistence Microservice
 *
 * Completely isolated storage service for managing user's saved articles.
 * Uses an in-memory fallback store if localStorage is blocked or corrupted,
 * ensuring bookmark failures never affect the news feed or navigation.
 */

const STORAGE_KEY = "newsmag_saved_articles_v1";

class BookmarkService {
  constructor() {
    this.memoryStore = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return this.memoryStore;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.memoryStore = parsed.filter((item) => item && item.title);
        }
      }
      this.initialized = true;
      healthMonitorService.reportStatus("bookmark-storage-service", {
        status: "HEALTHY",
        message: `${this.memoryStore.length} saved article(s) loaded from isolated storage`,
      });
    } catch (err) {
      this.initialized = true;
      healthMonitorService.reportStatus("bookmark-storage-service", {
        status: "DEGRADED",
        message: `LocalStorage unavailable (${err?.message}); using in-memory session store`,
      });
    }
    return this.memoryStore;
  }

  getAll() {
    if (!this.initialized) this.init();
    return [...this.memoryStore];
  }

  isBookmarked(article) {
    if (!article) return false;
    const key = article.url || article.title;
    return this.getAll().some((item) => (item.url || item.title) === key);
  }

  toggle(article) {
    if (!article) return this.getAll();
    const list = this.getAll();
    const key = article.url || article.title;
    const exists = list.some((item) => (item.url || item.title) === key);

    if (exists) {
      this.memoryStore = list.filter((item) => (item.url || item.title) !== key);
      eventBus.emit(EVENTS.TOAST_NOTIFY, "Removed from your Saved Reading List");
    } else {
      this.memoryStore = [
        { ...article, savedAt: new Date().toISOString() },
        ...list,
      ];
      eventBus.emit(EVENTS.TOAST_NOTIFY, "Article saved to your Reading List");
    }

    this.persist();
    eventBus.emit(EVENTS.BOOKMARKS_UPDATED, this.getAll());
    return this.getAll();
  }

  clearAll() {
    this.memoryStore = [];
    this.persist();
    eventBus.emit(EVENTS.BOOKMARKS_UPDATED, []);
    eventBus.emit(EVENTS.TOAST_NOTIFY, "Cleared all saved articles");
    return [];
  }

  persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryStore));
      healthMonitorService.reportStatus("bookmark-storage-service", {
        status: "HEALTHY",
        message: `Synced ${this.memoryStore.length} saved article(s) to persistent storage`,
      });
    } catch (err) {
      healthMonitorService.reportStatus("bookmark-storage-service", {
        status: "DEGRADED",
        message: `Storage write fallback (${err?.message})`,
      });
    }
  }
}

export const bookmarkService = new BookmarkService();


import { eventBus, EVENTS } from "../core/eventBus";
import { healthMonitorService } from "./healthMonitorService";

/**
 * User Preference Microservice
 *
 * Isolates theme ('dark' | 'light'), country edition, and view layout state.
 */

const THEME_KEY = "newsmag_theme_v1";
const EDITION_KEY = "newsmag_edition_india_v2";
const VIEW_MODE_KEY = "newsmag_viewmode_v1";
const READ_HISTORY_KEY = "newsmag_read_history_v1";
const FONT_SCALE_KEY = "newsmag_font_scale_v1";

class PreferenceService {
  getTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || "dark";
    } catch {
      return "dark";
    }
  }

  setTheme(theme) {
    const validTheme = theme === "light" ? "light" : "dark";
    try {
      document.documentElement.setAttribute("data-bs-theme", validTheme);
      document.documentElement.setAttribute("data-theme", validTheme);
      localStorage.setItem(THEME_KEY, validTheme);
      healthMonitorService.reportStatus("user-preference-service", {
        status: "HEALTHY",
        message: `Theme set to ${validTheme.toUpperCase()} mode`,
      });
    } catch (err) {
      healthMonitorService.reportStatus("user-preference-service", {
        status: "DEGRADED",
        message: `Preference storage warning: ${err?.message}`,
      });
    }
    eventBus.emit(EVENTS.THEME_CHANGED, validTheme);
    return validTheme;
  }

  getCountry() {
    try {
      return localStorage.getItem(EDITION_KEY) || "in";
    } catch {
      return "in";
    }
  }

  setCountry(country) {
    try {
      localStorage.setItem(EDITION_KEY, country);
    } catch {
      // Ignore storage errors
    }
    eventBus.emit(EVENTS.COUNTRY_CHANGED, country);
    return country;
  }

  getViewMode() {
    try {
      return localStorage.getItem(VIEW_MODE_KEY) || "grid";
    } catch {
      return "grid";
    }
  }

  setViewMode(mode) {
    const validMode = mode === "list" ? "list" : "grid";
    try {
      localStorage.setItem(VIEW_MODE_KEY, validMode);
    } catch {
      // Ignore storage errors
    }
    eventBus.emit(EVENTS.VIEW_MODE_CHANGED, validMode);
    return validMode;
  }

  getFontScale() {
    try {
      return localStorage.getItem(FONT_SCALE_KEY) || "md";
    } catch {
      return "md";
    }
  }

  setFontScale(scale) {
    const valid = ["sm", "md", "lg"].includes(scale) ? scale : "md";
    try {
      localStorage.setItem(FONT_SCALE_KEY, valid);
    } catch {
      // Ignore storage errors
    }
    return valid;
  }

  getReadHistory() {
    try {
      const raw = localStorage.getItem(READ_HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  recordArticleRead(article) {
    if (!article || (!article.url && !article.title)) return this.getReadHistory();
    try {
      const prev = this.getReadHistory();
      const key = article.url || article.title;
      const entry = {
        ...article,
        readAt: new Date().toISOString(),
      };
      const updated = [
        entry,
        ...prev.filter((item) => (item.url || item.title) !== key),
      ].slice(0, 50);
      localStorage.setItem(READ_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }

  clearReadHistory() {
    try {
      localStorage.removeItem(READ_HISTORY_KEY);
    } catch {
      // Ignore storage errors
    }
    return [];
  }
}

export const preferenceService = new PreferenceService();



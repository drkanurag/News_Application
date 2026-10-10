import { eventBus, EVENTS } from "../core/eventBus";

/**
 * Telemetry & Microservice Health Registry
 *
 * Tracks live status of every decoupled domain service and UI boundary.
 * Also allows safe fault-simulation testing to prove that a failure in one
 * service never cascades to other services.
 */

const INITIAL_SERVICES = {
  "news-ingestion-service": {
    id: "news-ingestion-service",
    name: "News Ingestion & API Gateway",
    domain: "Data & Network",
    status: "HEALTHY",
    message: "Connected to NewsAPI v2 (top-headlines + everything)",
    updatedAt: new Date().toISOString(),
  },
  "realtime-stream-service": {
    id: "realtime-stream-service",
    name: "Real-Time Live Stream Service",
    domain: "Live Breaking Wire",
    status: "HEALTHY",
    message: "Streaming up-to-the-minute breaking publisher feeds",
    updatedAt: new Date().toISOString(),
  },
  "fallback-catalog-service": {
    id: "fallback-catalog-service",
    name: "Curated Fallback Catalog Service",
    domain: "Resilience & Offline",
    status: "HEALTHY",
    message: "Standby curated articles ready across 7 categories",
    updatedAt: new Date().toISOString(),
  },
  "search-indexing-service": {
    id: "search-indexing-service",
    name: "Search & Ranking Microservice",
    domain: "Query & Filtering",
    status: "HEALTHY",
    message: "Real-time keyword indexing and multi-key sorting active",
    updatedAt: new Date().toISOString(),
  },
  "bookmark-storage-service": {
    id: "bookmark-storage-service",
    name: "Bookmark Persistence Service",
    domain: "Local Storage",
    status: "HEALTHY",
    message: "Isolated storage adapter with schema validation",
    updatedAt: new Date().toISOString(),
  },
  "user-preference-service": {
    id: "user-preference-service",
    name: "Theme & Edition Preference Service",
    domain: "User Experience",
    status: "HEALTHY",
    message: "Managing theme, country edition, and view layout",
    updatedAt: new Date().toISOString(),
  },
  "article-reader-service": {
    id: "article-reader-service",
    name: "Article Quick-Reader Service",
    domain: "Content Presentation",
    status: "HEALTHY",
    message: "Isolated modal reader and excerpt sanitizer",
    updatedAt: new Date().toISOString(),
  },
};

class HealthMonitorService {
  constructor() {
    this.services = { ...INITIAL_SERVICES };
  }

  reportStatus(serviceId, patch) {
    const existing = this.services[serviceId] || {
      id: serviceId,
      name: patch.name || serviceId,
      domain: patch.domain || "UI Micro-Frontend",
    };

    this.services = {
      ...this.services,
      [serviceId]: {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    };

    eventBus.emit(EVENTS.SERVICE_HEALTH_UPDATED, this.getAllStatuses());
  }

  getAllStatuses() {
    return Object.values(this.services);
  }

  getSummary() {
    const list = this.getAllStatuses();
    const healthyCount = list.filter((s) => s.status === "HEALTHY").length;
    const degradedCount = list.filter((s) => s.status === "DEGRADED").length;
    const faultCount = list.filter((s) => s.status === "ISOLATED_FAULT").length;

    return {
      total: list.length,
      healthyCount,
      degradedCount,
      faultCount,
      overall:
        faultCount > 0
          ? "ISOLATED_FAULT"
          : degradedCount > 0
          ? "DEGRADED"
          : "HEALTHY",
    };
  }
}

export const healthMonitorService = new HealthMonitorService();


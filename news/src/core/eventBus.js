/**
 * Fault-Isolated Event Bus (Microservice Message Broker)
 *
 * Ensures that all domain modules communicate via decoupled events.
 * Every subscriber callback executes inside an isolated try/catch block
 * so an error in one module can NEVER crash or block another module.
 */

class IsolatedEventBus {
  constructor() {
    this.listeners = new Map();
    this.eventLog = [];
  }

  /**
   * Subscribe to a domain event.
   * @param {string} eventName
   * @param {Function} handler
   * @returns {Function} Unsubscribe function
   */
  on(eventName, handler) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(handler);

    return () => {
      this.off(eventName, handler);
    };
  }

  /**
   * Unsubscribe a handler from a domain event.
   */
  off(eventName, handler) {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  /**
   * Publish an event to all subscribers with strict error isolation.
   * @param {string} eventName
   * @param {any} payload
   */
  emit(eventName, payload) {
    this.eventLog = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        eventName,
        timestamp: new Date().toISOString(),
      },
      ...this.eventLog.slice(0, 29),
    ];

    const handlers = this.listeners.get(eventName);
    if (!handlers || handlers.size === 0) return;

    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        // Fault isolation: log the error without crashing other subscribers or the publisher
        console.error(
          `[EventBus Fault Isolation] Subscriber failed on "${eventName}":`,
          err
        );
      }
    });
  }

  getRecentEvents() {
    return this.eventLog;
  }
}

export const eventBus = new IsolatedEventBus();

export const EVENTS = {
  CATEGORY_CHANGED: "navigation:category_changed",
  COUNTRY_CHANGED: "navigation:country_changed",
  SEARCH_CHANGED: "search:query_changed",
  SORT_CHANGED: "search:sort_changed",
  VIEW_MODE_CHANGED: "preferences:view_mode_changed",
  THEME_CHANGED: "preferences:theme_changed",
  ACTIVE_TAB_CHANGED: "navigation:tab_changed",
  BOOKMARKS_UPDATED: "bookmarks:updated",
  ARTICLE_SELECTED: "reader:article_selected",
  TOAST_NOTIFY: "ui:toast_notify",
  SERVICE_HEALTH_UPDATED: "telemetry:health_updated",
  REALTIME_PUSH_RECEIVED: "realtime:push_received",
};


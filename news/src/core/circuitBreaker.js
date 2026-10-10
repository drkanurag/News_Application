/**
 * Microservice Circuit Breaker Pattern
 *
 * States:
 * - CLOSED: Normal operation; requests pass through to the upstream service.
 * - OPEN: Upstream has failed/rate-limited; fails fast and routes directly to fallback without waiting.
 * - HALF_OPEN: Cooldown expired; allows a single probe request to test upstream recovery.
 */

export class CircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.failureThreshold = options.failureThreshold || 2;
    this.cooldownMs = options.cooldownMs || 45000;
    this.timeoutMs = options.timeoutMs || 7000;

    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.lastError = null;
  }

  getStatus() {
    if (
      this.state === "OPEN" &&
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime >= this.cooldownMs
    ) {
      this.state = "HALF_OPEN";
    }

    return {
      serviceName: this.serviceName,
      state: this.state,
      failureCount: this.failureCount,
      lastError: this.lastError,
      lastFailureTime: this.lastFailureTime,
    };
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
    this.lastError = null;
  }

  recordFailure(errorMessage) {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();
    this.lastError = errorMessage || "Upstream request failed";
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }

  reset() {
    this.failureCount = 0;
    this.state = "CLOSED";
    this.lastError = null;
    this.lastFailureTime = null;
  }

  /**
   * Execute an async action protected by timeout and circuit breaker state.
   */
  async execute(actionFn, fallbackFn) {
    const current = this.getStatus();

    if (current.state === "OPEN") {
      return fallbackFn({
        reason: `Circuit OPEN for ${this.serviceName} (${this.lastError})`,
        circuitState: this.state,
      });
    }

    try {
      const result = await Promise.race([
        actionFn(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout after ${this.timeoutMs}ms`)),
            this.timeoutMs
          )
        ),
      ]);
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error?.message || "Service error");
      return fallbackFn({
        reason: error?.message || "Service error",
        circuitState: this.state,
      });
    }
  }
}


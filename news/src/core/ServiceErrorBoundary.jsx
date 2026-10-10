import React from "react";
import { healthMonitorService } from "../services/healthMonitorService";

/**
 * Micro-Frontend Service Error Boundary
 *
 * Isolates runtime rendering/lifecycle exceptions to a single microservice UI zone.
 * Changes or failures in one area cannot crash the rest of the application.
 */
class ServiceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    const serviceId = this.props.serviceId || "ui-module";
    const serviceName = this.props.serviceName || "UI Micro-Module";
    console.error(`[ServiceErrorBoundary: ${serviceName}] Isolated fault:`, error, errorInfo);

    healthMonitorService.reportStatus(serviceId, {
      name: serviceName,
      status: "ISOLATED_FAULT",
      message: error?.message || "Component runtime exception isolated",
    });
  }

  handleReset = () => {
    const serviceId = this.props.serviceId || "ui-module";
    const serviceName = this.props.serviceName || "UI Micro-Module";

    healthMonitorService.reportStatus(serviceId, {
      name: serviceName,
      status: "HEALTHY",
      message: "Service recovered via manual reset",
    });

    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const serviceName = this.props.serviceName || "Micro-Frontend Service";
      const compact = this.props.compact;

      if (compact) {
        return (
          <div
            className="service-fault-card-compact p-3 rounded-3 border border-danger border-opacity-50 d-flex align-items-center justify-content-between gap-2 my-2"
            role="alert"
          >
            <div className="small">
              <i className="bi bi-shield-exclamation text-danger me-2"></i>
              <strong>{serviceName}</strong> isolated a fault:{" "}
              <span className="text-secondary">
                {this.state.error?.message || "Render error"}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger flex-shrink-0"
              onClick={this.handleReset}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i>
              Recover
            </button>
          </div>
        );
      }

      return (
        <div
          className="service-fault-card p-4 rounded-4 border border-danger border-opacity-50 my-3 text-center"
          role="alert"
        >
          <div className="mb-2 text-danger fs-3">
            <i className="bi bi-shield-lock-fill"></i>
          </div>
          <h6 className="fw-bold mb-1">
            {serviceName} — Fault Isolated
          </h6>
          <p className="small text-secondary mb-3">
            An issue occurred in this independent module (
            <code>{this.state.error?.message || "Runtime Error"}</code>). All
            other application microservices remain unaffected.
          </p>
          <button
            type="button"
            className="btn btn-sm btn-danger px-3"
            onClick={this.handleReset}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Restart {serviceName}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ServiceErrorBoundary;


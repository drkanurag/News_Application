import { useEffect, useState } from "react";
import { eventBus, EVENTS } from "../core/eventBus";
import { healthMonitorService } from "../services/healthMonitorService";

const ServiceHealthModal = ({ isOpen, onClose }) => {
  const [services, setServices] = useState(() =>
    healthMonitorService.getAllStatuses()
  );
  const [recentEvents, setRecentEvents] = useState(() =>
    eventBus.getRecentEvents()
  );

  useEffect(() => {
    if (!isOpen) return;
    setServices(healthMonitorService.getAllStatuses());
    setRecentEvents(eventBus.getRecentEvents());

    const unsubscribe = eventBus.on(EVENTS.SERVICE_HEALTH_UPDATED, (updated) => {
      setServices(updated);
      setRecentEvents(eventBus.getRecentEvents());
    });

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      unsubscribe();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const summary = healthMonitorService.getSummary();

  const handleSimulateFault = (service) => {
    if (service.status === "ISOLATED_FAULT") {
      healthMonitorService.reportStatus(service.id, {
        status: "HEALTHY",
        message: "Service restored and operating normally",
      });
    } else {
      healthMonitorService.reportStatus(service.id, {
        status: "ISOLATED_FAULT",
        message:
          "Simulated fault injected — isolated from sibling microservices",
      });
    }
  };

  return (
    <div
      className="article-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-health-title"
    >
      <div
        className="article-modal-card p-4"
        style={{ maxWidth: "780px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <span className="section-icon-badge bg-success text-white">
              <i className="bi bi-diagram-3-fill"></i>
            </span>
            <div>
              <h5 id="service-health-title" className="fw-bold mb-0">
                Microservice Architecture & Fault Isolation
              </h5>
              <span className="small text-secondary">
                {summary.healthyCount}/{summary.total} Services Healthy •
                Decoupled via EventBus &amp; Circuit Breakers
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-circle"
            onClick={onClose}
            aria-label="Close service health monitor"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="alert alert-secondary small py-2 px-3 mb-3">
          <i className="bi bi-shield-check text-success me-2"></i>
          <strong>Fault Isolation Guarantee:</strong> Each module runs inside an
          independent <code>ServiceErrorBoundary</code> and communicates via{" "}
          <code>IsolatedEventBus</code> + <code>CircuitBreaker</code>. Changes
          or runtime faults in one service cannot crash any other service.
        </div>

        <div className="row g-3 mb-4">
          {services.map((svc) => {
            const badgeClass =
              svc.status === "HEALTHY"
                ? "bg-success"
                : svc.status === "DEGRADED"
                ? "bg-warning text-dark"
                : "bg-danger";

            return (
              <div className="col-12 col-md-6" key={svc.id}>
                <div className="p-3 rounded-3 border h-100 d-flex flex-column justify-content-between service-tile">
                  <div>
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                      <span className="badge bg-secondary bg-opacity-25 text-body small">
                        {svc.domain}
                      </span>
                      <span className={`badge rounded-pill ${badgeClass}`}>
                        {svc.status}
                      </span>
                    </div>
                    <h6 className="fw-bold mb-1 mt-2">{svc.name}</h6>
                    <p className="small text-secondary mb-2">{svc.message}</p>
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-2">
                    <code className="small text-secondary">{svc.id}</code>
                    <button
                      type="button"
                      className={`btn btn-sm py-0 px-2 ${
                        svc.status === "ISOLATED_FAULT"
                          ? "btn-success"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => handleSimulateFault(svc)}
                    >
                      {svc.status === "ISOLATED_FAULT"
                        ? "Restore Service"
                        : "Test Fault"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {recentEvents.length > 0 && (
          <div className="border-top pt-3">
            <div className="small fw-bold text-uppercase text-secondary mb-2">
              <i className="bi bi-activity me-1"></i>
              Recent EventBus Messages (Decoupled Pub/Sub)
            </div>
            <div
              className="d-flex flex-wrap gap-2"
              style={{ maxHeight: "90px", overflowY: "auto" }}
            >
              {recentEvents.slice(0, 8).map((ev) => (
                <span
                  key={ev.id}
                  className="badge bg-secondary bg-opacity-10 text-body border fw-normal"
                >
                  <code>{ev.eventName}</code>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceHealthModal;


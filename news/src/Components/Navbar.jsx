import { useEffect, useRef, useState } from "react";
import { CATEGORIES, COUNTRIES } from "./fallbackData";
import { eventBus, EVENTS } from "../core/eventBus";
import { healthMonitorService } from "../services/healthMonitorService";
import { newsFeedService } from "../services/newsFeedService";

const Navbar = ({
  category = "general",
  setCategory,
  searchQuery = "",
  setSearchQuery,
  country = "us",
  setCountry,
  theme = "dark",
  onToggleTheme,
  activeView = "feed",
  setActiveView,
  bookmarkCount = 0,
  onOpenHealthModal,
}) => {
  const searchInputRef = useRef(null);
  const [healthSummary, setHealthSummary] = useState(() =>
    healthMonitorService.getSummary()
  );

  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.SERVICE_HEALTH_UPDATED, () => {
      setHealthSummary(healthMonitorService.getSummary());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCategorySelect = (catId) => {
    if (setCategory) setCategory(catId);
    if (setActiveView) setActiveView("feed");
    eventBus.emit(EVENTS.CATEGORY_CHANGED, catId);
    eventBus.emit(EVENTS.ACTIVE_TAB_CHANGED, "feed");
  };

  const handleCountryChange = (newCountry) => {
    if (setCountry) setCountry(newCountry);
    eventBus.emit(EVENTS.COUNTRY_CHANGED, newCountry);
  };

  const handleSearchChange = (value) => {
    if (setSearchQuery) setSearchQuery(value);
    if (activeView !== "feed" && setActiveView) setActiveView("feed");
    eventBus.emit(EVENTS.SEARCH_CHANGED, value);
  };

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const statusColorClass =
    healthSummary.overall === "HEALTHY"
      ? "text-success"
      : healthSummary.overall === "DEGRADED"
      ? "text-warning"
      : "text-danger";

  return (
    <header className="news-header sticky-top">
      {/* Top Utility Bar */}
      <div className="news-topbar py-1 px-3 border-bottom">
        <div className="container-xl d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-3 small">
            <span className="d-inline-flex align-items-center gap-1 fw-medium text-danger">
              <span className="live-dot"></span>
              LIVE EDITION
            </span>
            <span className="text-secondary d-none d-sm-inline">
              <i className="bi bi-calendar3 me-1"></i>
              {todayFormatted}
            </span>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Microservices Health Status Button */}
            {onOpenHealthModal && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                onClick={onOpenHealthModal}
                title="Inspect Microservices Architecture & Fault Isolation"
              >
                <i className={`bi bi-diagram-3-fill ${statusColorClass}`}></i>
                <span className="d-none d-md-inline">Services</span>
                <span className="badge rounded-pill bg-secondary bg-opacity-25 text-body">
                  {healthSummary.healthyCount}/{healthSummary.total}
                </span>
              </button>
            )}

            {/* Country / Edition Selector */}
            <div className="d-flex align-items-center gap-1">
              <label
                htmlFor="country-select"
                className="small text-secondary d-none d-lg-inline mb-0"
              >
                Edition:
              </label>
              <select
                id="country-select"
                className="form-select form-select-sm edition-select"
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                aria-label="Select country edition"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Saved Bookmarks Button */}
            <button
              type="button"
              className={`btn btn-sm ${
                activeView === "bookmarks"
                  ? "btn-warning fw-semibold"
                  : "btn-outline-secondary"
              } d-inline-flex align-items-center gap-1`}
              onClick={() => {
                const nextView =
                  activeView === "bookmarks" ? "feed" : "bookmarks";
                if (setActiveView) setActiveView(nextView);
                eventBus.emit(EVENTS.ACTIVE_TAB_CHANGED, nextView);
              }}
              title="View saved articles"
            >
              <i
                className={`bi ${
                  activeView === "bookmarks"
                    ? "bi-bookmark-fill"
                    : "bi-bookmark"
                }`}
              ></i>
              <span className="d-none d-sm-inline">Saved</span>
              <span className="badge rounded-pill bg-danger ms-1">
                {bookmarkCount}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <i
                className={`bi ${
                  theme === "dark"
                    ? "bi-sun-fill text-warning"
                    : "bi-moon-stars-fill"
                }`}
              ></i>
              <span className="d-none d-md-inline">
                {theme === "dark" ? "Light" : "Dark"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Masthead & Search */}
      <nav className="navbar navbar-expand-lg py-2 px-3">
        <div className="container-xl">
          <a
            className="navbar-brand d-flex align-items-center gap-2 me-4"
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleCategorySelect("general");
              handleSearchChange("");
            }}
          >
            <span className="brand-mark">
              <i className="bi bi-lightning-charge-fill"></i>
            </span>
            <div className="d-flex flex-column">
              <span className="brand-title">
                News<span className="text-danger">Mag</span>
              </span>
              <span className="brand-subtitle">GLOBAL BRIEFING</span>
            </div>
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            {/* Category Pills */}
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1 py-2 py-lg-0">
              {CATEGORIES.map((cat) => {
                const isActive =
                  activeView === "feed" && category === cat.id;
                return (
                  <li className="nav-item" key={cat.id}>
                    <button
                      type="button"
                      className={`nav-link category-pill ${
                        isActive ? "active" : ""
                      }`}
                      onMouseEnter={() =>
                        newsFeedService.prefetchOnHover({
                          category: cat.id,
                          country,
                        })
                      }
                      onClick={() => handleCategorySelect(cat.id)}
                    >
                      <i className={`bi ${cat.icon} me-1`}></i>
                      {cat.label}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Search Input */}
            <form
              className="news-search-form d-flex align-items-center"
              onSubmit={(e) => e.preventDefault()}
              role="search"
            >
              <div className="input-group input-group-sm news-search-group">
                <span className="input-group-text bg-transparent border-end-0">
                  <i className="bi bi-search text-secondary"></i>
                </span>
                <input
                  ref={searchInputRef}
                  type="search"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search headlines, topics... (Press /)"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  aria-label="Search news articles"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0"
                    onClick={() => handleSearchChange("")}
                    aria-label="Clear search"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

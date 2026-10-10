import { useCallback, useEffect, useState } from "react";
import Navbar from "./Components/Navbar";
import NewsBoard from "./Components/NewsBoard";
import ArticleModal from "./Components/ArticleModal";
import ServiceHealthModal from "./Components/ServiceHealthModal";
import ServiceErrorBoundary from "./core/ServiceErrorBoundary";
import { eventBus, EVENTS } from "./core/eventBus";
import { bookmarkService } from "./services/bookmarkService";
import { preferenceService } from "./services/preferenceService";
import { CATEGORIES } from "./Components/fallbackData";
import "./App.css";

const App = () => {
  const [category, setCategory] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [country, setCountry] = useState(() => preferenceService.getCountry());
  const [activeView, setActiveView] = useState("feed");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [theme, setTheme] = useState(() => preferenceService.getTheme());
  const [bookmarks, setBookmarks] = useState(() => bookmarkService.init());

  // Initialize theme via Preference Microservice
  useEffect(() => {
    preferenceService.setTheme(theme);
  }, [theme]);

  // Subscribe to decoupled EventBus notifications
  useEffect(() => {
    const unsubBookmarks = eventBus.on(EVENTS.BOOKMARKS_UPDATED, (updated) => {
      setBookmarks(updated);
    });
    const unsubToast = eventBus.on(EVENTS.TOAST_NOTIFY, (msg) => {
      setToastMessage(msg);
    });
    const unsubArticle = eventBus.on(EVENTS.ARTICLE_SELECTED, (article) => {
      setSelectedArticle(article);
    });

    return () => {
      unsubBookmarks();
      unsubToast();
      unsubArticle();
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      return preferenceService.setTheme(next);
    });
  }, []);

  const handleSetCountry = useCallback((newCountry) => {
    setCountry(preferenceService.setCountry(newCountry));
  }, []);

  const handleToggleBookmark = useCallback((article) => {
    bookmarkService.toggle(article);
  }, []);

  const handleClearBookmarks = useCallback(() => {
    bookmarkService.clearAll();
  }, []);

  const isSelectedBookmarked = selectedArticle
    ? bookmarkService.isBookmarked(selectedArticle)
    : false;

  return (
    <div
      id="top"
      className={`app-shell theme-${theme} min-vh-100 d-flex flex-column`}
    >
      {/* Isolated Micro-Frontend Zone 1: Navigation & Masthead Service */}
      <ServiceErrorBoundary
        serviceId="navigation-masthead-module"
        serviceName="Navigation & Search Masthead Service"
      >
        <Navbar
          category={category}
          setCategory={setCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          country={country}
          setCountry={handleSetCountry}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          activeView={activeView}
          setActiveView={setActiveView}
          bookmarkCount={bookmarks.length}
          onOpenHealthModal={() => setIsHealthModalOpen(true)}
        />
      </ServiceErrorBoundary>

      {/* Isolated Micro-Frontend Zone 2: News Feed & Discovery Board */}
      <div className="flex-grow-1">
        <ServiceErrorBoundary
          serviceId="news-board-module"
          serviceName="News Feed & Discovery Service"
        >
          <NewsBoard
            category={category}
            setCategory={setCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            country={country}
            activeView={activeView}
            setActiveView={setActiveView}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onClearBookmarks={handleClearBookmarks}
            onSelectArticle={setSelectedArticle}
          />
        </ServiceErrorBoundary>
      </div>

      {/* Isolated Micro-Frontend Zone 3: In-App Article Reader Service */}
      <ServiceErrorBoundary
        serviceId="article-reader-service"
        serviceName="Article Quick-Reader Service"
        onReset={() => setSelectedArticle(null)}
      >
        <ArticleModal
          article={selectedArticle}
          category={category}
          onClose={() => setSelectedArticle(null)}
          isBookmarked={isSelectedBookmarked}
          onToggleBookmark={handleToggleBookmark}
        />
      </ServiceErrorBoundary>

      {/* Isolated Micro-Frontend Zone 4: Microservices Health & Telemetry Inspector */}
      <ServiceErrorBoundary
        serviceId="telemetry-health-modal"
        serviceName="Microservice Health Inspector"
        onReset={() => setIsHealthModalOpen(false)}
      >
        <ServiceHealthModal
          isOpen={isHealthModalOpen}
          onClose={() => setIsHealthModalOpen(false)}
        />
      </ServiceErrorBoundary>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="news-toast shadow-lg" role="status" aria-live="polite">
          <i className="bi bi-bookmark-check-fill text-danger me-2"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Isolated Micro-Frontend Zone 5: Editorial Footer */}
      <ServiceErrorBoundary
        serviceId="editorial-footer-module"
        serviceName="Editorial Footer Service"
        compact
      >
        <footer className="news-footer mt-5 py-4 border-top">
          <div className="container-xl">
            <div className="row g-4 align-items-center justify-content-between">
              <div className="col-12 col-md-5">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="brand-mark brand-mark-sm">
                    <i className="bi bi-lightning-charge-fill"></i>
                  </span>
                  <span className="fw-bold fs-5">
                    News<span className="text-danger">Mag</span>
                  </span>
                  <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 small">
                    Microservice-Isolated
                  </span>
                </div>
                <p className="text-secondary small mb-0">
                  Architected with fault-isolated microservices, Circuit Breaker
                  failover, and decoupled EventBus messaging so changes or
                  errors in any module never impact sibling services.
                </p>
              </div>

              <div className="col-12 col-md-7">
                <div className="d-flex flex-wrap justify-content-md-end gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`btn btn-sm ${
                        category === cat.id && activeView === "feed"
                          ? "btn-danger"
                          : "btn-outline-secondary"
                      } rounded-pill`}
                      onClick={() => {
                        setCategory(cat.id);
                        setActiveView("feed");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-4 pt-3 border-top small text-secondary">
              <span>
                © {new Date().getFullYear()} NewsMag Editorial. Press{" "}
                <kbd className="px-1 py-0">/</kbd> to search or{" "}
                <kbd className="px-1 py-0">Esc</kbd> to close modals.
              </span>
              <div className="d-flex align-items-center gap-3">
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-secondary text-decoration-none"
                  onClick={() => setIsHealthModalOpen(true)}
                >
                  <i className="bi bi-diagram-3 me-1"></i>
                  Service Health Console
                </button>
                <a
                  href="#top"
                  className="text-decoration-none text-secondary d-inline-flex align-items-center gap-1"
                >
                  Back to top <i className="bi bi-arrow-up-circle"></i>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </ServiceErrorBoundary>
    </div>
  );
};

export default App;

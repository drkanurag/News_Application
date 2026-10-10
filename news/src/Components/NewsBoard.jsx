import { useCallback, useEffect, useMemo, useState } from "react";
import NewsItem from "./NewsItem";
import SubjectExplorer from "./SubjectExplorer";
import ServiceErrorBoundary from "../core/ServiceErrorBoundary";
import { newsFeedService } from "../services/newsFeedService";
import { liveStreamService } from "../services/liveStreamService";
import { searchSortService } from "../services/searchSortService";
import { preferenceService } from "../services/preferenceService";
import { intelligenceService } from "../services/intelligenceService";
import { audioBriefingService } from "../services/audioBriefingService";
import {
  CATEGORIES,
  CATEGORY_FALLBACK_IMAGES,
  COUNTRIES,
  DATE_PRESETS,
  NEWS_SUBJECTS,
  estimateReadingTime,
  formatExactDateTime,
  formatRelativeTime,
  getLocalDateKey,
} from "./fallbackData";

const PAGE_SIZE = 12;

const MACRO_MARKET_PULSE = [
  { label: "🇮🇳 NIFTY 50", val: "25,142.80", chg: "+0.68%", up: true, q: "Nifty" },
  { label: "🇮🇳 SENSEX", val: "82,190.45", chg: "+0.62%", up: true, q: "Sensex" },
  { label: "💱 USD / INR", val: "₹83.96", chg: "-0.04%", up: true, q: "Rupee" },
  { label: "🏦 RBI REPO", val: "6.50%", chg: "Steady", up: true, q: "RBI" },
  { label: "🛢️ BRENT CRUDE", val: "$77.40", chg: "-1.15%", up: false, q: "Oil" },
  { label: "🪙 GOLD 24K (10g)", val: "₹76,450", chg: "+0.45%", up: true, q: "Gold" },
  { label: "🌐 US FED RATE", val: "4.75–5.00%", chg: "-50 bps", up: true, q: "Fed" },
];

const NewsBoard = ({
  category = "general",
  setCategory,
  searchQuery = "",
  setSearchQuery,
  country = "in",
  activeView = "feed",
  setActiveView,
  bookmarks = [],
  onToggleBookmark,
  onClearBookmarks,
  onSelectArticle,
}) => {
  const [activeSubject, setActiveSubject] = useState(NEWS_SUBJECTS[0]);
  const [scopeFilter, setScopeFilter] = useState("all");
  const [publisherFilter, setPublisherFilter] = useState("all");
  const [audioState, setAudioState] = useState(() =>
    audioBriefingService.getState()
  );
  const [articles, setArticles] = useState(
    () => newsFeedService.getInstantSnapshot({ category, country }).articles
  );
  const [loading, setLoading] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);
  const [isFallback, setIsFallback] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(() =>
    new Date().toISOString()
  );
  const [autoSync, setAutoSync] = useState(true);
  const [realtimePulseCount, setRealtimePulseCount] = useState(0);
  const [newStoriesArrived, setNewStoriesArrived] = useState(0);

  // Date & Timeline state
  const [datePreset, setDatePreset] = useState("all");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState(() =>
    getLocalDateKey(new Date().toISOString())
  );
  const [groupByDate, setGroupByDate] = useState(true);

  const [sortBy, setSortBy] = useState("publishedAt");
  const [viewMode, setViewMode] = useState(() =>
    preferenceService.getViewMode()
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [heroImgError, setHeroImgError] = useState(false);

  useEffect(() => {
    const unsub = audioBriefingService.subscribe(setAudioState);
    return unsub;
  }, []);

  const currentCategoryMeta = useMemo(
    () => CATEGORIES.find((c) => c.id === category) || CATEGORIES[0],
    [category]
  );

  const currentCountryMeta = useMemo(
    () => COUNTRIES.find((c) => c.code === country) || COUNTRIES[0],
    [country]
  );

  const isArticleBookmarked = useCallback(
    (article) => {
      if (!article) return false;
      const key = article.url || article.title;
      return bookmarks.some((b) => (b.url || b.title) === key);
    },
    [bookmarks]
  );

  const fetchNews = useCallback(
    async (forceRefresh = false, silent = false) => {
      setHeroImgError(false);

      const bounds = searchSortService.resolveDateBounds(
        datePreset,
        customFromDate,
        customToDate
      );

      // 1. Instant 0ms Snapshot from L1/L2 Cache or Seed (Zero wait time!)
      if (!silent) {
        const snapshot = newsFeedService.getInstantSnapshot({
          category,
          country,
          fromDate: bounds.fromKey,
          toDate: bounds.toKey,
          remoteSearchQuery: activeSubject?.query || "",
        });
        if (snapshot?.articles?.length > 0) {
          setArticles(snapshot.articles);
          setLatencyMs(snapshot.latencyMs ?? 0);
          setLoading(false);
        } else {
          setLoading(true);
        }
      }

      setIsRevalidating(true);

      // 2. Progressive First-Responder Streaming
      const result = await newsFeedService.getHeadlines({
        category,
        country,
        fromDate: bounds.fromKey,
        toDate: bounds.toKey,
        remoteSearchQuery: activeSubject?.query || "",
        forceRefresh,
        onPartialUpdate: (partial) => {
          if (partial?.articles?.length > 0) {
            setArticles(partial.articles);
            setIsFallback(false);
            setLatencyMs(partial.latencyMs ?? 0);
            setLastSyncedAt(partial.lastSyncedAt || new Date().toISOString());
            setLoading(false);
          }
        },
      });

      setArticles(result.articles || []);
      setIsFallback(Boolean(result.isFallback));
      setStatusMessage(result.statusMessage || "");
      setLatencyMs(result.latencyMs ?? 0);
      setLastSyncedAt(result.lastSyncedAt || new Date().toISOString());
      setLoading(false);
      setIsRevalidating(false);
    },
    [category, country, datePreset, customFromDate, customToDate, activeSubject]
  );

  useEffect(() => {
    fetchNews(false, false);
    setVisibleCount(PAGE_SIZE);
  }, [fetchNews]);

  // Continuous Real-Time Global Stream Subscription (SSE /api/live-stream + 10s Live Wire Delta Poller)
  useEffect(() => {
    if (!autoSync || activeView !== "feed") return;

    const unsubscribe = liveStreamService.subscribeToRealtimePush({
      category,
      country,
      query: activeSubject?.query || "",
      onRealtimeArticles: (incomingArticles, meta) => {
        setArticles((prev) => {
          const { articles: merged, newCount } =
            newsFeedService.mergeRealtimeArticles(prev, incomingArticles, {
              category,
              country,
              remoteSearchQuery: activeSubject?.query || "",
            });
          if (newCount > 0) {
            setNewStoriesArrived((c) => c + newCount);
          }
          return merged;
        });
        setRealtimePulseCount((c) => c + 1);
        setLastSyncedAt(meta?.lastSyncedAt || new Date().toISOString());
        setIsFallback(false);
      },
    });

    return unsubscribe;
  }, [autoSync, activeView, category, country, activeSubject]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    searchQuery,
    activeView,
    sortBy,
    datePreset,
    customFromDate,
    customToDate,
    activeSubject,
  ]);

  const handleViewModeChange = (mode) => {
    const updated = preferenceService.setViewMode(mode);
    setViewMode(updated);
  };

  // Source list: either live/fallback feed or saved bookmarks
  const baseList = activeView === "bookmarks" ? bookmarks : articles;

  const indiaStoryCount = useMemo(
    () => baseList.filter((a) => a.scope === "INDIA").length,
    [baseList]
  );
  const macroStoryCount = useMemo(
    () => baseList.filter((a) => a.scope !== "INDIA").length,
    [baseList]
  );

  const trendingTopics = useMemo(
    () => intelligenceService.extractTrendingTopics(baseList, 8),
    [baseList]
  );

  const publishersList = useMemo(
    () => intelligenceService.extractPublishers(baseList),
    [baseList]
  );

  // Delegated to isolated Search, Date & Ranking Microservice
  const filteredArticles = useMemo(() => {
    let scoped =
      scopeFilter === "all"
        ? baseList
        : baseList.filter((a) =>
            scopeFilter === "INDIA"
              ? a.scope === "INDIA"
              : a.scope !== "INDIA"
          );

    if (publisherFilter !== "all") {
      scoped = scoped.filter(
        (a) => (a.source?.name || "News Wire") === publisherFilter
      );
    }

    return searchSortService.queryAndSort(scoped, {
      searchQuery,
      sortBy,
      datePreset,
      customFromDate,
      customToDate,
    });
  }, [
    baseList,
    scopeFilter,
    publisherFilter,
    searchQuery,
    sortBy,
    datePreset,
    customFromDate,
    customToDate,
  ]);

  const showHero =
    activeView === "feed" &&
    !loading &&
    filteredArticles.length > 0 &&
    !searchQuery.trim() &&
    publisherFilter === "all" &&
    datePreset === "all";

  const heroArticle = showHero ? filteredArticles[0] : null;
  const remainingArticles = showHero
    ? filteredArticles.slice(1)
    : filteredArticles;
  const displayedArticles = remainingArticles.slice(0, visibleCount);

  // Group displayed articles by date when groupByDate is enabled
  const dateGroups = useMemo(
    () =>
      groupByDate
        ? searchSortService.groupArticlesByDate(displayedArticles)
        : [],
    [groupByDate, displayedArticles]
  );

  const heroFallbackImg =
    CATEGORY_FALLBACK_IMAGES[heroArticle?.category || category] ||
    CATEGORY_FALLBACK_IMAGES.general;

  const formattedSyncTime = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  return (
    <main className="news-board-container container-xl py-4">
      {/* Isolated Micro-Module: India & Global Macro Market Pulse Strip */}
      {activeView === "feed" && (
        <ServiceErrorBoundary
          serviceId="macro-market-pulse-module"
          serviceName="India & Global Macro Market Pulse Service"
          compact
        >
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 p-2 px-3 rounded-3 border bg-body-tertiary">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge bg-dark border border-secondary border-opacity-50 text-uppercase px-2 py-1">
                <i className="bi bi-graph-up-arrow text-danger me-1"></i>
                Macro Pulse
              </span>
              {MACRO_MARKET_PULSE.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="btn btn-sm py-0 px-2 border rounded-pill d-inline-flex align-items-center gap-1 small"
                  onClick={() =>
                    setSearchQuery &&
                    setSearchQuery(searchQuery === item.q ? "" : item.q)
                  }
                  title={`Click to filter news about ${item.q}`}
                >
                  <span className="fw-semibold">{item.label}</span>
                  <span className="text-secondary">{item.val}</span>
                  <span
                    className={`fw-bold ${
                      item.up ? "text-success" : "text-danger"
                    }`}
                  >
                    {item.chg}
                  </span>
                </button>
              ))}
            </div>

            {/* Hands-Free Audio News Anchor Control */}
            {audioBriefingService.isSupported() && (
              <div className="d-flex align-items-center gap-1 ms-auto">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill d-inline-flex align-items-center gap-1 px-3 fw-semibold ${
                    audioState.isPlaying && audioState.mode === "briefing"
                      ? "btn-danger"
                      : "btn-outline-danger"
                  }`}
                  onClick={() =>
                    audioBriefingService.playTopBriefing(filteredArticles, 5)
                  }
                  title="Listen hands-free to the Top 5 India + Macro Global headlines"
                >
                  <i
                    className={`bi ${
                      audioState.isPlaying && audioState.mode === "briefing"
                        ? "bi-stop-circle-fill"
                        : "bi-headphones"
                    }`}
                  ></i>
                  {audioState.isPlaying && audioState.mode === "briefing"
                    ? "Stop Radio Briefing"
                    : "🎧 Listen Top 5 Briefing"}
                </button>
              </div>
            )}
          </div>
        </ServiceErrorBoundary>
      )}

      {/* Isolated Micro-Module: Real-Time Global Breaking Wire & Live Push Ticker */}
      <ServiceErrorBoundary
        serviceId="trending-ticker-module"
        serviceName="Trending Headlines Ticker"
        compact
      >
        {!loading && articles.length > 0 && activeView === "feed" && (
          <div className="trending-ticker-bar mb-3 p-2 px-3 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
              <span className="badge bg-danger text-uppercase px-2 py-1 d-inline-flex align-items-center gap-1 flex-shrink-0">
                <span className="live-dot" style={{ width: "6px", height: "6px", backgroundColor: "#fff" }}></span>
                🇮🇳 INDIA + 🌐 MACRO WIRE
              </span>
              <div className="trending-ticker-track text-truncate">
                {articles.slice(0, 6).map((item, idx) => (
                  <span key={idx} className="trending-ticker-item me-4">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none trending-ticker-link"
                      onClick={() => onSelectArticle && onSelectArticle(item)}
                    >
                      <strong className="text-danger me-1">
                        {item.scope === "INDIA" ? "🇮🇳" : "🌐"} [{formatRelativeTime(item.publishedAt)}]{" "}
                        {item.source?.name || "News"}:
                      </strong>
                      {item.title}
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 small flex-shrink-0">
              {newStoriesArrived > 0 && (
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                  +{newStoriesArrived} New Live
                </span>
              )}
              <span className="badge bg-secondary bg-opacity-10 text-secondary">
                <i className="bi bi-broadcast-pin text-danger me-1"></i>
                Auto-Stream {autoSync ? "ON (8s)" : "PAUSED"} • {formattedSyncTime}
                {realtimePulseCount > 0 ? ` (#${realtimePulseCount})` : ""}
              </span>
            </div>
          </div>
        )}
      </ServiceErrorBoundary>

      {/* Isolated Micro-Module: News Subjects & Topics Chooser */}
      {activeView === "feed" && (
        <ServiceErrorBoundary
          serviceId="subject-explorer-module"
          serviceName="News Subjects & Topic Discovery Service"
          compact
        >
          <SubjectExplorer
            category={category}
            onSelectCategory={setCategory}
            activeSubject={activeSubject}
            onSelectSubject={setActiveSubject}
          />
        </ServiceErrorBoundary>
      )}

      {/* Isolated Micro-Module: Coverage Mix + Publisher Filter + Trending Entities + Date Filter Bar */}
      <ServiceErrorBoundary
        serviceId="date-filter-bar-module"
        serviceName="Date Timeline & Coverage Mix Filter Service"
        compact
      >
        <div className="date-filter-bar p-3 mb-4 rounded-4 border d-flex flex-column gap-3">
          {/* Row 1: Coverage Focus Selector (Mostly India + Macro International) */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-2 border-bottom">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="small fw-semibold text-secondary me-1">
                <i className="bi bi-globe-central-south-asia text-danger me-1"></i>
                Coverage Mix:
              </span>
              <button
                type="button"
                className={`btn btn-sm rounded-pill ${
                  scopeFilter === "all"
                    ? "btn-danger fw-semibold"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setScopeFilter("all")}
              >
                🇮🇳 Mostly India + 🌐 Macro World ({baseList.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill ${
                  scopeFilter === "INDIA"
                    ? "btn-success fw-semibold"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setScopeFilter("INDIA")}
              >
                🇮🇳 India Only ({indiaStoryCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill ${
                  scopeFilter === "MACRO_GLOBAL"
                    ? "btn-info text-dark fw-semibold"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setScopeFilter("MACRO_GLOBAL")}
              >
                🌐 Macro International Only ({macroStoryCount})
              </button>
            </div>
            <span className="small text-secondary d-none d-lg-inline">
              <strong>80% India National/State/Economy</strong> + <strong>20% Macro Global Impact</strong>
            </span>
          </div>

          {/* Row 2: Live Publisher Wire Filter + Trending Entities */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-2 border-bottom">
            <div className="d-flex flex-wrap align-items-center gap-1">
              <span className="small fw-semibold text-secondary me-1">
                <i className="bi bi-building text-danger me-1"></i>
                Publisher:
              </span>
              <button
                type="button"
                className={`btn btn-sm py-0 px-2 rounded-pill ${
                  publisherFilter === "all"
                    ? "btn-dark"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setPublisherFilter("all")}
              >
                All Wires
              </button>
              {publishersList.slice(0, 6).map((pub) => (
                <button
                  key={pub.name}
                  type="button"
                  className={`btn btn-sm py-0 px-2 rounded-pill ${
                    publisherFilter === pub.name
                      ? "btn-danger"
                      : "btn-outline-secondary"
                  }`}
                  onClick={() =>
                    setPublisherFilter(
                      publisherFilter === pub.name ? "all" : pub.name
                    )
                  }
                >
                  {pub.name} ({pub.count})
                </button>
              ))}
            </div>

            {trendingTopics.length > 0 && (
              <div className="d-flex flex-wrap align-items-center gap-1">
                <span className="small fw-semibold text-secondary me-1">
                  <i className="bi bi-fire text-warning me-1"></i>
                  Trending:
                </span>
                {trendingTopics.slice(0, 5).map((t) => (
                  <button
                    key={t.term}
                    type="button"
                    className={`btn btn-sm py-0 px-2 rounded-pill ${
                      searchQuery.toLowerCase() === t.term.toLowerCase()
                        ? "btn-warning text-dark fw-semibold"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() =>
                      setSearchQuery &&
                      setSearchQuery(
                        searchQuery.toLowerCase() === t.term.toLowerCase()
                          ? ""
                          : t.term
                      )
                    }
                  >
                    #{t.term}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Row 3: Real-Time Date Timeline Presets */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="small fw-semibold text-secondary me-1">
                <i className="bi bi-calendar-check text-danger me-1"></i>
                Timeline:
              </span>
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`btn btn-sm rounded-pill ${
                    datePreset === preset.id
                      ? "btn-danger fw-semibold"
                      : "btn-outline-secondary"
                  } d-inline-flex align-items-center gap-1`}
                  onClick={() => setDatePreset(preset.id)}
                >
                  <i className={`bi ${preset.icon}`}></i>
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              {datePreset === "custom" && (
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <div className="d-flex align-items-center gap-1">
                    <label htmlFor="from-date" className="small text-secondary">
                      From:
                    </label>
                    <input
                      id="from-date"
                      type="date"
                      className="form-control form-control-sm edition-select"
                      value={customFromDate}
                      onChange={(e) => setCustomFromDate(e.target.value)}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <label htmlFor="to-date" className="small text-secondary">
                      To:
                    </label>
                    <input
                      id="to-date"
                      type="date"
                      className="form-control form-control-sm edition-select"
                      value={customToDate}
                      onChange={(e) => setCustomToDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                className={`btn btn-sm ${
                  groupByDate ? "btn-dark border" : "btn-outline-secondary"
                } d-inline-flex align-items-center gap-1`}
                onClick={() => setGroupByDate((prev) => !prev)}
                title="Group stories under chronological date headers"
              >
                <i className="bi bi-calendar3-range"></i>
                Group by Date: {groupByDate ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </div>
      </ServiceErrorBoundary>

      {/* Feed Header & Controls Toolbar */}
      <div className="news-toolbar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
        <div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            {activeView === "bookmarks" ? (
              <>
                <span className="section-icon-badge bg-warning text-dark">
                  <i className="bi bi-bookmark-star-fill"></i>
                </span>
                <h2 className="section-heading mb-0">
                  Saved <span className="text-danger">Reading List</span>
                </h2>
              </>
            ) : (
              <>
                <span className="section-icon-badge bg-danger text-white">
                  <i className={`bi ${currentCategoryMeta.icon}`}></i>
                </span>
                <h2 className="section-heading mb-0">
                  Real-Time{" "}
                  <span className="text-danger">
                    {currentCategoryMeta.label}
                  </span>
                </h2>
              </>
            )}
            <span className="badge rounded-pill bg-secondary bg-opacity-25 text-body ms-1">
              {filteredArticles.length}{" "}
              {filteredArticles.length === 1 ? "story" : "stories"}
            </span>
          </div>

          <div className="small text-secondary mt-1 d-flex flex-wrap align-items-center gap-2">
            {formattedSyncTime && activeView === "feed" && (
              <span>
                <i className="bi bi-clock-history text-success me-1"></i>
                Last real-time sync: <strong>{formattedSyncTime}</strong>
              </span>
            )}
            {activeView === "feed" && (
              <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
                <i className="bi bi-lightning-charge-fill me-1"></i>
                {latencyMs <= 1 ? "<1ms Instant Cache" : `${latencyMs}ms Stream`}
              </span>
            )}
            {searchQuery.trim() && (
              <span>
                • Keyword:{" "}
                <strong className="text-body">
                  &ldquo;{searchQuery}&rdquo;
                </strong>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 ms-2 text-danger text-decoration-none"
                  onClick={() => setSearchQuery && setSearchQuery("")}
                >
                  Clear filter
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Right Controls: Auto-Sync, Status badge, Refresh, Sort, View Toggle */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          {activeView === "feed" && (
            <div className="d-flex flex-wrap align-items-center gap-2 me-1">
              <button
                type="button"
                className={`btn btn-sm ${
                  autoSync ? "btn-outline-success" : "btn-outline-secondary"
                } d-inline-flex align-items-center gap-1`}
                onClick={() => setAutoSync((prev) => !prev)}
                title="Toggle 60-second automatic real-time news refresh"
              >
                <span
                  className={autoSync ? "live-dot" : ""}
                  style={
                    autoSync
                      ? { backgroundColor: "#10b981", width: "7px", height: "7px" }
                      : {}
                  }
                ></span>
                Auto-Sync: {autoSync ? "ON" : "OFF"}
              </button>

              <span
                className={`badge rounded-pill ${
                  isFallback
                    ? "bg-warning text-dark"
                    : "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                } px-2 py-1 d-inline-flex align-items-center gap-1`}
                title={
                  statusMessage ||
                  "Connected to multi-stream live news wire & NewsAPI"
                }
              >
                <i
                  className={`bi ${
                    isFallback ? "bi-database-check" : "bi-broadcast-pin"
                  }`}
                ></i>
                {isFallback
                  ? "Curated Feed"
                  : `Live (${currentCountryMeta.short})`}
              </span>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                onClick={() => fetchNews(true, false)}
                disabled={loading || isRevalidating}
                title="Sync real-time headlines now"
              >
                <i
                  className={`bi bi-arrow-clockwise ${
                    loading || isRevalidating ? "spin-icon" : ""
                  }`}
                ></i>
                <span className="d-none d-sm-inline">
                  {isRevalidating ? "Streaming..." : "Sync Now"}
                </span>
              </button>
            </div>
          )}

          {activeView === "bookmarks" && bookmarks.length > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
              onClick={onClearBookmarks}
            >
              <i className="bi bi-trash3"></i>
              Clear All
            </button>
          )}

          {/* Sort Select */}
          <select
            className="form-select form-select-sm sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort articles"
          >
            <option value="publishedAt">Sort: Newest First (Real-Time)</option>
            <option value="oldest">Sort: Oldest First (Timeline)</option>
            <option value="title">Sort: Title (A–Z)</option>
            <option value="source">Sort: Publisher</option>
          </select>

          {/* Grid / List View Mode Toggle */}
          <div
            className="btn-group btn-group-sm"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              className={`btn ${
                viewMode === "grid" ? "btn-danger" : "btn-outline-secondary"
              }`}
              onClick={() => handleViewModeChange("grid")}
              title="Grid view"
            >
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </button>
            <button
              type="button"
              className={`btn ${
                viewMode === "list" ? "btn-danger" : "btn-outline-secondary"
              }`}
              onClick={() => handleViewModeChange("list")}
              title="Compact list view"
            >
              <i className="bi bi-list-ul"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Status Banner when using fallback data */}
      {activeView === "feed" && isFallback && statusMessage && !loading && (
        <div
          className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 px-3 mb-4 small rounded-3"
          role="status"
        >
          <div>
            <i className="bi bi-info-circle-fill me-2"></i>
            {statusMessage}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-warning fw-medium py-0 px-2"
            onClick={() => fetchNews(true, false)}
          >
            Retry Live API
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && activeView === "feed" && (
        <div>
          <div className="skeleton-hero rounded-4 mb-4 p-4" />
          <div className="row g-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div className="col-12 col-md-6 col-lg-4" key={idx}>
                <div className="skeleton-card rounded-4 p-3 h-100">
                  <div className="skeleton-img rounded-3 mb-3" />
                  <div className="skeleton-line w-50 mb-2" />
                  <div className="skeleton-line w-100 mb-2" />
                  <div className="skeleton-line w-75 mb-3" />
                  <div className="skeleton-line w-25 mt-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredArticles.length === 0 && (
        <div className="empty-state-box text-center py-5 px-3 my-4 rounded-4">
          <div className="empty-state-icon mb-3">
            <i
              className={`bi ${
                activeView === "bookmarks"
                  ? "bi-bookmark-x"
                  : "bi-calendar-x"
              }`}
            ></i>
          </div>
          <h4 className="fw-bold mb-2">
            {activeView === "bookmarks"
              ? "No Saved Articles Yet"
              : "No Articles Found for Selected Date / Filter"}
          </h4>
          <p
            className="text-secondary mx-auto mb-4"
            style={{ maxWidth: "480px" }}
          >
            {activeView === "bookmarks"
              ? "Bookmark any headline while browsing by clicking its bookmark icon to build your personal reading list."
              : "No stories matched your current date range or keyword filter. Try expanding the timeline to 'All Real-Time' or clearing your search filter."}
          </p>
          {activeView === "bookmarks" ? (
            <button
              type="button"
              className="btn btn-danger px-4"
              onClick={() => setActiveView && setActiveView("feed")}
            >
              Explore Real-Time Stories
            </button>
          ) : (
            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-danger px-4"
                onClick={() => {
                  setDatePreset("all");
                  if (setSearchQuery) setSearchQuery("");
                }}
              >
                Show All Real-Time News
              </button>
            </div>
          )}
        </div>
      )}

      {/* Isolated Micro-Module: Featured Hero Story */}
      <ServiceErrorBoundary
        serviceId="hero-lead-story-module"
        serviceName="Featured Lead Story Module"
      >
        {heroArticle && (
          <section className="hero-story-card mb-5 rounded-4 overflow-hidden shadow-sm">
            <div className="row g-0 align-items-stretch">
              <div className="col-12 col-lg-7 position-relative">
                <div
                  className="hero-media-wrapper h-100"
                  onClick={() =>
                    onSelectArticle && onSelectArticle(heroArticle)
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      onSelectArticle && onSelectArticle(heroArticle);
                  }}
                >
                  <img
                    src={
                      heroImgError || !heroArticle.urlToImage
                        ? heroFallbackImg
                        : heroArticle.urlToImage
                    }
                    alt={heroArticle.title}
                    className="hero-media-img"
                    onError={() => setHeroImgError(true)}
                  />
                  <div className="hero-media-overlay" />
                  <span className="hero-featured-badge badge bg-danger px-3 py-2">
                    <i className="bi bi-broadcast me-1"></i>
                    LATEST BREAKING LEAD
                  </span>
                </div>
              </div>

              <div className="col-12 col-lg-5 d-flex flex-column justify-content-between p-4 p-xl-5">
                <div>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                    <span className="badge rounded-pill bg-danger bg-opacity-10 text-danger fw-semibold px-3 py-1">
                      {heroArticle.source?.name || "Top Source"}
                    </span>
                    <span className="text-secondary small fw-medium">
                      <i className="bi bi-calendar3 text-danger me-1"></i>
                      {formatExactDateTime(heroArticle.publishedAt)}
                    </span>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary">
                      {formatRelativeTime(heroArticle.publishedAt)} •{" "}
                      {estimateReadingTime(heroArticle)}
                    </span>
                  </div>

                  <h3
                    className="hero-story-title mb-3"
                    onClick={() =>
                      onSelectArticle && onSelectArticle(heroArticle)
                    }
                    role="button"
                  >
                    {heroArticle.title}
                  </h3>

                  <p className="hero-story-desc text-secondary mb-4">
                    {heroArticle.description ||
                      "Click below to read the full breaking coverage and analysis from our editorial partner."}
                  </p>
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-danger d-inline-flex align-items-center gap-2 px-3"
                    onClick={() =>
                      onSelectArticle && onSelectArticle(heroArticle)
                    }
                  >
                    <i className="bi bi-book-half"></i>
                    Quick Read
                  </button>

                  <a
                    href={heroArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
                  >
                    Full Article
                    <i className="bi bi-arrow-up-right"></i>
                  </a>

                  <button
                    type="button"
                    className={`btn ms-auto ${
                      isArticleBookmarked(heroArticle)
                        ? "btn-warning"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() =>
                      onToggleBookmark && onToggleBookmark(heroArticle)
                    }
                    title={
                      isArticleBookmarked(heroArticle)
                        ? "Remove from Saved"
                        : "Save Story"
                    }
                  >
                    <i
                      className={`bi ${
                        isArticleBookmarked(heroArticle)
                          ? "bi-bookmark-fill"
                          : "bi-bookmark"
                      }`}
                    ></i>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </ServiceErrorBoundary>

      {/* Isolated Micro-Module: Articles Grouped by Date OR Flat Grid/List */}
      {!loading && displayedArticles.length > 0 && (
        <>
          {groupByDate ? (
            <div className="date-grouped-timeline">
              {dateGroups.map((group) => (
                <section key={group.dateKey} className="date-group-section mb-5">
                  <div className="date-group-header d-flex align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge rounded-pill bg-danger px-3 py-2">
                        <i className="bi bi-calendar-event me-1"></i>
                        {group.dateKey}
                      </span>
                      <h4 className="fw-bold mb-0 fs-5">{group.heading}</h4>
                    </div>
                    <span className="badge bg-secondary bg-opacity-25 text-body rounded-pill">
                      {group.count} {group.count === 1 ? "article" : "articles"}
                    </span>
                  </div>

                  {viewMode === "list" ? (
                    <div className="news-list-container">
                      {group.articles.map((news, index) => (
                        <ServiceErrorBoundary
                          key={news.url || `${news.title}-${index}`}
                          serviceId={`news-card-${group.dateKey}-${index}`}
                          serviceName="Article Card Item"
                          compact
                        >
                          <NewsItem
                            article={news}
                            title={news.title}
                            description={news.description}
                            src={news.urlToImage}
                            url={news.url}
                            category={category}
                            viewMode="list"
                            isBookmarked={isArticleBookmarked(news)}
                            onToggleBookmark={onToggleBookmark}
                            onSelectArticle={onSelectArticle}
                          />
                        </ServiceErrorBoundary>
                      ))}
                    </div>
                  ) : (
                    <div className="row g-4">
                      {group.articles.map((news, index) => (
                        <div
                          className="col-12 col-sm-6 col-lg-4"
                          key={news.url || `${news.title}-${index}`}
                        >
                          <ServiceErrorBoundary
                            serviceId={`news-card-${group.dateKey}-${index}`}
                            serviceName="Article Card Item"
                            compact
                          >
                            <NewsItem
                              article={news}
                              title={news.title}
                              description={news.description}
                              src={news.urlToImage}
                              url={news.url}
                              category={category}
                              viewMode="grid"
                              isBookmarked={isArticleBookmarked(news)}
                              onToggleBookmark={onToggleBookmark}
                              onSelectArticle={onSelectArticle}
                            />
                          </ServiceErrorBoundary>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          ) : viewMode === "list" ? (
            <div className="news-list-container">
              {displayedArticles.map((news, index) => (
                <ServiceErrorBoundary
                  key={news.url || `${news.title}-${index}`}
                  serviceId={`news-card-${index}`}
                  serviceName="Article Card Item"
                  compact
                >
                  <NewsItem
                    article={news}
                    title={news.title}
                    description={news.description}
                    src={news.urlToImage}
                    url={news.url}
                    category={category}
                    viewMode="list"
                    isBookmarked={isArticleBookmarked(news)}
                    onToggleBookmark={onToggleBookmark}
                    onSelectArticle={onSelectArticle}
                  />
                </ServiceErrorBoundary>
              ))}
            </div>
          ) : (
            <div className="row g-4">
              {displayedArticles.map((news, index) => (
                <div
                  className="col-12 col-sm-6 col-lg-4"
                  key={news.url || `${news.title}-${index}`}
                >
                  <ServiceErrorBoundary
                    serviceId={`news-card-${index}`}
                    serviceName="Article Card Item"
                    compact
                  >
                    <NewsItem
                      article={news}
                      title={news.title}
                      description={news.description}
                      src={news.urlToImage}
                      url={news.url}
                      category={category}
                      viewMode="grid"
                      isBookmarked={isArticleBookmarked(news)}
                      onToggleBookmark={onToggleBookmark}
                      onSelectArticle={onSelectArticle}
                    />
                  </ServiceErrorBoundary>
                </div>
              ))}
            </div>
          )}

          {/* Load More Pagination */}
          {visibleCount < remainingArticles.length && (
            <div className="text-center mt-5">
              <button
                type="button"
                className="btn btn-outline-danger px-4 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-2"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                <i className="bi bi-plus-circle"></i>
                Load More Stories ({remainingArticles.length - visibleCount}{" "}
                remaining)
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default NewsBoard;

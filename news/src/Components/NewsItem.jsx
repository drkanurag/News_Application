import { useEffect, useMemo, useState } from "react";
import {
  CATEGORY_FALLBACK_IMAGES,
  estimateReadingTime,
  formatExactDateTime,
  formatRelativeTime,
} from "./fallbackData";
import { intelligenceService } from "../services/intelligenceService";
import { audioBriefingService } from "../services/audioBriefingService";

const NewsItem = ({
  article,
  title,
  description,
  src,
  url,
  category = "general",
  viewMode = "grid",
  isBookmarked = false,
  isRead = false,
  onToggleBookmark,
  onSelectArticle,
}) => {
  const item = article || {
    title,
    description,
    urlToImage: src,
    url,
    category,
  };

  const fallbackImg =
    CATEGORY_FALLBACK_IMAGES[item.category || category] ||
    CATEGORY_FALLBACK_IMAGES.general;

  const [imgSrc, setImgSrc] = useState(item.urlToImage || fallbackImg);
  const [audioState, setAudioState] = useState(() =>
    audioBriefingService.getState()
  );

  useEffect(() => {
    setImgSrc(item.urlToImage || fallbackImg);
  }, [item.urlToImage, fallbackImg]);

  useEffect(() => {
    const unsub = audioBriefingService.subscribe(setAudioState);
    return unsub;
  }, []);

  const safeTitle =
    item.title && item.title !== "[Removed]"
      ? item.title
      : "Developing News Story";
  const safeDescription =
    item.description && item.description !== "[Removed]"
      ? item.description
      : "Click 'Quick Preview' or 'Read Full Story' to explore complete coverage and live updates from the newsroom.";

  const sourceName = item.source?.name || "News Desk";
  const authorName =
    item.author && !item.author.startsWith("http")
      ? item.author.split(",")[0]
      : null;
  const timeAgo = formatRelativeTime(item.publishedAt);
  const exactDateTime = formatExactDateTime(item.publishedAt);
  const readTime = estimateReadingTime(item);

  const impact = useMemo(
    () => intelligenceService.analyzeImpact(item),
    [item]
  );
  const sentiment = useMemo(
    () => intelligenceService.analyzeSentiment(item),
    [item]
  );

  const isThisSpeaking =
    audioState.isPlaying && audioState.activeTitle === item.title;

  if (viewMode === "list") {
    return (
      <article className="news-list-card p-3 mb-3">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-sm-4 col-md-3">
            <div
              className="news-list-img-wrapper"
              onClick={() => onSelectArticle && onSelectArticle(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelectArticle && onSelectArticle(item);
              }}
            >
              <img
                src={imgSrc}
                alt={safeTitle}
                className="news-list-img"
                loading="lazy"
                onError={() => setImgSrc(fallbackImg)}
              />
              <span className="news-source-pill">{sourceName}</span>
            </div>
          </div>

          <div className="col-12 col-sm-8 col-md-9">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
              <div className="d-flex flex-wrap align-items-center gap-2 small text-secondary">
                {item.scope === "INDIA" ? (
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                    🇮🇳 INDIA
                  </span>
                ) : (
                  <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                    🌐 MACRO GLOBAL
                  </span>
                )}
                {item.isJustIn && (
                  <span className="badge bg-danger text-white">
                    <i className="bi bi-lightning-charge-fill me-1"></i>JUST IN
                  </span>
                )}
                <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">
                  <i className={`bi ${impact.icon} me-1`}></i>
                  {impact.label}
                </span>
                {isRead && (
                  <span className="badge bg-secondary bg-opacity-25 text-secondary">
                    <i className="bi bi-check2-all me-1"></i>Read
                  </span>
                )}
                <span className="fw-medium text-body" title={exactDateTime}>
                  <i className="bi bi-calendar3 me-1 text-danger"></i>
                  {exactDateTime}
                </span>
                <span>({timeAgo})</span>
                <span>•</span>
                <span>{readTime}</span>
                {authorName && (
                  <>
                    <span className="d-none d-md-inline">•</span>
                    <span
                      className="d-none d-md-inline text-truncate"
                      style={{ maxWidth: "180px" }}
                    >
                      {authorName}
                    </span>
                  </>
                )}
              </div>

              <div className="d-flex align-items-center gap-1">
                {audioBriefingService.isSupported() && (
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      isThisSpeaking ? "btn-danger" : "btn-outline-secondary"
                    } rounded-pill px-2 py-0`}
                    onClick={() => audioBriefingService.speakArticle(item)}
                    title="Listen to 60-word executive audio brief"
                  >
                    <i
                      className={`bi ${
                        isThisSpeaking ? "bi-stop-fill" : "bi-volume-up"
                      }`}
                    ></i>
                  </button>
                )}
                {onToggleBookmark && (
                  <button
                    type="button"
                    className={`btn btn-sm news-icon-btn ${
                      isBookmarked ? "bookmarked" : ""
                    }`}
                    onClick={() => onToggleBookmark(item)}
                    aria-label={
                      isBookmarked ? "Remove bookmark" : "Bookmark article"
                    }
                    title={
                      isBookmarked ? "Saved in Bookmarks" : "Save for later"
                    }
                  >
                    <i
                      className={`bi ${
                        isBookmarked ? "bi-bookmark-fill" : "bi-bookmark"
                      }`}
                    ></i>
                  </button>
                )}
              </div>
            </div>

            <h5
              className="news-card-title mb-2"
              onClick={() => onSelectArticle && onSelectArticle(item)}
              role="button"
            >
              {safeTitle}
            </h5>

            <p className="news-card-desc mb-3">
              {safeDescription.length > 160
                ? `${safeDescription.slice(0, 160).trim()}...`
                : safeDescription}
            </p>

            <div className="d-flex flex-wrap align-items-center gap-2">
              {onSelectArticle && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                  onClick={() => onSelectArticle(item)}
                >
                  <i className="bi bi-stars text-danger"></i>
                  Smart Brief & Preview
                </button>
              )}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-danger d-inline-flex align-items-center gap-1"
              >
                Read More
                <i className="bi bi-arrow-up-right"></i>
              </a>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="news-card h-100 d-flex flex-column">
      <div
        className="news-card-media"
        onClick={() => onSelectArticle && onSelectArticle(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSelectArticle && onSelectArticle(item);
        }}
      >
        <img
          src={imgSrc}
          className="news-card-img"
          alt={safeTitle}
          loading="lazy"
          decoding="async"
          onError={() => setImgSrc(fallbackImg)}
        />
        <div className="news-card-media-gradient" />
        <span className="news-source-pill">
          {item.isRealtimeStream && (
            <span
              className="live-dot me-1"
              style={{ width: "6px", height: "6px" }}
            ></span>
          )}
          {item.scope === "INDIA" ? "🇮🇳 " : "🌐 "}
          {sourceName}
        </span>
        {onToggleBookmark && (
          <button
            type="button"
            className={`news-bookmark-floating ${
              isBookmarked ? "bookmarked" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(item);
            }}
            aria-label={isBookmarked ? "Remove bookmark" : "Save article"}
            title={isBookmarked ? "Remove from Saved" : "Save article"}
          >
            <i
              className={`bi ${
                isBookmarked ? "bi-bookmark-fill" : "bi-bookmark"
              }`}
            ></i>
          </button>
        )}
      </div>

      <div className="news-card-body d-flex flex-column flex-grow-1 p-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between text-secondary small mb-2 gap-1">
          <span
            title={exactDateTime}
            className="d-inline-flex flex-wrap align-items-center gap-1"
          >
            {item.scope === "INDIA" ? (
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                🇮🇳 INDIA
              </span>
            ) : (
              <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                🌐 MACRO
              </span>
            )}
            {item.isJustIn && (
              <span className="badge bg-danger text-white">JUST IN</span>
            )}
            <span
              className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25"
              title={impact.whyItMatters}
            >
              <i className={`bi ${impact.icon} me-1`}></i>
              {impact.label}
            </span>
          </span>
          <span className="badge bg-secondary bg-opacity-10 text-secondary fw-normal">
            {timeAgo} • {readTime}
          </span>
        </div>

        <h5
          className="news-card-title mb-2"
          onClick={() => onSelectArticle && onSelectArticle(item)}
          role="button"
          title={safeTitle}
        >
          {safeTitle.length > 88
            ? `${safeTitle.slice(0, 88).trim()}...`
            : safeTitle}
        </h5>

        <p className="news-card-desc flex-grow-1 mb-2">
          {safeDescription.length > 115
            ? `${safeDescription.slice(0, 115).trim()}...`
            : safeDescription}
        </p>

        {/* Subtle Sentiment & Read Indicator Strip */}
        <div className="d-flex align-items-center justify-content-between small text-secondary mb-2">
          <span
            className="text-truncate"
            style={{ fontSize: "0.73rem" }}
            title={exactDateTime}
          >
            <i className="bi bi-clock-history me-1 text-danger"></i>
            {exactDateTime}
          </span>
          <span
            className={`badge rounded-pill ${
              sentiment.id === "positive"
                ? "bg-success bg-opacity-10 text-success"
                : sentiment.id === "alert"
                ? "bg-warning bg-opacity-10 text-warning"
                : "bg-secondary bg-opacity-10 text-secondary"
            }`}
            style={{ fontSize: "0.68rem" }}
          >
            {sentiment.shortLabel}
          </span>
        </div>

        <div className="news-card-footer d-flex align-items-center justify-content-between gap-2 pt-2 border-top mt-auto">
          <div className="d-flex align-items-center gap-1">
            {onSelectArticle && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                onClick={() => onSelectArticle(item)}
                title="View 60-word AI Brief & Quick Preview"
              >
                <i className="bi bi-stars text-danger"></i>
                Brief
              </button>
            )}
            {audioBriefingService.isSupported() && (
              <button
                type="button"
                className={`btn btn-sm ${
                  isThisSpeaking ? "btn-danger" : "btn-outline-secondary"
                } d-inline-flex align-items-center gap-1`}
                onClick={() => audioBriefingService.speakArticle(item)}
                title="Listen to article audio brief"
              >
                <i
                  className={`bi ${
                    isThisSpeaking ? "bi-stop-fill" : "bi-volume-up"
                  }`}
                ></i>
              </button>
            )}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-danger d-inline-flex align-items-center gap-1 ms-auto fw-medium"
          >
            Read More
            <i className="bi bi-arrow-up-right"></i>
          </a>
        </div>
      </div>
    </article>
  );
};

export default NewsItem;

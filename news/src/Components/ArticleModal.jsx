import { useEffect, useMemo, useState } from "react";
import {
  CATEGORY_FALLBACK_IMAGES,
  cleanArticleContent,
  estimateReadingTime,
  formatRelativeTime,
} from "./fallbackData";
import { intelligenceService } from "../services/intelligenceService";
import { audioBriefingService } from "../services/audioBriefingService";
import { preferenceService } from "../services/preferenceService";

const ArticleModal = ({
  article,
  category,
  onClose,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [fontScale, setFontScale] = useState(() =>
    preferenceService.getFontScale()
  );
  const [audioState, setAudioState] = useState(() =>
    audioBriefingService.getState()
  );

  useEffect(() => {
    const unsub = audioBriefingService.subscribe(setAudioState);
    return unsub;
  }, []);

  useEffect(() => {
    if (article) {
      setImgSrc(
        article.urlToImage ||
          CATEGORY_FALLBACK_IMAGES[article.category || category] ||
          CATEGORY_FALLBACK_IMAGES.general
      );
      setCopied(false);
    }
  }, [article, category]);

  useEffect(() => {
    if (!article) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        audioBriefingService.stop();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [article, onClose]);

  const executiveBrief = useMemo(
    () => (article ? intelligenceService.generateExecutiveBrief(article) : null),
    [article]
  );

  if (!article) return null;

  const sourceName = article.source?.name || "News Desk";
  const authorName =
    article.author && !article.author.startsWith("http")
      ? article.author
      : "Editorial Staff";
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recent";

  const isThisPlaying =
    audioState.isPlaying && audioState.activeTitle === article.title;

  const handleFontScale = (scale) => {
    const updated = preferenceService.setFontScale(scale);
    setFontScale(updated);
  };

  const handleCopyLink = async () => {
    if (!article.url) return;
    try {
      await navigator.clipboard.writeText(article.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const shareText = encodeURIComponent(`${article.title} — via NewsMag`);
  const shareUrl = encodeURIComponent(article.url || window.location.href);
  const whatsappUrl = `https://wa.me/?text=${shareText}%20${shareUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;

  const fullText = cleanArticleContent(article.content, article.description);
  const fontSizeStyle =
    fontScale === "lg"
      ? { fontSize: "1.14rem", lineHeight: 1.75 }
      : fontScale === "sm"
      ? { fontSize: "0.92rem", lineHeight: 1.55 }
      : { fontSize: "1.02rem", lineHeight: 1.65 };

  return (
    <div
      className="article-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-article-title"
    >
      <div
        className="article-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="article-modal-media">
          <img
            src={imgSrc}
            alt={article.title || "Article cover"}
            className="article-modal-img"
            onError={() =>
              setImgSrc(
                CATEGORY_FALLBACK_IMAGES[article.category || category] ||
                  CATEGORY_FALLBACK_IMAGES.general
              )
            }
          />
          <div className="article-modal-media-overlay" />
          <button
            type="button"
            className="article-modal-close"
            onClick={onClose}
            aria-label="Close preview"
          >
            <i className="bi bi-x-lg"></i>
          </button>
          <div className="article-modal-badges d-flex flex-wrap gap-2">
            {article.scope === "INDIA" ? (
              <span
                className="badge rounded-pill px-3 py-2 shadow-sm fw-bold"
                style={{
                  background: "rgba(255, 153, 51, 0.94)",
                  color: "#fff",
                }}
              >
                🇮🇳 INDIA NATIONAL
              </span>
            ) : (
              <span
                className="badge rounded-pill px-3 py-2 shadow-sm fw-bold"
                style={{
                  background: "rgba(14, 165, 233, 0.94)",
                  color: "#fff",
                }}
              >
                🌐 MACRO GLOBAL
              </span>
            )}
            <span className="badge rounded-pill bg-danger px-3 py-2 shadow-sm">
              <i className="bi bi-broadcast me-1"></i>
              {sourceName}
            </span>
            <span className="badge rounded-pill bg-dark bg-opacity-75 px-3 py-2">
              <i className="bi bi-clock me-1"></i>
              {estimateReadingTime(article)}
            </span>
          </div>
        </div>

        <div className="article-modal-body" style={fontSizeStyle}>
          {/* Top Reader Controls: Author/Date + Font Controls + Audio Listen */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom border-secondary border-opacity-25">
            <div className="d-flex flex-wrap align-items-center gap-2 text-secondary small">
              <span>
                <i className="bi bi-person-circle me-1"></i>
                {authorName}
              </span>
              <span>•</span>
              <span title={publishedDate}>
                <i className="bi bi-calendar3 me-1"></i>
                {publishedDate} ({formatRelativeTime(article.publishedAt)})
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              {/* Audio TTS Listen Button */}
              {audioBriefingService.isSupported() && (
                <button
                  type="button"
                  className={`btn btn-sm ${
                    isThisPlaying ? "btn-danger" : "btn-outline-danger"
                  } rounded-pill d-inline-flex align-items-center gap-1 px-3`}
                  onClick={() => audioBriefingService.speakArticle(article)}
                  title="Listen to article summary with voice synthesis"
                >
                  <i
                    className={`bi ${
                      isThisPlaying ? "bi-stop-circle-fill" : "bi-volume-up-fill"
                    }`}
                  ></i>
                  {isThisPlaying ? "Stop Audio" : "Listen"}
                </button>
              )}

              {/* Reader Font Size Controls */}
              <div
                className="btn-group btn-group-sm"
                role="group"
                aria-label="Reader font size"
              >
                {["sm", "md", "lg"].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`btn ${
                      fontScale === sz
                        ? "btn-secondary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => handleFontScale(sz)}
                    title={`Font size: ${sz.toUpperCase()}`}
                  >
                    {sz === "sm" ? "A-" : sz === "md" ? "A" : "A+"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <h3 id="modal-article-title" className="article-modal-title mb-3">
            {article.title}
          </h3>

          {/* AI 3-Bullet Executive Summary & Macro/India Impact Box */}
          {executiveBrief && (
            <div
              className="p-3 rounded-4 mb-3"
              style={{
                background: "rgba(239, 68, 68, 0.06)",
                border: "1px solid rgba(239, 68, 68, 0.22)",
              }}
            >
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <span className="text-uppercase small fw-bold text-danger d-inline-flex align-items-center gap-1">
                  <i className="bi bi-stars"></i>
                  60-Word Executive Brief & Key Takeaways
                </span>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge rounded-pill text-bg-dark border border-secondary border-opacity-25">
                    <i className={`bi ${executiveBrief.impact.icon} me-1`}></i>
                    {executiveBrief.impact.label}
                  </span>
                  <span
                    className={`badge rounded-pill ${
                      executiveBrief.sentiment.id === "positive"
                        ? "text-bg-success"
                        : executiveBrief.sentiment.id === "alert"
                        ? "text-bg-warning"
                        : "text-bg-secondary"
                    }`}
                  >
                    {executiveBrief.sentiment.label}
                  </span>
                </div>
              </div>
              <ul className="mb-0 ps-3 small" style={{ lineHeight: 1.65 }}>
                {executiveBrief.bullets.map((bullet, idx) => (
                  <li key={idx} className="mb-1">
                    {idx === 2 ? (
                      <>
                        <strong className="text-info">Why It Matters: </strong>
                        {bullet}
                      </>
                    ) : (
                      bullet
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {article.description && (
            <p className="article-modal-lead mb-3">{article.description}</p>
          )}

          {fullText && fullText !== article.description && (
            <div className="article-modal-content-box mb-4">
              <div className="text-uppercase small fw-bold text-danger mb-2">
                <i className="bi bi-journal-text me-1"></i>Story Excerpt
              </div>
              <p className="mb-0">{fullText}</p>
            </div>
          )}

          <div className="article-modal-footer d-flex flex-wrap align-items-center justify-content-between gap-2 pt-3 border-top">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <button
                type="button"
                className={`btn btn-sm ${
                  isBookmarked ? "btn-warning" : "btn-outline-secondary"
                } d-inline-flex align-items-center gap-2`}
                onClick={() => onToggleBookmark(article)}
              >
                <i
                  className={`bi ${
                    isBookmarked ? "bi-bookmark-fill" : "bi-bookmark"
                  }`}
                ></i>
                {isBookmarked ? "Saved" : "Save"}
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                onClick={handleCopyLink}
              >
                <i
                  className={`bi ${
                    copied ? "bi-check2-circle text-success" : "bi-link-45deg"
                  }`}
                ></i>
                {copied ? "Copied!" : "Copy Link"}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                title="Share on WhatsApp"
              >
                <i className="bi bi-whatsapp"></i>
                WhatsApp
              </a>

              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
                title="Share on X (Twitter)"
              >
                <i className="bi bi-twitter-x"></i>
                Post
              </a>

              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                title="Share on LinkedIn"
              >
                <i className="bi bi-linkedin"></i>
              </a>
            </div>

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-danger d-inline-flex align-items-center gap-2 px-4 fw-semibold"
            >
              Read Full Story at Source
              <i className="bi bi-box-arrow-up-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;

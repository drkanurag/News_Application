import { useState } from "react";
import { CATEGORIES, NEWS_SUBJECTS } from "./fallbackData";
import { newsFeedService } from "../services/newsFeedService";

const CUSTOM_SUBJECTS_KEY = "newsmag_custom_subjects_v1";

const SubjectExplorer = ({
  category = "general",
  onSelectCategory,
  activeSubject,
  onSelectSubject,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [customInput, setCustomInput] = useState("");
  const [customSubjects, setCustomSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_SUBJECTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allSubjects = [...NEWS_SUBJECTS, ...customSubjects];

  const handleAddCustomSubject = (e) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;

    const newSubject = {
      id: `custom-${Date.now()}`,
      label: trimmed,
      icon: "bi-bookmark-heart-fill",
      category,
      query: trimmed,
      isCustom: true,
    };

    const updated = [...customSubjects, newSubject];
    setCustomSubjects(updated);
    try {
      localStorage.setItem(CUSTOM_SUBJECTS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    setCustomInput("");
    if (onSelectSubject) {
      onSelectSubject(newSubject);
    }
  };

  const handleRemoveCustomSubject = (e, subjectId) => {
    e.stopPropagation();
    const updated = customSubjects.filter((s) => s.id !== subjectId);
    setCustomSubjects(updated);
    try {
      localStorage.setItem(CUSTOM_SUBJECTS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    if (activeSubject?.id === subjectId && onSelectSubject) {
      onSelectSubject(NEWS_SUBJECTS[0]);
    }
  };

  return (
    <section
      className="subject-explorer-section mb-4 p-3 p-md-4 rounded-4 border"
      aria-label="Choose News Subject"
    >
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <span className="section-icon-badge bg-danger text-white">
            <i className="bi bi-compass-fill"></i>
          </span>
          <div>
            <h5 className="fw-bold mb-0">
              Choose Your <span className="text-danger">News Subject</span>
            </h5>
            <span className="small text-secondary">
              Select a broad editorial desk, pick a specialized topic, or add
              your own custom subject
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {activeSubject && activeSubject.id !== "all" && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger rounded-pill"
              onClick={() => onSelectSubject && onSelectSubject(NEWS_SUBJECTS[0])}
            >
              <i className="bi bi-x-circle me-1"></i>
              Reset Subject ({activeSubject.label})
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <i
              className={`bi ${
                isExpanded ? "bi-chevron-up" : "bi-chevron-down"
              } me-1`}
            ></i>
            {isExpanded ? "Hide Subjects" : "Show Subjects"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* 1. Primary Editorial Desks (7 Broad Subjects) */}
          <div className="row g-2 mb-3">
            {CATEGORIES.map((desk) => {
              const isSelected =
                category === desk.id &&
                (!activeSubject || activeSubject.id === "all");

              return (
                <div className="col-6 col-sm-4 col-lg-3 col-xl" key={desk.id}>
                  <button
                    type="button"
                    className={`subject-desk-card w-100 text-start p-3 rounded-3 h-100 ${
                      isSelected ? "active" : ""
                    }`}
                    onMouseEnter={() =>
                      newsFeedService.prefetchOnHover({ category: desk.id })
                    }
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory(desk.id);
                      if (onSelectSubject) onSelectSubject(NEWS_SUBJECTS[0]);
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span
                        className="subject-desk-icon"
                        style={{ color: isSelected ? "#fff" : desk.color }}
                      >
                        <i className={`bi ${desk.icon}`}></i>
                      </span>
                      {category === desk.id && (
                        <span className="badge rounded-pill bg-danger">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="fw-bold small mb-1">{desk.label}</div>
                    <div className="subject-desk-desc text-secondary">
                      {desk.desc}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* 2. Specialized Sub-Topics & Custom Subject Creator */}
          <div className="pt-3 border-top">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <span className="small fw-semibold text-uppercase text-secondary">
                <i className="bi bi-tags-fill text-danger me-1"></i>
                Specialized Subjects &amp; Interests:
              </span>

              {/* Add Custom Subject Form */}
              <form
                className="d-flex align-items-center gap-1"
                onSubmit={handleAddCustomSubject}
              >
                <input
                  type="text"
                  className="form-control form-control-sm edition-select rounded-pill px-3"
                  placeholder="+ Add custom subject (e.g. Formula 1, EV)..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  style={{ minWidth: "240px" }}
                />
                <button
                  type="submit"
                  className="btn btn-sm btn-danger rounded-pill px-3 flex-shrink-0"
                >
                  Add
                </button>
              </form>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-2">
              {allSubjects.map((subj) => {
                const isSubjActive =
                  (activeSubject?.id || "all") === subj.id;

                return (
                  <button
                    key={subj.id}
                    type="button"
                    className={`btn btn-sm rounded-pill d-inline-flex align-items-center gap-1 subject-topic-chip ${
                      isSubjActive ? "btn-danger fw-semibold" : "btn-outline-secondary"
                    }`}
                    onMouseEnter={() =>
                      newsFeedService.prefetchOnHover({
                        category:
                          subj.category && subj.category !== "all"
                            ? subj.category
                            : category,
                        remoteSearchQuery: subj.query || "",
                      })
                    }
                    onClick={() => {
                      if (
                        subj.category &&
                        subj.category !== "all" &&
                        onSelectCategory
                      ) {
                        onSelectCategory(subj.category);
                      }
                      if (onSelectSubject) {
                        onSelectSubject(subj);
                      }
                    }}
                  >
                    <i className={`bi ${subj.icon}`}></i>
                    <span>{subj.label}</span>
                    {subj.isCustom && (
                      <span
                        className="ms-1 opacity-75"
                        onClick={(e) => handleRemoveCustomSubject(e, subj.id)}
                        title="Remove custom subject"
                        role="button"
                      >
                        <i className="bi bi-x-lg"></i>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default SubjectExplorer;


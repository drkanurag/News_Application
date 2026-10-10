/**
 * MICROSERVICE 6: AI Executive Synthesis, Sentiment & Macro Impact Service
 * ------------------------------------------------------------------------
 * Responsibility:
 *   - Generates a 3-bullet "60-Word Executive Brief" for any news article
 *   - Classifies sentiment (Positive/Bullish, Alert/Risk, Neutral/Policy)
 *   - Determines the India & Global Macro Impact lens ("Why It Matters")
 *   - Extracts trending entities/keywords & unique publishers from the active feed
 * Isolation:
 *   - Pure, zero-dependency analytical service. Never mutates external state.
 */

const POSITIVE_PATTERNS =
  /\b(surge|soar|rally|gain|growth|record high|breakthrough|approve|launch|win|victory|boost|upgrade|profit|expansion|recovery|deal signed|innovation|milestone|ceasefire|peace|investment)\b/i;

const ALERT_PATTERNS =
  /\b(crash|plunge|drop|decline|crisis|war|attack|strike|sanction|inflation|deficit|arrest|detain|protest|probe|fraud|ban|warning|threat|killed|injured|disaster|flood|earthquake|tariff|conflict|layoff)\b/i;

const IMPACT_CATEGORIES = [
  {
    id: "markets",
    label: "Markets & Monetary",
    icon: "bi-graph-up-arrow",
    pattern:
      /\b(rbi|sensex|nifty|sebi|rupee|gdp|inflation|fed|interest rate|bond|stock|market|ipo|fiscal|budget|tax|gst|trade|tariff|export|import|crude|oil|gold|imf|world bank|bank)\b/i,
    indiaWhy:
      "Directly impacts Indian capital markets (Sensex/Nifty), rupee liquidity, or domestic fiscal/monetary conditions.",
    macroWhy:
      "Shifts global capital flows, central bank rate expectations, or cross-border commodity pricing.",
  },
  {
    id: "geopolitics",
    label: "Geopolitics & Diplomacy",
    icon: "bi-globe2",
    pattern:
      /\b(summit|brics|g20|un|nato|treaty|sanction|border|defence|military|embassy|bilateral|foreign|diplomat|war|ceasefire|geopolit|jaishankar|modi|white house|kremlin|beijing)\b/i,
    indiaWhy:
      "Shapes India's strategic posture, bilateral trade corridors, and national security calculus.",
    macroWhy:
      "Alters sovereign alliances, global supply chain routing, and international diplomatic balance.",
  },
  {
    id: "tech",
    label: "AI & Frontier Tech",
    icon: "bi-cpu",
    pattern:
      /\b(ai|artificial intelligence|semiconductor|chip|nvidia|openai|cyber|digital|upi|startup|cloud|quantum|5g|6g|software|data|telecom|apple|google|microsoft|meta)\b/i,
    indiaWhy:
      "Accelerates India's digital public infrastructure, IT services ecosystem, or domestic semiconductor mission.",
    macroWhy:
      "Redefines global compute supply chains, enterprise productivity, and sovereign technology competition.",
  },
  {
    id: "science",
    label: "Space, Climate & Science",
    icon: "bi-rocket-takeoff",
    pattern:
      /\b(isro|nasa|space|satellite|rocket|lunar|gaganyaan|climate|solar|hydrogen|emission|quantum|research|genome|vaccine|medical|who|health)\b/i,
    indiaWhy:
      "Advances India's scientific self-reliance, space economy, or public health resilience.",
    macroWhy:
      "Represents a macro-level scientific, energy transition, or global health milestone.",
  },
  {
    id: "governance",
    label: "Governance & Law",
    icon: "bi-bank2",
    pattern:
      /\b(parliament|supreme court|high court|cabinet|ministry|election|bill|constitution|policy|governor|chief minister|nia|ed|cbi|law)\b/i,
    indiaWhy:
      "Influences domestic regulatory frameworks, constitutional jurisprudence, or state-level administration.",
    macroWhy:
      "Reflects institutional policy shifts with broader regulatory implications.",
  },
];

const STOPWORDS = new Set([
  "After", "Before", "About", "Against", "Amid", "Among", "Around", "Between",
  "During", "Under", "Over", "Into", "From", "With", "Without", "Within",
  "Through", "Towards", "Upon", "Says", "Said", "Will", "Would", "Could",
  "Should", "Their", "There", "Where", "When", "While", "What", "Which",
  "First", "Second", "Third", "Latest", "Breaking", "Update", "Watch",
  "Live", "Report", "Reports", "News", "Today", "Yesterday", "Tomorrow",
  "Month", "Year", "Years", "Week", "Days", "More", "Most", "Some", "Many",
  "Other", "Another", "Every", "Each", "High", "Major", "Chief", "State",
  "States", "National", "Global", "World", "International", "Indian", "India",
  "Government", "Minister", "Police", "Court", "People", "Center", "Centre",
]);

class IntelligenceService {
  /**
   * Classifies sentiment of an article.
   */
  analyzeSentiment(article) {
    const text = `${article?.title || ""} ${article?.description || ""}`;
    const posMatches = (text.match(new RegExp(POSITIVE_PATTERNS, "gi")) || []).length;
    const alertMatches = (text.match(new RegExp(ALERT_PATTERNS, "gi")) || []).length;

    if (posMatches > alertMatches) {
      return {
        id: "positive",
        label: "Positive / Constructive",
        shortLabel: "Positive",
        icon: "bi-arrow-up-right-circle-fill",
        badgeClass: "sentiment-positive",
      };
    }
    if (alertMatches > posMatches) {
      return {
        id: "alert",
        label: "High Alert / Risk Watch",
        shortLabel: "Risk Watch",
        icon: "bi-exclamation-triangle-fill",
        badgeClass: "sentiment-alert",
      };
    }
    return {
      id: "neutral",
      label: "Policy / Analytical",
      shortLabel: "Analytical",
      icon: "bi-Compass",
      badgeClass: "sentiment-neutral",
    };
  }

  /**
   * Determines the domain impact lens and "Why It Matters" explanation.
   */
  analyzeImpact(article) {
    const text = `${article?.title || ""} ${article?.description || ""}`;
    const isIndia = article?.scope === "INDIA";

    for (const cat of IMPACT_CATEGORIES) {
      if (cat.pattern.test(text)) {
        return {
          id: cat.id,
          label: cat.label,
          icon: cat.icon,
          whyItMatters: isIndia ? cat.indiaWhy : cat.macroWhy,
        };
      }
    }

    return {
      id: "general",
      label: isIndia ? "India National Desk" : "Global Macro Watch",
      icon: isIndia ? "bi-flag-fill" : "bi-globe-americas",
      whyItMatters: isIndia
        ? "Key national development tracked across major Indian editorial desks."
        : "Macro-level international development with cross-border strategic relevance.",
    };
  }

  /**
   * Generates a 3-bullet executive brief + metadata for an article.
   */
  generateExecutiveBrief(article) {
    if (!article) return null;
    const title = (article.title || "").trim();
    const desc = (article.description || "").trim();
    const source = article.source?.name || "Wire Desk";
    const isIndia = article.scope === "INDIA";
    const sentiment = this.analyzeSentiment(article);
    const impact = this.analyzeImpact(article);

    // Split description into clean sentences
    const cleanDesc = desc
      .replace(/^Live India Desk \([^)]+\):\s*/i, "")
      .replace(/^Global Macro Briefing \([^)]+\):\s*/i, "")
      .replace(/Click to read complete real-time coverage\.?/i, "")
      .trim();

    const sentences = cleanDesc
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.toLowerCase() !== title.toLowerCase());

    const bullet1 = title.endsWith(".") ? title : `${title}.`;
    const bullet2 =
      sentences[0] ||
      `Reported live by ${source} under ${isIndia ? "India National Coverage" : "Global Macro Intelligence"}.`;
    const bullet3 = impact.whyItMatters;

    return {
      bullets: [bullet1, bullet2, bullet3],
      sentiment,
      impact,
      scopeLabel: isIndia ? "🇮🇳 India National Priority" : "🌐 Macro-Level International",
    };
  }

  /**
   * Extracts top trending entities/keywords from the current article list.
   */
  extractTrendingTopics(articles = [], limit = 8) {
    const counts = new Map();

    const PRIORITY_TERMS = [
      "RBI", "Sensex", "Nifty", "ISRO", "Parliament", "Supreme Court",
      "Modi", "Delhi", "Mumbai", "Bengaluru", "AI", "Semiconductor",
      "Crude Oil", "Tariffs", "BRICS", "Fed", "Inflation", "Rupee",
      "Defense", "Cricket", "Startups", "Climate",
    ];

    for (const article of articles) {
      const text = `${article.title || ""} ${article.description || ""}`;
      for (const term of PRIORITY_TERMS) {
        const regex = new RegExp(`\\b${term}\\b`, "i");
        if (regex.test(text)) {
          counts.set(term, (counts.get(term) || 0) + 2);
        }
      }

      // Also extract capitalized multi-letter proper nouns from titles
      const words = (article.title || "").match(/\b[A-Z][a-zA-Z]{3,14}\b/g) || [];
      for (const word of words) {
        if (STOPWORDS.has(word)) continue;
        counts.set(word, (counts.get(word) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([term, count]) => ({ term, count }));
  }

  /**
   * Extracts unique publishers with article counts from the current feed.
   */
  extractPublishers(articles = []) {
    const map = new Map();
    for (const article of articles) {
      const name = article?.source?.name || "News Wire";
      map.set(name, (map.get(name) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }
}

export const intelligenceService = new IntelligenceService();
export default intelligenceService;


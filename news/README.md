# 🇮🇳 NewsMag — Microservice-Architected Real-Time News Application

## 🌐 Direct Working Website Links (Click Any Link Below to Launch Instantly)

[![Open Live Working Website Online](https://img.shields.io/badge/%F0%9F%9A%80_CLICK_HERE_TO_OPEN_LIVE_WEBSITE-Works_Directly_in_Browser-ef4444?style=for-the-badge)](https://raw.githack.com/drkanurag/News_Application/main/index.html)
[![Open Live Mirror](https://img.shields.io/badge/%F0%9F%8C%90_OPEN_LIVE_MIRROR-HTMLPreview_CDN-0ea5e9?style=for-the-badge)](https://htmlpreview.github.io/?https://github.com/drkanurag/News_Application/blob/main/index.html)
[![Open Localhost Server](https://img.shields.io/badge/%E2%9A%A1_LOCAL_EDGE_SERVER-localhost:5173-10b981?style=for-the-badge)](http://localhost:5173/launch.html)

- 🌍 **1. Direct Online Working Website (Zero Setup — Works Directly When Clicked on GitHub)**:
  👉 **[https://raw.githack.com/drkanurag/News_Application/main/index.html](https://raw.githack.com/drkanurag/News_Application/main/index.html)**
- 🌐 **2. Direct Online Mirror (HTMLPreview)**:
  👉 **[https://htmlpreview.github.io/?https://github.com/drkanurag/News_Application/blob/main/index.html](https://htmlpreview.github.io/?https://github.com/drkanurag/News_Application/blob/main/index.html)**
- 📡 **3. GitHub Pages URL**:
  👉 **[https://drkanurag.github.io/News_Application/](https://drkanurag.github.io/News_Application/)**
- 💻 **4. Local Ultra-Low Latency Edge Server (`<2ms` RAM Cache)**:
  👉 **[http://localhost:5173/launch.html](http://localhost:5173/launch.html)** | **[http://localhost:5173](http://localhost:5173)**

---

## ✨ Key Features

- **🇮🇳 80% India Priority + 🌐 20% Macro-Level Global News**:
  - Aggregates real-time Indian wires (**The Hindu**, **The Indian Express**, **NDTV India / NDTV Profit**, **Times of India**, **Google News India `when:2h`**) alongside strictly filtered **Macro-Level International News** (geopolitics, central banks/Fed/IMF/World Bank, BRICS/G20/UN summits, global trade/tariffs, commodities, and frontier AI/space breakthroughs).
- **🤖 AI 60-Word Executive Brief, Sentiment & Macro Impact (`intelligenceService.js`)**:
  - Every article preview generates a **3-Bullet Executive Brief** and **"Why It Matters"** analysis, plus domain impact badges and sentiment indicators.
- **🎧 Hands-Free Audio News Anchor & Article Voice Reader (`audioBriefingService.js`)**:
  - Listen to the **Top 5 India & Macro Radio Briefing** hands-free, or click **🔊 Listen** on any article card or reader modal.
- **📈 Live Macro Market Pulse + Publisher & Trending Filters**:
  - Track `🇮🇳 NIFTY 50`, `🇮🇳 SENSEX`, `💱 USD / INR`, `🏦 RBI REPO`, `🛢️ BRENT CRUDE`, `🪙 GOLD 24K (10g)`, and `🌐 US FED RATE`, filter by publisher wire, or click `#Trending` topics.
- **Chronological Date Grouping & Timeline Filter**:
  - Filter news by **All Real-Time**, **Today**, **Yesterday**, **Last 7 Days**, **Last 30 Days**, or pick a **Custom Date Range** (`From` – `To`).
- **Choose Your News Subject (`SubjectExplorer.jsx`)**:
  - Choose from **7 Editorial Desks**, **India + Macro Specialized Subject Chips**, or **add your own custom subjects**.
- **Fault-Isolated Microservice Architecture**:
  - Every UI zone and domain service runs inside its own [`ServiceErrorBoundary`](src/core/ServiceErrorBoundary.jsx) and communicates via [`IsolatedEventBus`](src/core/eventBus.js) and [`CircuitBreaker`](src/core/circuitBreaker.js).

---

## 🏗️ Microservice Directory Structure

```text
news/
├── fast_server.py                # Sub-2ms Python RAM Cache + SSE (/api/live-stream) Server
├── launch.html                   # Standalone zero-build production bundle (Cloud + Local hybrid)
├── start_newsmag.bat             # One-click Windows server + browser auto-launcher
└── src/
    ├── core/
    │   ├── eventBus.js               # Sandboxed Pub/Sub broker (try/catch per subscriber)
    │   ├── circuitBreaker.js         # Upstream API Circuit Breaker (CLOSED / OPEN / HALF_OPEN)
    │   └── ServiceErrorBoundary.jsx  # Per-module React Error Boundary with hot recovery
    ├── services/
    │   ├── newsFeedService.js        # Multi-stream India + Macro gateway & L1/L2 cache
    │   ├── liveStreamService.js      # Real-time SSE + RSS publisher wire service
    │   ├── intelligenceService.js    # 60-word AI Executive Brief, Sentiment & Impact service
    │   ├── audioBriefingService.js   # Hands-free Radio Briefing & per-article Voice TTS service
    │   ├── searchSortService.js      # Keyword, date-range & chronological grouping service
    │   ├── bookmarkService.js        # Isolated localStorage + memory fallback reading list
    │   ├── preferenceService.js      # Isolated theme, country edition, font scale & read history
    │   └── healthMonitorService.js   # Real-time microservice health & telemetry registry
    └── Components/
        ├── Navbar.jsx                # Navigation, Search, Edition & Services Health trigger
        ├── SubjectExplorer.jsx       # Dedicated News Subjects & Custom Topic chooser
        ├── NewsBoard.jsx             # Macro Pulse, Coverage Mix, Publisher Filter & Feed
        ├── NewsItem.jsx              # Resilient article card with INDIA/MACRO & Voice TTS
        ├── ArticleModal.jsx          # 60-Word Executive Brief, Font Controls & Social Share
        ├── ServiceHealthModal.jsx    # Live Microservice Health & Fault Simulation console
        └── fallbackData.js           # India + Macro Subjects catalog & date utilities
```

---

## 🚀 Running Locally

1. **One-Click Launch (Recommended)**:
   Double-click `news/start_newsmag.bat` or run:
   ```bash
   python news/fast_server.py
   ```
2. **Open in Browser**: [http://localhost:5173/launch.html](http://localhost:5173/launch.html)

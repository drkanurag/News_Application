# NewsMag — Microservice-Architected Real-Time News Application

## 🌐 Direct Website Links (Click to Open)

- 🚀 **[Click Here to Open NewsMag Live Website (`http://localhost:5173/launch.html`)](http://localhost:5173/launch.html)**
- ⚡ **[Open Vite Local Dev Server (`http://localhost:5173`)](http://localhost:5173)**
- 📂 **[Open Directly in Browser (`launch.html`)](./launch.html)**

---

## ✨ Key Features

- **Real-Time Multi-Stream News Aggregation**:
  - Combines **Live Publisher Wires** (BBC Global, NDTV Live), **NewsAPI `/v2/top-headlines`**, and **NewsAPI `/v2/everything`** with 60-second automatic background sync.
- **Chronological Date Grouping & Timeline Filter**:
  - Filter news by **All Real-Time**, **Today**, **Yesterday**, **Last 7 Days**, **Last 30 Days**, or pick a **Custom Date Range** (`From` – `To`).
  - Automatically organizes articles under date headers (`Today`, `Yesterday`, and exact calendar dates) with exact publication timestamps and relative times.
- **Choose Your News Subject (`SubjectExplorer.jsx`)**:
  - Choose from **7 Editorial Desks** (*Top Stories*, *Technology*, *Business*, *Science*, *Health*, *Sports*, *Entertainment*), **12 Specialized Subject Chips** (*AI & Robotics*, *Stock Markets*, *World Politics*, *Climate & Clean Energy*, *Space & Astronomy*, *Cybersecurity*, *Startups & VC*, *Cricket*, *Football*, *Medicine & Biotech*, *Cinema & Gaming*), or **add your own custom subjects**.
- **Fault-Isolated Microservice Architecture**:
  - Every UI zone and domain service runs inside its own [`ServiceErrorBoundary`](src/core/ServiceErrorBoundary.jsx) and communicates via [`IsolatedEventBus`](src/core/eventBus.js) and [`CircuitBreaker`](src/core/circuitBreaker.js), ensuring changes or errors in one module never affect any other area.

---

## 🏗️ Microservice Directory Structure

```text
news/src/
├── core/
│   ├── eventBus.js               # Sandboxed Pub/Sub broker (try/catch per subscriber)
│   ├── circuitBreaker.js         # Upstream API Circuit Breaker (CLOSED / OPEN / HALF_OPEN)
│   └── ServiceErrorBoundary.jsx  # Per-module React Error Boundary with hot recovery
├── services/
│   ├── newsFeedService.js        # Multi-stream NewsAPI + Live Wire gateway & TTL cache
│   ├── liveStreamService.js      # Real-time breaking RSS-to-JSON publisher wire service
│   ├── searchSortService.js      # Keyword, date-range & chronological grouping service
│   ├── bookmarkService.js        # Isolated localStorage + memory fallback reading list
│   ├── preferenceService.js      # Isolated theme, country edition, and layout service
│   └── healthMonitorService.js   # Real-time microservice health & telemetry registry
└── Components/
    ├── Navbar.jsx                # Navigation, Search, Edition & Services Health trigger
    ├── SubjectExplorer.jsx       # Dedicated News Subjects & Custom Topic chooser
    ├── NewsBoard.jsx             # Date-grouped real-time feed orchestrator
    ├── NewsItem.jsx              # Resilient article card with exact timestamps
    ├── ArticleModal.jsx          # Isolated in-app reader & link-sharing modal
    ├── ServiceHealthModal.jsx    # Live Microservice Health & Fault Simulation console
    └── fallbackData.js           # Subjects catalog, date utilities & standby articles
```

---

## 🚀 Running via Vite CLI

1. **Configure your API Key** in `news/.env`:
   ```env
   VITE_API_KEY=your_newsapi_key_here
   ```
2. **Install dependencies & start server**:
   ```bash
   cd news
   npm install
   npm run dev
   ```
3. **Open in Browser**: [http://localhost:5173](http://localhost:5173)

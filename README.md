# 🇮🇳 NewsMag — India-First (80%) + 🌐 Macro Global (20%) Real-Time News Application

## 🌐 Direct Working Website Links (Click Any Link Below to Launch Instantly)

[![Open Live Working Website Online](https://img.shields.io/badge/%F0%9F%9A%80_CLICK_HERE_TO_OPEN_LIVE_WEBSITE-Works_Directly_in_Browser-ef4444?style=for-the-badge)](https://raw.githack.com/drkanurag/News_Application/main/index.html)
[![Open Live Mirror](https://img.shields.io/badge/%F0%9F%8C%90_OPEN_LIVE_MIRROR-HTMLPreview_CDN-0ea5e9?style=for-the-badge)](https://htmlpreview.github.io/?https://github.com/drkanurag/News_Application/blob/main/index.html)
[![Open Localhost Server](https://img.shields.io/badge/%E2%9A%A1_LOCAL_EDGE_SERVER-localhost:5173-10b981?style=for-the-badge)](http://localhost:5173/launch.html)

- 🌍 **1. Direct Online Working Website (Zero Setup — Works from GitHub on Any Device)**:
  👉 **[https://raw.githack.com/drkanurag/News_Application/main/index.html](https://raw.githack.com/drkanurag/News_Application/main/index.html)**
- 🌐 **2. Direct Online Mirror (HTMLPreview)**:
  👉 **[https://htmlpreview.github.io/?https://github.com/drkanurag/News_Application/blob/main/index.html](https://htmlpreview.github.io/?https://github.com/drkanurag/News_Application/blob/main/index.html)**
- 📡 **3. GitHub Pages URL**:
  👉 **[https://drkanurag.github.io/News_Application/](https://drkanurag.github.io/News_Application/)**
- 💻 **4. Local Ultra-Low Latency Edge Server (`<2ms` RAM Cache)**:
  👉 **[http://localhost:5173/launch.html](http://localhost:5173/launch.html)** | **[http://localhost:5173](http://localhost:5173)**

---

## ✨ Key Capabilities

1. **🇮🇳 80% India National/Economy + 🌐 20% Macro-Level International Coverage**
   - Streams real-time Indian headlines from **The Hindu**, **The Indian Express**, **NDTV India / Profit**, **Times of India**, and **Google News India (`when:2h`)**.
   - Filters international news strictly to **Macro-Level Global Events** (Geopolitics, Central Banks/Fed/ECB/IMF/World Bank, BRICS/G20/UN summits, Global Trade/Tariffs, Brent Crude/Gold, and Frontier AI/Space breakthroughs), automatically excluding foreign local noise.
2. **🤖 AI 60-Word Executive Brief, Sentiment & Macro Impact Lens (`intelligenceService.js`)**
   - Generates a **3-Bullet Executive Summary** + **"Why It Matters"** explanation for every story, along with domain impact badges (*Markets & Monetary*, *Geopolitics & Diplomacy*, *AI & Frontier Tech*, *Space, Climate & Science*, *Governance & Law*) and sentiment classification.
3. **🎧 Hands-Free Audio News Anchor & Article Voice Reader (`audioBriefingService.js`)**
   - Click **"🎧 Listen Top 5 Briefing"** to hear the top 5 India & Macro headlines read aloud like a live radio broadcast, or click **🔊 Listen** on any individual card/modal.
4. **📈 Live India & Global Macro Market Pulse Strip**
   - Displays `🇮🇳 NIFTY 50`, `🇮🇳 SENSEX`, `💱 USD / INR`, `🏦 RBI REPO`, `🛢️ BRENT CRUDE`, `🪙 GOLD 24K (10g)`, and `🌐 US FED RATE` with one-click topic filtering.
5. **⚡ Sub-2ms Edge RAM Cache + Server-Sent Events (`/api/live-stream`)**
   - Automatically pushes breaking stories into the UI every 8–10 seconds without page reloads.
6. **🛡️ Fault-Isolated Microservice Architecture**
   - Each domain runs in its own isolated microservice (`newsFeedService`, `liveStreamService`, `intelligenceService`, `audioBriefingService`, `searchSortService`, `bookmarkService`, `preferenceService`, `healthMonitorService`) wrapped in `ServiceErrorBoundary` and `CircuitBreaker`.

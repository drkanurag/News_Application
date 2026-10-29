import email.utils
import hashlib
import json
import os
import re
import threading
import time
import urllib.parse
import urllib.request
try:
    import defusedxml.ElementTree as ET
except ImportError:
    import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 5173
API_KEY = os.environ.get("NEWSAPI_KEY", "")

env_file = os.path.join(BASE_DIR, ".env")
if not API_KEY and os.path.exists(env_file):
    try:
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if (line.startswith("NEWSAPI_KEY") or line.startswith("VITE_API_KEY")) and "=" in line:
                    API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
    except Exception:
        pass

CATEGORIES = [
    "general",
    "technology",
    "business",
    "science",
    "health",
    "sports",
    "entertainment",
]

# 1. PRIMARY INDIAN REAL-TIME FEEDS (~80% OF COVERAGE)
INDIA_XML_FEEDS = {
    "general": [
        ("https://www.thehindu.com/news/national/feeder/default.rss", "The Hindu"),
        ("https://indianexpress.com/section/india/feed/", "The Indian Express"),
        ("https://feeds.feedburner.com/ndtvnews-india-news", "NDTV India"),
        ("https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms", "Times of India"),
    ],
    "business": [
        ("https://www.thehindu.com/business/feeder/default.rss", "The Hindu Business"),
        ("https://indianexpress.com/section/business/feed/", "Indian Express Economy"),
        ("https://feeds.feedburner.com/ndtvprofit-latest", "NDTV Profit"),
    ],
    "technology": [
        ("https://indianexpress.com/section/technology/feed/", "Indian Express Tech"),
        ("https://www.thehindu.com/sci-tech/technology/feeder/default.rss", "The Hindu Tech"),
    ],
    "science": [
        ("https://www.thehindu.com/sci-tech/science/feeder/default.rss", "The Hindu Science"),
        ("https://www.thehindu.com/sci-tech/energy-and-environment/feeder/default.rss", "The Hindu Environment"),
    ],
    "health": [
        ("https://www.thehindu.com/sci-tech/health/feeder/default.rss", "The Hindu Health"),
        ("https://indianexpress.com/section/lifestyle/health/feed/", "Indian Express Health"),
    ],
    "sports": [
        ("https://www.thehindu.com/sport/cricket/feeder/default.rss", "The Hindu Cricket"),
        ("https://indianexpress.com/section/sports/feed/", "Indian Express Sports"),
        ("https://www.thehindu.com/sport/feeder/default.rss", "The Hindu Sport"),
    ],
    "entertainment": [
        ("https://indianexpress.com/section/entertainment/feed/", "Indian Express Entertainment"),
        ("https://www.thehindu.com/entertainment/feeder/default.rss", "The Hindu Entertainment"),
    ],
}

INDIA_REALTIME_QUERIES = {
    "general": "(India OR New Delhi OR Mumbai OR Bengaluru OR Parliament OR Supreme Court India OR RBI OR Modi OR Cabinet) when:2h",
    "business": "(India economy OR RBI OR Sensex OR Nifty OR SEBI OR GST OR Indian startups OR rupee OR exports India) when:3h",
    "technology": "(India technology OR Bengaluru tech OR AI India OR MeitY OR semiconductor India OR Digital India OR IT sector India) when:3h",
    "science": "(ISRO OR India space OR IIT research OR CSIR OR renewable energy India OR climate India) when:6h",
    "health": "(India healthcare OR AIIMS OR ICMR OR pharma India OR medical India OR Ayushman Bharat) when:6h",
    "sports": "(India cricket OR BCCI OR IPL OR Team India OR Indian sports OR Neeraj Chopra OR chess India) when:3h",
    "entertainment": "(Bollywood OR Indian cinema OR box office India OR South cinema OR OTT India) when:3h",
}

# 2. MACRO-LEVEL INTERNATIONAL FEEDS (~20% OF COVERAGE — ONLY BIG-PICTURE GLOBAL DEVELOPMENTS)
MACRO_GLOBAL_FEEDS = {
    "general": [
        ("https://feeds.bbci.co.uk/news/world/rss.xml", "BBC World Macro"),
        ("https://www.aljazeera.com/xml/rss/all.xml", "Al Jazeera Global"),
    ],
    "business": [
        ("https://feeds.bbci.co.uk/news/business/rss.xml", "BBC Global Economy"),
        ("https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", "CNBC Global Macro"),
    ],
    "technology": [
        ("https://feeds.bbci.co.uk/news/technology/rss.xml", "BBC Global Tech"),
        ("https://techcrunch.com/feed/", "TechCrunch Global"),
    ],
    "science": [
        ("https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", "BBC Global Science"),
    ],
    "health": [
        ("https://feeds.bbci.co.uk/news/health/rss.xml", "BBC Global Health"),
    ],
    "sports": [
        ("https://feeds.bbci.co.uk/sport/rss.xml", "BBC Global Sport"),
    ],
    "entertainment": [
        ("https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", "BBC Global Culture"),
    ],
}

MACRO_GLOBAL_QUERIES = {
    "general": "(geopolitics OR UN summit OR G20 OR BRICS OR IMF OR World Bank OR ceasefire OR global trade OR diplomacy OR European Union OR Middle East OR China) when:3h",
    "business": "(global economy OR Federal Reserve OR ECB OR IMF OR crude oil OR gold prices OR global markets OR trade tariff OR inflation OR GDP) when:3h",
    "technology": "(artificial intelligence breakthrough OR semiconductor supply chain OR OpenAI OR Google DeepMind OR global cybersecurity OR quantum computing) when:3h",
    "science": "(NASA OR SpaceX OR ESA OR global climate summit OR fusion energy OR CERN OR Webb telescope) when:6h",
    "health": "(WHO global health OR clinical trial breakthrough OR pandemic preparedness OR biotech approval) when:6h",
    "sports": "(ICC OR FIFA World Cup OR Champions League OR Formula 1 Grand Prix OR Grand Slam tennis OR Olympics) when:3h",
    "entertainment": "(global box office OR Cannes OR Oscars OR global streaming) when:6h",
}

# Macro-level keywords to ensure international stories are strictly high-impact macro news (no foreign local noise)
MACRO_KEYWORDS = re.compile(
    r"\b(global|world|economy|economic|market|markets|central bank|fed|federal reserve|imf|world bank|brics|g20|g7|nato|un|united nations|"
    r"summit|trade|tariff|tariffs|sanction|sanctions|treaty|diplomacy|geopolitic|oil|opec|energy|gold|inflation|gdp|recession|interest rate|"
    r"china|russia|ukraine|israel|iran|middle east|eu|european union|uk|us|white house|pentagon|parliament|election|president|prime minister|"
    r"ai|artificial intelligence|semiconductor|chip|nvidia|openai|google|apple|microsoft|quantum|cyber|space|nasa|spacex|isro|climate|emissions|"
    r"who|vaccine|biotech|champions league|premier league|fifa|icc|formula 1|grand slam|olympic)\b",
    re.IGNORECASE,
)

# Reject hyper-local foreign noise
FOREIGN_LOCAL_NOISE = re.compile(
    r"\b(varsity|high school|county sheriff|local weather|lottery|horoscope|obituary|yard sale|city council|alabama|kentucky|myrtle beach|guernsey)\b",
    re.IGNORECASE,
)

INDIA_IDENTIFIERS = re.compile(
    r"\b(india|indian|delhi|new delhi|mumbai|bengaluru|bangalore|chennai|kolkata|hyderabad|pune|ahmedabad|kerala|tamil nadu|maharashtra|"
    r"karnataka|uttar pradesh|bihar|gujarat|rajasthan|punjab|haryana|assam|odisha|telangana|andhra|goa|kashmir|ladakh|modi|jaishankar|"
    r"sitharaman|rahul gandhi|kejriwal|mamata|parliament|lok sabha|rajya sabha|supreme court|high court|rbi|sebi|sensex|nifty|rupee|inr|"
    r"gst|isro|drdo|aiims|icmr|iit|bcci|ipl|bollywood|the hindu|indian express|ndtv|times of india|hindustan times)\b",
    re.IGNORECASE,
)

CATEGORY_IMAGE_POOLS = {
    "general": [
        "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=560&q=70",
    ],
    "technology": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=560&q=70",
    ],
    "business": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=560&q=70",
    ],
    "science": [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=560&q=70",
    ],
    "health": [
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=560&q=70",
    ],
    "sports": [
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=560&q=70",
    ],
    "entertainment": [
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=560&q=70",
        "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=560&q=70",
    ],
}

RAM_CACHE = {}
ACTIVE_KEYS = {("in", "general", ""): time.time(), ("in", "business", ""): time.time(), ("in", "technology", ""): time.time()}
CACHE_LOCK = threading.Lock()
EXECUTOR = ThreadPoolExecutor(max_workers=16)

def is_safe_url(u):
    if not isinstance(u, str):
        return False
    u_lower = u.strip().lower()
    return u_lower.startswith("http://") or u_lower.startswith("https://")


def pick_category_image(title, category="general"):
    pool = CATEGORY_IMAGE_POOLS.get(category, CATEGORY_IMAGE_POOLS["general"])
    digest = int(hashlib.md5(title.encode("utf-8", errors="ignore")).hexdigest()[:8], 16)
    return pool[digest % len(pool)]


def strip_html(text):
    if not text:
        return ""
    cleaned = re.sub(r"<[^>]*>", " ", str(text))
    cleaned = re.sub(r"&nbsp;|&#160;", " ", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def parse_pubdate_to_iso(pub_str):
    if not pub_str:
        return datetime.now(timezone.utc).isoformat()
    pub_str = str(pub_str).strip()
    try:
        dt = email.utils.parsedate_to_datetime(pub_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        pass
    try:
        if "T" not in pub_str and " " in pub_str:
            pub_str = pub_str.replace(" ", "T") + "Z"
        return pub_str
    except Exception:
        return datetime.now(timezone.utc).isoformat()


def is_published_recently(iso_str, minutes=40):
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        age_sec = (datetime.now(timezone.utc) - dt).total_seconds()
        return -300 <= age_sec <= minutes * 60
    except Exception:
        return False


def is_macro_global_story(title, desc):
    combined = f"{title} {desc}"
    if FOREIGN_LOCAL_NOISE.search(combined):
        return False
    return bool(MACRO_KEYWORDS.search(combined))


def fetch_direct_xml_rss(rss_url, default_source_name, category="general", scope="INDIA", timeout=3.2):
    """Fetches and parses live XML/RSS directly from Indian or Macro Global publishers."""
    try:
        req = urllib.request.Request(
            rss_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NewsMag-IndiaMacroEngine/4.0"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            xml_bytes = resp.read(2_000_000)
        root = ET.fromstring(xml_bytes)
        items = root.findall(".//item")
        results = []
        for item in items[:28]:
            raw_title = strip_html(item.findtext("title") or "")
            if not raw_title:
                continue

            source_tag = strip_html(item.findtext("source") or "")
            title = raw_title
            if not source_tag and " - " in raw_title:
                parts = raw_title.rsplit(" - ", 1)
                if len(parts[1]) < 35:
                    title, source_tag = parts[0].strip(), parts[1].strip()
            elif source_tag and title.endswith(f" - {source_tag}"):
                title = title[: -(len(source_tag) + 3)].strip()

            source_name = source_tag or default_source_name
            desc = strip_html(item.findtext("description") or "")
            if not desc or desc.lower() == raw_title.lower() or len(desc) < 25:
                prefix = "Live India Desk" if scope == "INDIA" else "Global Macro Briefing"
                desc = f"{prefix} ({source_name}): {title}. Click to read complete real-time coverage."

            # Detect if an international feed item is actually about India
            detected_scope = scope
            if scope == "MACRO_GLOBAL":
                if INDIA_IDENTIFIERS.search(f"{title} {desc} {source_name}"):
                    detected_scope = "INDIA"
                elif not is_macro_global_story(title, desc):
                    continue
            elif scope == "INDIA":
                if FOREIGN_LOCAL_NOISE.search(f"{title} {desc}"):
                    continue

            link = (item.findtext("link") or "").strip()
            if not is_safe_url(link):
                link = "https://www.thehindu.com"
            pub_iso = parse_pubdate_to_iso(item.findtext("pubDate"))

            thumb_url = ""
            for child in item:
                tag_lower = child.tag.lower()
                if "thumbnail" in tag_lower or "content" in tag_lower or "enclosure" in tag_lower:
                    u = child.attrib.get("url") or child.attrib.get("href") or ""
                    if is_safe_url(u):
                        thumb_url = u.replace("/standard/240/", "/standard/624/")
                        break
            if not is_safe_url(thumb_url):
                thumb_url = pick_category_image(title, category)

            results.append(
                {
                    "source": {"id": source_name.lower().replace(" ", "-"), "name": source_name},
                    "author": source_name,
                    "title": title,
                    "description": desc,
                    "content": desc,
                    "url": link,
                    "urlToImage": thumb_url,
                    "publishedAt": pub_iso,
                    "category": category,
                    "scope": detected_scope,
                    "isRealtimeStream": True,
                    "isJustIn": is_published_recently(pub_iso, 40),
                }
            )
        return results
    except Exception:
        return []


def deduplicate_and_sort(articles):
    seen = set()
    out = []
    for art in articles:
        norm = re.sub(r"[^a-z0-9]", "", art["title"].lower())[:60]
        if not norm or norm in seen:
            continue
        seen.add(norm)
        out.append(art)
    out.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)
    return out


def fetch_category_bundle(category="general", country="in", q="", from_date="", to_date=""):
    start_t = time.perf_counter()
    futures = []

    # 1. INDIA REAL-TIME STREAMS (~80% TARGET SHARE)
    india_q = f"({q}) AND India when:6h" if q else INDIA_REALTIME_QUERIES.get(category, INDIA_REALTIME_QUERIES["general"])
    gnews_india_url = (
        f"https://news.google.com/rss/search?q={urllib.parse.quote(india_q)}"
        f"&hl=en-IN&gl=IN&ceid=IN:en"
    )
    futures.append(
        ("india", EXECUTOR.submit(fetch_direct_xml_rss, gnews_india_url, "India Live Wire", category, "INDIA", 3.2))
    )

    if not q and category == "general":
        gnews_in_top = "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en"
        futures.append(
            ("india", EXECUTOR.submit(fetch_direct_xml_rss, gnews_in_top, "India Top Stories", category, "INDIA", 3.0))
        )

    for rss_url, source_name in INDIA_XML_FEEDS.get(category, INDIA_XML_FEEDS["general"]):
        futures.append(
            ("india", EXECUTOR.submit(fetch_direct_xml_rss, rss_url, source_name, category, "INDIA", 3.0))
        )

    # 2. MACRO-LEVEL INTERNATIONAL STREAMS (~20% TARGET SHARE — BIG-PICTURE WORLD ONLY)
    macro_q = f"({q}) AND (global OR world OR economy) when:6h" if q else MACRO_GLOBAL_QUERIES.get(category, MACRO_GLOBAL_QUERIES["general"])
    gnews_macro_url = (
        f"https://news.google.com/rss/search?q={urllib.parse.quote(macro_q)}"
        f"&hl=en-US&gl=US&ceid=US:en"
    )
    futures.append(
        ("macro", EXECUTOR.submit(fetch_direct_xml_rss, gnews_macro_url, "Global Macro Wire", category, "MACRO_GLOBAL", 3.2))
    )

    for rss_url, source_name in MACRO_GLOBAL_FEEDS.get(category, MACRO_GLOBAL_FEEDS["general"]):
        futures.append(
            ("macro", EXECUTOR.submit(fetch_direct_xml_rss, rss_url, source_name, category, "MACRO_GLOBAL", 3.0))
        )

    india_raw = []
    macro_raw = []
    for kind, fut in futures:
        items = fut.result()
        if not items:
            continue
        for item in items:
            if q and q.lower() not in f"{item['title']} {item['description']}".lower():
                # Keep if query terms roughly match
                terms = [t.lower() for t in re.split(r"\s+OR\s+|\s+", q) if len(t) > 2 and t.upper() not in ("AND", "OR")]
                if terms and not any(t in f"{item['title']} {item['description']}".lower() for t in terms):
                    continue
            if item.get("scope") == "INDIA":
                india_raw.append(item)
            else:
                macro_raw.append(item)

    india_sorted = deduplicate_and_sort(india_raw)
    macro_sorted = deduplicate_and_sort(macro_raw)

    # Blend strictly as ~80% India (48 stories) + ~20% Macro International (12 stories)
    # If the user explicitly switches country edition away from 'in', adjust ratio accordingly
    if country == "in":
        selected_india = india_sorted[:48]
        selected_macro = macro_sorted[:12]
    else:
        selected_india = india_sorted[:20]
        selected_macro = macro_sorted[:35]

    combined = deduplicate_and_sort(selected_india + selected_macro)

    # Ensure the very top hero + first few stories lead with India's latest breaking news when in 'in' edition
    if country == "in" and selected_india:
        top_india = selected_india[:4]
        top_ids = {a["title"] for a in top_india}
        rest = [a for a in combined if a["title"] not in top_ids]
        combined = top_india + rest

    top_articles = combined[:60]
    india_count = sum(1 for a in top_articles if a.get("scope") == "INDIA")
    macro_count = len(top_articles) - india_count

    elapsed_ms = round((time.perf_counter() - start_t) * 1000)
    payload_obj = {
        "status": "ok",
        "articles": top_articles,
        "indiaCount": india_count,
        "macroCount": macro_count,
        "totalResults": len(combined),
        "edgeCached": True,
        "upstreamMs": elapsed_ms,
        "lastSyncedAt": datetime.now(timezone.utc).isoformat(),
    }
    return json.dumps(payload_obj).encode("utf-8"), top_articles


def get_cached_or_fetch(category="general", country="in", q="", from_date="", to_date="", force=False):
    if category not in CATEGORIES:
        category = "general"
    country = country.lower() if country and country.lower() in ("in", "us", "gb", "au", "ca", "de", "fr", "jp") else "in"
    q = (q or "")[:100].strip()
    from_date = (from_date or "")[:25]
    to_date = (to_date or "")[:25]

    cache_key = f"{country}:{category}:{q}:{from_date}:{to_date}"
    with CACHE_LOCK:
        ACTIVE_KEYS[(country, category, q)] = time.time()
        entry = RAM_CACHE.get(cache_key)

    if entry and not force:
        if time.time() - entry["ts"] > 10:
            EXECUTOR.submit(refresh_key, cache_key, category, country, q, from_date, to_date)
        return entry["payload"]

    payload, articles = fetch_category_bundle(category, country, q, from_date, to_date)
    with CACHE_LOCK:
        RAM_CACHE[cache_key] = {"ts": time.time(), "payload": payload, "articles": articles}
        if len(RAM_CACHE) > 200:
            oldest_keys = sorted(RAM_CACHE.keys(), key=lambda k: RAM_CACHE[k]["ts"])[:50]
            for old_k in oldest_keys:
                RAM_CACHE.pop(old_k, None)
    return payload


def refresh_key(cache_key, category, country, q, from_date="", to_date=""):
    try:
        payload, articles = fetch_category_bundle(category, country, q, from_date, to_date)
        with CACHE_LOCK:
            RAM_CACHE[cache_key] = {"ts": time.time(), "payload": payload, "articles": articles}
            if len(RAM_CACHE) > 200:
                oldest_keys = sorted(RAM_CACHE.keys(), key=lambda k: RAM_CACHE[k]["ts"])[:50]
                for old_k in oldest_keys:
                    RAM_CACHE.pop(old_k, None)
    except Exception:
        pass


def realtime_scanner_loop():
    """Continuously scans Indian & Macro Global wires every 10 seconds."""
    while True:
        time.sleep(10)
        now = time.time()
        with CACHE_LOCK:
            for k in list(ACTIVE_KEYS.keys()):
                if now - ACTIVE_KEYS[k] > 600:
                    del ACTIVE_KEYS[k]
            recent_items = sorted(ACTIVE_KEYS.items(), key=lambda x: x[1], reverse=True)[:8]
            keys_to_scan = [k for k, _ in recent_items]
        for country, category, q in keys_to_scan:
            cache_key = f"{country}:{category}:{q}::"
            EXECUTOR.submit(refresh_key, cache_key, category, country, q, "", "")


def prewarm_all_categories():
    for cat in CATEGORIES:
        EXECUTOR.submit(get_cached_or_fetch, cat, "in", "", "", "", False)


class FastNewsHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        norm_path = urllib.parse.unquote(parsed.path)

        # Security check: Block direct download of sensitive files and hidden paths
        clean_path = norm_path.replace("\\", "/").strip("/")
        segments = clean_path.split("/") if clean_path else []
        if any(s.startswith(".") for s in segments) or clean_path.lower().endswith(
            (".py", ".env", ".bat", ".json", ".md")
        ):
            self.send_error(404, "File not found")
            return

        if parsed.path == "/api/fast-news":
            qs = urllib.parse.parse_qs(parsed.query)
            category = qs.get("category", ["general"])[0]
            country = qs.get("country", ["in"])[0]
            q = qs.get("q", [""])[0]
            from_date = qs.get("from", [""])[0]
            to_date = qs.get("to", [""])[0]
            force = qs.get("force", ["0"])[0] == "1"

            data = get_cached_or_fetch(category, country, q, from_date, to_date, force)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        if parsed.path == "/api/live-stream":
            qs = urllib.parse.parse_qs(parsed.query)
            category = qs.get("category", ["general"])[0]
            country = qs.get("country", ["in"])[0]
            q = qs.get("q", [""])[0]

            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            try:
                while True:
                    data_bytes = get_cached_or_fetch(category, country, q, "", "", False)
                    sse_frame = b"event: realtime_feed\ndata: " + data_bytes + b"\n\n"
                    self.wfile.write(sse_frame)
                    self.wfile.flush()
                    time.sleep(8)
            except (BrokenPipeError, ConnectionResetError, Exception):
                return

        if parsed.path in ("/", "/index.html"):
            dist_index = os.path.join(BASE_DIR, "dist", "index.html")
            if os.path.exists(dist_index):
                self.path = "/dist/index.html"
            else:
                self.path = "/launch.html"

        return super().do_GET()


if __name__ == "__main__":
    prewarm_all_categories()
    scanner_thread = threading.Thread(target=realtime_scanner_loop, daemon=True)
    scanner_thread.start()
    server = ThreadingHTTPServer(("127.0.0.1", PORT), FastNewsHandler)
    print(f"India-First + Macro Global Real-Time Server listening on http://localhost:{PORT}")
    server.serve_forever()

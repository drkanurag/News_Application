export const CATEGORIES = [
  {
    id: "general",
    label: "Top Stories",
    icon: "bi-newspaper",
    color: "#ef4444",
    badgeClass: "bg-danger",
    desc: "Breaking world headlines, diplomacy & global affairs",
  },
  {
    id: "technology",
    label: "Technology",
    icon: "bi-cpu",
    color: "#3b82f6",
    badgeClass: "bg-primary",
    desc: "AI, software, semiconductors, gadgets & cybersecurity",
  },
  {
    id: "business",
    label: "Business",
    icon: "bi-graph-up-arrow",
    color: "#10b981",
    badgeClass: "bg-success",
    desc: "Markets, economy, startups, finance & global trade",
  },
  {
    id: "science",
    label: "Science",
    icon: "bi-rocket-takeoff",
    color: "#8b5cf6",
    badgeClass: "bg-info",
    desc: "Space exploration, physics, climate & discoveries",
  },
  {
    id: "health",
    label: "Health",
    icon: "bi-heart-pulse",
    color: "#ec4899",
    badgeClass: "bg-danger",
    desc: "Medicine, wellness, biotech, nutrition & longevity",
  },
  {
    id: "sports",
    label: "Sports",
    icon: "bi-trophy",
    color: "#f59e0b",
    badgeClass: "bg-warning",
    desc: "Cricket, football, tennis, Formula 1 & championships",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: "bi-film",
    color: "#f97316",
    badgeClass: "bg-secondary",
    desc: "Cinema, streaming, music, gaming & pop culture",
  },
];

export const NEWS_SUBJECTS = [
  {
    id: "all",
    label: "All Subjects (India + Macro World)",
    icon: "bi-grid-fill",
    category: "all",
    query: "",
  },
  {
    id: "india-national",
    label: "India Policy, Parliament & Governance",
    icon: "bi-bank2",
    category: "general",
    query: "India OR New Delhi OR Parliament OR Supreme Court OR Cabinet",
  },
  {
    id: "markets-economy",
    label: "Sensex, Nifty, RBI & Macro Economy",
    icon: "bi-currency-exchange",
    category: "business",
    query: "Sensex OR Nifty OR RBI OR India economy OR inflation OR global markets",
  },
  {
    id: "ai-robotics",
    label: "Indian IT, AI & Frontier Tech",
    icon: "bi-robot",
    category: "technology",
    query: "India AI OR Bengaluru tech OR semiconductor OR OpenAI OR Gemini",
  },
  {
    id: "geopolitics",
    label: "Macro Geopolitics & Global Diplomacy",
    icon: "bi-globe-americas",
    category: "general",
    query: "India diplomacy OR BRICS OR G20 OR UN summit OR geopolitics",
  },
  {
    id: "startups-vc",
    label: "Indian Startups, IPOs & FinTech",
    icon: "bi-lightbulb-fill",
    category: "business",
    query: "Indian startups OR IPO India OR UPI OR FinTech OR venture capital",
  },
  {
    id: "cricket",
    label: "India Cricket, IPL & BCCI",
    icon: "bi-award-fill",
    category: "sports",
    query: "India cricket OR BCCI OR IPL OR Team India OR test match",
  },
  {
    id: "space-cosmos",
    label: "ISRO, NASA & Space Missions",
    icon: "bi-stars",
    category: "science",
    query: "ISRO OR Gaganyaan OR Chandrayaan OR NASA OR SpaceX",
  },
  {
    id: "climate-energy",
    label: "Green Energy, EVs & Climate Macro",
    icon: "bi-sun-fill",
    category: "science",
    query: "renewable energy India OR solar OR electric vehicles OR climate summit",
  },
  {
    id: "cybersecurity",
    label: "Cybersecurity & Digital Public Infra",
    icon: "bi-shield-lock-fill",
    category: "technology",
    query: "cybersecurity OR Digital India OR data privacy OR CERT-In",
  },
  {
    id: "medicine-biotech",
    label: "Healthcare, AIIMS & Pharma India",
    icon: "bi-capsule-pill",
    category: "health",
    query: "AIIMS OR ICMR OR Indian pharma OR clinical trial OR WHO",
  },
  {
    id: "cinema-gaming",
    label: "Indian Cinema, Bollywood & OTT",
    icon: "bi-controller",
    category: "entertainment",
    query: "Bollywood OR Indian cinema OR box office India OR OTT",
  },
];

export const COUNTRIES = [
  { code: "in", label: "India + Macro World", short: "IN", flag: "🇮🇳" },
  { code: "us", label: "United States", short: "US", flag: "🇺🇸" },
  { code: "gb", label: "United Kingdom", short: "UK", flag: "🇬🇧" },
  { code: "ca", label: "Canada", short: "CA", flag: "🇨🇦" },
  { code: "au", label: "Australia", short: "AU", flag: "🇦🇺" },
];

export const CATEGORY_FALLBACK_IMAGES = {
  general: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80",
  business: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80",
  science: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80",
  health: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1000&q=80",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80",
  entertainment: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80",
};

const now = Date.now();
const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString();

export const FALLBACK_ARTICLES = {
  general: [
    {
      source: { id: "reuters", name: "Reuters" },
      author: "Elena Rostova & Marcus Vance",
      title: "Global Clean Energy Grid Expansion Surpasses Decade Targets Ahead of Schedule",
      description: "International energy regulators report record-breaking utility-scale solar, wind, and grid-scale battery deployments across North America, Europe, and Asia.",
      content: "Global clean energy infrastructure investment reached a historic milestone this quarter, with grid-scale battery storage and high-voltage interconnectors coming online nearly two years ahead of initial projections. Analysts attribute the acceleration to streamlined permitting frameworks, falling module costs, and AI-assisted grid load balancing across major metropolitan corridors.",
      url: "https://www.reuters.com/sustainability/",
      urlToImage: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(1.5),
      category: "general",
    },
    {
      source: { id: "associated-press", name: "Associated Press" },
      author: "David Chen",
      title: "Next-Generation High-Speed Rail Corridors Approved Across Three Continents",
      description: "New cross-border transit agreements promise to cut intercity travel times by up to 60% while reducing regional aviation emissions.",
      content: "Transportation ministries unveiled coordinated funding packages for next-generation magnetic and high-speed electric rail lines linking major economic hubs. Construction on the first phase will prioritize freight-passenger shared corridors and automated signaling systems.",
      url: "https://apnews.com/",
      urlToImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(3),
      category: "general",
    },
    {
      source: { id: "bbc-news", name: "BBC News" },
      author: "Priya Nair",
      title: "UNESCO Launches Digital Preservation Vault for Endangered World Heritage Sites",
      description: "High-precision LiDAR scanning and photogrammetry teams are archiving millimeter-accurate 3D models of coastal and ancient monuments.",
      content: "Using terrestrial laser scanning and autonomous drone fleets, preservationists have cataloged over 400 vulnerable heritage sites in an open-access digital twin repository designed for researchers, educators, and restoration architects worldwide.",
      url: "https://www.bbc.com/news",
      urlToImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(5),
      category: "general",
    },
    {
      source: { id: "the-verge", name: "The Guardian" },
      author: "Hannah Sterling",
      title: "Urban Micro-Forests Show Dramatic Cooling Effect in Summer Heatwave Study",
      description: "Multi-city environmental research confirms pocket forests lower neighborhood surface temperatures by up to 5.5 degrees Celsius.",
      content: "Dense, native-species urban micro-forests planted on reclaimed municipal lots are outperforming conventional street trees in both stormwater absorption and localized heat-island mitigation, prompting dozens of mayors to expand green zoning mandates.",
      url: "https://www.theguardian.com/environment",
      urlToImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(7),
      category: "general",
    },
    {
      source: { id: "bloomberg", name: "Bloomberg" },
      author: "Liam O'Connor",
      title: "Central Banks Coordinate Instant Cross-Border Settlement Standards for Small Businesses",
      description: "New interoperability protocols eliminate multi-day clearing delays and slash foreign exchange fees for international suppliers.",
      content: "Small and medium-sized enterprises conducting cross-border commerce will soon benefit from near-instantaneous settlement transparency and capped FX conversion spreads under a newly ratified multilateral payment standard.",
      url: "https://www.bloomberg.com/",
      urlToImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(9),
      category: "general",
    },
    {
      source: { id: "national-geographic", name: "National Geographic" },
      author: "Dr. Mateo Silva",
      title: "Deep-Ocean Autonomous Gliders Map Previously Unknown Hydrothermal Ecosystems",
      description: "A six-month expedition in the South Pacific reveals thriving biological communities around mineral-rich deep-sea vents.",
      content: "Marine biologists aboard an international research vessel have documented over thirty previously undescribed species thriving in extreme pressure and thermal gradients more than 3,800 meters beneath the ocean surface.",
      url: "https://www.nationalgeographic.com/",
      urlToImage: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(12),
      category: "general",
    },
  ],
  technology: [
    {
      source: { id: "ars-technica", name: "Ars Technica" },
      author: "Siddharth Rao",
      title: "Next-Gen Photonic Processors Demonstrate 10x Energy Efficiency for AI Inference",
      description: "Optical interconnects replace copper traces inside data center accelerators, slashing thermal bottlenecks for large multimodal models.",
      content: "Semiconductor researchers have unveiled a commercial-grade silicon photonics package capable of transmitting terabits of data per second using laser light pulses rather than electrical signals, dramatically cutting data center cooling requirements.",
      url: "https://arstechnica.com/",
      urlToImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(1),
      category: "technology",
    },
    {
      source: { id: "techcrunch", name: "TechCrunch" },
      author: "Maya Lin",
      title: "Open-Source Local-First Collaborative Apps Gain Momentum Among Enterprise Teams",
      description: "End-to-end encrypted CRDT sync engines allow instant offline editing without relying on centralized cloud latency.",
      content: "Software engineering and design teams are increasingly adopting local-first architectures powered by Conflict-Free Replicated Data Types (CRDTs), combining sub-millisecond UI responsiveness with cryptographic data ownership.",
      url: "https://techcrunch.com/",
      urlToImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(2.5),
      category: "technology",
    },
    {
      source: { id: "wired", name: "Wired" },
      author: "Jordan Thorne",
      title: "Solid-State Silicon-Anode Batteries Enter Mass Production for Flagship Laptops",
      description: "Higher volumetric energy density enables 28-hour real-world battery life in ultrathin notebooks without added weight.",
      content: "Consumer electronics manufacturers have begun shipping first-generation solid-state silicon-anode cells that boast a 40% increase in watt-hours per liter while supporting 80% fast-charge cycles in under 18 minutes.",
      url: "https://www.wired.com/",
      urlToImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(4),
      category: "technology",
    },
    {
      source: { id: "the-verge", name: "The Verge" },
      author: "Alex Rivera",
      title: "W3C Finalizes WebGPU 2.0 Compute Extensions for Browser-Native Scientific Computing",
      description: "Developers can now run complex fluid simulations, neural rendering, and CAD workloads directly inside standard web browsers.",
      content: "The latest WebGPU specification update brings subgroup operations and unified memory pointers to major desktop and mobile browsers, closing the performance gap between native desktop applications and zero-install web apps.",
      url: "https://www.theverge.com/",
      urlToImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(6),
      category: "technology",
    },
    {
      source: { id: "mit-tech-review", name: "MIT Technology Review" },
      author: "Clara Vance",
      title: "Post-Quantum TLS Encryption Reaches 85% Adoption Across Major Cloud Providers",
      description: "Hybrid lattice-based key exchange algorithms now protect billions of daily HTTPS connections against future quantum decryption.",
      content: "Internet infrastructure providers report that hybrid post-quantum cryptography handshakes have been deployed at scale with negligible latency overhead, securing financial, healthcare, and consumer traffic.",
      url: "https://www.technologyreview.com/",
      urlToImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(8.5),
      category: "technology",
    },
    {
      source: { id: "ieee-spectrum", name: "IEEE Spectrum" },
      author: "Kenji Takahashi",
      title: "Bipedal Warehouse Robots Complete 100,000 Autonomous Shift Hours Without Safety Incidents",
      description: "Tactile force-feedback hands and vision-language navigation models enable safe human-robot collaboration on factory floors.",
      content: "Equipped with compliant actuators and real-time spatial perception, humanoid logistics assistants have demonstrated reliable tote handling and dynamic obstacle avoidance across multi-shift industrial trials.",
      url: "https://spectrum.ieee.org/",
      urlToImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(11),
      category: "technology",
    },
  ],
  business: [
    {
      source: { id: "financial-times", name: "Financial Times" },
      author: "Arthur Pendelton",
      title: "Global Supply Chain Resilience Index Hits Five-Year High Amid Nearshoring Boom",
      description: "Diversified manufacturing hubs and AI-driven inventory forecasting have sharply reduced port congestion and component lead times.",
      content: "Corporate logistics officers report that multi-region sourcing strategies combined with real-time digital twin supply chain visibility have cut average freight disruptions by more than half over the past twelve months.",
      url: "https://www.ft.com/",
      urlToImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(2),
      category: "business",
    },
    {
      source: { id: "wall-street-journal", name: "Wall Street Journal" },
      author: "Rachel Greenwald",
      title: "Semiconductor Foundry Investments Spur Regional Tech Clusters & Skilled Job Growth",
      description: "New fabrication plants are attracting ratusan of specialized materials suppliers, university partnerships, and cleanroom training academies.",
      content: "Billions of dollars in private and public capital commitments are transforming regional industrial parks into vertically integrated microelectronics ecosystems, creating tens of thousands of technician and engineering roles.",
      url: "https://www.wsj.com/",
      urlToImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(4.5),
      category: "business",
    },
    {
      source: { id: "economist", name: "The Economist" },
      author: "Vikram Mehta",
      title: "Green Bonds and Transition Finance Outpace Conventional Corporate Debt Issuance",
      description: "Institutional investors increasingly tie lower borrowing rates to verified carbon-reduction milestones in heavy industry.",
      content: "Sustainability-linked debt instruments have matured into a cornerstone of industrial capital markets, with independent third-party telemetry verifying emissions reductions in steel, cement, and maritime shipping.",
      url: "https://www.economist.com/",
      urlToImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(6.5),
      category: "business",
    },
    {
      source: { id: "forbes", name: "Forbes" },
      author: "Sophia Martinez",
      title: "Four-Day Workweek Trials Report Sustained Productivity Gains Across 200 Firms",
      description: "Longitudinal study finds 34% drop in employee turnover and higher customer satisfaction scores with zero revenue loss.",
      content: "Companies participating in a two-year structured work-time reduction program maintained 100% compensation while streamlining meeting culture and asynchronous workflows, leading 91% of participating firms to make the policy permanent.",
      url: "https://www.forbes.com/",
      urlToImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(9),
      category: "business",
    },
  ],
  science: [
    {
      source: { id: "nature", name: "Nature" },
      author: "Dr. Aris Thorne",
      title: "James Webb & Ground ELT Spectroscopy Detect Water Vapor in Habitable-Zone Exoplanet",
      description: "Combined infrared transmission spectra reveal atmospheric cloud layers and carbon chemistry on a temperate super-Earth.",
      content: "Astronomers combining space-based infrared observations with adaptive-optics ground telescopes have confirmed persistent water vapor absorption bands in the atmosphere of a rocky exoplanet orbiting a nearby red dwarf star.",
      url: "https://www.nature.com/",
      urlToImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(1.8),
      category: "science",
    },
    {
      source: { id: "science-daily", name: "Science" },
      author: "Dr. Mei-Ling Zhou",
      title: "Room-Temperature Enzymatic Plastic Recycling Breaks Down PET in Under Four Hours",
      description: "Engineered depolymerase enzymes convert post-consumer polyester waste back into virgin-grade monomers with 98% yield.",
      content: "Biochemists using machine-guided protein design have stabilized a synthetic enzyme cocktail that rapidly deconstructs colored and mixed-textile polyester waste at mild temperatures, enabling closed-loop industrial recycling.",
      url: "https://www.science.org/",
      urlToImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(5),
      category: "science",
    },
    {
      source: { id: "new-scientist", name: "New Scientist" },
      author: "Lucas Vandenberg",
      title: "High-Temperature Superconducting Magnets Achieve Record Continuous Field Strength",
      description: "Compact REBCO tape coils pave the way for smaller, commercially viable magnetic confinement fusion reactors.",
      content: "Fusion energy engineers completed a 72-hour continuous stress test of a next-generation toroidal field magnet coil, demonstrating stable operation above 20 Tesla with markedly reduced cryogenic power consumption.",
      url: "https://www.newscientist.com/",
      urlToImage: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(8),
      category: "science",
    },
  ],
  health: [
    {
      source: { id: "stat-news", name: "STAT News" },
      author: "Dr. Ananya Deshmukh",
      title: "Personalized mRNA Neoantigen Vaccines Show 78% Recurrence Reduction in Phase 3 Trial",
      description: "Tailored immunotherapies designed from individual patient tumor sequencing train T-cells to eliminate microscopic residual disease.",
      content: "Multi-center clinical trial results presented at the annual oncology congress confirm that custom-synthesized mRNA vaccines delivered within six weeks of surgery produce durable, multi-year immune memory with minimal side effects.",
      url: "https://www.statnews.com/",
      urlToImage: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(2.2),
      category: "health",
    },
    {
      source: { id: "medical-news", name: "The Lancet" },
      author: "Claire Beaumont",
      title: "Non-Invasive Optical Wrist Sensors Achieve Clinical-Grade Continuous Hydration & Lactate Tracking",
      description: "Multi-wavelength Raman spectroscopy wearables help athletes and elderly patients prevent dehydration before symptoms appear.",
      content: "Clinical validation across 4,500 participants demonstrates that next-generation wearable optical sensors accurately quantify interstitial fluid balance and metabolic lactate thresholds without needles or disposable patches.",
      url: "https://www.thelancet.com/",
      urlToImage: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(5.5),
      category: "health",
    },
    {
      source: { id: "nih-news", name: "HealthDay" },
      author: "Marcus Sterling",
      title: "Mediterranean-Style Fermented Diet Linked to Improved Gut Microbiome Diversity and Sleep Quality",
      description: "Twelve-week nutritional intervention highlights the gut-brain axis role in restorative slow-wave sleep.",
      content: "Researchers tracking polysomnography and microbiome metabolomics found that participants consuming polyphenol-rich vegetables alongside daily fermented foods experienced a 24% increase in deep sleep duration.",
      url: "https://www.who.int/",
      urlToImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(9.5),
      category: "health",
    },
  ],
  sports: [
    {
      source: { id: "espn", name: "ESPN" },
      author: "Devon Brooks",
      title: "Champions League Quarterfinal Thriller Ends in Stoppage-Time Bicycle Kick Winner",
      description: "An unforgettable 94th-minute acrobatics goal seals a dramatic 4-3 aggregate comeback in front of 75,000 roaring fans.",
      content: "In one of the most electric knockout ties in recent memory, both clubs traded lead changes before a stunning stoppage-time overhead strike sent the home stadium into pandemonium and booked a place in the semifinals.",
      url: "https://www.espn.com/",
      urlToImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(1.2),
      category: "sports",
    },
    {
      source: { id: "the-athletic", name: "The Athletic" },
      author: "Rohan Gavaskar",
      title: "Biomechanics & Smart Ball Telemetry Transform Fast-Bowling Injury Prevention in Cricket",
      description: "Real-time lumbar load tracking and high-speed motion capture help pace bowlers sustain 150 km/h spells safely.",
      content: "National cricket academies have integrated millimeter-wave radar and wearable inertial measurement units into training sessions, identifying micro-adjustments in front-foot landing mechanics that reduce stress fractures by 45%.",
      url: "https://theathletic.com/",
      urlToImage: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(4),
      category: "sports",
    },
    {
      source: { id: "motorsport", name: "Formula 1 Media" },
      author: "Luca Moretti",
      title: "Sustainable Synthetic Fuels Deliver Identical Lap Times in Pre-Season Endurance Testing",
      description: "100% drop-in carbon-neutral racing fuel passes rigorous 5,000-kilometer dyno and track reliability benchmarks.",
      content: "Motorsport engineers confirmed that advanced e-fuels synthesized from captured atmospheric carbon and green hydrogen matched traditional racing fuel output to within 0.1% while running cleaner internal combustion temperatures.",
      url: "https://www.formula1.com/",
      urlToImage: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(7.5),
      category: "sports",
    },
  ],
  entertainment: [
    {
      source: { id: "variety", name: "Variety" },
      author: "Camille Laurent",
      title: "Independent Sci-Fi Epic Sweeps International Film Festival With Practical Effects Mastery",
      description: "Shot entirely on 65mm large-format film using miniature models and in-camera lighting, the drama earned a 12-minute standing ovation.",
      content: "Audiences and critics alike praised the tactile realism of the production, which eschewed green screens in favor of handcrafted architectural miniatures, optical cloud tanks, and a soaring orchestral score recorded live.",
      url: "https://variety.com/",
      urlToImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(2.8),
      category: "entertainment",
    },
    {
      source: { id: "rolling-stone", name: "Rolling Stone" },
      author: "Miles Sterling",
      title: "Spatial Audio Live Concert Streams Bring Symphony Halls to Global Classrooms",
      description: "Binaural microphone arrays allow music students worldwide to experience philharmonic performances from the conductor's podium perspective.",
      content: "Major symphony orchestras have partnered with public music education foundations to broadcast interactive, multi-angle spatial audio recitals free of charge to over 15,000 schools globally.",
      url: "https://www.rollingstone.com/",
      urlToImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(6),
      category: "entertainment",
    },
    {
      source: { id: "ign", name: "IGN" },
      author: "Elena Vance",
      title: "Cozy Architectural Restoration Game Crosses 10 Million Players in First Month",
      description: "Players collaborate to restore historic train stations, botanical gardens, and libraries using historically accurate craft tools.",
      content: "Combining relaxing acoustic soundscapes with intricate woodworking and masonry puzzles, the indie title has become a surprise word-of-mouth phenomenon across PC and console platforms.",
      url: "https://www.ign.com/",
      urlToImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80",
      publishedAt: hoursAgo(10),
      category: "entertainment",
    },
  ],
};

export function getFallbackArticles(category = "general") {
  const catArticles = FALLBACK_ARTICLES[category] || FALLBACK_ARTICLES.general;
  if (category === "general") {
    return [
      ...FALLBACK_ARTICLES.general,
      FALLBACK_ARTICLES.technology[0],
      FALLBACK_ARTICLES.business[0],
      FALLBACK_ARTICLES.science[0],
    ];
  }
  return catArticles;
}

export function formatRelativeTime(dateString) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently";
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatExactDateTime(dateString) {
  if (!dateString) return "Live";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recent";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getLocalDateKey(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  if (isNaN(date.getTime())) return "unknown";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateHeading(dateKey) {
  if (!dateKey || dateKey === "unknown") return "Recent Coverage";
  const todayKey = getLocalDateKey(new Date().toISOString());
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayKey = getLocalDateKey(yesterday.toISOString());

  const [year, month, day] = dateKey.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formattedFull = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (dateKey === todayKey) {
    return `Today — ${formattedFull}`;
  }
  if (dateKey === yesterdayKey) {
    return `Yesterday — ${formattedFull}`;
  }
  return formattedFull;
}

export const DATE_PRESETS = [
  { id: "all", label: "All Real-Time", icon: "bi-broadcast" },
  { id: "today", label: "Today", icon: "bi-lightning-charge" },
  { id: "yesterday", label: "Yesterday", icon: "bi-calendar-event" },
  { id: "7d", label: "Last 7 Days", icon: "bi-calendar-week" },
  { id: "30d", label: "Last 30 Days", icon: "bi-calendar-month" },
  { id: "custom", label: "Custom Date", icon: "bi-calendar-range" },
];

export function estimateReadingTime(article) {
  const text = `${article?.title || ""} ${article?.description || ""} ${article?.content || ""}`;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(2, Math.min(8, Math.ceil(words / 45)));
  return `${minutes} min read`;
}

export function cleanArticleContent(content, description) {
  const raw = content || description || "";
  const cleaned = raw.replace(/\s*\[\+\d+\s*chars\]\s*$/i, "").trim();
  if (!cleaned) {
    return "Full details for this developing story are available directly on the publisher's website. Click 'Read Full Story at Source' below to view the complete report, multimedia assets, and live updates.";
  }
  return cleaned;
}

import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";
const API_URL =
  import.meta.env.VITE_API_URL ?? `${API_BASE}/api/analytics`;
const NETWORK_URL = `${API_BASE}/api/network`;
const POSTS_URL = `${API_BASE}/api/posts`;
const TIMESERIES_URL = `${API_BASE}/api/timeseries`;
const INSIGHTS_URL = `${API_BASE}/api/insights`;

const SENTIMENT_COLORS = ["#16a34a", "#dc2626", "#6366f1"];
const LIVE_POLL_MS = 10000;

type Analytics = {
  total_posts: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  platforms: Record<string, number>;
  countries: Record<string, number>;
  trends: Record<string, number>;
  server_time?: string;
};

type NetworkNode = {
  id: string;
  type: "user" | "platform";
  degree: number;
  pagerank: number;
  betweenness: number;
  engagement: number;
};
type NetworkLink = { source: string; target: string };
type NetworkData = {
  nodes: NetworkNode[];
  links: NetworkLink[];
  stats: { nodes: number; edges: number; top_central: { id: string; degree: number }[] };
  influencers: { user: string; engagement: number; posts: number }[];
  server_time?: string;
};
type TimelinePoint = {
  period: string;
  total: number;
  positive: number;
  negative: number;
  neutral: number;
};
type TimelineData = {
  granularity: string;
  points: TimelinePoint[];
  server_time?: string;
};
type Insight = { id: string; title: string; body: string };

type Post = {
  id: number;
  user: string;
  platform: string;
  text: string;
  sentiment: string;
  ai_score: number;
  country: string;
  hashtags: string;
  likes: number;
  retweets: number;
  timestamp: string;
};
type PostsData = {
  total: number;
  limit: number;
  offset: number;
  posts: Post[];
  server_time?: string;
};

function App() {
  const [data, setData] = useState<Analytics | null>(null);
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [postsData, setPostsData] = useState<PostsData | null>(null);
  const [activePage, setActivePage] = useState("Overview");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [live, setLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [sentimentFilter, setSentimentFilter] = useState("All");
  const [postOffset, setPostOffset] = useState(0);
  const [netMax, setNetMax] = useState(30);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [sizeBy, setSizeBy] = useState<"degree" | "pagerank" | "engagement">("pagerank");
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [gran, setGran] = useState("month");
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [ask, setAsk] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  // Debounce topbar/explorer search into query
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPostOffset(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Lively auto-refresh ticker
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setReloadKey((k) => k + 1), LIVE_POLL_MS);
    return () => clearInterval(t);
  }, [live]);

  // Analytics (all pages)
  useEffect(() => {
    const controller = new AbortController();
    fetch(API_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((result) => {
        setData(result);
        setLastUpdated(new Date());
        setError(null);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error(err);
          setError(`Could not load analytics from ${API_URL}. Is the backend running?`);
        }
      });
    return () => controller.abort();
  }, [reloadKey]);

  // Network graph (only when visiting Network page)
  useEffect(() => {
    if (activePage !== "Network") return;
    const controller = new AbortController();
    fetch(`${NETWORK_URL}?max_users=${netMax}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => setNetwork(j))
      .catch((e) => {
        if (e?.name !== "AbortError") console.error("network:", e);
      });
    return () => controller.abort();
  }, [activePage, reloadKey, netMax]);

  // Live posts (only when visiting Data page)
  useEffect(() => {
    if (activePage !== "Data") return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      limit: "15",
      offset: String(postOffset),
      search,
      platform: platformFilter,
      sentiment: sentimentFilter,
    });
    fetch(`${POSTS_URL}?${params}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => setPostsData(j))
      .catch((e) => {
        if (e?.name !== "AbortError") console.error("posts:", e);
      });
    return () => controller.abort();
  }, [activePage, reloadKey, search, platformFilter, sentimentFilter, postOffset]);

  // Timeline series (only when visiting Timeline page)
  useEffect(() => {
    if (activePage !== "Timeline") return;
    const controller = new AbortController();
    fetch(`${TIMESERIES_URL}?granularity=${gran}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => setTimeline(j))
      .catch((e) => {
        if (e?.name !== "AbortError") console.error("timeline:", e);
      });
    return () => controller.abort();
  }, [activePage, reloadKey, gran]);

  // AI insights strip (Overview page)
  useEffect(() => {
    if (activePage !== "Overview") return;
    const controller = new AbortController();
    fetch(INSIGHTS_URL, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => setInsights(j.insights ?? []))
      .catch((e) => {
        if (e?.name !== "AbortError") console.error("insights:", e);
      });
    return () => controller.abort();
  }, [activePage, reloadKey]);

  const submitAsk = () => {
    const q = ask.trim();
    if (!q || asking) return;
    setAsking(true);
    fetch(`${INSIGHTS_URL}?q=${encodeURIComponent(q)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        setAnswer(j.answer ?? "No answer available.");
        if (j.insights) setInsights(j.insights);
      })
      .catch((e) => {
        console.error("ask:", e);
        setAnswer("Could not reach the insights engine. Is the backend running?");
      })
      .finally(() => setAsking(false));
  };

  // SVG layout for network graph (platforms inner ring, users outer ring)
  const netLayout = useMemo(() => {
    if (!network) return { pos: new Map<string, { x: number; y: number }>(), W: 800, H: 520 };
    const W = 800, H = 520, cx = W / 2, cy = H / 2;
    const platforms = network.nodes.filter((n) => n.type === "platform");
    const users = network.nodes.filter((n) => n.type === "user");
    const pos = new Map<string, { x: number; y: number }>();
    platforms.forEach((n, i) => {
      const a = (2 * Math.PI * i) / Math.max(platforms.length, 1) - Math.PI / 2;
      pos.set(n.id, { x: cx + 95 * Math.cos(a), y: cy + 80 * Math.sin(a) });
    });
    users.forEach((n, i) => {
      const a = (2 * Math.PI * i) / Math.max(users.length, 1) - Math.PI / 2;
      pos.set(n.id, { x: cx + 250 * Math.cos(a), y: cy + 200 * Math.sin(a) });
    });
    return { pos, W, H };
  }, [network]);

  if (error) {
    return (
      <div className="loading-screen">
        <div>
          <h2>Social Intelligence Hub</h2>
          <p>{error}</p>
          <button className="refresh-button" onClick={() => { setError(null); setReloadKey((k) => k + 1); }}>
            ↻ Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="loading-screen">
        <div>
          <h2>Social Intelligence Hub</h2>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const sentimentData = [
    { name: "Positive", value: data.sentiment.positive },
    { name: "Negative", value: data.sentiment.negative },
    { name: "Neutral", value: data.sentiment.neutral },
  ];

  const platformData = Object.entries(data.platforms).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const countryData = Object.entries(data.countries).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const trendData = Object.entries(data.trends).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const positivePercentage = data.total_posts
    ? Math.round((data.sentiment.positive / data.total_posts) * 100)
    : 0;

  const negativePercentage = data.total_posts
    ? Math.round((data.sentiment.negative / data.total_posts) * 100)
    : 0;

  const neutralPercentage = data.total_posts
    ? Math.round((data.sentiment.neutral / data.total_posts) * 100)
    : 0;

  const topCountryValue = countryData[0]?.value ?? 1;

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">SI</div>
          <div>
            <h2>Social Intelligence</h2>
            <span>Analytics Hub</span>
          </div>
        </div>

        <nav className="nav">

          <button
            className={activePage === "Overview" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("Overview")}
          >
            <span>⌂</span>
            Overview
          </button>

          <button
            className={activePage === "Sentiment" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("Sentiment")}
          >
            <span>◉</span>
            Sentiment
          </button>

          <button
            className={activePage === "Trends" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("Trends")}
          >
            <span>↗</span>
            Trends
          </button>

          <button
            className={activePage === "Demographics" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("Demographics")}
          >
            <span>◎</span>
            Demographics
          </button>

          <button
            className={activePage === "Network" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("Network")}
          >
            <span>⌘</span>
            Network
          </button>

          <button
            className={activePage === "Timeline" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("Timeline")}
          >
            <span>◷</span>
            Timeline
          </button>

          <button
            className={activePage === "Data" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("Data")}
          >
            <span>▤</span>
            Data Explorer
          </button>

        </nav>

        <div className="sidebar-bottom">
          <div className="system-box">
            <span className="online-dot"></span>
            <div>
              <strong>System Active</strong>
              <small>Analytics engine online</small>
            </div>
          </div>
        </div>

      </aside>


      {/* MAIN CONTENT */}
      <div className="main-area">

        {/* TOPBAR */}
        <header className="topbar">

          <div className="breadcrumb">
            <span>Analytics</span>
            <b>/</b>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">

            <div className="search">
              <span>⌕</span>
              <input
                placeholder="Search posts, users, tags..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (activePage !== "Data") setActivePage("Data");
                }}
              />
            </div>

            <button
              className="icon-button"
              title={live ? "Live updates ON — click to pause" : "Paused — click to resume live"}
              onClick={() => setLive((v) => !v)}
            >
              {live ? "🔔" : "🔕"}
            </button>

            <div className="profile">
              <div className="avatar">A</div>
              <div>
                <strong>Analyst</strong>
                <small>Admin</small>
              </div>
            </div>

          </div>

        </header>


        <main className="content">

          {/* PAGE HEADER */}
          <section className="page-heading">

            <div>
              <h1>{activePage}</h1>

              <p>
                Monitor conversations, sentiment and emerging trends
                across social platforms.{" "}
                <span className={live ? "live-badge on" : "live-badge off"}>
                  <span className="live-dot" />{live ? `LIVE · refreshes every ${LIVE_POLL_MS / 1000}s` : "PAUSED"}
                </span>
                {lastUpdated && (
                  <span className="updated-at">
                    {" "}· Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>

            <div className="filters">

              <button
                className={live ? "filter-button live-on" : "filter-button"}
                onClick={() => setLive((v) => !v)}
                title="Toggle lively auto-refresh"
              >
                {live ? "⏸ Pause live" : "▶ Go live"}
              </button>

              <button className="refresh-button" onClick={() => setReloadKey((k) => k + 1)}>
                ↻ Refresh now
              </button>

            </div>

          </section>


          {/* OVERVIEW */}
          {activePage === "Overview" && (
            <>

              {/* KPI CARDS */}
              <section className="stats-grid">

                <div className="stat-card">
                  <div className="stat-icon blue">◉</div>
                  <div>
                    <span>Total Posts</span>
                    <h2>{data.total_posts.toLocaleString()}</h2>
                    <small className="positive-text">Dataset analyzed</small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">↑</div>
                  <div>
                    <span>Positive Sentiment</span>
                    <h2>{positivePercentage}%</h2>
                    <small>{data.sentiment.positive} posts</small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon red">↓</div>
                  <div>
                    <span>Negative Sentiment</span>
                    <h2>{negativePercentage}%</h2>
                    <small>{data.sentiment.negative} posts</small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon purple">◌</div>
                  <div>
                    <span>Neutral Sentiment</span>
                    <h2>{neutralPercentage}%</h2>
                    <small>{data.sentiment.neutral} posts</small>
                  </div>
                </div>

              </section>


              {/* MAIN CHART ROW */}
              <section className="dashboard-grid">

                <div className="dashboard-card large-card">

                  <div className="card-heading">
                    <div>
                      <h3>Sentiment Overview</h3>
                      <p>AI-classified sentiment across collected posts</p>
                    </div>

                    <button className="more-button">•••</button>
                  </div>

                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={330}>
                      <PieChart>

                        <Pie
                          data={sentimentData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={120}
                          paddingAngle={3}
                          label
                        >
                          {sentimentData.map((_, index) => (
                            <Cell key={index} fill={SENTIMENT_COLORS[index % SENTIMENT_COLORS.length]} />
                          ))}
                        </Pie>

                        <Tooltip />
                        <Legend />

                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                </div>


                <div className="dashboard-card">

                  <div className="card-heading">
                    <div>
                      <h3>Platform Distribution</h3>
                      <p>Posts by social platform</p>
                    </div>

                    <button className="more-button">•••</button>
                  </div>

                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={330}>
                      <BarChart data={platformData}>

                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />

                        <XAxis dataKey="name" />

                        <YAxis />

                        <Tooltip />

                        <Bar
                          dataKey="value"
                          radius={[6, 6, 0, 0]}
                        />

                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                </div>

              </section>


              {/* SECOND ROW */}
              <section className="dashboard-grid">

                <div className="dashboard-card">

                  <div className="card-heading">
                    <div>
                      <h3>Trending Topics</h3>
                      <p>Most frequently discussed hashtags</p>
                    </div>
                  </div>

                  <div className="trend-list">

                    {trendData.slice(0, 7).map((trend, index) => (

                      <div className="trend-item" key={trend.name}>

                        <div className="trend-rank">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="trend-name">
                          <strong>{trend.name}</strong>
                          <span>Trending topic</span>
                        </div>

                        <div className="trend-count">
                          {trend.value}
                        </div>

                        <div className="trend-arrow">↗</div>

                      </div>

                    ))}

                  </div>

                </div>


                <div className="dashboard-card">

                  <div className="card-heading">
                    <div>
                      <h3>Audience Geography</h3>
                      <p>Posts grouped by country</p>
                    </div>
                  </div>

                  <div className="country-list">

                    {countryData.slice(0, 7).map((country, index) => (

                      <div className="country-item" key={country.name}>

                        <div className="country-info">
                          <span className="country-rank">
                            {index + 1}
                          </span>

                          <strong>{country.name}</strong>
                        </div>

                        <div className="country-bar-wrapper">

                          <div
                            className="country-bar"
                            style={{
                              width: `${Math.max(
                                8,
                                (country.value / topCountryValue) * 100
                              )}%`,
                            }}
                          />

                        </div>

                        <span className="country-value">
                          {country.value}
                        </span>

                      </div>

                    ))}

                  </div>

                </div>

              </section>


              {/* AI INSIGHTS */}
              <section className="dashboard-card">

                <div className="card-heading">
                  <div>
                    <h3>AI Insights {live && <span className="live-badge on"><span className="live-dot" />LIVE</span>}</h3>
                    <p>Auto-generated takeaways + ask the assistant</p>
                  </div>
                </div>

                <div className="insight-list">
                  {!insights ? (
                    <p className="section-description">Loading insights…</p>
                  ) : (
                    insights.slice(0, 4).map((ins) => (
                      <div className="insight-item" key={ins.id}>
                        <strong>{ins.title}</strong>
                        <span>{ins.body}</span>
                      </div>
                    ))
                  )}
                </div>

                {answer && <p className="assistant-answer">🤖 {answer}</p>}

                <div className="explorer-controls">
                  <div className="search wide">
                    <span>🤖</span>
                    <input
                      placeholder='Ask: "Why is sentiment negative?"'
                      value={ask}
                      onChange={(e) => setAsk(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") submitAsk(); }}
                    />
                  </div>
                  <button
                    className="refresh-button"
                    onClick={submitAsk}
                    disabled={asking || !ask.trim()}
                  >
                    {asking ? "Thinking…" : "Ask"}
                  </button>
                </div>

              </section>

            </>
          )}


          {/* SENTIMENT PAGE */}
          {activePage === "Sentiment" && (
            <section className="full-page-card">

              <h2>Sentiment Intelligence</h2>

              <p className="section-description">
                AI-powered analysis of emotional polarity across social
                media conversations.
              </p>

              <div className="sentiment-page-grid">

                <div className="big-number">
                  <span>Positive</span>
                  <strong>{positivePercentage}%</strong>
                  <small>{data.sentiment.positive} posts</small>
                </div>

                <div className="big-number">
                  <span>Negative</span>
                  <strong>{negativePercentage}%</strong>
                  <small>{data.sentiment.negative} posts</small>
                </div>

                <div className="big-number">
                  <span>Neutral</span>
                  <strong>{neutralPercentage}%</strong>
                  <small>{data.sentiment.neutral} posts</small>
                </div>

              </div>

              <ResponsiveContainer width="100%" height={400}>
                <PieChart>

                  <Pie
                    data={sentimentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={150}
                    label
                  >
                    {sentimentData.map((_, index) => (
                      <Cell key={index} fill={SENTIMENT_COLORS[index % SENTIMENT_COLORS.length]} />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />

                </PieChart>
              </ResponsiveContainer>

            </section>
          )}


          {/* TRENDS PAGE */}
          {activePage === "Trends" && (
            <section className="full-page-card">

              <h2>Trend Detection</h2>

              <p className="section-description">
                Frequently appearing topics and hashtags detected from
                social media content.
              </p>

              <ResponsiveContainer width="100%" height={500}>

                <BarChart
                  data={trendData}
                  layout="vertical"
                  margin={{ left: 30, right: 30 }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                  />

                  <XAxis type="number" />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </section>
          )}


          {/* DEMOGRAPHICS PAGE */}
          {activePage === "Demographics" && (
            <section className="full-page-card">

              <h2>Demographic Insights</h2>

              <p className="section-description">
                Geographic distribution of the analyzed social media
                audience.
              </p>

              <ResponsiveContainer width="100%" height={500}>

                <BarChart data={countryData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </section>
          )}


          {/* TIMELINE PAGE — volume + sentiment over time */}
          {activePage === "Timeline" && (
            <section className="full-page-card">

              <h2>Timeline Analytics {live && <span className="live-badge on"><span className="live-dot" />LIVE</span>}</h2>

              <p className="section-description">
                Post volume and sentiment momentum over time. Auto-refreshes with the lively feed.
              </p>

              <div className="net-controls">
                <label>
                  Granularity
                  <select value={gran} onChange={(e) => setGran(e.target.value)}>
                    <option value="day">Daily</option>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </label>
                {timeline && (
                  <span className="net-stats">
                    {timeline.points.length} periods ·{" "}
                    {timeline.points.reduce((a, p) => a + p.total, 0)} posts
                  </span>
                )}
              </div>

              {!timeline ? (
                <p className="section-description">Loading timeline…</p>
              ) : timeline.points.length === 0 ? (
                <p className="section-description">No data for this granularity.</p>
              ) : (
                <ResponsiveContainer width="100%" height={460}>
                  <AreaChart data={timeline.points} margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 10 }}
                      minTickGap={40}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="positive"
                      stackId="1"
                      stroke={SENTIMENT_COLORS[0]}
                      fill={SENTIMENT_COLORS[0]}
                      fillOpacity={0.55}
                      name="Positive"
                    />
                    <Area
                      type="monotone"
                      dataKey="negative"
                      stackId="1"
                      stroke={SENTIMENT_COLORS[1]}
                      fill={SENTIMENT_COLORS[1]}
                      fillOpacity={0.55}
                      name="Negative"
                    />
                    <Area
                      type="monotone"
                      dataKey="neutral"
                      stackId="1"
                      stroke={SENTIMENT_COLORS[2]}
                      fill={SENTIMENT_COLORS[2]}
                      fillOpacity={0.55}
                      name="Neutral"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

            </section>
          )}


          {/* NETWORK PAGE — live user↔platform graph */}
          {activePage === "Network" && (
            <section className="full-page-card">

              <h2>Network Intelligence {live && <span className="live-badge on"><span className="live-dot" />LIVE</span>}</h2>

              <p className="section-description">
                Live user↔platform influence graph. Node size = connection degree.
                Click a node to inspect it. Auto-refreshes with the lively feed.
              </p>

              <div className="net-controls">
                <label>
                  Top users
                  <select value={netMax} onChange={(e) => setNetMax(Number(e.target.value))}>
                    {[10, 20, 30, 50, 75].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Node size
                  <select value={sizeBy} onChange={(e) => setSizeBy(e.target.value as typeof sizeBy)}>
                    <option value="pagerank">PageRank</option>
                    <option value="degree">Degree</option>
                    <option value="engagement">Engagement</option>
                  </select>
                </label>
                {network && (
                  <span className="net-stats">
                    {network.stats.nodes} nodes · {network.stats.edges} edges
                  </span>
                )}
                <span className="net-legend">
                  <span className="legend-swatch hub" /> platform
                  <span className="legend-swatch user" /> user
                </span>
                {selectedNode && (
                  <button className="filter-button" onClick={() => setSelectedNode(null)}>
                    ✕ Clear selection ({selectedNode})
                  </button>
                )}
              </div>

              {!network ? (
                <p className="section-description">Loading live network…</p>
              ) : (
                <>
                  <svg
                    className="net-svg"
                    viewBox={`0 0 ${netLayout.W} ${netLayout.H}`}
                    role="img"
                    aria-label="User platform network graph"
                  >
                    {network.links.map((l, i) => {
                      const a = netLayout.pos.get(l.source);
                      const b = netLayout.pos.get(l.target);
                      if (!a || !b) return null;
                      const active =
                        selectedNode && (l.source === selectedNode || l.target === selectedNode);
                      return (
                        <line
                          key={i}
                          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                          className={selectedNode && !active ? "net-link dim" : "net-link"}
                        />
                      );
                    })}
                    {network.nodes.map((n) => {
                      const p = netLayout.pos.get(n.id);
                      if (!p) return null;
                      const isHub = n.type === "platform";
                      const maxPR = Math.max(
                        1e-9,
                        ...network.nodes
                          .filter((m) => m.type === "user")
                          .map((m) => m.pagerank)
                      );
                      const r = isHub
                        ? 26
                        : sizeBy === "pagerank"
                          ? Math.min(22, 6 + (n.pagerank / maxPR) * 16)
                          : sizeBy === "engagement"
                            ? Math.min(22, 6 + Math.log10(1 + n.engagement) * 6)
                            : Math.min(18, 7 + n.degree * 2);
                      const dim = selectedNode && selectedNode !== n.id &&
                        !network.links.some(
                          (l) =>
                            (l.source === selectedNode && l.target === n.id) ||
                            (l.target === selectedNode && l.source === n.id)
                        );
                      return (
                        <g
                          key={n.id}
                          transform={`translate(${p.x},${p.y})`}
                          className={dim ? "net-node dim" : "net-node"}
                          onClick={() => setSelectedNode(n.id === selectedNode ? null : n.id)}
                        >
                          <circle
                            r={r}
                            className={isHub ? "net-hub" : "net-user"}
                          />
                          <text y={r + 13} textAnchor="middle" className="net-label">
                            {n.id.length > 14 ? n.id.slice(0, 13) + "…" : n.id}
                          </text>
                          <title>{`${n.id} (${n.type}, degree ${n.degree}, pagerank ${n.pagerank}, engagement ${n.engagement})`}</title>
                        </g>
                      );
                    })}
                  </svg>

                  <div className="net-central">
                    <strong>Top hubs:</strong>{" "}
                    {network.stats.top_central.map((c) => (
                      <button
                        key={c.id}
                        className={selectedNode === c.id ? "chip active" : "chip"}
                        onClick={() => setSelectedNode(c.id === selectedNode ? null : c.id)}
                      >
                        {c.id} · {c.degree}
                      </button>
                    ))}
                  </div>

                  {selectedNode && (() => {
                    const n = network.nodes.find((m) => m.id === selectedNode);
                    if (!n) return null;
                    return (
                      <div className="node-detail">
                        <strong>{n.id}</strong>
                        <span>{n.type}</span>
                        <span>degree {n.degree}</span>
                        <span>pagerank {n.pagerank}</span>
                        <span>betweenness {n.betweenness}</span>
                        <span>engagement {n.engagement}</span>
                      </div>
                    );
                  })()}

                  {network.influencers.length > 0 && (
                    <div className="net-central">
                      <strong>Top voices by engagement:</strong>{" "}
                      {network.influencers.slice(0, 5).map((f) => (
                        <button
                          key={f.user}
                          className={selectedNode === f.user ? "chip active" : "chip"}
                          onClick={() => setSelectedNode(f.user === selectedNode ? null : f.user)}
                        >
                          {f.user} · ♥{f.engagement} · {f.posts} posts
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

            </section>
          )}


          {/* DATA PAGE — live explorer */}
          {activePage === "Data" && (
            <section className="full-page-card">

              <h2>
                Data Explorer{" "}
                {live
                  ? <span className="live-badge on"><span className="live-dot" />LIVE</span>
                  : <span className="live-badge off">PAUSED</span>}
              </h2>

              <p className="section-description">
                Live, searchable post feed — most recent first. Updates every{" "}
                {LIVE_POLL_MS / 1000}s while live.
                {postsData && ` Showing ${postsData.posts.length} of ${postsData.total} matches.`}
              </p>

              <div className="data-summary">

                <div>
                  <span>Records</span>
                  <strong>{data.total_posts}</strong>
                </div>

                <div>
                  <span>Platforms</span>
                  <strong>{Object.keys(data.platforms).length}</strong>
                </div>

                <div>
                  <span>Countries</span>
                  <strong>{Object.keys(data.countries).length}</strong>
                </div>

                <div>
                  <span>Trending Topics</span>
                  <strong>{Object.keys(data.trends).length}</strong>
                </div>

              </div>

              <div className="explorer-controls">
                <div className="search wide">
                  <span>⌕</span>
                  <input
                    placeholder="Search text, user, hashtag..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <select
                  className="filter-button"
                  value={platformFilter}
                  onChange={(e) => { setPlatformFilter(e.target.value); setPostOffset(0); }}
                >
                  <option value="All">All platforms</option>
                  {Object.keys(data.platforms).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <select
                  className="filter-button"
                  value={sentimentFilter}
                  onChange={(e) => { setSentimentFilter(e.target.value); setPostOffset(0); }}
                >
                  {["All", "positive", "negative", "neutral"].map((s) => (
                    <option key={s} value={s}>
                      {s === "All" ? "All sentiments" : s}
                    </option>
                  ))}
                </select>
                <button
                  className={live ? "filter-button live-on" : "filter-button"}
                  onClick={() => setLive((v) => !v)}
                >
                  {live ? "⏸ Pause" : "▶ Go live"}
                </button>
              </div>

              {!postsData ? (
                <p className="section-description">Loading live posts…</p>
              ) : postsData.posts.length === 0 ? (
                <p className="section-description">No posts match these filters.</p>
              ) : (
                <>
                  <div className="table-wrap">
                    <table className="live-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Platform</th>
                          <th>Post</th>
                          <th>Sentiment</th>
                          <th>♥/↻</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {postsData.posts.map((p) => (
                          <tr key={p.id}>
                            <td className="mono">{p.user}</td>
                            <td>{p.platform}</td>
                            <td className="post-text" title={`${p.hashtags} · ${p.country}`}>
                              {p.text.length > 120 ? p.text.slice(0, 119) + "…" : p.text}
                              <span className="post-meta">{p.hashtags} · {p.country}</span>
                            </td>
                            <td>
                              <span className={`sentiment-pill ${p.sentiment}`}>
                                {p.sentiment} · {Math.round(p.ai_score * 100)}%
                              </span>
                            </td>
                            <td className="mono">{p.likes}/{p.retweets}</td>
                            <td className="mono small">{p.timestamp || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pager">
                    <button
                      className="filter-button"
                      disabled={postOffset === 0}
                      onClick={() => setPostOffset((o) => Math.max(0, o - 15))}
                    >
                      ← Newer
                    </button>
                    <span>
                      {postOffset + 1}–{Math.min(postOffset + 15, postsData.total)} of {postsData.total}
                    </span>
                    <button
                      className="filter-button"
                      disabled={postOffset + 15 >= postsData.total}
                      onClick={() => setPostOffset((o) => o + 15)}
                    >
                      Older →
                    </button>
                  </div>
                </>
              )}

            </section>
          )}

        </main>

      </div>

    </div>
  );
}

export default App;
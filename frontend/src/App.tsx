import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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
};

function App() {
  const [data, setData] = useState<Analytics | null>(null);
  const [activePage, setActivePage] = useState("Overview");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/analytics")
      .then((response) => response.json())
      .then((result) => setData(result))
      .catch((error) => console.error(error));
  }, []);

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

  const positivePercentage = Math.round(
    (data.sentiment.positive / data.total_posts) * 100
  );

  const negativePercentage = Math.round(
    (data.sentiment.negative / data.total_posts) * 100
  );

  const neutralPercentage = Math.round(
    (data.sentiment.neutral / data.total_posts) * 100
  );

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
              <input placeholder="Search analytics..." />
            </div>

            <button className="icon-button">🔔</button>

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
                across social platforms.
              </p>
            </div>

            <div className="filters">

              <button className="filter-button">
                All Platforms ▾
              </button>

              <button className="filter-button">
                All Time ▾
              </button>

              <button className="refresh-button">
                ↻ Refresh
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
                            <Cell key={index} />
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
                                (country.value / countryData[0].value) * 100
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
                      <Cell key={index} />
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


          {/* NETWORK PAGE */}
          {activePage === "Network" && (
            <section className="full-page-card">

              <div className="coming-soon">

                <div className="coming-icon">⌘</div>

                <h2>Network Intelligence</h2>

                <p>
                  Influence mapping, user relationships and information
                  propagation analysis will appear here.
                </p>

                <span>Module E connected</span>

              </div>

            </section>
          )}


          {/* DATA PAGE */}
          {activePage === "Data" && (
            <section className="full-page-card">

              <h2>Data Explorer</h2>

              <p className="section-description">
                Current dataset overview.
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

            </section>
          )}

        </main>

      </div>

    </div>
  );
}

export default App;
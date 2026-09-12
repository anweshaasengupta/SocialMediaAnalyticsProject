from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from functools import lru_cache
from pathlib import Path
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import networkx as nx
import pandas as pd
import re
from collections import Counter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://127.0.0.1:5173",
                   ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _resolve_csv() -> Path:
    here = Path(__file__).resolve()
    candidates = [
        here.parent.parent / "social_media_sentiment.csv",
        here.parent / "social_media_sentiment.csv",
        Path.cwd() / "social_media_sentiment.csv",
        Path.cwd().parent / "social_media_sentiment.csv",
    ]
    for p in candidates:
        if p.is_file():
            return p
    raise FileNotFoundError(
        "social_media_sentiment.csv not found. Searched: "
        + ", ".join(str(p) for p in candidates)
    )


@lru_cache(maxsize=1)
def get_df() -> pd.DataFrame:
    try:
        df = pd.read_csv(_resolve_csv())
    except FileNotFoundError:
        raise
    except Exception as exc:
        raise RuntimeError(f"Failed to load CSV: {exc}") from exc
    required = {"AI_Sentiment", "Platform", "Country", "Hashtags"}
    missing = required - set(df.columns)
    if missing:
        raise RuntimeError(f"CSV missing required columns: {sorted(missing)}")
    return df


def _load() -> pd.DataFrame:
    """Load cached dataframe or raise a 500 with a clear message."""
    try:
        return get_df()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


def _clean(series: pd.Series) -> pd.Series:
    """Strip whitespace and drop stringified nulls."""
    return series.astype(str).str.strip().replace(
        {"nan": pd.NA, "None": pd.NA, "": pd.NA}
    )


def _sentiment(df: pd.DataFrame) -> pd.Series:
    """Normalized lowercase sentiment labels."""
    return df["AI_Sentiment"].astype(str).str.strip().str.lower()


def _hashtag_counts(df: pd.DataFrame) -> Counter:
    tags: Counter = Counter()
    for raw in df["Hashtags"].dropna():
        tags.update(re.findall(r"#\w+", str(raw).lower()))
    return tags


@app.get("/")
def home():
    return {"message": "Social Media Analytics Backend is running"}


@app.get("/api/analytics")
def analytics():
    df = _load()

    top_hashtags = _hashtag_counts(df).most_common(10)

    countries = (
        _clean(df["Country"]).dropna().value_counts().head(10).to_dict()
    )

    sentiment_norm = _sentiment(df)

    platforms = _clean(df["Platform"]).dropna().value_counts().to_dict()

    return {
        "total_posts": len(df),

        "sentiment": {
            "positive": int((sentiment_norm == "positive").sum()),
            "negative": int((sentiment_norm == "negative").sum()),
            "neutral": int((sentiment_norm == "neutral").sum())
        },

        "platforms": platforms,

        "countries": countries,

        "trends": dict(top_hashtags),

        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/network")
def network(max_users: int = Query(30, ge=5, le=100)):
    df = _load()

    sub = df.copy()
    sub["User"] = sub["User"].astype(str).str.strip()
    sub["Platform"] = sub["Platform"].astype(str).str.strip()
    sub = sub[
        sub["User"].notna()
        & sub["Platform"].notna()
        & (sub["User"].str.lower() != "nan")
        & (sub["Platform"].str.lower() != "nan")
    ]
    top_users = sub["User"].value_counts().head(max_users).index.tolist()
    sub = sub[sub["User"].isin(top_users)]

    G = nx.Graph()
    for _, row in sub.iterrows():
        u, p = str(row["User"]), str(row["Platform"])
        G.add_edge(u, p)

    pagerank = nx.pagerank(G) if G.number_of_nodes() else {}
    betweenness = nx.betweenness_centrality(G) if G.number_of_nodes() else {}

    # Engagement proxy for influence: likes + reposts per user (full dataset)
    eng = df.copy()
    eng["User"] = eng["User"].astype(str).str.strip()
    likes = pd.to_numeric(eng["Likes"], errors="coerce").fillna(0)
    reposts = pd.to_numeric(eng["Retweets"], errors="coerce").fillna(0)
    eng_score = (likes + reposts).groupby(eng["User"]).sum()
    eng_count = eng["User"].value_counts()
    influencers = [
        {
            "user": u,
            "engagement": round(float(eng_score.get(u, 0)), 1),
            "posts": int(eng_count.get(u, 0)),
        }
        for u in eng_score.sort_values(ascending=False).head(8).index
    ]

    nodes: dict[str, dict] = {}
    links: list[dict] = []
    top_set = set(top_users)
    for u, p in G.edges():
        for nid in (u, p):
            nodes.setdefault(
                nid,
                {"id": nid, "type": "user" if nid in top_set else "platform", "degree": 0},
            )
        links.append({"source": u, "target": p})
        nodes[u]["degree"] += 1
        nodes[p]["degree"] += 1
    for nid, n in nodes.items():
        n["pagerank"] = round(float(pagerank.get(nid, 0)), 5)
        n["betweenness"] = round(float(betweenness.get(nid, 0)), 4)
        n["engagement"] = round(float(eng_score.get(nid, 0)), 1)

    top_central = sorted(
        ((n["id"], n["degree"]) for n in nodes.values()), key=lambda x: x[1], reverse=True
    )[:5]

    return {
        "nodes": list(nodes.values()),
        "links": links,
        "stats": {
            "nodes": len(nodes),
            "edges": len(links),
            "top_central": [{"id": i, "degree": d} for i, d in top_central],
        },
        "influencers": influencers,
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/posts")
def posts(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: str = Query("", max_length=200),
    platform: str = Query("All", max_length=50),
    sentiment: str = Query("All", max_length=20),
):
    df = _load()

    sub = df.copy()
    sub["Platform"] = sub["Platform"].astype(str).str.strip()
    sub["AI_Sentiment"] = sub["AI_Sentiment"].astype(str).str.strip().str.lower()
    sub["User"] = sub["User"].astype(str).str.strip()
    sub["Country"] = sub["Country"].astype(str).str.strip()

    if platform != "All":
        sub = sub[sub["Platform"].str.lower() == platform.strip().lower()]
    if sentiment != "All":
        sub = sub[sub["AI_Sentiment"] == sentiment.strip().lower()]
    if search.strip():
        q = search.strip().lower()
        mask = (
            sub["Text"].astype(str).str.lower().str.contains(q, na=False)
            | sub["User"].str.lower().str.contains(q, na=False)
            | sub["Hashtags"].astype(str).str.lower().str.contains(q, na=False)
        )
        sub = sub[mask]

    # Most recent first when Timestamp exists
    if "Timestamp" in sub.columns:
        ts = pd.to_datetime(sub["Timestamp"], errors="coerce")
        sub = sub.assign(_ts=ts).sort_values("_ts", ascending=False, na_position="last").drop(columns=["_ts"])

    total = len(sub)
    page = sub.iloc[offset : offset + limit]

    out = []
    for i, row in page.iterrows():
        out.append(
            {
                "id": int(i),
                "user": str(row.get("User", "")),
                "platform": str(row.get("Platform", "")),
                "text": str(row.get("Text", "")),
                "sentiment": str(row.get("AI_Sentiment", "")),
                "ai_score": float(row.get("AI_Score", 0) or 0),
                "country": str(row.get("Country", "")),
                "hashtags": str(row.get("Hashtags", "")),
                "likes": float(row.get("Likes", 0) or 0),
                "retweets": float(row.get("Retweets", 0) or 0),
                "timestamp": str(row.get("Timestamp", "")),
            }
        )

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "posts": out,
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/sentiment")
def sentiment():
    """Module B: sentiment distribution, per-platform split, mean AI score."""
    df = _load()
    norm = _sentiment(df)
    dist = {
        "positive": int((norm == "positive").sum()),
        "negative": int((norm == "negative").sum()),
        "neutral": int((norm == "neutral").sum()),
    }
    by_platform: dict[str, dict[str, int]] = {}
    for plat, grp in df.groupby(_clean(df["Platform"]).fillna("Unknown")):
        g = _sentiment(grp)
        by_platform[str(plat)] = {
            "positive": int((g == "positive").sum()),
            "negative": int((g == "negative").sum()),
            "neutral": int((g == "neutral").sum()),
        }
    scores = pd.to_numeric(df.get("AI_Score"), errors="coerce").dropna()
    return {
        "total": len(df),
        "distribution": dist,
        "by_platform": by_platform,
        "avg_score": round(float(scores.mean()), 4) if len(scores) else 0.0,
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/demographics")
def demographics(top: int = Query(10, ge=1, le=50)):
    """Module C: top countries, platform split, active users, hourly activity."""
    df = _load()
    hours = pd.to_numeric(df.get("Hour"), errors="coerce").dropna().astype(int)
    hours = hours[(hours >= 0) & (hours <= 23)]
    return {
        "countries": _clean(df["Country"]).dropna().value_counts().head(top).to_dict(),
        "platforms": _clean(df["Platform"]).dropna().value_counts().to_dict(),
        "top_users": _clean(df["User"]).dropna().value_counts().head(top).to_dict(),
        "activity_by_hour": {str(h): int((hours == h).sum()) for h in range(24)},
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/trends")
def trends(top: int = Query(10, ge=1, le=50)):
    """Module D: trending hashtags with totals + recent-vs-past momentum."""
    df = _load()
    counts = _hashtag_counts(df)
    top_tags = [t for t, _ in counts.most_common(top)]

    # Momentum: split corpus at median timestamp, % change per tag
    growth: dict[str, float | None] = {}
    gainers: list[dict] = []
    if "Timestamp" in df.columns:
        ts = pd.to_datetime(df["Timestamp"], errors="coerce")
        med = ts.median()
        past = _hashtag_counts(df[ts <= med])
        recent = _hashtag_counts(df[ts > med])
        for tag in top_tags:
            p, r = past.get(tag, 0), recent.get(tag, 0)
            growth[tag] = round((r - p) / p * 100, 1) if p else None
        gainers = sorted(
            (
                {"tag": t, "growth_pct": round((recent[t] - past.get(t, 0)) / past[t] * 100, 1),
                 "recent": recent[t]}
                for t in recent
                if past.get(t, 0) >= 2 and recent[t] >= 3
            ),
            key=lambda x: x["growth_pct"],
            reverse=True,
        )[:5]

    return {
        "trends": dict(counts.most_common(top)),
        "growth_pct": growth,
        "top_gainers": gainers,
        "total_unique": len(counts),
        "total_mentions": sum(counts.values()),
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/timeseries")
def timeseries(granularity: str = Query("month", pattern="^(year|month|day)$")):
    """Post volume + sentiment over time (periods capped for charting)."""
    df = _load()
    if "Timestamp" not in df.columns:
        raise HTTPException(status_code=500, detail="CSV has no Timestamp column")
    ts = pd.to_datetime(df["Timestamp"], errors="coerce")
    frame = pd.DataFrame({"ts": ts, "s": _sentiment(df)}).dropna(subset=["ts"])
    if granularity == "year":
        frame["period"] = frame["ts"].dt.strftime("%Y")
    elif granularity == "month":
        frame["period"] = frame["ts"].dt.strftime("%Y-%m")
    else:
        frame["period"] = frame["ts"].dt.strftime("%Y-%m-%d")
    buckets = []
    for period, grp in frame.groupby("period", sort=True):
        buckets.append(
            {
                "period": str(period),
                "total": len(grp),
                "positive": int((grp["s"] == "positive").sum()),
                "negative": int((grp["s"] == "negative").sum()),
                "neutral": int((grp["s"] == "neutral").sum()),
            }
        )
    return {
        "granularity": granularity,
        "points": buckets[-366:],
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/refresh")
def refresh():
    """Reload the CSV into cache (run after regenerating the dataset)."""
    get_df.cache_clear()
    df = _load()
    return {
        "reloaded": True,
        "rows": len(df),
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


class IngestPost(BaseModel):
    """Module A collection schema: X / Telegram post (roadmap format)."""

    platform: str = Field(default="Unknown", max_length=50)
    user_id: str | None = Field(default=None, max_length=100)
    username: str | None = Field(default=None, max_length=100)
    content: str = Field(default="", max_length=5000)
    timestamp: str | None = Field(default=None, max_length=50)
    likes: float = Field(default=0, ge=0)
    shares: float = Field(default=0, ge=0)
    hashtags: str = Field(default="", max_length=1000)
    country: str = Field(default="Unknown", max_length=50)


@app.post("/api/ingest", status_code=201)
def ingest(posts: list[IngestPost]):
    """Module A: collect posts; queued as pending until Module B analyzes them."""
    if not posts:
        raise HTTPException(status_code=422, detail="posts must not be empty")
    if len(posts) > 500:
        raise HTTPException(status_code=422, detail="max 500 posts per request")
    valid = [p for p in posts if p.content.strip()]
    if not valid:
        raise HTTPException(status_code=422, detail="all posts have empty content")

    now = datetime.now(timezone.utc)
    rows = []
    for p in valid:
        ts = pd.to_datetime(p.timestamp, errors="coerce", utc=True)
        if pd.isna(ts):
            ts = pd.Timestamp.now(tz="UTC")
        local = pd.Timestamp(ts).tz_convert(None)
        tags = p.hashtags.strip() or " ".join(re.findall(r"#\w+", p.content))
        rows.append(
            {
                "Text": p.content.strip(),
                "Sentiment": "Unknown",
                "Timestamp": local.strftime("%Y-%m-%d %H:%M:%S"),
                "User": (p.username or p.user_id or "Anonymous").strip(),
                "Platform": p.platform.strip() or "Unknown",
                "Hashtags": tags,
                "Retweets": p.shares,
                "Likes": p.likes,
                "Country": p.country.strip() or "Unknown",
                "Year": local.year,
                "Month": local.month,
                "Day": local.day,
                "Hour": local.hour,
                "AI_Sentiment": "pending",
                "AI_Score": 0.0,
            }
        )

    try:
        df = _load()
        extra = pd.DataFrame(rows, columns=df.columns)
        merged = pd.concat([df, extra], ignore_index=True)
        merged.to_csv(_resolve_csv(), index=False)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to store posts: {exc}")
    get_df.cache_clear()
    return {
        "added": len(rows),
        "skipped_empty": len(posts) - len(rows),
        "total_rows": len(merged),
        "note": "Ingested posts are queued as AI_Sentiment=pending until sentiment analysis runs.",
        "server_time": now.isoformat(),
    }


@app.get("/api/insights")
def insights(q: str = Query("", max_length=200)):
    """Rule-based assistant: auto insights + keyword Q&A over live aggregates."""
    df = _load()
    norm = _sentiment(df)
    total = len(df)
    pos = int((norm == "positive").sum())
    neg = int((norm == "negative").sum())
    neu = int((norm == "neutral").sum())

    cards: list[dict[str, str]] = []
    if total:
        cards.append(
            {
                "id": "sentiment",
                "title": "Sentiment overview",
                "body": f"{pos} positive, {neg} negative, {neu} neutral across {total} posts.",
            }
        )

    momentum = ""
    if "Timestamp" in df.columns:
        ts = pd.to_datetime(df["Timestamp"], errors="coerce")
        ok = ts.notna()
        if ok.sum() > 10:
            med = ts[ok].median()
            past, recent = norm[ok & (ts <= med)], norm[ok & (ts > med)]
            dp = (past == "positive").mean() * 100 if len(past) else 0
            dr = (recent == "positive").mean() * 100 if len(recent) else 0
            dneg_p = (past == "negative").mean() * 100 if len(past) else 0
            dneg_r = (recent == "negative").mean() * 100 if len(recent) else 0
            rng = f"{ts[ok].min():%Y-%m} to {med:%Y-%m} vs {med:%Y-%m} to {ts[ok].max():%Y-%m}"
            momentum = (
                f"Positive share moved {dp:.1f}% to {dr:.1f}% ({dr - dp:+.1f} pts); "
                f"negative {dneg_p:.1f}% to {dneg_r:.1f}% ({dneg_r - dneg_p:+.1f} pts) [{rng}]."
            )
            cards.append({"id": "momentum", "title": "Sentiment momentum", "body": momentum})

    neg_tags = Counter()
    for raw in df.loc[norm == "negative", "Hashtags"].dropna():
        neg_tags.update(re.findall(r"#\w+", str(raw).lower()))
    if neg_tags:
        top_neg = ", ".join(t for t, _ in neg_tags.most_common(3))
        cards.append(
            {"id": "drivers", "title": "Negative drivers",
             "body": f"Negative posts cluster around {top_neg}."}
        )

    eng = df.copy()
    eng["User"] = eng["User"].astype(str).str.strip()
    score = (pd.to_numeric(eng["Likes"], errors="coerce").fillna(0)
             + pd.to_numeric(eng["Retweets"], errors="coerce").fillna(0))
    top_voices = ", ".join(score.groupby(eng["User"]).sum().sort_values(ascending=False).head(3).index)
    if top_voices:
        cards.append(
            {"id": "influence", "title": "Top voices",
             "body": f"Highest engagement: {top_voices}."}
        )

    hours = pd.to_numeric(df.get("Hour"), errors="coerce").dropna().astype(int)
    hours = hours[(hours >= 0) & (hours <= 23)]
    if len(hours):
        best = int(hours.value_counts().idxmax())
        top_country = _clean(df["Country"]).dropna().value_counts()
        region = f"{top_country.index[0]} ({int(top_country.iloc[0])} posts)" if len(top_country) else "n/a"
        cards.append(
            {"id": "timing", "title": "When to post",
             "body": f"Peak activity at {best}:00. Top region: {region}."}
        )

    counts = _hashtag_counts(df)
    if counts:
        tag, n = counts.most_common(1)[0]
        cards.append(
            {"id": "trend", "title": "Trend to watch",
             "body": f"{tag} leads with {n} mentions of {sum(counts.values())} total."}
        )

    query = q.strip().lower()
    answer: str | None = None
    picked = cards
    if query:
        if any(k in query for k in ("negative", "why", "angry", "against")):
            picked = [c for c in cards if c["id"] in ("momentum", "drivers", "sentiment")]
            answer = ("Negative sentiment is driven by " +
                      (", ".join(t for t, _ in neg_tags.most_common(3)) or "scattered topics") +
                      (f". {momentum}" if momentum else "."))
        elif any(k in query for k in ("trend", "viral", "topic", "hashtag")):
            picked = [c for c in cards if c["id"] in ("trend", "momentum")]
            answer = (f"Top trend is {counts.most_common(1)[0][0]} "
                      f"({counts.most_common(1)[0][1]} mentions)." if counts else "No trends yet.")
        elif any(k in query for k in ("who", "influenc", "network", "leader")):
            picked = [c for c in cards if c["id"] in ("influence", "trend")]
            answer = f"Most influential voices by engagement: {top_voices}." if top_voices else None
        elif any(k in query for k in ("when", "time", "hour", "best", "post")):
            picked = [c for c in cards if c["id"] in ("timing", "momentum")]
            answer = next((c["body"] for c in cards if c["id"] == "timing"), None)
        elif "sentiment" in query or "feel" in query:
            picked = [c for c in cards if c["id"] in ("sentiment", "momentum")]
            answer = (cards[0]["body"] + (f" {momentum}" if momentum else "")) if cards else None
        else:
            answer = "Try asking about sentiment, negative drivers, trends, influencers, or best posting time."

    return {
        "insights": picked,
        "answer": answer,
        "server_time": datetime.now(timezone.utc).isoformat(),
    }
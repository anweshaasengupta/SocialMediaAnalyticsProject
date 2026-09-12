import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from collections import Counter
from pathlib import Path
import re

# Page configuration
st.set_page_config(
    page_title="Social Media Analytics",
    page_icon="📊",
    layout="wide"
)


@st.cache_data
def load_data() -> pd.DataFrame:
    here = Path(__file__).resolve()
    candidates = [
        here.parent / "social_media_sentiment.csv",
        Path.cwd() / "social_media_sentiment.csv",
    ]
    csv_path = next((p for p in candidates if p.is_file()), None)
    if csv_path is None:
        st.error(
            "social_media_sentiment.csv not found. Run "
            "moduleb/sentiment_analysis.py first."
        )
        st.stop()
    try:
        df = pd.read_csv(csv_path)
    except Exception as exc:
        st.error(f"Failed to load CSV: {exc}")
        st.stop()
    required = {"AI_Sentiment", "Platform", "Country", "Hashtags"}
    missing = required - set(df.columns)
    if missing:
        st.error(f"CSV missing required columns: {sorted(missing)}")
        st.stop()
    # Normalize whitespace/case once so counts match backend
    df["AI_Sentiment"] = df["AI_Sentiment"].astype(str).str.strip().str.lower()
    df["Platform"] = df["Platform"].astype(str).str.strip()
    df["Country"] = df["Country"].astype(str).str.strip()
    return df


# Load data
df = load_data()

# Title
st.title("📊 AI-Driven Social Media Analytics Dashboard")
st.write("Analyze sentiment, demographics, trends and social media activity.")

# ---------------- METRICS ----------------

total_posts = len(df)

positive = (df["AI_Sentiment"] == "positive").sum()
negative = (df["AI_Sentiment"] == "negative").sum()
neutral = (df["AI_Sentiment"] == "neutral").sum()

col1, col2, col3, col4 = st.columns(4)

col1.metric("Total Posts", total_posts)
col2.metric("Positive", positive)
col3.metric("Negative", negative)
col4.metric("Neutral", neutral)

st.divider()

# ---------------- SENTIMENT ----------------

st.header("😊 Sentiment Analysis")

col1, col2 = st.columns(2)

with col1:
    sentiment_counts = df["AI_Sentiment"].value_counts()

    fig, ax = plt.subplots()
    sentiment_counts.plot(kind="bar", ax=ax)
    ax.set_xlabel("Sentiment")
    ax.set_ylabel("Number of Posts")
    ax.set_title("Sentiment Distribution")
    plt.xticks(rotation=0)
    plt.tight_layout()
    st.pyplot(fig)
    plt.close(fig)

with col2:
    platform_counts = df["Platform"].value_counts()

    fig, ax = plt.subplots()
    platform_counts.plot(kind="bar", ax=ax)
    ax.set_xlabel("Platform")
    ax.set_ylabel("Number of Posts")
    ax.set_title("Platform Distribution")
    plt.xticks(rotation=0)
    plt.tight_layout()
    st.pyplot(fig)
    plt.close(fig)

# ---------------- DEMOGRAPHICS ----------------

st.header("🌍 Demographic Analysis")

country_counts = df["Country"].value_counts().head(10)

fig, ax = plt.subplots()
country_counts.plot(kind="bar", ax=ax)
ax.set_title("Top Countries")
ax.set_xlabel("Country")
ax.set_ylabel("Number of Posts")
plt.xticks(rotation=45)
plt.tight_layout()
st.pyplot(fig)
plt.close(fig)

# ---------------- TRENDS ----------------

st.header("🔥 Trending Hashtags")

hashtags = []

for tags in df["Hashtags"].dropna():
    words = re.findall(r"#\w+", str(tags).lower())
    hashtags.extend(words)

top_trends = Counter(hashtags).most_common(10)

trend_names = [x[0] for x in top_trends]
trend_counts = [x[1] for x in top_trends]

fig, ax = plt.subplots()
ax.bar(trend_names, trend_counts)
ax.set_title("Top Trending Hashtags")
ax.set_xlabel("Hashtag")
ax.set_ylabel("Number of Posts")
plt.xticks(rotation=45)
plt.tight_layout()
st.pyplot(fig)
plt.close(fig)

# ---------------- TIMELINE ----------------

st.header("📈 Timeline Analytics")

if "Timestamp" in df.columns:
    ts = pd.to_datetime(df["Timestamp"], errors="coerce")
    monthly = ts.dropna().dt.strftime("%Y-%m").value_counts().sort_index().tail(24)

    fig, ax = plt.subplots()
    monthly.plot(kind="bar", ax=ax)
    ax.set_title("Post Volume (last 24 months)")
    ax.set_xlabel("Month")
    ax.set_ylabel("Number of Posts")
    plt.xticks(rotation=45)
    plt.tight_layout()
    st.pyplot(fig)
    plt.close(fig)

# ---------------- INFLUENCERS ----------------

st.header("⭐ Top Voices")

for col in ("Likes", "Retweets"):
    df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

voices = (
    (df["Likes"] + df["Retweets"])
    .groupby(df["User"].astype(str).str.strip())
    .sum()
    .sort_values(ascending=False)
    .head(10)
    .reset_index()
)
voices.columns = ["User", "Engagement"]

st.dataframe(voices, use_container_width=True)

# ---------------- SAMPLE DATA ----------------

st.header("📝 Recent Social Media Posts")

st.dataframe(
    df[["User", "Platform", "Text", "AI_Sentiment"]].head(20),
    use_container_width=True
)
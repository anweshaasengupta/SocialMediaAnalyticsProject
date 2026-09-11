import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from collections import Counter
import re

# Page configuration
st.set_page_config(
    page_title="Social Media Analytics",
    page_icon="📊",
    layout="wide"
)

# Load data
df = pd.read_csv("social_media_sentiment.csv")

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
    st.pyplot(fig)

with col2:
    platform_counts = df["Platform"].value_counts()

    fig, ax = plt.subplots()
    platform_counts.plot(kind="bar", ax=ax)
    ax.set_xlabel("Platform")
    ax.set_ylabel("Number of Posts")
    ax.set_title("Platform Distribution")
    plt.xticks(rotation=0)
    st.pyplot(fig)

# ---------------- DEMOGRAPHICS ----------------

st.header("🌍 Demographic Analysis")

country_counts = df["Country"].value_counts().head(10)

fig, ax = plt.subplots()
country_counts.plot(kind="bar", ax=ax)
ax.set_title("Top Countries")
ax.set_xlabel("Country")
ax.set_ylabel("Number of Posts")
plt.xticks(rotation=45)
st.pyplot(fig)

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
st.pyplot(fig)

# ---------------- SAMPLE DATA ----------------

st.header("📝 Recent Social Media Posts")

st.dataframe(
    df[["User", "Platform", "Text", "AI_Sentiment"]].head(20),
    use_container_width=True
)
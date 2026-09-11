from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import re
from collections import Counter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://127.0.0.1:5173",
                   ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = pd.read_csv("../social_media_sentiment.csv")


@app.get("/")
def home():
    return {"message": "Social Media Analytics Backend is running"}


@app.get("/api/analytics")
def analytics():

    hashtags = []

    for tags in df["Hashtags"].dropna():
        words = re.findall(r"#\w+", str(tags).lower())
        hashtags.extend(words)

    top_hashtags = Counter(hashtags).most_common(10)

    countries = (
        df["Country"]
        .astype(str)
        .str.strip()
        .value_counts()
        .head(10)
        .to_dict()
    )

    return {
        "total_posts": len(df),

        "sentiment": {
            "positive": int((df["AI_Sentiment"] == "positive").sum()),
            "negative": int((df["AI_Sentiment"] == "negative").sum()),
            "neutral": int((df["AI_Sentiment"] == "neutral").sum())
        },

        "platforms": df["Platform"].value_counts().to_dict(),

        "countries": countries,

        "trends": dict(top_hashtags)
    }
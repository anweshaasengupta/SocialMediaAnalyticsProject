import pandas as pd
from transformers import pipeline

# Load dataset
df = pd.read_csv("social_media_data_clean.csv")

# Load AI sentiment model
sentiment_model = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)

# Analyze all posts
results = sentiment_model(
    df["Text"].astype(str).tolist(),
    batch_size=16
)

# Add results to dataset
df["AI_Sentiment"] = [r["label"] for r in results]
df["AI_Score"] = [r["score"] for r in results]

# Save results
df.to_csv("social_media_sentiment.csv", index=False)

print("Sentiment analysis completed!")
print(df[["Text", "AI_Sentiment", "AI_Score"]].head(10))
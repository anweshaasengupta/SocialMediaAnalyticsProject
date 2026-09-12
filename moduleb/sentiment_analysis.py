import pandas as pd
from pathlib import Path
from transformers import pipeline


LABEL_MAP = {
    "LABEL_0": "negative",
    "LABEL_1": "neutral",
    "LABEL_2": "positive",
    "NEGATIVE": "negative",
    "NEUTRAL": "neutral",
    "POSITIVE": "positive",
    "negative": "negative",
    "neutral": "neutral",
    "positive": "positive",
}


def normalize_label(raw: str) -> str:
    return LABEL_MAP.get(str(raw).strip(), str(raw).strip().lower())


def main() -> None:
    here = Path(__file__).resolve()
    in_path = here.parent.parent / "social_media_data_clean.csv"
    out_path = here.parent.parent / "social_media_sentiment.csv"
    if not in_path.is_file():
        raise FileNotFoundError(f"Input not found: {in_path}")

    # Load dataset
    df = pd.read_csv(in_path)
    if "Text" not in df.columns:
        raise KeyError("Input CSV must contain a 'Text' column")

    texts = df["Text"].fillna("").astype(str).tolist()
    if not texts:
        raise ValueError("No texts to analyze")

    # Load AI sentiment model
    sentiment_model = pipeline(
        "sentiment-analysis",
        model="cardiffnlp/twitter-roberta-base-sentiment-latest",
        truncation=True,
        max_length=512,
    )

    # Analyze all posts
    results = sentiment_model(
        texts,
        batch_size=16,
        truncation=True,
    )

    # Add results to dataset
    df["AI_Sentiment"] = [normalize_label(r["label"]) for r in results]
    df["AI_Score"] = [float(r["score"]) for r in results]

    # Save results
    df.to_csv(out_path, index=False)

    print("Sentiment analysis completed!")
    print(df[["Text", "AI_Sentiment", "AI_Score"]].head(10))


if __name__ == "__main__":
    main()
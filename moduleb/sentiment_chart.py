import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path


def main(save: bool = False) -> None:
    csv_path = Path(__file__).resolve().parent.parent / "social_media_sentiment.csv"
    df = pd.read_csv(csv_path)

    df["AI_Sentiment"].astype(str).str.strip().str.lower().value_counts().plot(kind="bar")

    plt.title("Sentiment Distribution")
    plt.xlabel("Sentiment")
    plt.ylabel("Number of Posts")
    plt.tight_layout()
    if save:
        plt.savefig(Path(__file__).resolve().parent / "sentiment_distribution.png")
    else:
        plt.show()


if __name__ == "__main__":
    main()
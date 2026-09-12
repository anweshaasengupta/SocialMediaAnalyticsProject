import pandas as pd
import matplotlib.pyplot as plt
from collections import Counter
from pathlib import Path
import re


def main(save: bool = False) -> None:
    csv_path = Path(__file__).resolve().parent.parent / "social_media_sentiment.csv"
    df = pd.read_csv(csv_path)

    # Collect hashtags
    hashtags = []

    for tags in df["Hashtags"].dropna():
        words = re.findall(r"#\w+", str(tags).lower())
        hashtags.extend(words)

    # Count hashtags
    top_trends = Counter(hashtags).most_common(10)

    print("Top Trends:")
    for hashtag, count in top_trends:
        print(hashtag, ":", count)

    # Create chart
    names = [x[0] for x in top_trends]
    counts = [x[1] for x in top_trends]

    plt.bar(names, counts)
    plt.title("Top Trending Hashtags")
    plt.xlabel("Hashtag")
    plt.ylabel("Number of Posts")
    plt.xticks(rotation=45)
    plt.tight_layout()
    if save:
        plt.savefig(Path(__file__).resolve().parent / "top_trends.png")
    else:
        plt.show()


if __name__ == "__main__":
    main()
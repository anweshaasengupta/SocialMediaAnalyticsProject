import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path


def main(save: bool = False) -> None:
    csv_path = Path(__file__).resolve().parent.parent / "social_media_sentiment.csv"
    # Load sentiment dataset
    df = pd.read_csv(csv_path)

    # Count users/posts by country (strip whitespace to avoid "USA" vs " USA" splits)
    country_counts = df["Country"].astype(str).str.strip().value_counts()

    print("Top countries:")
    print(country_counts.head(10))

    # Plot top 10 countries
    country_counts.head(10).plot(kind="bar")

    plt.title("Social Media Posts by Country")
    plt.xlabel("Country")
    plt.ylabel("Number of Posts")
    plt.xticks(rotation=45)
    plt.tight_layout()
    if save:
        plt.savefig(Path(__file__).resolve().parent / "posts_by_country.png")
    else:
        plt.show()


if __name__ == "__main__":
    main()
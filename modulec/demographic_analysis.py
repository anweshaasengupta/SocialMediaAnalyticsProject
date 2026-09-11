import pandas as pd
import matplotlib.pyplot as plt

# Load sentiment dataset
df = pd.read_csv("social_media_sentiment.csv")

# Count users/posts by country
country_counts = df["Country"].value_counts()

print("Top countries:")
print(country_counts.head(10))

# Plot top 10 countries
country_counts.head(10).plot(kind="bar")

plt.title("Social Media Posts by Country")
plt.xlabel("Country")
plt.ylabel("Number of Posts")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
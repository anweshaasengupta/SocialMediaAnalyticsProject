import pandas as pd
import matplotlib.pyplot as plt
from collections import Counter
import re

df = pd.read_csv("social_media_sentiment.csv")

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
plt.show()
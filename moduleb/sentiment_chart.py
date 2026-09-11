import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("social_media_sentiment.csv")

df["AI_Sentiment"].value_counts().plot(kind="bar")

plt.title("Sentiment Distribution")
plt.xlabel("Sentiment")
plt.ylabel("Number of Posts")
plt.tight_layout()
plt.show()
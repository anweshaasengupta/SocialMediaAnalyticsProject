import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt

df = pd.read_csv("social_media_sentiment.csv")

G = nx.Graph()

for _, row in df.iterrows():
    user = str(row["User"])
    platform = str(row["Platform"])

    G.add_edge(user, platform)

plt.figure(figsize=(10, 7))
nx.draw_networkx(G, with_labels=True, node_size=500, font_size=8)

plt.title("Social Media User-Platform Network")
plt.axis("off")
plt.show()
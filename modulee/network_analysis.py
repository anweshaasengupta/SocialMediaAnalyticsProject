import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt
from pathlib import Path


def build_graph(df: pd.DataFrame, max_users: int = 100) -> nx.Graph:
    G = nx.Graph()
    df = df.copy()
    df["User"] = df["User"].astype(str).str.strip()
    df["Platform"] = df["Platform"].astype(str).str.strip()
    # Limit to most active users so the plot stays readable
    top_users = df["User"].value_counts().head(max_users).index
    sub = df[df["User"].isin(top_users)]
    for _, row in sub.iterrows():
        user = str(row["User"])
        platform = str(row["Platform"])
        if user and platform and user.lower() != "nan" and platform.lower() != "nan":
            G.add_edge(user, platform)
    return G


def main(save: bool = False, max_users: int = 100) -> None:
    csv_path = Path(__file__).resolve().parent.parent / "social_media_sentiment.csv"
    df = pd.read_csv(csv_path)

    G = build_graph(df, max_users=max_users)
    print(f"Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}")
    if G.number_of_nodes():
        print("Top central nodes:", sorted(nx.degree_centrality(G).items(), key=lambda x: x[1], reverse=True)[:5])

    plt.figure(figsize=(12, 8))
    nx.draw_networkx(G, with_labels=True, node_size=500, font_size=8, pos=nx.spring_layout(G, seed=42))

    plt.title("Social Media User-Platform Network")
    plt.axis("off")
    plt.tight_layout()
    if save:
        plt.savefig(Path(__file__).resolve().parent / "user_platform_network.png")
    else:
        plt.show()


if __name__ == "__main__":
    main()
# https://hugocisneros.com/blog/my-org-roam-notes-workflow/

import json
import sys

import networkx as nx
import networkx.algorithms.link_analysis.pagerank_alg as pag
import networkx.algorithms.community as com
from networkx.drawing.nx_pydot import read_dot
from networkx.readwrite import json_graph

from roam_db_to_json import build_graph

N_MISSING = 20  # Number of predicted missing links
MAX_NODES = 10000  # Number of nodes in the final graph

def compute_centrality(dot_graph: nx.DiGraph) -> None:
    """Add a `centrality` attribute to each node with its PageRank score.
    """
    simp_graph = nx.Graph(dot_graph)
    central = pag.pagerank(simp_graph)
    min_cent = min(central.values())
    central = {i: central[i] - min_cent for i in central}
    max_cent = max(central.values())
    central = {i: central[i] / max_cent for i in central}
    nx.set_node_attributes(dot_graph, central, "centrality")
    sorted_cent = sorted(dot_graph, key=lambda x: dot_graph.nodes[x]["centrality"])
    for n in sorted_cent[:-MAX_NODES]:
        dot_graph.remove_node(n)


def compute_communities(dot_graph: nx.DiGraph) -> None:
    """Add a `communityLabel` attribute to each node according to their
    computed community.
    """
    simp_graph = nx.Graph(dot_graph)
    # girvan_newman はエッジ数の2乗で遅くなるので、貪欲法のモジュラリティ最大化で分ける
    labels = com.greedy_modularity_communities(simp_graph)
    label_dict = {l_key: i for i in range(len(labels)) for l_key in labels[i]}
    nx.set_node_attributes(dot_graph, label_dict, "communityLabel")


def add_missing_links(dot_graph: nx.DiGraph, n_missing: int) -> None:
    """Add some missing links to the graph by using top ranking inexisting
    links by ressource allocation index.
    """
    simp_graph = nx.Graph(dot_graph)
    preds = nx.ra_index_soundarajan_hopcroft(simp_graph, community="communityLabel")
    new = sorted(preds, key=lambda x: -x[2])[:n_missing]
    for link in new:
        # sys.stderr.write(f"Predicted edge {link[0]} {link[1]}\n")
        dot_graph.add_edge(link[0], link[1], predicted=link[2])


if __name__ == "__main__":
    # sys.stderr.write("Reading graph...")
    DOT_GRAPH = build_graph()
    compute_centrality(DOT_GRAPH)
    compute_communities(DOT_GRAPH)
    add_missing_links(DOT_GRAPH, N_MISSING)
    # sys.stderr.write("Done\n")
    JS_GRAPH = json_graph.node_link_data(DOT_GRAPH)
    sys.stdout.write(json.dumps(JS_GRAPH))

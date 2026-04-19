import networkx as nx
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)
_graph: nx.DiGraph = None


def get_knowledge_graph() -> nx.DiGraph:
    global _graph
    if _graph is None:
        _graph = _build_indian_law_graph()
        logger.info(f"Knowledge graph built: {_graph.number_of_nodes()} nodes, {_graph.number_of_edges()} edges")
    return _graph


def _build_indian_law_graph() -> nx.DiGraph:
    G = nx.DiGraph()

    # ── IPC SECTIONS ──
    ipc_sections = [
        ("IPC-299", "IPC §299 - Culpable Homicide", "ipc_section"),
        ("IPC-300", "IPC §300 - Murder", "ipc_section"),
        ("IPC-302", "IPC §302 - Punishment for Murder", "ipc_section"),
        ("IPC-304", "IPC §304 - Culpable Homicide Not Amounting to Murder", "ipc_section"),
        ("IPC-304A", "IPC §304A - Death by Negligence", "ipc_section"),
        ("IPC-306", "IPC §306 - Abetment of Suicide", "ipc_section"),
        ("IPC-307", "IPC §307 - Attempt to Murder", "ipc_section"),
        ("IPC-320", "IPC §320 - Grievous Hurt", "ipc_section"),
        ("IPC-375", "IPC §375 - Rape", "ipc_section"),
        ("IPC-376", "IPC §376 - Punishment for Rape", "ipc_section"),
        ("IPC-378", "IPC §378 - Theft", "ipc_section"),
        ("IPC-383", "IPC §383 - Extortion", "ipc_section"),
        ("IPC-415", "IPC §415 - Cheating", "ipc_section"),
        ("IPC-420", "IPC §420 - Cheating and Dishonestly Inducing", "ipc_section"),
        ("IPC-498A", "IPC §498A - Cruelty by Husband or Relatives", "ipc_section"),
        ("IPC-503", "IPC §503 - Criminal Intimidation", "ipc_section"),
    ]

    # ── CONSTITUTION ARTICLES ──
    constitution_articles = [
        ("CONST-12", "Art. 12 - Definition of State", "constitution"),
        ("CONST-13", "Art. 13 - Laws inconsistent with Fundamental Rights", "constitution"),
        ("CONST-14", "Art. 14 - Right to Equality", "constitution"),
        ("CONST-19", "Art. 19 - Right to Freedom", "constitution"),
        ("CONST-20", "Art. 20 - Protection in Conviction", "constitution"),
        ("CONST-21", "Art. 21 - Protection of Life and Personal Liberty", "constitution"),
        ("CONST-22", "Art. 22 - Protection Against Arrest", "constitution"),
        ("CONST-32", "Art. 32 - Right to Constitutional Remedies", "constitution"),
        ("CONST-226", "Art. 226 - High Court Writ Jurisdiction", "constitution"),
        ("CONST-136", "Art. 136 - Special Leave Petition", "constitution"),
    ]

    # ── CRPC SECTIONS ──
    crpc_sections = [
        ("CrPC-41", "CrPC §41 - Arrest Without Warrant", "crpc_section"),
        ("CrPC-154", "CrPC §154 - FIR", "crpc_section"),
        ("CrPC-161", "CrPC §161 - Examination of Witnesses", "crpc_section"),
        ("CrPC-167", "CrPC §167 - Procedure When Investigation Cannot Be Completed", "crpc_section"),
        ("CrPC-173", "CrPC §173 - Police Report", "crpc_section"),
        ("CrPC-313", "CrPC §313 - Power to Examine the Accused", "crpc_section"),
        ("CrPC-437", "CrPC §437 - Bail in Non-Bailable Offences", "crpc_section"),
        ("CrPC-439", "CrPC §439 - Special Powers of High Court Regarding Bail", "crpc_section"),
    ]

    # ── LANDMARK CASES ──
    cases = [
        ("CASE-Maneka", "Maneka Gandhi v. Union of India (1978)", "case"),
        ("CASE-Jagrup", "Jagrup Singh v. State of Haryana (1981)", "case"),
        ("CASE-KS-Puttaswamy", "K.S. Puttaswamy v. Union of India (2017)", "case"),
        ("CASE-Vishaka", "Vishaka v. State of Rajasthan (1997)", "case"),
        ("CASE-Arnesh", "Arnesh Kumar v. State of Bihar (2014)", "case"),
        ("CASE-DK-Basu", "D.K. Basu v. State of West Bengal (1997)", "case"),
        ("CASE-Bachan-Singh", "Bachan Singh v. State of Punjab (1980)", "case"),
        ("CASE-Shreya-Singhal", "Shreya Singhal v. Union of India (2015)", "case"),
    ]

    # Add all nodes
    for node_id, label, ntype in ipc_sections + constitution_articles + crpc_sections + cases:
        G.add_node(node_id, label=label, node_type=ntype)

    # ── EDGES: IPC relationships ──
    G.add_edge("IPC-299", "IPC-300", relation="leads_to")
    G.add_edge("IPC-300", "IPC-302", relation="punished_under")
    G.add_edge("IPC-299", "IPC-304", relation="lesser_offence")
    G.add_edge("IPC-304", "IPC-304A", relation="related")
    G.add_edge("IPC-375", "IPC-376", relation="punished_under")
    G.add_edge("IPC-378", "IPC-383", relation="related")
    G.add_edge("IPC-415", "IPC-420", relation="punished_under")

    # ── EDGES: IPC → Constitution ──
    G.add_edge("IPC-302", "CONST-21", relation="affects")
    G.add_edge("IPC-304", "CONST-21", relation="affects")
    G.add_edge("IPC-376", "CONST-21", relation="affects")
    G.add_edge("IPC-498A", "CONST-14", relation="upholds")
    G.add_edge("IPC-302", "CONST-20", relation="protection_under")

    # ── EDGES: IPC → CrPC ──
    G.add_edge("IPC-302", "CrPC-154", relation="fir_under")
    G.add_edge("IPC-302", "CrPC-437", relation="bail_under")
    G.add_edge("IPC-376", "CrPC-154", relation="fir_under")
    G.add_edge("IPC-420", "CrPC-154", relation="fir_under")
    G.add_edge("CrPC-41", "CONST-22", relation="governed_by")
    G.add_edge("CrPC-437", "CONST-21", relation="upholds")
    G.add_edge("CrPC-439", "CONST-226", relation="appealable_to")

    # ── EDGES: Cases → Sections ──
    G.add_edge("CASE-Maneka", "CONST-21", relation="interprets")
    G.add_edge("CASE-Maneka", "CONST-19", relation="interprets")
    G.add_edge("CASE-Jagrup", "IPC-304", relation="interprets")
    G.add_edge("CASE-KS-Puttaswamy", "CONST-21", relation="expands")
    G.add_edge("CASE-Vishaka", "CONST-14", relation="upholds")
    G.add_edge("CASE-Vishaka", "CONST-19", relation="upholds")
    G.add_edge("CASE-Arnesh", "CrPC-41", relation="guidelines_for")
    G.add_edge("CASE-Arnesh", "IPC-498A", relation="related_to")
    G.add_edge("CASE-DK-Basu", "CONST-21", relation="upholds")
    G.add_edge("CASE-DK-Basu", "CrPC-41", relation="regulates")
    G.add_edge("CASE-Bachan-Singh", "IPC-302", relation="interprets")
    G.add_edge("CASE-Shreya-Singhal", "CONST-19", relation="upholds")

    return G


def get_related_nodes(query_terms: List[str], max_hops: int = 2) -> List[str]:
    """Find graph nodes related to query terms and return contextual strings."""
    G = get_knowledge_graph()
    matched_nodes = []
    query_lower = " ".join(query_terms).lower()

    # Match nodes by label
    for node_id, data in G.nodes(data=True):
        label = data.get("label", "").lower()
        if any(term.lower() in label for term in query_terms):
            matched_nodes.append(node_id)

    # Pattern matching for IPC section numbers
    import re
    section_matches = re.findall(r"section\s*(\d+[a-z]?)|§\s*(\d+[a-z]?)|ipc\s*(\d+[a-z]?)|art(?:icle)?\s*(\d+)", query_lower)
    for match_group in section_matches:
        num = next((m for m in match_group if m), None)
        if num:
            for prefix in ["IPC-", "CONST-", "CrPC-"]:
                candidate = f"{prefix}{num.upper()}"
                if G.has_node(candidate):
                    matched_nodes.append(candidate)

    if not matched_nodes:
        return []

    # BFS for neighbors
    context_nodes = set(matched_nodes)
    for node in matched_nodes:
        if max_hops >= 1:
            context_nodes.update(G.successors(node))
            context_nodes.update(G.predecessors(node))
        if max_hops >= 2:
            for neighbor in list(context_nodes):
                context_nodes.update(G.successors(neighbor))

    # Build context strings
    context = []
    for node_id in context_nodes:
        data = G.nodes[node_id]
        label = data.get("label", node_id)
        ntype = data.get("node_type", "")
        neighbors = list(G.successors(node_id))
        neighbor_labels = [G.nodes[n].get("label", n) for n in neighbors[:3]]
        ctx = f"{label}"
        if neighbor_labels:
            ctx += f" → related to: {', '.join(neighbor_labels)}"
        context.append(ctx)

    return context[:10]


def get_graph_data() -> Dict:
    """Return full graph as nodes + edges for frontend visualization."""
    G = get_knowledge_graph()
    nodes = []
    edges = []

    for node_id, data in G.nodes(data=True):
        nodes.append({
            "id": node_id,
            "label": data.get("label", node_id),
            "node_type": data.get("node_type", "unknown"),
        })

    for src, dst, data in G.edges(data=True):
        edges.append({
            "source": src,
            "target": dst,
            "relation": data.get("relation", "related"),
        })

    return {"nodes": nodes, "edges": edges}

"""
RAG retriever - gracefully degrades if ChromaDB/embeddings not available.
"""
from typing import List, Dict, Optional
from app.rag.chroma_client import get_or_create_collection, COLLECTIONS, is_available as chroma_ok
from app.rag.embeddings import embed_query, is_available as embed_ok


def retrieve_local_intelligence(query: str, location: Optional[str] = None, n_results: int = 5) -> List[Dict]:
    if not chroma_ok() or not embed_ok():
        return []
    collection = get_or_create_collection(COLLECTIONS["local_intelligence"])
    if collection is None:
        return []
    query_embedding = embed_query(query)
    where_filter = {"location": {"$eq": location}} if location else None
    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )
        return [
            {"content": doc, "metadata": results["metadatas"][0][i], "relevance_score": 1 - results["distances"][0][i]}
            for i, doc in enumerate(results["documents"][0])
        ]
    except Exception:
        return []


def retrieve_safety_tips(location: str, n_results: int = 3) -> List[Dict]:
    if not chroma_ok() or not embed_ok():
        return []
    collection = get_or_create_collection(COLLECTIONS["safety_tips"])
    if collection is None:
        return []
    query_embedding = embed_query(f"safety tips for traveling to {location}")
    try:
        results = collection.query(query_embeddings=[query_embedding], n_results=n_results, include=["documents", "metadatas"])
        return [{"content": doc, "metadata": results["metadatas"][0][i]} for i, doc in enumerate(results["documents"][0])]
    except Exception:
        return []


def retrieve_route_notes(from_loc: str, to_loc: str, n_results: int = 3) -> List[Dict]:
    if not chroma_ok() or not embed_ok():
        return []
    collection = get_or_create_collection(COLLECTIONS["route_notes"])
    if collection is None:
        return []
    query_embedding = embed_query(f"travel route from {from_loc} to {to_loc} Tamil Nadu")
    try:
        results = collection.query(query_embeddings=[query_embedding], n_results=n_results, include=["documents", "metadatas"])
        return [{"content": doc, "metadata": results["metadatas"][0][i]} for i, doc in enumerate(results["documents"][0])]
    except Exception:
        return []


def add_document(collection_name: str, doc_id: str, text: str, metadata: Dict):
    if not chroma_ok() or not embed_ok():
        return
    collection = get_or_create_collection(collection_name)
    if collection is None:
        return
    embedding = embed_query(text)
    collection.upsert(ids=[doc_id], embeddings=[embedding], documents=[text], metadatas=[metadata])

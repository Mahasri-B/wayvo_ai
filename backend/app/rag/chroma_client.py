"""
ChromaDB client with graceful fallback if chromadb is not installed.
Install chromadb when C++ build tools are available.
"""
import os

PERSIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "chroma_data")

COLLECTIONS = {
    "local_intelligence": "tn_local_intelligence",
    "route_notes": "tn_route_notes",
    "safety_tips": "tn_safety_tips",
    "alerts": "tn_alerts",
}

_client = None
_chroma_available = False

try:
    import chromadb
    from chromadb.config import Settings
    _chroma_available = True
except ImportError:
    pass


def get_chroma_client():
    global _client
    if not _chroma_available:
        return None
    if _client is None:
        os.makedirs(PERSIST_DIR, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False),
        )
    return _client


def get_or_create_collection(name: str):
    client = get_chroma_client()
    if client is None:
        return None
    return client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
    )


def is_available() -> bool:
    return _chroma_available

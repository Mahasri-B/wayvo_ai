"""
Embeddings with graceful fallback if sentence-transformers not installed.
"""
from typing import List

_model = None
_st_available = False

try:
    from sentence_transformers import SentenceTransformer
    _st_available = True
    MODEL_NAME = "all-MiniLM-L6-v2"
except ImportError:
    pass


def get_embedding_model():
    global _model
    if not _st_available:
        return None
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_texts(texts: List[str]) -> List[List[float]]:
    model = get_embedding_model()
    if model is None:
        return [[0.0] * 384 for _ in texts]
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()


def embed_query(query: str) -> List[float]:
    model = get_embedding_model()
    if model is None:
        return [0.0] * 384
    embedding = model.encode([query], convert_to_numpy=True)
    return embedding[0].tolist()


def is_available() -> bool:
    return _st_available

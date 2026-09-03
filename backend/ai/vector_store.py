# -*- coding: utf-8 -*-
# backend/ai/vector_store.py
"""
TerasVectorStore - stockage/recherche RAG en base Django (Python 3.14 compatible)

But:
- Fournir une API "à la Chroma" minimale:
  - query(collection_name, query_text, n_results) -> {"documents":[[..]], "metadatas":[[..]], "distances":[[..]], "ids":[[..]]}
- Assurer la compat rétro:
  - search(...) alias de query(...)
  - get_vector_store() attendu par ai/views.py

- Ne jamais casser l'app si Cohere n'est pas configuré:
  - si COHERE_API_KEY absent: fallback texte simple (icontains) + score approximatif

⚠️ IMPORTANT:
Ce fichier suppose un modèle Django dans `ai.models` :
- DocumentEmbedding
Champs attendus:
- collection (str)
- title (str)
- source (str)
- content (text)
- embedding (JSON list[float], nullable)
- metadata (JSON dict, nullable)
- doc_id (str, unique)
"""

from __future__ import annotations

import os
import math
import logging
import requests
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from django.db.models import Q

logger = logging.getLogger("ai.vector_store")


# -------------------------------------------------------------------
# Chargement local .env (optionnel)
# -------------------------------------------------------------------
def _load_env_file_local() -> None:
    try:
        current_dir = Path(__file__).resolve().parent
        project_root = current_dir.parent.parent
        env_path = project_root / '.env'

        if env_path.exists():
            logger.info(f"📁 Chargement du .env depuis: {env_path}")
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip()
                        if key not in os.environ:
                            os.environ[key] = value
    except Exception:
        pass


_load_env_file_local()


# -------------------------------------------------------------------
# Helpers distance
# -------------------------------------------------------------------
def _cosine_distance(a: List[float], b: List[float]) -> float:
    """Retourne 1 - cosine_sim, donc 0 = identique, 2 = opposé."""
    if not a or not b:
        return 1.0
    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b):
        dot += float(x) * float(y)
        na += float(x) * float(x)
        nb += float(y) * float(y)
    if na <= 0 or nb <= 0:
        return 1.0
    sim = dot / (math.sqrt(na) * math.sqrt(nb))
    sim = max(-1.0, min(1.0, sim))
    return 1.0 - sim


# -------------------------------------------------------------------
# Cohere Embeddings (optionnel)
# -------------------------------------------------------------------
class CohereEmbedder:
    def __init__(self) -> None:
        self.api_key = os.getenv("COHERE_API_KEY", "") or ""
        self.model = os.getenv("COHERE_EMBED_MODEL", "embed-multilingual-v3.0")
        self.endpoint = "https://api.cohere.com/v1/embed"

    def is_available(self) -> bool:
        return bool(self.api_key)

    def embed(self, texts: List[str]) -> List[List[float]]:
        if not self.is_available():
            raise RuntimeError("Cohere non configuré (COHERE_API_KEY manquant).")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "texts": texts,
            "input_type": "search_document",
        }
        r = requests.post(self.endpoint, json=payload, headers=headers, timeout=30)
        r.raise_for_status()
        data = r.json()
        emb = data.get("embeddings") or []
        return emb


# -------------------------------------------------------------------
# TerasVectorStore (DB Django)
# -------------------------------------------------------------------
class TerasVectorStore:
    """
    Vector store en DB Django.
    Nécessite un modèle `ai.models.DocumentEmbedding`.
    """

    def __init__(self) -> None:
        self.embedder = CohereEmbedder()

        try:
            from ai.models import DocumentEmbedding  # type: ignore
            self.Model = DocumentEmbedding
            logger.info("✅ TerasVectorStore initialisé (mode DB Django)")
        except Exception as e:
            self.Model = None
            logger.error("❌ Impossible d'importer ai.models.DocumentEmbedding: %s", e)

    def is_available(self) -> bool:
        return self.Model is not None

    # ---- Compat API -------------------------------------------------
    def search(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """Compat: certains modules appellent .search()."""
        return self.query(*args, **kwargs)

    # ---- API principale ---------------------------------------------
    def query(self, collection_name: str, query_text: str, n_results: int = 5) -> Dict[str, Any]:
        """
        Retourne un dict compatible style Chroma:
        {
          "documents": [[...]],
          "metadatas": [[...]],
          "distances": [[...]],
          "ids": [[...]]
        }
        """
        if not self.is_available():
            return {"documents": [[]], "metadatas": [[]], "distances": [[]], "ids": [[]]}

        q = (query_text or "").strip()
        if not q:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]], "ids": [[]]}

        col = (collection_name or "").strip() or "teras_general"
        n = int(n_results or 5)

        qs = self.Model.objects.all()
        if col:
            qs = qs.filter(collection=col)

        # 2) Embeddings => ranking cosine
        if self.embedder.is_available():
            try:
                qvecs = self.embedder.embed([q])
                qvec = qvecs[0] if qvecs else None
            except Exception as e:
                logger.error("Vector store: embed query failed, fallback texte. Err=%s", e)
                qvec = None

            if qvec:
                candidates = list(qs.exclude(embedding__isnull=True)[:2000])
                scored: List[Tuple[float, Any]] = []
                for obj in candidates:
                    try:
                        dist = _cosine_distance(qvec, obj.embedding or [])
                        scored.append((dist, obj))
                    except Exception:
                        continue
                scored.sort(key=lambda x: x[0])
                top = [o for _, o in scored[:n]]
                return self._format(top, qvec=qvec)

        # 3) Fallback texte (si pas de cohere / pas d'embeddings)
        txt_qs = qs.filter(
            Q(title__icontains=q) | Q(source__icontains=q) | Q(content__icontains=q)
        )[:n]
        top = list(txt_qs)
        return self._format(top, qvec=None)

    # ✅ AJOUTS (compat document_indexer.py) ---------------------------
    def add_documents(self, collection_name: str, documents: List[str], metadatas: List[Dict[str, Any]], ids: List[str]) -> None:
        """
        Ajoute des chunks (documents) dans la DB.
        Attendu par document_indexer.py
        """
        if not self.is_available():
            raise RuntimeError("Vector store indisponible (DocumentEmbedding introuvable)")

        col = (collection_name or "").strip() or "teras_general"
        docs = documents or []
        mds = metadatas or [{} for _ in range(len(docs))]
        chunk_ids = ids or ["" for _ in range(len(docs))]

        # Embeddings (si dispo) — sinon embedding=None, recherche fallback texte
        embeddings: List[Optional[List[float]]] = [None] * len(docs)
        if self.embedder.is_available():
            try:
                emb = self.embedder.embed(docs)
                if isinstance(emb, list) and len(emb) == len(docs):
                    embeddings = emb
            except Exception as e:
                logger.error("add_documents: embedding failed, fallback texte. Err=%s", e)

        for i, content in enumerate(docs):
            md = mds[i] if i < len(mds) else {}
            doc_id = (chunk_ids[i] if i < len(chunk_ids) else "") or None

            payload = {
                "collection": col,
                "title": (md.get("title") or ""),
                "source": (md.get("source") or ""),
                "content": (content or ""),
                "embedding": embeddings[i],
                "metadata": md if isinstance(md, dict) else {},
                "doc_id": doc_id,
            }

            if doc_id:
                self.Model.objects.update_or_create(
                    collection=col,
                    doc_id=doc_id,
                    defaults=payload
                )
            else:
                self.Model.objects.create(**payload)

    def delete_documents(self, collection_name: str, ids: List[str]) -> None:
        """Supprime des chunks par doc_id."""
        if not self.is_available():
            return
        col = (collection_name or "").strip()
        qs = self.Model.objects.all()
        if col:
            qs = qs.filter(collection=col)
        if ids:
            qs = qs.filter(doc_id__in=ids)
        qs.delete()

    def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """Statistiques simples de collection."""
        if not self.is_available():
            return {"collection": collection_name, "count": 0, "embeddings": 0}

        col = (collection_name or "").strip()
        qs = self.Model.objects.all()
        if col:
            qs = qs.filter(collection=col)

        total = qs.count()
        emb = qs.exclude(embedding__isnull=True).count()
        return {"collection": col, "count": total, "embeddings": emb}

    # ---- Format output ---------------------------------------------
    def _format(self, objs: List[Any], qvec: Optional[List[float]]) -> Dict[str, Any]:
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []
        distances: List[float] = []
        ids: List[str] = []

        for obj in objs:
            documents.append(getattr(obj, "content", "") or "")

            md = {
                "title": getattr(obj, "title", "") or "",
                "source": getattr(obj, "source", "") or "",
                "collection": getattr(obj, "collection", "") or "",
            }
            extra = getattr(obj, "metadata", None)
            if isinstance(extra, dict):
                md.update(extra)

            metadatas.append(md)
            ids.append(str(getattr(obj, "doc_id", None) or getattr(obj, "id", "")))

            if qvec and getattr(obj, "embedding", None):
                distances.append(_cosine_distance(qvec, obj.embedding or []))
            else:
                distances.append(0.8)

        return {
            "documents": [documents],
            "metadatas": [metadatas],
            "distances": [distances],
            "ids": [ids],
        }


# -------------------------------------------------------------------
# ✅ Singleton attendu par ai/views.py : get_vector_store()
# -------------------------------------------------------------------
_vector_store_singleton: Optional[TerasVectorStore] = None


def get_vector_store() -> TerasVectorStore:
    global _vector_store_singleton
    if _vector_store_singleton is None:
        _vector_store_singleton = TerasVectorStore()
    return _vector_store_singleton
# backend/ai/document_indexer.py
"""
TERAS Document Indexer
Indexation et chunking de documents pour RAG
"""

import hashlib
from typing import List, Dict, Optional, Tuple
# RecursiveCharacterTextSplitter — implémentation native (pas de langchain requis)
class RecursiveCharacterTextSplitter:
    """Version simplifiée compatible Python 3.14 (sans langchain)"""
    def __init__(self, chunk_size=500, chunk_overlap=50, length_function=len, separators=None):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", " ", ""]
    
    def split_text(self, text: str):
        if len(text) <= self.chunk_size:
            return [text]
        chunks = []
        start = 0
        while start < len(text):
            end = start + self.chunk_size
            if end >= len(text):
                chunks.append(text[start:])
                break
            # Trouver un bon point de coupure
            cut = end
            for sep in self.separators:
                pos = text.rfind(sep, start, end)
                if pos > start:
                    cut = pos + len(sep)
                    break
            chunks.append(text[start:cut])
            start = max(start + 1, cut - self.chunk_overlap)
        return [c for c in chunks if c.strip()]
import logging

from .vector_store import get_vector_store
from .models import IndexedDocument

logger = logging.getLogger('ai.document_indexer')


class TerasDocumentIndexer:
    """
    Service d'indexation de documents pour TERAS RAG
    """

    # Collections par type de document
    COLLECTIONS = {
        'legislation': 'teras_legislation',
        'documentation': 'teras_documentation',
        'faq': 'teras_faq',
        'case_study': 'teras_cases',
        'policy': 'teras_policies',
        'guide': 'teras_guides',
    }

    def __init__(
            self,
            chunk_size: int = 500,
            chunk_overlap: int = 50
    ):
        """
        Initialise l'indexeur

        Args:
            chunk_size: Taille des chunks en caractères
            chunk_overlap: Chevauchement entre chunks
        """
        self.vector_store = get_vector_store()

        # Text splitter pour découpage intelligent
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def calculate_content_hash(self, content: str) -> str:
        """
        Calcule le hash SHA256 du contenu

        Args:
            content: Contenu texte

        Returns:
            Hash hexadécimal
        """
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def chunk_document(self, content: str) -> List[str]:
        """
        Découpe un document en chunks

        Args:
            content: Contenu complet du document

        Returns:
            Liste de chunks
        """
        chunks = self.text_splitter.split_text(content)
        logger.debug(f"Document découpé en {len(chunks)} chunks")
        return chunks

    def index_document(
            self,
            title: str,
            content: str,
            document_type: str = 'documentation',
            source: str = '',
            metadata: Dict = None,
            user=None
    ) -> IndexedDocument:
        """
        Indexe un document dans la base vectorielle

        Args:
            title: Titre du document
            content: Contenu texte
            document_type: Type de document
            source: Source/URL (optionnel)
            metadata: Métadonnées additionnelles (optionnel)
            user: Utilisateur qui indexe (optionnel)

        Returns:
            Instance IndexedDocument créée
        """
        # Calculer hash pour déduplication
        content_hash = self.calculate_content_hash(content)

        # Vérifier si déjà indexé
        existing = IndexedDocument.objects.filter(content_hash=content_hash).first()
        if existing:
            logger.info(f"Document déjà indexé: {title} (hash: {content_hash[:8]}...)")
            return existing

        # Créer l'enregistrement DB
        doc = IndexedDocument.objects.create(
            title=title,
            document_type=document_type,
            content=content,
            content_hash=content_hash,
            source=source,
            metadata=metadata or {},
            indexed_by=user,
            status='indexing'
        )

        try:
            # Découper en chunks
            chunks = self.chunk_document(content)

            # Préparer métadonnées pour chaque chunk
            collection_name = self.COLLECTIONS.get(document_type, 'teras_general')

            chunk_metadatas = []
            chunk_ids = []

            for i, chunk in enumerate(chunks):
                chunk_meta = {
                    'document_id': str(doc.id),
                    'title': title,
                    'document_type': document_type,
                    'source': source,
                    'chunk_index': i,
                    'chunk_total': len(chunks)
                }
                # Ajouter métadonnées custom
                if metadata:
                    chunk_meta.update(metadata)

                chunk_metadatas.append(chunk_meta)
                chunk_ids.append(f"doc_{doc.id}_chunk_{i}")

            # Indexer dans ChromaDB
            self.vector_store.add_documents(
                collection_name=collection_name,
                documents=chunks,
                metadatas=chunk_metadatas,
                ids=chunk_ids
            )

            # Marquer comme indexé
            vector_id = f"doc_{doc.id}"
            doc.mark_as_indexed(vector_id=vector_id, chunk_count=len(chunks))

            logger.info(f"Document indexé: {title} ({len(chunks)} chunks)")
            return doc

        except Exception as e:
            logger.error(f"Erreur indexation document '{title}': {e}", exc_info=True)
            doc.mark_as_failed()
            raise

    def index_bulk(
            self,
            documents: List[Dict],
            user=None
    ) -> List[IndexedDocument]:
        """
        Indexe plusieurs documents en batch

        Args:
            documents: Liste de dicts avec title, content, document_type, etc.
            user: Utilisateur qui indexe

        Returns:
            Liste des IndexedDocument créés
        """
        indexed_docs = []

        for doc_data in documents:
            try:
                doc = self.index_document(
                    title=doc_data['title'],
                    content=doc_data['content'],
                    document_type=doc_data.get('document_type', 'documentation'),
                    source=doc_data.get('source', ''),
                    metadata=doc_data.get('metadata'),
                    user=user
                )
                indexed_docs.append(doc)
            except Exception as e:
                logger.error(f"Erreur indexation bulk '{doc_data.get('title')}': {e}")
                continue

        logger.info(f"Indexation bulk: {len(indexed_docs)}/{len(documents)} réussis")
        return indexed_docs

    def reindex_document(self, document_id: int) -> IndexedDocument:
        """
        Ré-indexe un document existant

        Args:
            document_id: ID du document à ré-indexer

        Returns:
            Document ré-indexé
        """
        doc = IndexedDocument.objects.get(id=document_id)

        # Supprimer anciens chunks
        self.delete_document_chunks(doc)

        # Ré-indexer
        doc.status = 'pending'
        doc.save()

        return self.index_document(
            title=doc.title,
            content=doc.content,
            document_type=doc.document_type,
            source=doc.source,
            metadata=doc.metadata,
            user=doc.indexed_by
        )

    def delete_document_chunks(self, doc: IndexedDocument):
        """
        Supprime les chunks d'un document de ChromaDB

        Args:
            doc: Document à supprimer
        """
        if not doc.vector_id or doc.chunk_count == 0:
            return

        collection_name = self.COLLECTIONS.get(doc.document_type, 'teras_general')

        # IDs des chunks à supprimer
        chunk_ids = [f"doc_{doc.id}_chunk_{i}" for i in range(doc.chunk_count)]

        try:
            self.vector_store.delete_documents(
                collection_name=collection_name,
                ids=chunk_ids
            )
            logger.info(f"Supprimé {len(chunk_ids)} chunks du document {doc.id}")
        except Exception as e:
            logger.error(f"Erreur suppression chunks document {doc.id}: {e}")

    def get_collection_stats(self) -> Dict[str, Dict]:
        """
        Récupère les stats de toutes les collections

        Returns:
            Dict avec stats par collection
        """
        stats = {}
        for doc_type, collection_name in self.COLLECTIONS.items():
            try:
                stats[doc_type] = self.vector_store.get_collection_stats(collection_name)
            except Exception as e:
                logger.error(f"Erreur stats collection '{collection_name}': {e}")
                stats[doc_type] = {'error': str(e)}

        return stats


# Singleton instance
_indexer_instance = None


def get_indexer() -> TerasDocumentIndexer:
    """
    Récupère l'instance singleton de l'indexeur

    Returns:
        Instance TerasDocumentIndexer
    """
    global _indexer_instance
    if _indexer_instance is None:
        _indexer_instance = TerasDocumentIndexer()
    return _indexer_instance
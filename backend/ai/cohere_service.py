# backend/ai/cohere_service.py
"""
TERAS Cohere AI Service
Embeddings, Rerank, Search et RAG sans chromadb
Utilise le modèle DocumentEmbedding de models.py
"""

import os
import json
import hashlib
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime

try:
    import cohere
    COHERE_SDK_AVAILABLE = True
except ImportError:
    COHERE_SDK_AVAILABLE = False
    cohere = None
from django.conf import settings

logger = logging.getLogger('ai.cohere_service')


class CohereService:
    """
    Service Cohere pour TERAS
    - Embeddings de documents
    - Recherche sémantique
    - Reranking des résultats
    - Classification de tickets/documents
    - Résumés automatiques
    """

    def __init__(self):
        self.api_key = os.getenv('COHERE_API_KEY', getattr(settings, 'COHERE_API_KEY', None))
        if not self.api_key:
            logger.warning("COHERE_API_KEY non configurée")
            self.client = None
        else:
            try:
                if COHERE_SDK_AVAILABLE and cohere:
                    self.client = cohere.ClientV2(api_key=self.api_key)
                    logger.info("✅ Cohere client initialisé")
                else:
                    self.client = None
                    logger.warning("SDK Cohere non disponible — mode dégradé")
            except Exception as e:
                logger.error(f"❌ Erreur init Cohere: {e}")
                self.client = None

        # Modèles Cohere
        self.embed_model = "embed-multilingual-v3.0"
        self.chat_model = "command-r-plus"
        self.rerank_model = "rerank-multilingual-v3.0"

    def is_available(self) -> bool:
        """Vérifie si le service est disponible"""
        return self.client is not None

    # =========================================
    # EMBEDDINGS
    # =========================================

    def create_embedding(
            self,
            text: str,
            input_type: str = "search_document"
    ) -> List[float]:
        """
        Crée un embedding pour un texte

        Args:
            text: Texte à encoder
            input_type: "search_document" ou "search_query"

        Returns:
            Vecteur d'embedding (1024 dimensions)
        """
        if not self.client:
            raise ValueError("Cohere non configuré")

        response = self.client.embed(
            texts=[text],
            model=self.embed_model,
            input_type=input_type,
            embedding_types=["float"]
        )

        return response.embeddings.float[0]

    def create_embeddings_batch(
            self,
            texts: List[str],
            input_type: str = "search_document"
    ) -> List[List[float]]:
        """
        Crée des embeddings pour plusieurs textes

        Args:
            texts: Liste de textes
            input_type: Type d'input

        Returns:
            Liste de vecteurs
        """
        if not self.client:
            raise ValueError("Cohere non configuré")

        # Cohere accepte max 96 textes par requête
        all_embeddings = []
        batch_size = 96

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = self.client.embed(
                texts=batch,
                model=self.embed_model,
                input_type=input_type,
                embedding_types=["float"]
            )
            all_embeddings.extend(response.embeddings.float)

        return all_embeddings

    # =========================================
    # RECHERCHE SÉMANTIQUE
    # =========================================

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calcule la similarité cosinus entre deux vecteurs"""
        import math

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def search_documents(
            self,
            query: str,
            documents: List[Dict],
            top_k: int = 5
    ) -> List[Dict]:
        """
        Recherche sémantique dans une liste de documents

        Args:
            query: Requête de recherche
            documents: Liste de dicts avec 'content' et 'embedding' (optionnel)
            top_k: Nombre de résultats

        Returns:
            Documents triés par pertinence avec score
        """
        if not self.client:
            raise ValueError("Cohere non configuré")

        # Créer embedding de la requête
        query_embedding = self.create_embedding(query, input_type="search_query")

        # Calculer les scores
        results = []
        for doc in documents:
            # Utiliser l'embedding existant ou en créer un
            if 'embedding' in doc and doc['embedding']:
                doc_embedding = doc['embedding']
            else:
                doc_embedding = self.create_embedding(doc['content'])

            score = self.cosine_similarity(query_embedding, doc_embedding)
            results.append({
                **doc,
                'score': score
            })

        # Trier par score décroissant
        results.sort(key=lambda x: x['score'], reverse=True)

        return results[:top_k]

    # =========================================
    # RERANKING
    # =========================================

    def rerank(
            self,
            query: str,
            documents: List[str],
            top_n: int = 5
    ) -> List[Dict]:
        """
        Rerank les documents par pertinence

        Args:
            query: Requête
            documents: Liste de textes de documents
            top_n: Nombre de résultats à retourner

        Returns:
            Documents reordonnés avec scores
        """
        if not self.client:
            raise ValueError("Cohere non configuré")

        response = self.client.rerank(
            query=query,
            documents=documents,
            model=self.rerank_model,
            top_n=top_n
        )

        results = []
        for item in response.results:
            results.append({
                'index': item.index,
                'document': documents[item.index],
                'relevance_score': item.relevance_score
            })

        return results

    # =========================================
    # CLASSIFICATION
    # =========================================

    def classify_ticket(self, ticket_content: str) -> Dict:
        """
        Classifie automatiquement un ticket de support

        Args:
            ticket_content: Contenu du ticket (sujet + description)

        Returns:
            Catégorie et priorité suggérées
        """
        if not self.client:
            return {'category': 'general', 'priority': 'medium'}

        prompt = f"""Analyse ce ticket de support et détermine:
1. La catégorie parmi: general, account, score, kyc, credit, technical, billing, other
2. La priorité parmi: low, medium, high, urgent

Ticket:
{ticket_content}

Réponds en JSON: {{"category": "...", "priority": "...", "reason": "..."}}"""

        response = self.client.chat(
            model=self.chat_model,
            messages=[{"role": "user", "content": prompt}]
        )

        try:
            # Extraire le JSON de la réponse
            content = response.message.content[0].text
            # Trouver le JSON dans la réponse
            import re
            json_match = re.search(r'\{[^}]+\}', content)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            logger.error(f"Erreur classification: {e}")

        return {'category': 'general', 'priority': 'medium'}

    def classify_document(self, document_content: str) -> Dict:
        """
        Classifie un document uploadé

        Args:
            document_content: Contenu du document

        Returns:
            Type de document et métadonnées
        """
        if not self.client:
            return {'type': 'other', 'confidence': 0.5}

        prompt = f"""Analyse ce document et détermine son type parmi:
- identity: Pièce d'identité (CNI, passeport)
- income: Justificatif de revenus (fiche de paie, attestation)
- address: Justificatif de domicile (facture, attestation)
- bank: Document bancaire (relevé, RIB)
- business: Document entreprise (RCCM, statuts)
- other: Autre document

Document (extrait):
{document_content[:1500]}

Réponds en JSON: {{"type": "...", "confidence": 0.0-1.0, "details": "..."}}"""

        response = self.client.chat(
            model=self.chat_model,
            messages=[{"role": "user", "content": prompt}]
        )

        try:
            content = response.message.content[0].text
            import re
            json_match = re.search(r'\{[^}]+\}', content)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            logger.error(f"Erreur classification document: {e}")

        return {'type': 'other', 'confidence': 0.5}

    # =========================================
    # RÉSUMÉS
    # =========================================

    def summarize(
            self,
            text: str,
            length: str = "medium",
            format: str = "paragraph"
    ) -> str:
        """
        Génère un résumé d'un texte

        Args:
            text: Texte à résumer
            length: "short", "medium", "long"
            format: "paragraph" ou "bullets"

        Returns:
            Résumé
        """
        if not self.client:
            return text[:500] + "..."

        prompt = f"""Résume ce texte en français. 
Longueur: {length}
Format: {format}

Texte:
{text}

Résumé:"""

        response = self.client.chat(
            model=self.chat_model,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.message.content[0].text

    # =========================================
    # RAG - QUESTION/RÉPONSE
    # =========================================

    def answer_with_context(
            self,
            question: str,
            context_documents: List[str],
            system_prompt: str = None
    ) -> Dict:
        """
        Répond à une question en utilisant des documents comme contexte

        Args:
            question: Question de l'utilisateur
            context_documents: Documents de contexte
            system_prompt: Instructions système (optionnel)

        Returns:
            Réponse avec sources
        """
        if not self.client:
            raise ValueError("Cohere non configuré")

        # Construire le contexte
        context = "\n\n---\n\n".join([
            f"Document {i + 1}:\n{doc}"
            for i, doc in enumerate(context_documents)
        ])

        default_system = """Tu es un assistant TERAS spécialisé dans le scoring financier au Congo-Brazzaville.
Réponds en français de manière précise et professionnelle.
Base ta réponse UNIQUEMENT sur les documents fournis.
Si l'information n'est pas dans les documents, dis-le clairement."""

        prompt = f"""{system_prompt or default_system}

DOCUMENTS DE RÉFÉRENCE:
{context}

QUESTION: {question}

RÉPONSE:"""

        response = self.client.chat(
            model=self.chat_model,
            messages=[{"role": "user", "content": prompt}]
        )

        return {
            'answer': response.message.content[0].text,
            'sources_count': len(context_documents),
            'model': self.chat_model
        }

    # =========================================
    # CHAT CONVERSATIONNEL
    # =========================================

    def chat(
            self,
            message: str,
            conversation_history: List[Dict] = None,
            system_prompt: str = None
    ) -> str:
        """
        Chat conversationnel avec historique

        Args:
            message: Message de l'utilisateur
            conversation_history: Historique [{role, content}, ...]
            system_prompt: Instructions système

        Returns:
            Réponse du modèle
        """
        if not self.client:
            raise ValueError("Cohere non configuré")

        messages = []

        # Ajouter le system prompt comme premier message
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })

        # Ajouter l'historique
        if conversation_history:
            messages.extend(conversation_history)

        # Ajouter le message actuel
        messages.append({
            "role": "user",
            "content": message
        })

        response = self.client.chat(
            model=self.chat_model,
            messages=messages
        )

        return response.message.content[0].text


# =========================================
# SERVICE DE STOCKAGE D'EMBEDDINGS
# =========================================

class EmbeddingStore:
    """
    Store pour gérer les embeddings dans la DB Django
    Utilise le modèle DocumentEmbedding de models.py
    """

    def __init__(self):
        self.cohere = CohereService()

    def index_document(
            self,
            document_id: int,
            document_type: str,
            content: str,
            title: str = "",
            source: str = "",
            metadata: Dict = None,
            chunk_size: int = 500,
            chunk_overlap: int = 50
    ) -> int:
        """
        Indexe un document en créant des embeddings pour chaque chunk

        Returns:
            Nombre de chunks créés
        """
        # Import ici pour éviter les imports circulaires
        from .models import DocumentEmbedding

        # Découper en chunks
        chunks = self._split_text(content, chunk_size, chunk_overlap)

        # Créer les embeddings en batch
        embeddings = self.cohere.create_embeddings_batch(chunks)

        # Sauvegarder
        created = 0
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            content_hash = hashlib.sha256(chunk.encode('utf-8')).hexdigest()

            # Vérifier si existe déjà
            existing = DocumentEmbedding.objects.filter(
                content_hash=content_hash
            ).first()

            if not existing:
                DocumentEmbedding.objects.create(
                    doc_id=f"doc_{document_id}_chunk_{i}",
                    collection=document_type,
                    content=chunk,
                    embedding=embedding,
                    title=title,
                    source=source,
                    metadata=metadata or {},
                    content_hash=content_hash
                )
                created += 1

        logger.info(f"Indexé document {document_id}: {created}/{len(chunks)} chunks")
        return created

    def search(
            self,
            query: str,
            document_type: str = None,
            top_k: int = 5
    ) -> List[Dict]:
        """
        Recherche sémantique dans les documents indexés
        """
        # Import ici pour éviter les imports circulaires
        from .models import DocumentEmbedding

        # Créer embedding de la requête
        query_embedding = self.cohere.create_embedding(query, input_type="search_query")

        # Récupérer les documents
        qs = DocumentEmbedding.objects.all()
        if document_type:
            qs = qs.filter(collection=document_type)

        # Calculer les scores
        results = []
        for doc in qs:
            if doc.embedding:
                score = self.cohere.cosine_similarity(query_embedding, doc.embedding)
                results.append({
                    'id': doc.id,
                    'doc_id': doc.doc_id,
                    'collection': doc.collection,
                    'title': doc.title,
                    'content': doc.content,
                    'source': doc.source,
                    'score': score,
                    'metadata': doc.metadata
                })

        # Trier et retourner top_k
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_k]

    def delete_document(self, document_id: int, document_type: str):
        """Supprime les embeddings d'un document"""
        from .models import DocumentEmbedding

        # Supprimer tous les chunks de ce document
        deleted, _ = DocumentEmbedding.objects.filter(
            doc_id__startswith=f"doc_{document_id}_"
        ).delete()
        logger.info(f"Supprimé {deleted} chunks pour document {document_id}")
        return deleted

    def _split_text(
            self,
            text: str,
            chunk_size: int,
            overlap: int
    ) -> List[str]:
        """Découpe un texte en chunks avec overlap"""
        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]

            # Essayer de couper à une fin de phrase
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                cut_point = max(last_period, last_newline)
                if cut_point > chunk_size * 0.5:
                    chunk = chunk[:cut_point + 1]
                    end = start + cut_point + 1

            chunks.append(chunk.strip())
            start = end - overlap

        return [c for c in chunks if c]  # Filtrer les vides


# =========================================
# SINGLETON
# =========================================

_cohere_service = None
_embedding_store = None


def get_cohere_service() -> CohereService:
    """Retourne l'instance singleton du service Cohere"""
    global _cohere_service
    if _cohere_service is None:
        _cohere_service = CohereService()
    return _cohere_service


def get_embedding_store() -> EmbeddingStore:
    """Retourne l'instance singleton du store d'embeddings"""
    global _embedding_store
    if _embedding_store is None:
        _embedding_store = EmbeddingStore()
    return _embedding_store
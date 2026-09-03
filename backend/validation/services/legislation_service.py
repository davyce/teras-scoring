# backend/admin/services/legislation_service.py
"""
Service de gestion et indexation vectorielle de la législation CEMAC
Utilise des embeddings pour recherche sémantique
"""

import os
import logging
from typing import List, Dict, Optional
from PyPDF2 import PdfReader

logger = logging.getLogger(__name__)

# Configuration
CHUNK_SIZE = 512  # Tokens par chunk
CHUNK_OVERLAP = 50  # Overlap entre chunks


class LegislationService:
    """Service de gestion de la législation"""
    
    def __init__(self):
        self.vector_store_available = self._check_vector_store()
    
    def _check_vector_store(self) -> bool:
        """Vérifie si un vector store est configuré"""
        # TODO: Vérifier si pgvector, Pinecone ou Weaviate est configuré
        return False
    
    def index_legislation_document(self, legislation_doc) -> Dict:
        """
        Indexe un document législatif
        
        Args:
            legislation_doc: Instance de LegislationDocument
        
        Returns:
            Dict avec les résultats de l'indexation
        """
        
        try:
            # 1. Extraire le texte du PDF
            full_text = self._extract_text_from_pdf(legislation_doc.file.path)
            
            if not full_text:
                logger.error(f"Impossible d'extraire le texte de {legislation_doc.filename}")
                return {
                    'success': False,
                    'error': 'Extraction texte échouée'
                }
            
            # 2. Découper en chunks
            chunks = self._chunk_text(full_text, CHUNK_SIZE, CHUNK_OVERLAP)
            
            logger.info(f"Document {legislation_doc.filename} découpé en {len(chunks)} chunks")
            
            # 3. Créer embeddings et stocker
            if self.vector_store_available:
                vector_ids = self._store_chunks_in_vector_db(
                    chunks=chunks,
                    legislation_doc=legislation_doc
                )
            else:
                logger.warning("Vector store non configuré - stockage local uniquement")
                vector_ids = []
            
            # 4. Mettre à jour le document
            from datetime import datetime
            legislation_doc.indexed = True
            legislation_doc.indexed_at = datetime.now()
            legislation_doc.chunks_count = len(chunks)
            legislation_doc.vector_ids = vector_ids if vector_ids else []
            legislation_doc.save()
            
            return {
                'success': True,
                'chunks_count': len(chunks),
                'vector_ids_count': len(vector_ids)
            }
            
        except Exception as e:
            logger.error(f"Erreur indexation {legislation_doc.filename}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extrait le texte complet d'un PDF"""
        
        try:
            reader = PdfReader(file_path)
            text = ""
            
            for page in reader.pages:
                text += page.extract_text() + "\n\n"
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Erreur extraction PDF: {str(e)}")
            return ""
    
    def _chunk_text(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """
        Découpe le texte en chunks avec overlap
        
        Note: Version simple par caractères
        TODO: Améliorer avec tokenization (tiktoken)
        """
        
        chunks = []
        words = text.split()
        
        # Approximation: 1 token ≈ 4 caractères
        chars_per_chunk = chunk_size * 4
        chars_overlap = overlap * 4
        
        start = 0
        while start < len(text):
            end = start + chars_per_chunk
            chunk = text[start:end]
            
            if chunk.strip():
                chunks.append(chunk.strip())
            
            start = end - chars_overlap
        
        return chunks
    
    def _store_chunks_in_vector_db(
        self, 
        chunks: List[str], 
        legislation_doc
    ) -> List[str]:
        """
        Stocke les chunks dans une base vectorielle
        
        Options:
        - PostgreSQL avec pgvector
        - Pinecone (cloud)
        - Weaviate (self-hosted)
        
        Returns:
            Liste des IDs vectoriels
        """
        
        # TODO: Implémenter selon le vector store choisi
        
        # Exemple avec pgvector (à implémenter):
        # from pgvector.psycopg2 import register_vector
        # import psycopg2
        # 
        # conn = psycopg2.connect(...)
        # register_vector(conn)
        # 
        # for chunk in chunks:
        #     embedding = self._get_embedding(chunk)
        #     cursor.execute(
        #         "INSERT INTO legislation_vectors (doc_id, chunk, embedding) VALUES (%s, %s, %s)",
        #         (legislation_doc.id, chunk, embedding)
        #     )
        
        logger.warning("Vector DB non implémenté - retour liste vide")
        return []
    
    def _get_embedding(self, text: str) -> List[float]:
        """
        Génère l'embedding d'un texte
        
        Options:
        - OpenAI embeddings (text-embedding-3-small)
        - Sentence Transformers (local)
        - Claude embeddings (si disponible)
        """
        
        # TODO: Implémenter
        # Exemple avec OpenAI:
        # import openai
        # response = openai.Embedding.create(
        #     model="text-embedding-3-small",
        #     input=text
        # )
        # return response['data'][0]['embedding']
        
        return []
    
    def search_legislation(
        self, 
        query: str, 
        country: Optional[str] = None,
        category: Optional[str] = None,
        top_k: int = 5
    ) -> str:
        """
        Recherche sémantique dans la législation
        
        Args:
            query: Question ou requête
            country: Filtrer par pays (optionnel)
            category: Filtrer par catégorie (optionnel)
            top_k: Nombre de résultats à retourner
        
        Returns:
            Contexte législatif pertinent (texte)
        """
        
        if not self.vector_store_available:
            logger.warning("Vector store non disponible - recherche simple")
            return self._simple_search(query, country, category)
        
        # TODO: Implémenter recherche vectorielle
        # 1. Générer embedding de la query
        # query_embedding = self._get_embedding(query)
        # 
        # 2. Rechercher chunks similaires
        # similar_chunks = vector_db.similarity_search(
        #     query_embedding, 
        #     filters={'country': country, 'category': category},
        #     top_k=top_k
        # )
        # 
        # 3. Combiner et retourner
        # return "\n\n".join([chunk.text for chunk in similar_chunks])
        
        return self._simple_search(query, country, category)
    
    def _simple_search(
        self, 
        query: str, 
        country: Optional[str] = None,
        category: Optional[str] = None
    ) -> str:
        """
        Recherche simple (fallback sans vector store)
        Retourne les documents les plus récents correspondants
        """
        
        from users.models import LegislationDocument
        
        queryset = LegislationDocument.objects.filter(is_active=True, indexed=True)
        
        if country:
            queryset = queryset.filter(country=country)
        
        if category:
            queryset = queryset.filter(category=category)
        
        # Prendre les 3 documents les plus récents
        docs = queryset.order_by('-effective_date')[:3]
        
        if not docs:
            return "Aucune législation disponible pour ce contexte."
        
        context = ""
        for doc in docs:
            context += f"\n\n--- {doc.title} ({doc.country_display}) ---\n"
            context += f"Catégorie: {doc.category_display}\n"
            if doc.description:
                context += f"{doc.description[:500]}\n"
        
        return context.strip()
    
    def get_relevant_legislation(
        self,
        country: str,
        document_type: str
    ) -> str:
        """
        Récupère la législation pertinente pour un type de document
        
        Mapping document_type → category
        """
        
        # Mapping type document → catégorie législation
        category_mapping = {
            'national_id': 'kyc',
            'passport': 'kyc',
            'drivers_license': 'kyc',
            'residence_proof': 'kyc',
            'bank_statement': 'banking',
            'business_registration': 'business',
            'business_statutes': 'business',
            'tax_certificate': 'tax',
            'balance_sheet': 'tax',
            'official_mandate': 'compliance',
            'accreditation': 'compliance',
            'banking_license': 'banking',
            'certification': 'compliance',
        }
        
        category = category_mapping.get(document_type, 'kyc')
        
        return self.search_legislation(
            query=f"Exigences pour {document_type}",
            country=country,
            category=category,
            top_k=3
        )


# Instance globale
legislation_service = LegislationService()


def index_legislation(legislation_doc):
    """Helper function pour indexation"""
    return legislation_service.index_legislation_document(legislation_doc)


def search_legislation(query, country=None, category=None):
    """Helper function pour recherche"""
    return legislation_service.search_legislation(query, country, category)

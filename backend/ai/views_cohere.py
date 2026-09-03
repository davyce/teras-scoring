# backend/ai/views_cohere.py
"""
TERAS Cohere AI Views
API endpoints pour les fonctionnalités IA Cohere
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .cohere_service import get_cohere_service, get_embedding_store


class CohereStatusView(APIView):
    """
    GET /api/ai/cohere/status/
    Vérifie le statut du service Cohere
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        service = get_cohere_service()
        
        return Response({
            'available': service.is_available(),
            'models': {
                'embed': service.embed_model,
                'chat': service.chat_model,
                'rerank': service.rerank_model,
            } if service.is_available() else None
        })


class CohereChatView(APIView):
    """
    POST /api/ai/cohere/chat/
    Chat avec Cohere
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        service = get_cohere_service()
        
        if not service.is_available():
            return Response(
                {'error': 'Service Cohere non disponible'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        message = request.data.get('message', '').strip()
        history = request.data.get('history', [])
        system_prompt = request.data.get('system_prompt')
        
        if not message:
            return Response(
                {'error': 'Message requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            response = service.chat(
                message=message,
                conversation_history=history,
                system_prompt=system_prompt
            )
            
            return Response({
                'response': response,
                'model': service.chat_model
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CohereSearchView(APIView):
    """
    POST /api/ai/cohere/search/
    Recherche sémantique dans les documents indexés
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        service = get_cohere_service()
        store = get_embedding_store()
        
        if not service.is_available():
            return Response(
                {'error': 'Service Cohere non disponible'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        query = request.data.get('query', '').strip()
        document_type = request.data.get('document_type')
        top_k = request.data.get('top_k', 5)
        
        if not query:
            return Response(
                {'error': 'Query requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            results = store.search(
                query=query,
                document_type=document_type,
                top_k=min(top_k, 20)
            )
            
            return Response({
                'query': query,
                'results': results,
                'count': len(results)
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CohereRAGView(APIView):
    """
    POST /api/ai/cohere/rag/
    Question-réponse avec contexte (RAG)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        service = get_cohere_service()
        store = get_embedding_store()
        
        if not service.is_available():
            return Response(
                {'error': 'Service Cohere non disponible'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        question = request.data.get('question', '').strip()
        document_type = request.data.get('document_type')
        top_k = request.data.get('top_k', 5)
        
        if not question:
            return Response(
                {'error': 'Question requise'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 1. Rechercher les documents pertinents
            search_results = store.search(
                query=question,
                document_type=document_type,
                top_k=top_k
            )
            
            if not search_results:
                return Response({
                    'answer': "Je n'ai pas trouvé d'information pertinente dans la base documentaire.",
                    'sources': [],
                    'has_context': False
                })
            
            # 2. Extraire les textes pour le contexte
            context_docs = [r['content'] for r in search_results]
            
            # 3. Générer la réponse
            result = service.answer_with_context(
                question=question,
                context_documents=context_docs
            )
            
            return Response({
                'answer': result['answer'],
                'sources': [
                    {
                        'title': r['title'],
                        'source': r['source'],
                        'score': r['score'],
                        'excerpt': r['content'][:200] + '...'
                    }
                    for r in search_results
                ],
                'has_context': True,
                'model': result['model']
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CohereSummarizeView(APIView):
    """
    POST /api/ai/cohere/summarize/
    Résume un texte
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        service = get_cohere_service()
        
        if not service.is_available():
            return Response(
                {'error': 'Service Cohere non disponible'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        text = request.data.get('text', '').strip()
        length = request.data.get('length', 'medium')
        format_type = request.data.get('format', 'paragraph')
        
        if not text:
            return Response(
                {'error': 'Texte requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(text) < 100:
            return Response(
                {'error': 'Texte trop court pour être résumé'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            summary = service.summarize(
                text=text,
                length=length,
                format=format_type
            )
            
            return Response({
                'summary': summary,
                'original_length': len(text),
                'summary_length': len(summary)
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CohereClassifyTicketView(APIView):
    """
    POST /api/ai/cohere/classify-ticket/
    Classifie automatiquement un ticket de support
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        service = get_cohere_service()
        
        if not service.is_available():
            return Response(
                {'error': 'Service Cohere non disponible'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        subject = request.data.get('subject', '').strip()
        description = request.data.get('description', '').strip()
        
        if not subject and not description:
            return Response(
                {'error': 'Sujet ou description requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            content = f"Sujet: {subject}\n\nDescription: {description}"
            result = service.classify_ticket(content)
            
            return Response({
                'classification': result,
                'suggested_category': result.get('category', 'general'),
                'suggested_priority': result.get('priority', 'medium'),
                'reason': result.get('reason', '')
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CohereClassifyDocumentView(APIView):
    """
    POST /api/ai/cohere/classify-document/
    Classifie automatiquement un document
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        service = get_cohere_service()
        
        if not service.is_available():
            return Response(
                {'error': 'Service Cohere non disponible'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        content = request.data.get('content', '').strip()
        
        if not content:
            return Response(
                {'error': 'Contenu requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = service.classify_document(content)
            
            return Response({
                'classification': result,
                'document_type': result.get('type', 'other'),
                'confidence': result.get('confidence', 0.5),
                'details': result.get('details', '')
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CohereRerankView(APIView):
    """
    POST /api/ai/cohere/rerank/
    Rerank une liste de documents par pertinence
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        service = get_cohere_service()
        
        if not service.is_available():
            return Response(
                {'error': 'Service Cohere non disponible'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        query = request.data.get('query', '').strip()
        documents = request.data.get('documents', [])
        top_n = request.data.get('top_n', 5)
        
        if not query:
            return Response(
                {'error': 'Query requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not documents or len(documents) < 2:
            return Response(
                {'error': 'Au moins 2 documents requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            results = service.rerank(
                query=query,
                documents=documents,
                top_n=min(top_n, len(documents))
            )
            
            return Response({
                'query': query,
                'results': results
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CohereIndexDocumentView(APIView):
    """
    POST /api/ai/cohere/index/
    Indexe un document pour la recherche sémantique
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        service = get_cohere_service()
        store = get_embedding_store()
        
        if not service.is_available():
            return Response(
                {'error': 'Service Cohere non disponible'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        document_id = request.data.get('document_id')
        document_type = request.data.get('document_type', 'general')
        content = request.data.get('content', '').strip()
        title = request.data.get('title', '')
        source = request.data.get('source', '')
        metadata = request.data.get('metadata', {})
        
        if not document_id or not content:
            return Response(
                {'error': 'document_id et content requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            chunks_created = store.index_document(
                document_id=document_id,
                document_type=document_type,
                content=content,
                title=title,
                source=source,
                metadata=metadata
            )
            
            return Response({
                'success': True,
                'document_id': document_id,
                'chunks_created': chunks_created
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

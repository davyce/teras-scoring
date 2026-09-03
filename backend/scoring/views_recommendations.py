# backend/scoring/views_recommendations.py
"""
TERAS Recommendations API - GÉNÉRATION IA DÉTAILLÉE
✅ Utilise le service RAG pour générer recommandations complètes
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime, timedelta
import logging

from django.contrib.auth import get_user_model
from .models import Recommendation, TerasScore, Transaction, Income, Asset

User = get_user_model()
logger = logging.getLogger('scoring.recommendations')


class GenerateDetailedRecommendationView(APIView):
    """
    POST /api/scoring/user/recommendations/generate-detail/
    
    Génère une recommandation IA détaillée basée sur:
    - Le score actuel de l'utilisateur
    - L'historique des 30 derniers jours
    - Les données du profil
    - La catégorie de recommandation
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Récupérer données
            recommendation_id = request.data.get('recommendation_id')
            category = request.data.get('category')
            
            if not recommendation_id and not category:
                return Response(
                    {'error': 'recommendation_id ou category requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Récupérer recommandation existante OU créer contexte
            if recommendation_id:
                try:
                    rec = Recommendation.objects.get(id=recommendation_id, user=request.user)
                    category = rec.category
                except Recommendation.DoesNotExist:
                    return Response(
                        {'error': 'Recommandation introuvable'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Construire contexte utilisateur
            context = self._build_user_context(request.user, category)
            
            # Appeler service IA pour génération détaillée
            detailed_recommendation = self._generate_with_ai(context, category)
            
            return Response(detailed_recommendation, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Erreur génération recommandation: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Erreur serveur: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _build_user_context(self, user: User, category: str) -> dict:
        """Construit le contexte complet de l'utilisateur"""
        
        # Score actuel
        try:
            current_score = TerasScore.objects.filter(user=user).latest('created_at')
            score_data = {
                'score': current_score.score,
                'level': current_score.level,
                'breakdown': {
                    'T': current_score.transactions_score,
                    'E': current_score.savings_score,
                    'R': current_score.income_score,
                    'A': current_score.assets_score,
                    'S': current_score.social_score,
                }
            }
        except TerasScore.DoesNotExist:
            score_data = {'score': 0, 'level': 'Nouveau', 'breakdown': {}}
        
        # Transactions 30j
        thirty_days_ago = timezone.now() - timedelta(days=30)
        transactions = Transaction.objects.filter(
            user=user,
            created_at__gte=thirty_days_ago
        )
        
        transactions_data = {
            'count': transactions.count(),
            'total_volume': float(sum(t.amount for t in transactions)),
            'avg_transaction': float(sum(t.amount for t in transactions) / max(transactions.count(), 1)),
            'channels': list(set(t.channel for t in transactions))
        }
        
        # Revenus
        incomes = Income.objects.filter(user=user).only('amount', 'source', 'verified')
        income_data = {
            'monthly_avg': float(incomes.aggregate(avg=models.Avg('amount'))['avg'] or 0),
            'verified': incomes.filter(verified=True).exists(),
            'sources': list(set(i.source for i in incomes)) if incomes.exists() else []
        }
        
        # Actifs
        assets = Asset.objects.filter(user=user).only('estimated_value', 'asset_type', 'verified')
        assets_data = {
            'total_value': float(sum(a.estimated_value for a in assets)) if assets.exists() else 0.0,
            'types': list(set(a.asset_type for a in assets)) if assets.exists() else [],
            'verified_count': assets.filter(verified=True).count()
        }
        
        # Profil
        profile_data = {
            'first_name': user.first_name or 'Utilisateur',
            'email': user.email,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None
        }
        
        return {
            'category': category,
            'score': score_data,
            'transactions': transactions_data,
            'income': income_data,
            'assets': assets_data,
            'profile': profile_data
        }
    
    def _generate_with_ai(self, context: dict, category: str) -> dict:
        """Génère recommandation détaillée avec IA"""
        
        try:
            # Importer service RAG
            from ai.rag_service import get_rag_service
            rag_service = get_rag_service()
            
            # Construire prompt
            prompt = self._build_prompt(context, category)
            
            # Appeler IA
            result = rag_service.chat_with_rag(
                query=prompt,
                document_types=['documentation', 'faq'],
                n_results=3,
                user=None,
                conversation_history=[]
            )
            
            # Parser réponse
            return self._parse_ai_response(result['response'], context)
            
        except Exception as e:
            logger.error(f"Erreur IA: {e}")
            # Fallback: recommandation basique
            return self._generate_fallback(context, category)
    
    def _build_prompt(self, context: dict, category: str) -> str:
        """Construit le prompt pour l'IA"""
        
        category_labels = {
            'transactions': 'Transactions',
            'epargne': 'Épargne',
            'revenus': 'Revenus',
            'actifs': 'Actifs',
            'social': 'Score Social'
        }
        
        prompt = f"""Tu es l'Assistant IA TERAS. Génère une recommandation DÉTAILLÉE pour améliorer le pilier "{category_labels.get(category, category)}".

**CONTEXTE UTILISATEUR:**
- Nom: {context['profile']['first_name']}
- Score TERAS actuel: {context['score']['score']}/1000 ({context['score']['level']})
- Breakdown:
  * Transactions (T): {context['score']['breakdown'].get('T', 0)}/100
  * Épargne (E): {context['score']['breakdown'].get('E', 0)}/100
  * Revenus (R): {context['score']['breakdown'].get('R', 0)}/100
  * Actifs (A): {context['score']['breakdown'].get('A', 0)}/100
  * Social (S): {context['score']['breakdown'].get('S', 0)}/100

- Transactions (30j): {context['transactions']['count']} transactions, {context['transactions']['total_volume']:,.0f} FCFA
- Revenus moyens: {context['income']['monthly_avg']:,.0f} FCFA/mois
- Actifs: {context['assets']['total_value']:,.0f} FCFA ({len(context['assets']['types'])} types)

**GÉNÈRE UNE RECOMMANDATION COMPLÈTE AVEC:**

1. **DIAGNOSTIC** (2-3 phrases)
   Analyse la situation actuelle de l'utilisateur pour ce pilier.

2. **OBJECTIF** (1 phrase claire)
   Quel objectif précis et mesurable atteindre ?

3. **PLAN D'ACTION** (5-7 étapes concrètes)
   Étapes détaillées et actionnables, numérotées.

4. **IMPACT ESTIMÉ**
   Gain de points attendu sur le score TERAS.

5. **DÉLAI**
   Temps nécessaire pour voir les résultats.

6. **CONSEILS BONUS** (2-3 tips)
   Astuces supplémentaires pour maximiser l'impact.

**FORMAT DE RÉPONSE (STRICT):**
```json
{{
  "diagnostic": "...",
  "objectif": "...",
  "plan_action": [
    {{"etape": 1, "titre": "...", "description": "..."}},
    ...
  ],
  "impact_points": "+XX points sur score TERAS",
  "delai": "X semaines/mois",
  "conseils_bonus": ["...", "...", "..."]
}}
```

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ou après."""

        return prompt
    
    def _parse_ai_response(self, ai_response: str, context: dict) -> dict:
        """Parse la réponse de l'IA"""
        
        import json
        import re
        
        try:
            # Extraire JSON
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                
                # Enrichir avec contexte
                data['user_name'] = context['profile']['first_name']
                data['current_score'] = context['score']['score']
                data['category'] = context['category']
                data['generated_at'] = datetime.now().isoformat()
                
                return data
            else:
                raise ValueError("Pas de JSON dans la réponse")
                
        except Exception as e:
            logger.error(f"Erreur parsing: {e}")
            return self._generate_fallback(context, context['category'])
    
    def _generate_fallback(self, context: dict, category: str) -> dict:
        """Génère recommandation basique si IA échoue"""
        
        fallbacks = {
            'transactions': {
                'diagnostic': f"Vous avez effectué {context['transactions']['count']} transactions ce mois-ci. Il y a une marge d'amélioration pour augmenter votre score.",
                'objectif': "Atteindre 20 transactions par mois minimum",
                'plan_action': [
                    {'etape': 1, 'titre': 'Transactions quotidiennes', 'description': 'Effectuez au moins 1 transaction par jour'},
                    {'etape': 2, 'titre': 'Diversifier les canaux', 'description': 'Utilisez wallet, QR code et transferts'},
                    {'etape': 3, 'titre': 'Régularité', 'description': 'Maintenez une activité constante chaque semaine'}
                ],
                'impact_points': '+25 points sur score TERAS',
                'delai': '4 semaines',
                'conseils_bonus': [
                    'Payez vos achats quotidiens via ZOLA',
                    'Programmez des transferts automatiques',
                    'Utilisez les paiements QR en magasin'
                ]
            },
            'epargne': {
                'diagnostic': f"Votre épargne actuelle peut être optimisée pour améliorer votre score TERAS.",
                'objectif': "Épargner 50,000 FCFA par mois minimum",
                'plan_action': [
                    {'etape': 1, 'titre': 'Épargne automatique', 'description': 'Configurez un virement automatique mensuel'},
                    {'etape': 2, 'titre': 'Régularité', 'description': 'Maintenez des dépôts constants chaque mois'},
                    {'etape': 3, 'titre': 'Objectif clair', 'description': 'Fixez-vous un objectif d\'épargne sur 6 mois'}
                ],
                'impact_points': '+30 points sur score TERAS',
                'delai': '3 mois',
                'conseils_bonus': [
                    'Utilisez la règle 50/30/20 (50% besoins, 30% envies, 20% épargne)',
                    'Créez une épargne d\'urgence équivalente à 3 mois de dépenses',
                    'Programmez votre épargne le jour de réception du salaire'
                ]
            },
            'revenus': {
                'diagnostic': f"Vos revenus moyens sont de {context['income']['monthly_avg']:,.0f} FCFA/mois. Stabiliser et augmenter vos revenus améliorera significativement votre score.",
                'objectif': "Stabiliser et documenter vos revenus mensuels",
                'plan_action': [
                    {'etape': 1, 'titre': 'Documentation', 'description': 'Conservez tous vos justificatifs de revenus'},
                    {'etape': 2, 'titre': 'Régularité', 'description': 'Maintenez des entrées d\'argent constantes'},
                    {'etape': 3, 'titre': 'Diversification', 'description': 'Développez des sources de revenus complémentaires'}
                ],
                'impact_points': '+35 points sur score TERAS',
                'delai': '2 mois',
                'conseils_bonus': [
                    'Déclarez tous vos revenus dans l\'application',
                    'Obtenez des attestations employeur si possible',
                    'Construisez un historique de 3 mois minimum'
                ]
            },
            'actifs': {
                'diagnostic': f"Vous avez déclaré {context['assets']['total_value']:,.0f} FCFA d'actifs. Documenter vos biens augmentera votre crédibilité.",
                'objectif': "Déclarer et vérifier tous vos actifs",
                'plan_action': [
                    {'etape': 1, 'titre': 'Inventaire', 'description': 'Listez tous vos biens (véhicule, terrain, équipement)'},
                    {'etape': 2, 'titre': 'Documentation', 'description': 'Rassemblez cartes grises, titres de propriété, factures'},
                    {'etape': 3, 'titre': 'Vérification', 'description': 'Soumettez vos documents pour vérification'}
                ],
                'impact_points': '+40 points sur score TERAS',
                'delai': '2 semaines',
                'conseils_bonus': [
                    'Commencez par les biens de valeur (moto, terrain)',
                    'Prenez des photos claires de vos documents',
                    'Mettez à jour régulièrement la valeur de vos actifs'
                ]
            },
            'social': {
                'diagnostic': "Votre réputation sociale peut être améliorée en participant activement à l'écosystème TERAS.",
                'objectif': "Obtenir une note moyenne de 4.5/5",
                'plan_action': [
                    {'etape': 1, 'titre': 'Transactions fiables', 'description': 'Honorez tous vos engagements à temps'},
                    {'etape': 2, 'titre': 'Parrainages', 'description': 'Parrainez 3-5 personnes dans votre réseau'},
                    {'etape': 3, 'titre': 'Participation', 'description': 'Rejoignez une tontine ou association'}
                ],
                'impact_points': '+20 points sur score TERAS',
                'delai': '6 semaines',
                'conseils_bonus': [
                    'Demandez des avis à vos partenaires commerciaux',
                    'Payez toujours vos dettes avant l\'échéance',
                    'Participez aux programmes communautaires ZOLA'
                ]
            }
        }
        
        data = fallbacks.get(category, fallbacks['transactions'])
        data['user_name'] = context['profile']['first_name']
        data['current_score'] = context['score']['score']
        data['category'] = category
        data['generated_at'] = datetime.now().isoformat()
        data['is_fallback'] = True
        
        return data


class ExportRecommendationPDFView(APIView):
    """
    POST /api/scoring/user/recommendations/export-pdf/
    
    Exporte une recommandation générée en PDF
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Récupérer données recommandation
            detail_data = request.data.get('detail_data')
            
            if not detail_data:
                return Response(
                    {'error': 'detail_data requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Importer service PDF
            from .pdf_export_recommendations import export_recommendation_to_pdf
            
            # Générer PDF
            pdf_buffer = export_recommendation_to_pdf(detail_data)
            
            if not pdf_buffer:
                return Response(
                    {'error': 'Erreur génération PDF'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Préparer nom fichier
            category = detail_data.get('category', 'recommandation')
            user_name = detail_data.get('user_name', 'utilisateur')
            filename = f"TERAS_Plan_IA_{category}_{user_name}_{datetime.now().strftime('%Y%m%d')}.pdf"
            
            # Retourner PDF
            response = HttpResponse(
                pdf_buffer.getvalue(),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            logger.info(f"PDF recommandation exporté: {filename}")
            
            return response
            
        except Exception as e:
            logger.error(f"Erreur export PDF: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Erreur serveur: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RecommendationCompleteView(APIView):
    """
    POST /api/scoring/user/recommendations/{pk}/complete/
    Marque une recommandation comme complétée.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            rec = Recommendation.objects.get(id=pk, user=request.user)
        except Recommendation.DoesNotExist:
            return Response({'error': 'Recommandation introuvable'}, status=status.HTTP_404_NOT_FOUND)

        rec.completed = True
        rec.completed_at = timezone.now()
        rec.save(update_fields=['completed', 'completed_at'])

        return Response({
            'message': 'Recommandation complétée',
            'id': rec.id,
            'completed': True,
            'completed_at': rec.completed_at.isoformat(),
        }, status=status.HTTP_200_OK)


# Importer dans urls.py
from django.db import models

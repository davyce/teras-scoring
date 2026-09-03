# backend/scoring/views_history_analysis.py
"""
Analyse IA des scores historiques
Génère des insights détaillés sur chaque score enregistré
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import requests
import os
from .models import TerasScore


class AnalyzeHistoricalScoreView(APIView):
    """
    POST /api/scoring/user/history/{score_id}/analyze/
    Génère une analyse IA détaillée d'un score historique
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, score_id):
        try:
            # Récupérer le score
            score = TerasScore.objects.get(id=score_id, user=request.user)
            
            # Récupérer l'historique pour contexte
            all_scores = TerasScore.objects.filter(
                user=request.user
            ).order_by('-created_at')[:10]
            
            # Calculer tendance
            if all_scores.count() > 1:
                previous_scores = list(all_scores[1:4])
                if previous_scores:
                    avg_previous = sum(s.score for s in previous_scores) / len(previous_scores)
                    trend = score.score - avg_previous
                else:
                    trend = 0
            else:
                trend = 0
            
            # Analyse des piliers
            piliers_analysis = []
            piliers_strengths = []
            piliers_weaknesses = []
            
            piliers = [
                ('T', 'Transactions', score.transactions_score, 100),
                ('E', 'Épargne', score.savings_score, 100),
                ('R', 'Revenus', score.income_score, 100),
                ('A', 'Actifs', score.assets_score, 100),
                ('S', 'Social', score.social_score, 100)
            ]
            
            for key, name, value, max_val in piliers:
                percentage = (value / max_val) * 100
                piliers_analysis.append(f"- {name} : {value}/100 ({percentage:.0f}%)")
                
                if percentage >= 75:
                    piliers_strengths.append(f"{name} ({percentage:.0f}%)")
                elif percentage < 50:
                    piliers_weaknesses.append(f"{name} ({percentage:.0f}%)")
            
            # Contexte pour Claude
            context = f"""Tu es un conseiller financier TERAS expert. Analyse ce score historique.

**SCORE ANALYSÉ** : {score.score}/1000 (Niveau {score.level_display})
**DATE** : {score.created_at.strftime('%d/%m/%Y à %H:%M')}
**SOURCE** : {'Simulation' if 'manual-compute' in score.model_version else 'Calcul réel'}

**DÉTAIL DES PILIERS** :
{chr(10).join(piliers_analysis)}

**POINTS FORTS** : {', '.join(piliers_strengths) if piliers_strengths else 'Aucun pilier dominant'}
**POINTS FAIBLES** : {', '.join(piliers_weaknesses) if piliers_weaknesses else 'Aucune faiblesse majeure'}

**TENDANCE** : {'Progression de ' + str(int(trend)) + ' points' if trend > 5 else 'Régression de ' + str(abs(int(trend))) + ' points' if trend < -5 else 'Stable'}

**CONSIGNE** :
Génère une analyse complète en 3 parties distinctes (séparées par "|||") :

1. ANALYSE GLOBALE (2-3 phrases) : Vue d'ensemble du score et de la situation
2. INSIGHTS CLÉS (3 points) : Observations importantes, un par ligne
3. RECOMMANDATIONS (3 actions) : Actions concrètes pour améliorer, une par ligne

**FORMAT REQUIS** :
Partie 1|||Point insight 1
Point insight 2
Point insight 3|||Action recommandation 1
Action recommandation 2
Action recommandation 3

**RÈGLES** :
- Ton encourageant et constructif
- Insights courts (max 12 mots)
- Recommandations actionnables (max 15 mots)
- Pas de formules de politesse
- Pas de numéros ni puces
- Directement au contenu

**EXEMPLE** :
Ton score de 780 montre une excellente gestion financière. Tes transactions et ton épargne sont exemplaires. Continue sur cette lancée tout en renforçant tes actifs pour viser le niveau Diamant.|||Transactions très régulières démontrant une discipline financière solide
Épargne constante permettant une bonne réserve de sécurité
Social légèrement en retrait nécessitant plus d'engagement communautaire|||Déclare tes biens (moto, terrain) avec preuves pour +25 points
Obtiens 2-3 avis positifs sur ZONE ce mois pour +15 points
Diversifie tes revenus avec une activité secondaire pour +20 points

Génère maintenant l'analyse pour ce score."""

            # Appeler Claude via REST (Python 3.14 compatible)
            api_resp = requests.post(
                'https://api.anthropic.com/v1/messages',
                headers={
                    'x-api-key': os.getenv('ANTHROPIC_API_KEY', ''),
                    'content-type': 'application/json',
                    'anthropic-version': '2023-06-01',
                },
                json={
                    'model': 'claude-sonnet-4-20250514',
                    'max_tokens': 800,
                    'messages': [{'role': 'user', 'content': context}]
                },
                timeout=30
            )
            api_resp.raise_for_status()
            
            # Parser la réponse
            response_text = api_resp.json()['content'][0]['text'].strip()
            parts = response_text.split('|||')
            
            if len(parts) >= 3:
                analysis = parts[0].strip()
                insights = [line.strip() for line in parts[1].strip().split('\n') if line.strip()]
                recommendations = [line.strip() for line in parts[2].strip().split('\n') if line.strip()]
            else:
                # Fallback si parsing échoue
                analysis = response_text
                insights = []
                recommendations = []
            
            # Prédiction tendance
            if trend > 10:
                trend_pred = "Progression forte attendue si vous maintenez vos efforts"
            elif trend > 0:
                trend_pred = "Légère progression possible avec constance"
            elif trend < -10:
                trend_pred = "Attention à la baisse, actions correctives nécessaires"
            else:
                trend_pred = "Score stable, opportunités d'amélioration identifiées"
            
            return Response({
                'score_id': score.id,
                'analysis': analysis,
                'key_insights': insights[:3],  # Max 3
                'recommendations': recommendations[:3],  # Max 3
                'trend_prediction': trend_pred,
                'score_value': score.score,
                'level': score.level_display
            }, status=status.HTTP_200_OK)
            
        except TerasScore.DoesNotExist:
            return Response(
                {'error': 'Score non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Erreur analyse historique: {e}")
            
            # Fallback analyse basique
            try:
                score = TerasScore.objects.get(id=score_id, user=request.user)
                
                return Response({
                    'score_id': score.id,
                    'analysis': f"Votre score de {score.score} points reflète votre situation financière actuelle. Continuez vos efforts pour progresser vers les niveaux supérieurs.",
                    'key_insights': [
                        f"Score actuel : {score.score}/1000",
                        f"Niveau : {score.level_display}",
                        "Analyse détaillée en cours de génération"
                    ],
                    'recommendations': [
                        "Maintenez vos bonnes pratiques financières",
                        "Consultez vos recommandations personnalisées",
                        "Utilisez les simulateurs pour planifier votre progression"
                    ],
                    'trend_prediction': "Stable",
                    'score_value': score.score,
                    'level': score.level_display
                }, status=status.HTTP_200_OK)
            except:
                return Response(
                    {'error': 'Erreur lors de l\'analyse'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

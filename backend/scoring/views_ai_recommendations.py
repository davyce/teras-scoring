# backend/scoring/views_ai_recommendations.py
"""
Génération de recommandations IA pour simulation de score
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import requests
import os


class GenerateSimulationRecommendationsView(APIView):
    """
    POST /api/scoring/user/recommendations/generate-from-simulation/
    Génère des recommandations IA basées sur un score simulé
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            data = request.data
            score = data.get('score', 0)
            breakdown = data.get('breakdown', {})
            piliers = data.get('piliers', {})
            
            # Analyser les piliers
            piliers_details = []
            for key, label, max_val in [
                ('T', 'Transactions', 300),
                ('E', 'Épargne', 150),
                ('R', 'Revenus', 200),
                ('A', 'Actifs', 150),
                ('S', 'Social', 200)
            ]:
                value = breakdown.get(key, 0)
                percentage = int((value / max_val) * 100)
                piliers_details.append(f"- {label} : {value}/{max_val} ({percentage}%)")
            
            # Identifier forces et faiblesses
            piliers_array = [
                ('T', 'Transactions', breakdown.get('T', 0), 300),
                ('E', 'Épargne', breakdown.get('E', 0), 150),
                ('R', 'Revenus', breakdown.get('R', 0), 200),
                ('A', 'Actifs', breakdown.get('A', 0), 150),
                ('S', 'Social', breakdown.get('S', 0), 200)
            ]
            
            sorted_piliers = sorted(piliers_array, key=lambda x: x[2]/x[3])
            faiblesses = sorted_piliers[:2]
            forces = sorted_piliers[-2:]
            
            # Construire le prompt pour Claude
            prompt = f"""Tu es un conseiller financier TERAS expert. Un utilisateur vient de simuler son score TERAS.

**SCORE SIMULÉ** : {score}/1000

**DÉTAIL DES PILIERS** :
{chr(10).join(piliers_details)}

**POINTS FORTS** :
- {forces[1][1]} : {forces[1][2]}/{forces[1][3]} ({int((forces[1][2]/forces[1][3])*100)}%)
- {forces[0][1]} : {forces[0][2]}/{forces[0][3]} ({int((forces[0][2]/forces[0][3])*100)}%)

**POINTS FAIBLES** :
- {faiblesses[0][1]} : {faiblesses[0][2]}/{faiblesses[0][3]} ({int((faiblesses[0][2]/faiblesses[0][3])*100)}%)
- {faiblesses[1][1]} : {faiblesses[1][2]}/{faiblesses[1][3]} ({int((faiblesses[1][2]/faiblesses[1][3])*100)}%)

**CONSIGNE** :
Génère exactement 3 recommandations COURTES et ACTIONNABLES pour améliorer ce score simulé.

**FORMAT REQUIS** (une ligne par recommandation, sans numéros ni puces) :
Pilier X : Action concrète pour +Y points

**RÈGLES** :
1. Maximum 15 mots par recommandation
2. Commencer par le nom du pilier
3. Action concrète et réalisable
4. Estimation du gain en points
5. Ton direct et encourageant
6. Pas de formule de politesse
7. Pas de numéros ni puces

**EXEMPLES** :
Épargne : Mets 10,000 FCFA de côté chaque mois pour +25 points
Actifs : Déclare ta moto avec carte grise pour +30 points
Transactions : Utilise ZOLA tous les jours pendant un mois pour +40 points

Génère maintenant 3 recommandations pour ce score simulé."""

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
                    'max_tokens': 500,
                    'messages': [{'role': 'user', 'content': prompt}]
                },
                timeout=30
            )
            api_resp.raise_for_status()
            
            # Extraire les recommandations
            response_text = api_resp.json()['content'][0]['text'].strip()
            recommendations = [
                line.strip() 
                for line in response_text.split('\n') 
                if line.strip() and not line.strip().startswith('#')
            ]
            
            # Nettoyer (retirer numéros si présents)
            cleaned_recommendations = []
            for rec in recommendations[:3]:  # Max 3
                # Retirer numéros au début (1., 2., 1), 2), etc.)
                rec_clean = rec
                if rec_clean and rec_clean[0].isdigit():
                    # Trouver où commence le vrai texte
                    for i, char in enumerate(rec_clean):
                        if char.isalpha():
                            rec_clean = rec_clean[i:]
                            break
                cleaned_recommendations.append(rec_clean)
            
            return Response({
                'recommendations': cleaned_recommendations[:3],
                'score': score,
                'generated_by': 'ai'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Fallback - recommandations basiques
            print(f"Erreur génération IA: {e}")
            
            fallback_recs = []
            if breakdown.get('E', 0) < 75:
                fallback_recs.append(f"Épargne : Mets de l'argent de côté régulièrement pour +{int((150 - breakdown.get('E', 0)) * 0.5)} points")
            if breakdown.get('T', 0) < 150:
                fallback_recs.append(f"Transactions : Utilise ZOLA plus souvent pour +{int((300 - breakdown.get('T', 0)) * 0.3)} points")
            if breakdown.get('A', 0) < 75:
                fallback_recs.append(f"Actifs : Déclare tes biens (moto, terrain) pour +{int((150 - breakdown.get('A', 0)) * 0.5)} points")
            
            return Response({
                'recommendations': fallback_recs[:3] if fallback_recs else ["Améliore tes piliers faibles pour augmenter ton score"],
                'score': score,
                'generated_by': 'fallback'
            }, status=status.HTTP_200_OK)

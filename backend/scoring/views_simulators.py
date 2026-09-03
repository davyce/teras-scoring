# backend/scoring/views_simulators.py
"""
TERAS Simulators API
Simulateurs financiers : Crédit, Épargne, Impact Score
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from datetime import datetime, timedelta
import logging
from decimal import Decimal

from django.contrib.auth import get_user_model
from .models import TerasScore, Transaction, Income

User = get_user_model()
logger = logging.getLogger('scoring.simulators')


class CreditSimulatorView(APIView):
    """
    POST /api/scoring/user/simulators/credit/
    
    Simule un crédit avec calcul de faisabilité
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            amount = float(request.data.get('amount', 0))
            duration = int(request.data.get('duration', 12))
            
            if amount <= 0 or duration <= 0:
                return Response(
                    {'error': 'Montant et durée doivent être positifs'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Récupérer score actuel
            try:
                current_score = TerasScore.objects.filter(
                    user=request.user
                ).latest('created_at')
                score = current_score.score
            except TerasScore.DoesNotExist:
                score = 0
            
            # Calculer revenus moyens 90j
            ninety_days_ago = timezone.now() - timedelta(days=90)
            incomes = Income.objects.filter(
                user=request.user,
                created_at__gte=ninety_days_ago
            )
            
            if incomes.exists():
                avg_income = float(incomes.aggregate(
                    avg=models.Avg('amount')
                )['avg'] or 0)
            else:
                # Fallback: calculer depuis transactions
                transactions = Transaction.objects.filter(
                    user=request.user,
                    transaction_type='credit',
                    created_at__gte=ninety_days_ago
                )
                if transactions.exists():
                    avg_income = float(transactions.aggregate(
                        total=models.Sum('amount')
                    )['total'] or 0) / 3  # Moyenne sur 3 mois
                else:
                    avg_income = 0
            
            # Calcul CRM (Customer Risk Metric)
            crm = avg_income * 0.30  # 30% des revenus nets
            
            # Mensualité
            monthly_payment = amount / duration
            
            # Faisabilité
            is_feasible = monthly_payment <= crm and score >= 400
            
            # Taux d'intérêt selon score
            if score >= 900:
                interest_rate = '5-7%'
                rate_num = 0.06
            elif score >= 750:
                interest_rate = '8-10%'
                rate_num = 0.09
            elif score >= 600:
                interest_rate = '10-12%'
                rate_num = 0.11
            elif score >= 400:
                interest_rate = '12-15%'
                rate_num = 0.135
            else:
                interest_rate = '15%+'
                rate_num = 0.15
            
            # Calcul coût total
            total_interest = amount * rate_num * (duration / 12)
            total_cost = amount + total_interest
            
            # Scénarios alternatifs si non faisable
            alternative_scenarios = []
            
            if not is_feasible:
                # Scénario 1: Montant réduit
                if crm > 0:
                    feasible_amount = crm * duration * 0.85
                    if feasible_amount > 0:
                        alternative_scenarios.append({
                            'label': 'Montant réduit',
                            'amount': int(feasible_amount),
                            'duration': duration,
                            'monthly_payment': int(feasible_amount / duration),
                            'is_feasible': True,
                            'reason': 'Mensualité adaptée à vos revenus'
                        })
                
                # Scénario 2: Durée prolongée
                if monthly_payment > crm and crm > 0:
                    new_duration = int(amount / crm)
                    if new_duration <= 24:
                        alternative_scenarios.append({
                            'label': 'Durée prolongée',
                            'amount': int(amount),
                            'duration': new_duration,
                            'monthly_payment': int(amount / new_duration),
                            'is_feasible': True,
                            'reason': 'Mensualité réduite sur plus longue période'
                        })
            
            # Warnings
            warnings = []
            
            if not is_feasible:
                if monthly_payment > crm:
                    warnings.append({
                        'type': 'error',
                        'message': f'Mensualité trop élevée ({int(monthly_payment):,} FCFA > {int(crm):,} FCFA capacité)'
                    })
                if score < 400:
                    warnings.append({
                        'type': 'error',
                        'message': f'Score insuffisant ({score}/1000 < 400 requis)'
                    })
            
            if score < 600:
                warnings.append({
                    'type': 'warning',
                    'message': 'Score bas - conditions moins avantageuses'
                })
            
            if monthly_payment / avg_income > 0.35 if avg_income > 0 else True:
                warnings.append({
                    'type': 'warning',
                    'message': 'Taux d\'endettement élevé (>35%)'
                })
            
            # Conseils
            recommendations = []
            
            if not is_feasible:
                if score < 600:
                    recommendations.append('Améliorez votre score TERAS en augmentant vos transactions')
                if avg_income < amount / 6:
                    recommendations.append('Augmentez vos revenus avant de demander ce montant')
                recommendations.append('Consultez nos recommandations IA pour améliorer votre profil')
            
            # Réponse
            result = {
                'simulation_id': f'SIM_{request.user.id}_{int(datetime.now().timestamp())}',
                'is_feasible': is_feasible,
                'amount': int(amount),
                'duration': duration,
                'monthly_payment': int(monthly_payment),
                'total_cost': int(total_cost),
                'total_interest': int(total_interest),
                'interest_rate': interest_rate,
                'user_data': {
                    'score': score,
                    'avg_income': int(avg_income),
                    'crm': int(crm),
                    'debt_ratio': round((monthly_payment / avg_income * 100) if avg_income > 0 else 0, 1)
                },
                'alternative_scenarios': alternative_scenarios,
                'warnings': warnings,
                'recommendations': recommendations,
                'simulated_at': datetime.now().isoformat()
            }
            
            logger.info(f"Simulation crédit: {amount} FCFA / {duration} mois - Faisable: {is_feasible}")
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Erreur simulation crédit: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Erreur serveur: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SavingsSimulatorView(APIView):
    """
    POST /api/scoring/user/simulators/savings/
    
    Simule un plan d'épargne
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            monthly_amount = float(request.data.get('monthly_amount', 0))
            duration = int(request.data.get('duration', 12))
            target_amount = float(request.data.get('target_amount', 0))
            
            if monthly_amount < 0 or duration <= 0:
                return Response(
                    {'error': 'Valeurs invalides'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculer selon le mode
            if target_amount > 0:
                # Mode: atteindre un objectif
                required_monthly = target_amount / duration
                total_saved = target_amount
            else:
                # Mode: épargne fixe mensuelle
                required_monthly = monthly_amount
                total_saved = monthly_amount * duration
            
            # Intérêts (taux fictif 2% annuel)
            annual_rate = 0.02
            monthly_rate = annual_rate / 12
            
            # Calcul avec intérêts composés
            future_value = 0
            for month in range(duration):
                future_value = (future_value + required_monthly) * (1 + monthly_rate)
            
            interest_earned = future_value - total_saved
            
            # Récupérer revenus moyens
            ninety_days_ago = timezone.now() - timedelta(days=90)
            incomes = Income.objects.filter(
                user=request.user,
                created_at__gte=ninety_days_ago
            )
            
            if incomes.exists():
                avg_income = float(incomes.aggregate(
                    avg=models.Avg('amount')
                )['avg'] or 0)
            else:
                avg_income = 0
            
            # Faisabilité
            savings_ratio = (required_monthly / avg_income * 100) if avg_income > 0 else 0
            is_feasible = savings_ratio <= 30  # Max 30% des revenus
            
            # Étapes mensuelles
            monthly_breakdown = []
            cumulative = 0
            
            for month in range(1, min(duration + 1, 13)):  # Max 12 mois affichés
                cumulative += required_monthly
                cumulative_with_interest = cumulative * (1 + monthly_rate * month)
                
                monthly_breakdown.append({
                    'month': month,
                    'deposit': int(required_monthly),
                    'cumulative': int(cumulative),
                    'with_interest': int(cumulative_with_interest),
                    'interest': int(cumulative_with_interest - cumulative)
                })
            
            # Warnings
            warnings = []
            
            if not is_feasible:
                warnings.append({
                    'type': 'warning',
                    'message': f'Épargne élevée ({savings_ratio:.1f}% des revenus > 30% recommandé)'
                })
            
            if avg_income == 0:
                warnings.append({
                    'type': 'info',
                    'message': 'Aucun revenu enregistré - ajoutez vos revenus pour une simulation précise'
                })
            
            # Conseils
            recommendations = []
            
            if savings_ratio < 10:
                recommendations.append('Excellent ! Vous pouvez épargner davantage')
            elif savings_ratio > 30:
                recommendations.append('Réduisez le montant ou augmentez la durée')
            
            if duration > 12:
                recommendations.append('Plan à long terme - restez discipliné !')
            
            # Réponse
            result = {
                'is_feasible': is_feasible,
                'monthly_amount': int(required_monthly),
                'duration': duration,
                'total_saved': int(total_saved),
                'interest_earned': int(interest_earned),
                'future_value': int(future_value),
                'user_data': {
                    'avg_income': int(avg_income),
                    'savings_ratio': round(savings_ratio, 1),
                },
                'monthly_breakdown': monthly_breakdown,
                'warnings': warnings,
                'recommendations': recommendations,
                'simulated_at': datetime.now().isoformat()
            }
            
            logger.info(f"Simulation épargne: {required_monthly} FCFA x {duration} mois")
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Erreur simulation épargne: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Erreur serveur: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ScoreImpactSimulatorView(APIView):
    """
    POST /api/scoring/user/simulators/score-impact/
    
    Simule l'impact d'actions sur le score TERAS
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Actions à simuler
            actions = request.data.get('actions', {})
            
            # Score actuel
            try:
                current_score = TerasScore.objects.filter(
                    user=request.user
                ).latest('created_at')
                base_score = current_score.score
                breakdown = {
                    'T': current_score.transactions_score,
                    'E': current_score.savings_score,
                    'R': current_score.income_score,
                    'A': current_score.assets_score,
                    'S': current_score.social_score,
                }
            except TerasScore.DoesNotExist:
                base_score = 0
                breakdown = {'T': 0, 'E': 0, 'R': 0, 'A': 0, 'S': 0}
            
            # Calcul impacts
            impacts = {}
            new_breakdown = breakdown.copy()
            
            # Transactions
            if actions.get('increase_transactions'):
                current_txn = breakdown['T']
                improvement = min(20, (100 - current_txn) * 0.3)  # Max +20
                new_breakdown['T'] = min(100, current_txn + improvement)
                impacts['transactions'] = {
                    'action': 'Augmenter transactions à 20/mois',
                    'current': current_txn,
                    'potential': int(new_breakdown['T']),
                    'gain': int(improvement)
                }
            
            # Épargne
            if actions.get('start_savings'):
                monthly_savings = float(actions.get('savings_amount', 50000))
                current_sav = breakdown['E']
                improvement = min(25, (100 - current_sav) * 0.4)
                new_breakdown['E'] = min(100, current_sav + improvement)
                impacts['savings'] = {
                    'action': f'Épargner {int(monthly_savings):,} FCFA/mois',
                    'current': current_sav,
                    'potential': int(new_breakdown['E']),
                    'gain': int(improvement)
                }
            
            # Revenus
            if actions.get('increase_income'):
                income_increase = float(actions.get('income_amount', 100000))
                current_inc = breakdown['R']
                improvement = min(30, (100 - current_inc) * 0.5)
                new_breakdown['R'] = min(100, current_inc + improvement)
                impacts['income'] = {
                    'action': f'Augmenter revenus de {int(income_increase):,} FCFA',
                    'current': current_inc,
                    'potential': int(new_breakdown['R']),
                    'gain': int(improvement)
                }
            
            # Actifs
            if actions.get('add_asset'):
                asset_value = float(actions.get('asset_value', 500000))
                current_ast = breakdown['A']
                improvement = min(35, (100 - current_ast) * 0.6)
                new_breakdown['A'] = min(100, current_ast + improvement)
                impacts['assets'] = {
                    'action': f'Déclarer actif de {int(asset_value):,} FCFA',
                    'current': current_ast,
                    'potential': int(new_breakdown['A']),
                    'gain': int(improvement)
                }
            
            # Social
            if actions.get('improve_social'):
                current_soc = breakdown['S']
                improvement = min(15, (100 - current_soc) * 0.25)
                new_breakdown['S'] = min(100, current_soc + improvement)
                impacts['social'] = {
                    'action': 'Améliorer réputation (avis, parrainages)',
                    'current': current_soc,
                    'potential': int(new_breakdown['S']),
                    'gain': int(improvement)
                }
            
            # Calculer nouveau score total
            weights = {'T': 0.28, 'E': 0.18, 'R': 0.22, 'A': 0.20, 'S': 0.12}
            
            new_score = sum(
                new_breakdown[pillar] * weights[pillar] * 10
                for pillar in ['T', 'E', 'R', 'A', 'S']
            )
            
            total_gain = new_score - base_score
            
            # Timeline estimée
            timeline = []
            
            if impacts.get('transactions'):
                timeline.append({'action': 'Transactions', 'weeks': 4, 'impact': impacts['transactions']['gain']})
            
            if impacts.get('savings'):
                timeline.append({'action': 'Épargne', 'weeks': 8, 'impact': impacts['savings']['gain']})
            
            if impacts.get('income'):
                timeline.append({'action': 'Revenus', 'weeks': 6, 'impact': impacts['income']['gain']})
            
            if impacts.get('assets'):
                timeline.append({'action': 'Actifs', 'weeks': 2, 'impact': impacts['assets']['gain']})
            
            if impacts.get('social'):
                timeline.append({'action': 'Social', 'weeks': 10, 'impact': impacts['social']['gain']})
            
            # Réponse
            result = {
                'current_score': int(base_score),
                'projected_score': int(new_score),
                'total_gain': int(total_gain),
                'current_breakdown': {k: int(v) for k, v in breakdown.items()},
                'projected_breakdown': {k: int(v) for k, v in new_breakdown.items()},
                'impacts': impacts,
                'timeline': timeline,
                'estimated_weeks': max([t['weeks'] for t in timeline]) if timeline else 0,
                'simulated_at': datetime.now().isoformat()
            }
            
            logger.info(f"Simulation impact score: {base_score} → {new_score} (+{total_gain})")
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Erreur simulation impact: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Erreur serveur: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Importer models pour aggregation
from django.db import models

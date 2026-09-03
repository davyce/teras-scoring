# backend/credit/utils/crm_calculator.py
"""
CRM Calculator - Calcul de la Capacité de Remboursement Mensuelle
Protocole ZOLA: CRM = 30% des revenus nets moyens sur 90 jours
"""

from decimal import Decimal
from typing import Dict, Optional
from django.db.models import Avg, Sum, Q
from datetime import timedelta
from django.utils import timezone


def calculate_crm(user, transaction_days=90) -> Dict[str, Decimal]:
    """
    Calcule le CRM (Capacity to Repay Monthly) d'un utilisateur
    
    Formule ZOLA:
    - Revenus Nets = Revenus moyens - Dépenses vitales estimées
    - CRM = 30% des revenus nets moyens sur 90 jours
    
    Args:
        user: Utilisateur Django
        transaction_days: Période d'analyse (défaut 90 jours)
    
    Returns:
        Dict contenant:
        - revenue_avg: Revenus moyens mensuels
        - vital_expenses: Dépenses vitales estimées
        - net_revenue: Revenus nets (revenue - expenses)
        - crm: CRM calculé (30% de net_revenue)
        - max_monthly_payment: Mensualité maximale acceptable
    """
    
    # Date limite pour transactions
    cutoff_date = timezone.now() - timedelta(days=transaction_days)
    
    # 1. Récupérer les revenus ZOLA
    revenue_avg = get_average_monthly_revenue(user, cutoff_date)
    
    # 2. Estimer les dépenses vitales
    vital_expenses = estimate_vital_expenses(user, revenue_avg, cutoff_date)
    
    # 3. Calculer revenus nets
    net_revenue = max(Decimal('0'), revenue_avg - vital_expenses)
    
    # 4. CRM = 30% des revenus nets
    crm = (net_revenue * Decimal('0.30')).quantize(Decimal('0.01'))
    
    # 5. Mensualité maximale = CRM
    max_monthly_payment = crm
    
    return {
        'revenue_avg': revenue_avg,
        'vital_expenses': vital_expenses,
        'net_revenue': net_revenue,
        'crm': crm,
        'max_monthly_payment': max_monthly_payment,
        'calculation_period_days': transaction_days,
        'calculated_at': timezone.now().isoformat()
    }


def get_average_monthly_revenue(user, cutoff_date) -> Decimal:
    """
    Calcule les revenus mensuels moyens depuis cutoff_date
    
    Sources:
    1. Transactions ZOLA (entrées d'argent)
    2. Revenus déclarés dans le profil
    3. Factures SFEC (si vendeur)
    """
    
    # TODO: Intégrer vraies transactions ZOLA
    # Pour l'instant, on utilise les revenus déclarés ou un forfait
    
    try:
        # Essayer de récupérer depuis le profil utilisateur
        if hasattr(user, 'profile') and hasattr(user.profile, 'monthly_income'):
            return Decimal(str(user.profile.monthly_income or 0))
        
        # Sinon, essayer depuis les scores TERAS (pilier R - Revenus)
        if hasattr(user, 'teras_scores'):
            latest_score = user.teras_scores.order_by('-calculated_at').first()
            if latest_score and hasattr(latest_score, 'revenue_data'):
                revenue_data = latest_score.revenue_data or {}
                if 'monthly_avg' in revenue_data:
                    return Decimal(str(revenue_data['monthly_avg']))
        
        # Fallback: revenus minimum estimés
        return Decimal('50000')  # 50K CDF minimum estimé
        
    except Exception as e:
        print(f"Erreur calcul revenus: {e}")
        return Decimal('50000')


def estimate_vital_expenses(user, revenue_avg: Decimal, cutoff_date) -> Decimal:
    """
    Estime les dépenses vitales mensuelles
    
    Méthodes:
    1. Si transactions ZOLA disponibles: analyse dépenses réelles
    2. Sinon: forfait 40-50% des revenus (ajusté selon profil)
    """
    
    # TODO: Analyser vraies transactions ZOLA pour détecter:
    # - Loyer (transactions récurrentes mensuelles)
    # - Alimentation (achats marché, supermarché)
    # - Transport (carburant, transport public)
    # - Énergie (électricité, eau)
    
    # Pour l'instant: méthode forfaitaire
    
    # Taux de dépenses vitales selon revenu
    if revenue_avg < Decimal('100000'):
        # Faibles revenus: 50% en dépenses vitales
        vital_rate = Decimal('0.50')
    elif revenue_avg < Decimal('200000'):
        # Revenus moyens: 45% en dépenses vitales
        vital_rate = Decimal('0.45')
    else:
        # Revenus élevés: 40% en dépenses vitales
        vital_rate = Decimal('0.40')
    
    vital_expenses = (revenue_avg * vital_rate).quantize(Decimal('0.01'))
    
    return vital_expenses


def calculate_max_loan_amount(crm: Decimal, duration_months: int, safety_margin: Decimal = Decimal('0.85')) -> Decimal:
    """
    Calcule le montant maximum empruntable
    
    Formule ZOLA:
    Plafond = CRM × Durée (mois) × 0.85 (marge sécurité)
    
    Args:
        crm: Capacité de remboursement mensuelle
        duration_months: Durée du crédit en mois
        safety_margin: Marge de sécurité (défaut 0.85 = 85%)
    
    Returns:
        Montant maximum empruntable
    """
    max_amount = (crm * Decimal(str(duration_months)) * safety_margin).quantize(Decimal('0.01'))
    return max_amount


def adjust_crm_by_score_band(crm: Decimal, score_band: str) -> Decimal:
    """
    Ajuste le CRM selon la bande de score TERAS
    
    Multiplicateurs:
    - A+ (900-1000): ×1.0 (aucun ajustement)
    - A  (800-899):  ×0.95
    - B  (700-799):  ×0.90
    - C  (600-699):  ×0.85
    - D  (500-599):  ×0.70
    - E  (<500):     ×0.50
    """
    multipliers = {
        'A+': Decimal('1.00'),
        'A':  Decimal('0.95'),
        'B':  Decimal('0.90'),
        'C':  Decimal('0.85'),
        'D':  Decimal('0.70'),
        'E':  Decimal('0.50'),
    }
    
    multiplier = multipliers.get(score_band, Decimal('0.85'))
    adjusted_crm = (crm * multiplier).quantize(Decimal('0.01'))
    
    return adjusted_crm


def get_crm_with_adjustments(user, score_band: Optional[str] = None) -> Dict[str, Decimal]:
    """
    Calcule le CRM avec tous les ajustements nécessaires
    
    Returns:
        Dict contenant CRM de base + CRM ajusté
    """
    # CRM de base
    crm_data = calculate_crm(user)
    base_crm = crm_data['crm']
    
    # Récupérer la bande de score si non fournie
    if not score_band:
        try:
            if hasattr(user, 'teras_scores'):
                latest_score = user.teras_scores.order_by('-calculated_at').first()
                if latest_score:
                    score_band = latest_score.band or 'C'
                else:
                    score_band = 'C'
            else:
                score_band = 'C'
        except:
            score_band = 'C'
    
    # Ajuster selon score
    adjusted_crm = adjust_crm_by_score_band(base_crm, score_band)
    
    return {
        **crm_data,
        'base_crm': base_crm,
        'adjusted_crm': adjusted_crm,
        'score_band': score_band,
        'adjustment_factor': float(adjusted_crm / base_crm) if base_crm > 0 else 0
    }


def validate_monthly_payment(monthly_payment: Decimal, net_revenue: Decimal, max_effort_rate: Decimal = Decimal('0.30')) -> Dict[str, any]:
    """
    Valide qu'une mensualité ne dépasse pas le taux d'effort maximum
    
    Règle ZOLA: Mensualité ≤ 30% des revenus nets
    
    Args:
        monthly_payment: Mensualité proposée
        net_revenue: Revenus nets mensuels
        max_effort_rate: Taux d'effort maximum (défaut 30%)
    
    Returns:
        Dict avec is_valid, effort_rate, et message
    """
    if net_revenue <= 0:
        return {
            'is_valid': False,
            'effort_rate': 100.0,
            'message': 'Revenus nets insuffisants'
        }
    
    effort_rate = (monthly_payment / net_revenue * 100).quantize(Decimal('0.1'))
    max_rate_percent = (max_effort_rate * 100).quantize(Decimal('0.1'))
    
    is_valid = effort_rate <= max_rate_percent
    
    if is_valid:
        message = f"✅ Taux d'effort acceptable ({effort_rate}% ≤ {max_rate_percent}%)"
    else:
        message = f"⚠️ Taux d'effort trop élevé ({effort_rate}% > {max_rate_percent}%)"
    
    return {
        'is_valid': is_valid,
        'effort_rate': float(effort_rate),
        'max_rate': float(max_rate_percent),
        'message': message
    }

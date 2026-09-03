# backend/credit/utils/eligibility_checker.py
"""
Eligibility Checker - Vérification de l'éligibilité aux produits de crédit
Protocole ZOLA
"""

from decimal import Decimal
from typing import Dict, List, Optional
from django.utils import timezone
from datetime import timedelta


def check_product_eligibility(user, product, crm_data: Optional[Dict] = None) -> Dict:
    """
    Vérifie l'éligibilité d'un utilisateur à un produit de crédit
    
    Critères:
    1. Score TERAS dans la fourchette du produit
    2. CRM suffisant pour le montant minimum
    3. Historique crédit acceptable (si applicable)
    4. Conditions spécifiques du produit
    
    Returns:
        Dict avec:
        - eligible: bool (immediate, conditional, not_eligible)
        - eligibility_type: str
        - reasons: List[str] (raisons de non-éligibilité)
        - conditions: List[str] (conditions à remplir si conditional)
        - recommendations: List[str] (conseils pour devenir éligible)
    """
    
    # Import local pour éviter circular import
    from .crm_calculator import get_crm_with_adjustments
    
    reasons = []
    conditions = []
    recommendations = []
    
    # 1. Vérifier le score TERAS
    score_check = check_teras_score(user, product)
    
    if not score_check['eligible']:
        reasons.extend(score_check['reasons'])
        recommendations.extend(score_check['recommendations'])
        
        # Si score trop bas, impossible même avec conditions
        if score_check['score_gap'] > 50:
            return {
                'eligible': False,
                'eligibility_type': 'not_eligible',
                'reasons': reasons,
                'conditions': [],
                'recommendations': recommendations,
                'score_gap': score_check['score_gap']
            }
        else:
            # Score proche, éligibilité conditionnelle possible
            conditions.append(f"Améliorer score TERAS à {product.min_score}+")
    
    # 2. Vérifier le CRM
    if crm_data is None:
        crm_data = get_crm_with_adjustments(user)
    
    crm_check = check_crm_sufficiency(crm_data, product)
    
    if not crm_check['sufficient']:
        reasons.extend(crm_check['reasons'])
        recommendations.extend(crm_check['recommendations'])
        conditions.append("Justifier revenus supplémentaires")
    
    # 3. Vérifier l'historique crédit
    history_check = check_credit_history(user)
    
    if not history_check['acceptable']:
        reasons.extend(history_check['reasons'])
        recommendations.extend(history_check['recommendations'])
        
        if history_check['has_active_default']:
            # Défaut actif = non éligible
            return {
                'eligible': False,
                'eligibility_type': 'not_eligible',
                'reasons': reasons,
                'conditions': [],
                'recommendations': recommendations
            }
        
        if history_check['has_recent_rejection']:
            conditions.append("Attendre 30 jours depuis dernier refus")
    
    # 4. Vérifier activité ZOLA
    activity_check = check_zola_activity(user, product)
    
    if not activity_check['sufficient']:
        reasons.extend(activity_check['reasons'])
        conditions.extend(activity_check['conditions'])
        recommendations.extend(activity_check['recommendations'])
    
    # 5. Vérifier KYC
    kyc_check = check_kyc_status(user)
    
    if not kyc_check['verified']:
        reasons.append("KYC non validé")
        conditions.append("Compléter validation KYC")
    
    # 6. Déterminer type d'éligibilité
    if len(reasons) == 0 and len(conditions) == 0:
        eligibility_type = 'immediate'
        eligible = True
    elif len(conditions) > 0 and len(reasons) <= 2:
        eligibility_type = 'conditional'
        eligible = True
    else:
        eligibility_type = 'not_eligible'
        eligible = False
    
    return {
        'eligible': eligible,
        'eligibility_type': eligibility_type,
        'reasons': reasons,
        'conditions': conditions,
        'recommendations': recommendations,
        'checks': {
            'score': score_check,
            'crm': crm_check,
            'history': history_check,
            'activity': activity_check,
            'kyc': kyc_check
        }
    }


def check_teras_score(user, product) -> Dict:
    """
    Vérifie que le score TERAS est dans la fourchette du produit
    """
    try:
        # Récupérer le dernier score TERAS
        if hasattr(user, 'teras_scores'):
            latest_score = user.teras_scores.order_by('-calculated_at').first()
            if latest_score:
                current_score = latest_score.total_score
            else:
                current_score = 0
        else:
            current_score = 0
        
        # Vérifier fourchette
        eligible = product.min_score <= current_score <= product.max_score
        score_gap = product.min_score - current_score if current_score < product.min_score else 0
        
        reasons = []
        recommendations = []
        
        if not eligible:
            if current_score < product.min_score:
                reasons.append(f"Score TERAS {current_score} < minimum {product.min_score}")
                recommendations.append(f"Améliorer score de {score_gap} points")
                recommendations.append("Actions: épargne régulière, actifs déclarés, transactions ZOLA")
            else:
                reasons.append(f"Score TERAS {current_score} > maximum {product.max_score}")
                recommendations.append(f"Ce produit cible un score de {product.min_score}-{product.max_score}")
                recommendations.append("Envisager un produit de catégorie supérieure")
        
        return {
            'eligible': eligible,
            'current_score': current_score,
            'min_required': product.min_score,
            'max_allowed': product.max_score,
            'score_gap': score_gap,
            'reasons': reasons,
            'recommendations': recommendations
        }
        
    except Exception as e:
        return {
            'eligible': False,
            'current_score': 0,
            'min_required': product.min_score,
            'max_allowed': product.max_score,
            'score_gap': product.min_score,
            'reasons': [f"Erreur vérification score: {str(e)}"],
            'recommendations': ["Calculer votre score TERAS"]
        }


def check_crm_sufficiency(crm_data: Dict, product) -> Dict:
    """
    Vérifie que le CRM est suffisant pour le montant minimum du produit
    """
    from .loan_calculator import calculate_monthly_payment
    
    adjusted_crm = crm_data.get('adjusted_crm', Decimal('0'))
    
    # Calculer mensualité minimum du produit
    min_monthly = calculate_monthly_payment(
        amount=product.min_amount,
        duration_months=product.min_duration_months,
        annual_rate=product.interest_rate_max  # Taux max pour calcul conservateur
    )
    
    sufficient = adjusted_crm >= min_monthly
    crm_gap = min_monthly - adjusted_crm if not sufficient else Decimal('0')
    
    reasons = []
    recommendations = []
    
    if not sufficient:
        reasons.append(f"CRM {adjusted_crm:,.0f} CDF < mensualité min {min_monthly:,.0f} CDF")
        recommendations.append(f"Augmenter revenus nets de {crm_gap:,.0f} CDF/mois")
        recommendations.append("Ou choisir un montant/durée plus adaptés")
    
    return {
        'sufficient': sufficient,
        'crm': adjusted_crm,
        'min_monthly_required': min_monthly,
        'crm_gap': crm_gap,
        'reasons': reasons,
        'recommendations': recommendations
    }


def check_credit_history(user) -> Dict:
    """
    Vérifie l'historique de crédit de l'utilisateur
    """
    from ..models import CreditRequest, CreditHistory
    
    reasons = []
    recommendations = []
    
    # Vérifier défauts actifs
    active_defaults = CreditRequest.objects.filter(
        user=user,
        status='defaulted'
    ).count()
    
    has_active_default = active_defaults > 0
    
    if has_active_default:
        reasons.append(f"{active_defaults} crédit(s) en défaut de paiement")
        recommendations.append("Régulariser les impayés avant nouvelle demande")
    
    # Vérifier rejets récents (30 derniers jours)
    recent_rejections = CreditRequest.objects.filter(
        user=user,
        status='rejected',
        reviewed_at__gte=timezone.now() - timedelta(days=30)
    ).count()
    
    has_recent_rejection = recent_rejections > 0
    
    if has_recent_rejection:
        reasons.append(f"{recent_rejections} demande(s) refusée(s) récemment")
        recommendations.append("Améliorer profil avant nouvelle demande (30j)")
    
    # Vérifier comportement historique
    history = CreditHistory.objects.filter(user=user)
    
    if history.exists():
        avg_behavior_score = sum(h.behavior_score for h in history) / len(history)
        
        if avg_behavior_score < 50:
            reasons.append(f"Historique comportement faible ({avg_behavior_score:.0f}/100)")
            recommendations.append("Améliorer ponctualité des remboursements")
    
    acceptable = not has_active_default
    
    return {
        'acceptable': acceptable,
        'has_active_default': has_active_default,
        'active_defaults_count': active_defaults,
        'has_recent_rejection': has_recent_rejection,
        'recent_rejections_count': recent_rejections,
        'reasons': reasons,
        'recommendations': recommendations
    }


def check_zola_activity(user, product) -> Dict:
    """
    Vérifie l'activité ZOLA de l'utilisateur
    """
    reasons = []
    conditions = []
    recommendations = []
    
    # TODO: Intégrer vraies données ZOLA
    # Pour l'instant, on vérifie via les conditions du produit
    
    try:
        # Vérifier ancienneté compte
        account_age_days = (timezone.now() - user.date_joined).days
        
        # Exigences selon catégorie produit
        min_activity_days = {
            'seed': 30,      # 1 mois
            'starter': 90,   # 3 mois
            'growth': 90,    # 3 mois
            'pro': 180       # 6 mois
        }
        
        required_days = min_activity_days.get(product.category, 90)
        sufficient = account_age_days >= required_days
        
        if not sufficient:
            missing_days = required_days - account_age_days
            reasons.append(f"Activité ZOLA insuffisante ({account_age_days} jours < {required_days} requis)")
            conditions.append(f"Attendre {missing_days} jours supplémentaires")
            recommendations.append("Utiliser ZOLA régulièrement pour transactions quotidiennes")
        
        return {
            'sufficient': sufficient,
            'activity_days': account_age_days,
            'required_days': required_days,
            'reasons': reasons,
            'conditions': conditions,
            'recommendations': recommendations
        }
        
    except Exception as e:
        return {
            'sufficient': False,
            'activity_days': 0,
            'required_days': 90,
            'reasons': [f"Erreur vérification activité: {str(e)}"],
            'conditions': ["Vérifier historique ZOLA"],
            'recommendations': []
        }


def check_kyc_status(user) -> Dict:
    """
    Vérifie le statut KYC de l'utilisateur
    """
    # TODO: Intégrer vrai système KYC
    # Pour l'instant, on suppose KYC OK si user actif
    
    try:
        verified = user.is_active
        
        return {
            'verified': verified,
            'kyc_level': 'basic' if verified else 'none',
            'reasons': [] if verified else ["KYC non complété"],
            'recommendations': [] if verified else ["Uploader pièce d'identité et selfie"]
        }
    except:
        return {
            'verified': False,
            'kyc_level': 'none',
            'reasons': ["Statut KYC inconnu"],
            'recommendations': ["Vérifier votre profil"]
        }


def get_all_eligible_products(user, products_queryset=None):
    """
    Retourne tous les produits avec leur statut d'éligibilité
    
    Returns:
        List[Dict] avec pour chaque produit:
        - product: objet Product
        - eligibility: résultat de check_product_eligibility
    """
    from ..models import CreditProduct
    from .crm_calculator import get_crm_with_adjustments
    
    if products_queryset is None:
        products_queryset = CreditProduct.objects.filter(is_active=True)
    
    # Calculer CRM une seule fois
    crm_data = get_crm_with_adjustments(user)
    
    results = []
    
    for product in products_queryset:
        eligibility = check_product_eligibility(user, product, crm_data)
        
        results.append({
            'product': product,
            'eligibility': eligibility
        })
    
    # Trier: immediate > conditional > not_eligible
    eligibility_order = {'immediate': 0, 'conditional': 1, 'not_eligible': 2}
    results.sort(key=lambda x: eligibility_order.get(x['eligibility']['eligibility_type'], 3))
    
    return results

# backend/credit/utils/loan_calculator.py
"""
Loan Calculator - Calcul des mensualités, intérêts et coûts totaux
Protocole ZOLA
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta


def calculate_monthly_payment(amount: Decimal, duration_months: int, annual_rate: Decimal) -> Decimal:
    """
    Calcule la mensualité d'un prêt (amortissement constant)
    
    Formule: M = P * (r(1+r)^n) / ((1+r)^n - 1)
    Où:
    - M = mensualité
    - P = montant principal
    - r = taux mensuel (taux annuel / 12)
    - n = nombre de mois
    
    Args:
        amount: Montant du prêt
        duration_months: Durée en mois
        annual_rate: Taux d'intérêt annuel (ex: 18.5 pour 18.5%)
    
    Returns:
        Mensualité arrondie à 2 décimales
    """
    if amount <= 0 or duration_months <= 0:
        return Decimal('0')
    
    # Taux mensuel
    monthly_rate = (annual_rate / Decimal('100')) / Decimal('12')
    
    # Cas spécial: taux = 0
    if monthly_rate == 0:
        return (amount / Decimal(str(duration_months))).quantize(Decimal('0.01'), ROUND_HALF_UP)
    
    # Formule mensualité
    numerator = monthly_rate * ((Decimal('1') + monthly_rate) ** duration_months)
    denominator = ((Decimal('1') + monthly_rate) ** duration_months) - Decimal('1')
    
    monthly_payment = (amount * numerator / denominator).quantize(Decimal('0.01'), ROUND_HALF_UP)
    
    return monthly_payment


def calculate_loan_details(
    amount: Decimal,
    duration_months: int,
    annual_rate: Decimal,
    start_date: date = None
) -> Dict:
    """
    Calcule tous les détails d'un prêt
    
    Returns:
        Dict contenant:
        - monthly_payment: Mensualité
        - total_cost: Coût total (capital + intérêts)
        - total_interest: Total des intérêts
        - effective_rate: Taux effectif global (TEG)
        - payment_schedule: Échéancier détaillé
    """
    if start_date is None:
        start_date = date.today()
    
    # Mensualité
    monthly_payment = calculate_monthly_payment(amount, duration_months, annual_rate)
    
    # Coût total
    total_cost = (monthly_payment * Decimal(str(duration_months))).quantize(Decimal('0.01'), ROUND_HALF_UP)
    
    # Total intérêts
    total_interest = (total_cost - amount).quantize(Decimal('0.01'), ROUND_HALF_UP)
    
    # TEG (approximatif)
    if duration_months > 0:
        effective_rate = ((total_interest / amount) * (Decimal('12') / Decimal(str(duration_months))) * Decimal('100')).quantize(Decimal('0.01'), ROUND_HALF_UP)
    else:
        effective_rate = Decimal('0')
    
    # Générer échéancier
    payment_schedule = generate_payment_schedule(
        amount=amount,
        monthly_payment=monthly_payment,
        duration_months=duration_months,
        annual_rate=annual_rate,
        start_date=start_date
    )
    
    return {
        'amount': amount,
        'duration_months': duration_months,
        'annual_rate': annual_rate,
        'monthly_payment': monthly_payment,
        'total_cost': total_cost,
        'total_interest': total_interest,
        'effective_rate': effective_rate,
        'start_date': start_date.isoformat(),
        'end_date': (start_date + relativedelta(months=duration_months)).isoformat(),
        'payment_schedule': payment_schedule
    }


def generate_payment_schedule(
    amount: Decimal,
    monthly_payment: Decimal,
    duration_months: int,
    annual_rate: Decimal,
    start_date: date
) -> List[Dict]:
    """
    Génère l'échéancier de remboursement complet
    
    Returns:
        Liste de dicts pour chaque échéance:
        - payment_number: Numéro échéance
        - due_date: Date d'échéance
        - principal_amount: Montant principal
        - interest_amount: Montant intérêts
        - total_amount: Montant total
        - remaining_balance: Solde restant
    """
    schedule = []
    remaining_balance = amount
    monthly_rate = (annual_rate / Decimal('100')) / Decimal('12')
    
    for i in range(1, duration_months + 1):
        # Date d'échéance
        due_date = start_date + relativedelta(months=i)
        
        # Intérêts du mois
        interest_amount = (remaining_balance * monthly_rate).quantize(Decimal('0.01'), ROUND_HALF_UP)
        
        # Capital remboursé
        principal_amount = (monthly_payment - interest_amount).quantize(Decimal('0.01'), ROUND_HALF_UP)
        
        # Ajustement dernière échéance (pour absorber arrondis)
        if i == duration_months:
            principal_amount = remaining_balance
            total_amount = principal_amount + interest_amount
        else:
            total_amount = monthly_payment
        
        # Solde restant après paiement
        remaining_balance = (remaining_balance - principal_amount).quantize(Decimal('0.01'), ROUND_HALF_UP)
        
        schedule.append({
            'payment_number': i,
            'due_date': due_date.isoformat(),
            'principal_amount': float(principal_amount),
            'interest_amount': float(interest_amount),
            'total_amount': float(total_amount),
            'remaining_balance': float(remaining_balance)
        })
    
    return schedule


def calculate_effort_rate(monthly_payment: Decimal, net_revenue: Decimal) -> Decimal:
    """
    Calcule le taux d'effort (mensualité / revenus nets)
    
    Returns:
        Taux d'effort en pourcentage (ex: 28.5 pour 28.5%)
    """
    if net_revenue <= 0:
        return Decimal('100')
    
    effort_rate = ((monthly_payment / net_revenue) * Decimal('100')).quantize(Decimal('0.1'), ROUND_HALF_UP)
    
    return effort_rate


def is_loan_sustainable(monthly_payment: Decimal, net_revenue: Decimal, max_effort_rate: Decimal = Decimal('30')) -> Dict:
    """
    Vérifie si un prêt est soutenable (taux d'effort ≤ seuil)
    
    Args:
        monthly_payment: Mensualité du prêt
        net_revenue: Revenus nets mensuels
        max_effort_rate: Taux d'effort maximum (défaut 30%)
    
    Returns:
        Dict avec:
        - is_sustainable: bool
        - effort_rate: taux calculé
        - max_rate: seuil maximum
        - message: message explicatif
    """
    effort_rate = calculate_effort_rate(monthly_payment, net_revenue)
    is_sustainable = effort_rate <= max_effort_rate
    
    if is_sustainable:
        message = f"✅ Crédit soutenable (taux d'effort {effort_rate}% ≤ {max_effort_rate}%)"
    else:
        excess = effort_rate - max_effort_rate
        message = f"⚠️ Crédit non soutenable (taux d'effort {effort_rate}% > {max_effort_rate}%, excès de {excess}%)"
    
    return {
        'is_sustainable': is_sustainable,
        'effort_rate': float(effort_rate),
        'max_rate': float(max_effort_rate),
        'excess_rate': float(effort_rate - max_effort_rate) if not is_sustainable else 0,
        'message': message
    }


def calculate_max_sustainable_amount(
    net_revenue: Decimal,
    duration_months: int,
    annual_rate: Decimal,
    max_effort_rate: Decimal = Decimal('30')
) -> Dict:
    """
    Calcule le montant maximum empruntable soutenable
    
    Returns:
        Dict avec:
        - max_amount: montant maximum
        - max_monthly_payment: mensualité correspondante
        - effort_rate: taux d'effort (devrait être = max_effort_rate)
    """
    # Mensualité maximale acceptable
    max_monthly_payment = (net_revenue * (max_effort_rate / Decimal('100'))).quantize(Decimal('0.01'), ROUND_HALF_UP)
    
    # Montant correspondant (formule inverse)
    monthly_rate = (annual_rate / Decimal('100')) / Decimal('12')
    
    if monthly_rate == 0:
        max_amount = max_monthly_payment * Decimal(str(duration_months))
    else:
        numerator = max_monthly_payment
        denominator = monthly_rate * ((Decimal('1') + monthly_rate) ** duration_months) / (((Decimal('1') + monthly_rate) ** duration_months) - Decimal('1'))
        max_amount = (numerator / denominator).quantize(Decimal('0.01'), ROUND_HALF_UP)
    
    return {
        'max_amount': max_amount,
        'max_monthly_payment': max_monthly_payment,
        'effort_rate': float(max_effort_rate),
        'duration_months': duration_months,
        'annual_rate': float(annual_rate)
    }


def compare_loan_options(
    amounts: List[Decimal],
    durations: List[int],
    annual_rate: Decimal,
    net_revenue: Decimal
) -> List[Dict]:
    """
    Compare plusieurs options de prêt
    
    Returns:
        Liste de dicts triés par taux d'effort croissant
    """
    options = []
    
    for amount in amounts:
        for duration in durations:
            details = calculate_loan_details(amount, duration, annual_rate)
            sustainability = is_loan_sustainable(details['monthly_payment'], net_revenue)
            
            options.append({
                'amount': float(amount),
                'duration_months': duration,
                'monthly_payment': float(details['monthly_payment']),
                'total_cost': float(details['total_cost']),
                'total_interest': float(details['total_interest']),
                'effort_rate': sustainability['effort_rate'],
                'is_sustainable': sustainability['is_sustainable'],
                'recommendation': 'Recommandé' if sustainability['is_sustainable'] else 'Non recommandé'
            })
    
    # Trier par taux d'effort croissant
    options.sort(key=lambda x: x['effort_rate'])
    
    return options


def calculate_early_repayment(
    remaining_balance: Decimal,
    paid_months: int,
    total_months: int,
    monthly_payment: Decimal,
    annual_rate: Decimal,
    early_repayment_fee_rate: Decimal = Decimal('0')
) -> Dict:
    """
    Calcule les détails d'un remboursement anticipé
    
    Args:
        remaining_balance: Solde restant dû
        paid_months: Nombre de mois déjà payés
        total_months: Durée totale initiale
        monthly_payment: Mensualité actuelle
        annual_rate: Taux d'intérêt annuel
        early_repayment_fee_rate: Frais remboursement anticipé (% du capital restant, défaut 0%)
    
    Returns:
        Dict avec économies réalisées et frais applicables
    """
    # Intérêts restants si on continue normalement
    remaining_months = total_months - paid_months
    remaining_interest = (monthly_payment * Decimal(str(remaining_months))) - remaining_balance
    
    # Frais remboursement anticipé
    early_fee = (remaining_balance * (early_repayment_fee_rate / Decimal('100'))).quantize(Decimal('0.01'), ROUND_HALF_UP)
    
    # Montant à payer pour remboursement anticipé
    amount_to_pay = remaining_balance + early_fee
    
    # Économies nettes
    savings = remaining_interest - early_fee
    
    return {
        'remaining_balance': float(remaining_balance),
        'remaining_interest_if_continue': float(remaining_interest),
        'early_repayment_fee': float(early_fee),
        'amount_to_pay_now': float(amount_to_pay),
        'net_savings': float(savings),
        'is_beneficial': savings > 0,
        'recommendation': 'Avantageux' if savings > 0 else 'Peu avantageux' if savings == 0 else 'Désavantageux'
    }

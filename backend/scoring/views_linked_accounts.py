# backend/scoring/views_linked_accounts.py
"""
TERAS — Comptes liés (Mobile Money / Banque) + Système Staff
"""
import json
import secrets
from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models_linked_accounts import LinkedAccount, ImportedTransaction, StaffMember, StaffActivityLog


# ═══════════════════════════════════════════════════════════════════════════════
# COMPTES LIÉS — MOBILE MONEY / BANCAIRES
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_linked_accounts(request):
    """GET /api/scoring/user/linked-accounts/ — Liste des comptes liés"""
    accounts = LinkedAccount.objects.filter(user=request.user).order_by('-is_primary', '-created_at')
    data = []
    for acc in accounts:
        data.append({
            'id':             acc.id,
            'operator':       acc.operator,
            'operator_label': acc.get_operator_display(),
            'account_type':   acc.account_type,
            'phone_number':   acc.phone_number,
            'account_number': acc.account_number,
            'account_name':   acc.account_name,
            'bank_name':      acc.bank_name,
            'is_primary':     acc.is_primary,
            'is_verified':    acc.is_verified,
            'status':         acc.status,
            'balance_xaf':    float(acc.balance_xaf or 0),
            'transactions_imported': acc.transactions_imported,
            'last_sync_at':   acc.last_sync_at.isoformat() if acc.last_sync_at else None,
            'consent_given':  acc.consent_given,
            'created_at':     acc.created_at.isoformat(),
        })
    return Response({'accounts': data, 'count': len(data)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_linked_account(request):
    """POST /api/scoring/user/linked-accounts/add/"""
    d         = request.data
    operator  = d.get('operator', '')
    phone     = d.get('phone_number', '').strip()
    acc_num   = d.get('account_number', '').strip()
    acc_name  = d.get('account_name', '').strip()
    bank_name = d.get('bank_name', '').strip()
    is_primary = d.get('is_primary', False)
    consent    = d.get('consent_given', False)
    acc_type   = d.get('account_type', 'mobile_money')

    VALID_OPERATORS = [o[0] for o in LinkedAccount.OPERATOR_CHOICES]
    if operator not in VALID_OPERATORS:
        return Response({'error': f"Opérateur invalide. Valeurs: {', '.join(VALID_OPERATORS)}"}, status=400)

    if not phone and not acc_num:
        return Response({'error': "Numéro de téléphone ou numéro de compte requis."}, status=400)

    if not consent:
        return Response({'error': "Vous devez donner votre consentement pour lier ce compte."}, status=400)

    # Vérifier doublon
    if phone and LinkedAccount.objects.filter(user=request.user, operator=operator, phone_number=phone).exists():
        return Response({'error': "Ce compte est déjà lié à votre profil TERAS."}, status=400)

    # Générer un code OTP de vérification (4 chiffres)
    otp_code = str(secrets.randbelow(9000) + 1000)

    acc = LinkedAccount.objects.create(
        user            = request.user,
        operator        = operator,
        account_type    = acc_type,
        phone_number    = phone or None,
        account_number  = acc_num or None,
        account_name    = acc_name or None,
        bank_name       = bank_name or None,
        is_primary      = is_primary,
        status          = 'pending',
        is_verified     = False,
        consent_given   = True,
        consent_at      = timezone.now(),
        verification_code = otp_code,
    )

    # En production, on enverrait le code par SMS
    # En dev, on le retourne directement pour test
    return Response({
        'message':       f"Compte {acc.get_operator_display()} ajouté. Vérifiez le code OTP envoyé par SMS.",
        'account_id':    acc.id,
        'status':        'pending',
        'otp_code':      otp_code,   # À supprimer en production
        'operator_label': acc.get_operator_display(),
    }, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_linked_account(request, account_id):
    """POST /api/scoring/user/linked-accounts/<id>/verify/ — Vérifier avec OTP"""
    try:
        acc = LinkedAccount.objects.get(id=account_id, user=request.user)
    except LinkedAccount.DoesNotExist:
        return Response({'error': 'Compte non trouvé.'}, status=404)

    otp = str(request.data.get('otp_code', '')).strip()
    if not otp:
        return Response({'error': 'Code OTP requis.'}, status=400)

    if otp == acc.verification_code:
        acc.is_verified        = True
        acc.status             = 'verified'
        acc.verification_code  = None
        acc.save()

        # Si c'est le premier compte, le mettre en principal
        if not LinkedAccount.objects.filter(user=request.user, is_primary=True).exclude(id=acc.id).exists():
            acc.is_primary = True
            acc.save()

        return Response({
            'message':     f"Compte {acc.get_operator_display()} vérifié avec succès !",
            'is_verified': True,
            'is_primary':  acc.is_primary,
        })
    else:
        return Response({'error': 'Code OTP incorrect.'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_linked_account(request, account_id):
    """POST /api/scoring/user/linked-accounts/<id>/sync/ — Importer transactions"""
    try:
        acc = LinkedAccount.objects.get(id=account_id, user=request.user)
    except LinkedAccount.DoesNotExist:
        return Response({'error': 'Compte non trouvé.'}, status=404)

    if not acc.is_verified:
        return Response({'error': 'Vérifiez d\'abord ce compte avec le code OTP.'}, status=400)

    # Transactions manuelles fournies dans le body (import CSV/JSON)
    transactions_data = request.data.get('transactions', [])

    if not transactions_data:
        # Simulation de sync automatique (en prod: appel API opérateur)
        # Pour la démo, générer quelques transactions fictives réalistes
        from datetime import date, timedelta
        import random

        demo_txns = []
        base_date = date.today()
        balance   = float(acc.balance_xaf or 150_000)

        demo_templates = [
            ('Salaire Mensuel',          'credit', 250_000),
            ('Transfert reçu Mobile Money','credit', 50_000),
            ('Paiement Supermarché',     'debit',   35_000),
            ('Facture eau/électricité',  'debit',   25_000),
            ('Tontine quartier',         'debit',   20_000),
            ('Airtime recharge',         'debit',    5_000),
            ('Remboursement ami',        'credit',  15_000),
            ('Transport taxi-moto',      'debit',    2_000),
        ]

        for i, (desc, tx_type, amount) in enumerate(demo_templates[:6]):
            tx_date = base_date - timedelta(days=i*5)
            if tx_type == 'credit':
                balance += amount
            else:
                balance -= amount

            demo_txns.append({
                'date':        str(tx_date),
                'description': desc,
                'amount':      amount,
                'type':        tx_type,
                'balance_after': max(balance, 0),
            })

        transactions_data = demo_txns
        acc.balance_xaf = max(balance, 0)

    # Sauvegarder les transactions importées
    imported = 0
    skipped  = 0
    for txn in transactions_data[:200]:  # Max 200 par sync
        try:
            external_id = txn.get('id') or txn.get('external_id') or f"{txn.get('date')}_{txn.get('amount')}_{txn.get('description', '')[:20]}"

            obj, created = ImportedTransaction.objects.get_or_create(
                linked_account = acc,
                external_id    = str(external_id)[:100],
                defaults={
                    'date':         txn.get('date', str(datetime.today().date())),
                    'description':  str(txn.get('description', ''))[:255],
                    'amount':       abs(float(txn.get('amount', 0))),
                    'tx_type':      txn.get('type', txn.get('tx_type', 'credit')),
                    'balance_after':txn.get('balance_after'),
                    'category':     txn.get('category', ''),
                    'is_income':    txn.get('type', '') == 'credit',
                }
            )
            if created:
                imported += 1
            else:
                skipped += 1
        except Exception:
            skipped += 1

    acc.transactions_imported += imported
    acc.last_sync_at           = timezone.now()
    acc.status                 = 'synced'
    acc.save()

    return Response({
        'message':     f"Synchronisation terminée : {imported} nouvelles transactions importées.",
        'imported':    imported,
        'skipped':     skipped,
        'total':       acc.transactions_imported,
        'balance_xaf': float(acc.balance_xaf),
        'synced_at':   acc.last_sync_at.isoformat(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_linked_account_transactions(request, account_id):
    """GET /api/scoring/user/linked-accounts/<id>/transactions/"""
    try:
        acc = LinkedAccount.objects.get(id=account_id, user=request.user)
    except LinkedAccount.DoesNotExist:
        return Response({'error': 'Compte non trouvé.'}, status=404)

    txns = ImportedTransaction.objects.filter(linked_account=acc).order_by('-date')[:100]
    data = [{
        'id':           t.id,
        'date':         str(t.date),
        'description':  t.description,
        'amount':       float(t.amount),
        'type':         t.tx_type,
        'balance_after':float(t.balance_after) if t.balance_after else None,
        'category':     t.category,
        'is_income':    t.is_income,
        'applied_to_teras': t.applied_to_teras,
    } for t in txns]

    # Stats rapides
    credits = sum(t['amount'] for t in data if t['type'] == 'credit')
    debits  = sum(t['amount'] for t in data if t['type'] == 'debit')

    return Response({
        'account_id':    account_id,
        'operator':      acc.get_operator_display(),
        'transactions':  data,
        'count':         len(data),
        'stats': {
            'total_credits': credits,
            'total_debits':  debits,
            'net_cashflow':  credits - debits,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_linked_transactions_to_score(request, account_id):
    """POST /api/scoring/user/linked-accounts/<id>/apply-to-score/"""
    try:
        acc = LinkedAccount.objects.get(id=account_id, user=request.user)
    except LinkedAccount.DoesNotExist:
        return Response({'error': 'Compte non trouvé.'}, status=404)

    txns = ImportedTransaction.objects.filter(linked_account=acc, applied_to_teras=False)
    count = txns.count()

    if count == 0:
        return Response({'message': 'Toutes les transactions ont déjà été appliquées au score.'})

    # Appliquer au score TERAS
    txns.update(applied_to_teras=True)

    return Response({
        'message': f"{count} transactions appliquées à votre score TERAS.",
        'applied': count,
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_linked_account(request, account_id):
    """DELETE /api/scoring/user/linked-accounts/<id>/delete/"""
    try:
        acc = LinkedAccount.objects.get(id=account_id, user=request.user)
    except LinkedAccount.DoesNotExist:
        return Response({'error': 'Compte non trouvé.'}, status=404)

    acc.delete()
    return Response({'message': 'Compte délié avec succès.'})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def set_primary_account(request, account_id):
    """PATCH /api/scoring/user/linked-accounts/<id>/set-primary/"""
    try:
        acc = LinkedAccount.objects.get(id=account_id, user=request.user)
    except LinkedAccount.DoesNotExist:
        return Response({'error': 'Compte non trouvé.'}, status=404)

    acc.is_primary = True
    acc.save()
    return Response({'message': f"{acc.get_operator_display()} défini comme compte principal."})


# ═══════════════════════════════════════════════════════════════════════════════
# SYSTÈME STAFF
# ═══════════════════════════════════════════════════════════════════════════════

def _serialize_staff(member: StaffMember) -> dict:
    return {
        'id':           member.id,
        'email':        member.email,
        'first_name':   member.first_name,
        'last_name':    member.last_name,
        'full_name':    member.full_name,
        'phone':        member.phone,
        'role':         member.role,
        'role_label':   member.get_role_display(),
        'status':       member.status,
        'interface':    member.interface,
        'is_active':    member.status == 'active',
        'permissions':  member.permissions or member.get_default_permissions(),
        'joined_at':    member.joined_at.isoformat() if member.joined_at else None,
        'last_active_at': member.last_active_at.isoformat() if member.last_active_at else None,
        'created_at':   member.created_at.isoformat(),
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_staff(request):
    """GET /api/scoring/staff/list/?interface=bank"""
    interface = request.GET.get('interface', request.user.user_type)
    members   = StaffMember.objects.filter(
        institution_user=request.user,
        interface=interface
    ).order_by('role', 'last_name')

    return Response({
        'staff':     [_serialize_staff(m) for m in members],
        'count':     members.count(),
        'interface': interface,
        'roles':     _get_roles_for_interface(interface),
    })


def _get_roles_for_interface(interface: str) -> list:
    ROLES = {
        'bank': [
            {'value': 'bank_admin',   'label': 'Administrateur Banque',   'description': 'Accès complet à toutes les fonctionnalités'},
            {'value': 'bank_analyst', 'label': 'Analyste Crédit',          'description': 'Analyse dossiers, pas d\'approbation'},
            {'value': 'bank_agent',   'label': 'Agent Commercial',         'description': 'Création clients, suivi dossiers'},
            {'value': 'bank_viewer',  'label': 'Lecture seule',            'description': 'Consultation uniquement'},
        ],
        'enterprise': [
            {'value': 'ent_admin',    'label': 'Administrateur',           'description': 'Accès complet'},
            {'value': 'ent_manager',  'label': 'Manager',                  'description': 'Gestion équipe et clients'},
            {'value': 'ent_accountant','label': 'Comptable',               'description': 'Finances et rapports'},
            {'value': 'ent_hr',       'label': 'Ressources Humaines',      'description': 'Gestion des employés'},
            {'value': 'ent_viewer',   'label': 'Lecture seule',            'description': 'Consultation uniquement'},
        ],
        'government': [
            {'value': 'gov_admin',    'label': 'Administrateur',           'description': 'Accès complet'},
            {'value': 'gov_minister', 'label': 'Ministre / Directeur',     'description': 'Rapports et tableaux de bord'},
            {'value': 'gov_analyst',  'label': 'Analyste',                 'description': 'Analyse des données CEMAC'},
            {'value': 'gov_viewer',   'label': 'Lecture seule',            'description': 'Consultation uniquement'},
        ],
    }
    return ROLES.get(interface, [])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_staff(request):
    """POST /api/scoring/staff/invite/"""
    d         = request.data
    email     = d.get('email', '').lower().strip()
    role      = d.get('role', '')
    interface = d.get('interface', request.user.user_type)
    first_name = d.get('first_name', '')
    last_name  = d.get('last_name', '')
    phone      = d.get('phone', '')
    permissions = d.get('permissions', {})

    if not email:
        return Response({'error': 'Email requis.'}, status=400)
    if not role:
        return Response({'error': 'Rôle requis.'}, status=400)

    # Vérifier que le rôle correspond à l'interface
    valid_roles = [r['value'] for r in _get_roles_for_interface(interface)]
    if role not in valid_roles:
        return Response({'error': f"Rôle invalide pour l'interface {interface}."}, status=400)

    # Vérifier doublon
    if StaffMember.objects.filter(institution_user=request.user, email=email, interface=interface).exists():
        return Response({'error': 'Cette personne est déjà membre de votre équipe.'}, status=400)

    # Générer token d'invitation
    token = secrets.token_urlsafe(32)
    expires = timezone.now() + timedelta(days=7)

    # Trouver le compte TERAS si existe
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        teras_user = User.objects.get(email=email)
    except User.DoesNotExist:
        teras_user = None

    # Permissions par défaut ou personnalisées
    member = StaffMember(
        institution_user = request.user,
        user             = teras_user,
        email            = email,
        first_name       = first_name,
        last_name        = last_name,
        phone            = phone,
        interface        = interface,
        role             = role,
        status           = 'active' if teras_user else 'pending',
        invite_token     = token,
        invite_expires_at = expires,
        invited_by       = request.user,
        joined_at        = timezone.now() if teras_user else None,
    )
    # Fusionner permissions par défaut + personnalisées
    default_perms = member.get_default_permissions()
    default_perms.update(permissions)
    member.permissions = default_perms
    member.save()

    return Response({
        'message':    f"{'Membre ajouté' if teras_user else 'Invitation envoyée à'} {email}.",
        'member':     _serialize_staff(member),
        'has_account': bool(teras_user),
        'invite_url': f"/join-team/{token}" if not teras_user else None,
    }, status=201)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_staff_permissions(request, member_id):
    """PATCH /api/scoring/staff/<id>/permissions/ — Modifier rôle et permissions"""
    try:
        member = StaffMember.objects.get(id=member_id, institution_user=request.user)
    except StaffMember.DoesNotExist:
        return Response({'error': 'Membre non trouvé.'}, status=404)

    d = request.data

    if 'role' in d:
        member.role = d['role']
        # Réinitialiser permissions selon nouveau rôle
        member.permissions = member.get_default_permissions()

    if 'permissions' in d and isinstance(d['permissions'], dict):
        current = member.permissions or {}
        current.update(d['permissions'])
        member.permissions = current

    if 'status' in d and d['status'] in ('active', 'inactive', 'suspended'):
        member.status = d['status']

    member.save()

    return Response({
        'message': 'Permissions mises à jour.',
        'member':  _serialize_staff(member),
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_staff(request, member_id):
    """DELETE /api/scoring/staff/<id>/remove/"""
    try:
        member = StaffMember.objects.get(id=member_id, institution_user=request.user)
    except StaffMember.DoesNotExist:
        return Response({'error': 'Membre non trouvé.'}, status=404)

    name = member.full_name
    member.delete()
    return Response({'message': f"{name} retiré de l'équipe."})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_staff_access(request):
    """
    GET /api/scoring/staff/my-access/
    Retourne les permissions du user courant au sein d'une institution.
    Utilisé par le frontend pour afficher/masquer les éléments selon les droits.
    """
    # Chercher si ce user est membre d'une institution
    memberships = StaffMember.objects.filter(
        user=request.user, status='active'
    ).select_related('institution_user')

    result = []
    for m in memberships:
        result.append({
            'institution_id':    m.institution_user.id,
            'institution_email': m.institution_user.email,
            'institution_name':  getattr(m.institution_user, 'bank_name', None) or
                                 getattr(m.institution_user, 'company_name', None) or
                                 m.institution_user.email,
            'interface':         m.interface,
            'role':              m.role,
            'role_label':        m.get_role_display(),
            'permissions':       m.permissions or m.get_default_permissions(),
        })

    return Response({'memberships': result, 'count': len(result)})

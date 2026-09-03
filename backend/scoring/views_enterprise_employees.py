# backend/scoring/views_enterprise_employees.py
"""
Gestion des employés de l'entreprise TERAS
- CRUD complet
- Liaison avec comptes TERAS individuels
- Score TERAS de l'employé
- Équipe/membres de l'espace entreprise
"""
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Avg
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

User = get_user_model()


def _get_enterprise(user):
    """Retourne le profil BankEnterprise lié à l'utilisateur."""
    try:
        from scoring.models_bank import BankEnterprise
        return BankEnterprise.objects.filter(user=user).first()
    except Exception:
        return None


def _get_enterprise_model(user):
    """Retourne le profil enterprise TERAS lié à l'utilisateur."""
    try:
        from scoring.models_enterprise import Enterprise
        return Enterprise.objects.filter(user=user).first()
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Modèle Employee (inline, créé à la volée si absent)
# ─────────────────────────────────────────────────────────────────────────────

def _get_employee_model():
    """Import lazy du modèle Employee."""
    try:
        from scoring.models_enterprise_employees import Employee, TeamMember
        return Employee, TeamMember
    except ImportError:
        return None, None


# ─────────────────────────────────────────────────────────────────────────────
# 1. Employés
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def enterprise_employees_list(request):
    """GET /api/scoring/enterprise/employees/"""
    Employee, _ = _get_employee_model()
    if not Employee:
        return Response({'employees': [], 'stats': {
            'total': 0, 'active': 0, 'with_teras': 0, 'avg_score': None
        }})

    ent = _get_enterprise(request.user)
    ent_id = ent.id if ent else None

    # Chercher aussi via enterprise TERAS
    ent_teras = _get_enterprise_model(request.user)
    ent_teras_id = ent_teras.id if ent_teras else None

    emps = Employee.objects.filter(
        bank_enterprise_id=ent_id
    ) if ent_id else Employee.objects.none()

    data = []
    for e in emps.order_by('-created_at'):
        # Score TERAS via compte utilisateur lié
        score = None
        if e.teras_user:
            try:
                from scoring.models import ScoreHistory
                last = ScoreHistory.objects.filter(user=e.teras_user).order_by('-calculated_at').first()
                if last:
                    score = last.score
            except Exception:
                pass
            if score is None:
                score = getattr(e.teras_user, 'teras_score', None)

        data.append({
            'id':            e.id,
            'first_name':    e.first_name,
            'last_name':     e.last_name,
            'email':         e.email,
            'phone':         e.phone,
            'position':      e.position,
            'department':    e.department,
            'salary':        str(e.salary) if e.salary else None,
            'hire_date':     e.hire_date.isoformat() if e.hire_date else None,
            'status':        e.status,
            'teras_user_id': e.teras_user_id,
            'teras_email':   e.teras_user.email if e.teras_user else None,
            'teras_score':   score,
            'niu':           e.niu,
            'created_at':    e.created_at.isoformat(),
        })

    scores = [d['teras_score'] for d in data if d['teras_score'] is not None]
    stats = {
        'total':     len(data),
        'active':    sum(1 for d in data if d['status'] == 'active'),
        'with_teras': sum(1 for d in data if d['teras_user_id']),
        'avg_score': round(sum(scores) / len(scores)) if scores else None,
    }
    return Response({'employees': data, 'stats': stats})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enterprise_employee_create(request):
    """POST /api/scoring/enterprise/employees/create/"""
    Employee, _ = _get_employee_model()
    if not Employee:
        return Response({'error': 'Module employés non disponible'}, status=503)

    ent = _get_enterprise(request.user)
    if not ent:
        return Response({'error': 'Profil entreprise introuvable'}, status=404)

    data     = request.data
    email    = data.get('email', '').strip().lower()
    niu      = data.get('niu', '').strip()
    position = data.get('position', '')

    if not email or not data.get('first_name') or not data.get('last_name'):
        return Response({'error': 'first_name, last_name et email sont requis'}, status=400)

    if Employee.objects.filter(bank_enterprise=ent, email=email).exists():
        return Response({'error': f"Un employé avec l'email {email} existe déjà"}, status=400)

    # Chercher un compte TERAS existant par email ou NIU
    teras_user = None
    if email:
        teras_user = User.objects.filter(email=email).first()
    if not teras_user and niu:
        teras_user = User.objects.filter(username=niu).first()

    from datetime import date as dt_date
    hire_date_str = data.get('hire_date')
    hire_date = None
    if hire_date_str:
        try:
            hire_date = dt_date.fromisoformat(hire_date_str)
        except ValueError:
            pass

    emp = Employee.objects.create(
        bank_enterprise=ent,
        first_name=data.get('first_name', '').strip(),
        last_name=data.get('last_name', '').strip(),
        email=email,
        phone=data.get('phone', ''),
        position=position,
        department=data.get('department', ''),
        salary=data.get('salary') or None,
        hire_date=hire_date or dt_date.today(),
        status=data.get('status', 'active'),
        niu=niu,
        teras_user=teras_user,
    )

    return Response({
        'success':     True,
        'id':          emp.id,
        'teras_linked': teras_user is not None,
        'teras_email': teras_user.email if teras_user else None,
        'message':     f"Employé créé{'— compte TERAS lié !' if teras_user else ''}"
    }, status=201)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def enterprise_employee_detail(request, employee_id):
    """GET/PUT/DELETE /api/scoring/enterprise/employees/<id>/"""
    Employee, _ = _get_employee_model()
    if not Employee:
        return Response({'error': 'Module employés non disponible'}, status=503)

    ent = _get_enterprise(request.user)
    try:
        emp = Employee.objects.get(id=employee_id, bank_enterprise=ent)
    except Employee.DoesNotExist:
        return Response({'error': 'Employé introuvable'}, status=404)

    if request.method == 'DELETE':
        emp.delete()
        return Response({'success': True})

    if request.method == 'PUT':
        data = request.data
        for field in ['first_name', 'last_name', 'phone', 'position', 'department', 'status', 'niu']:
            if field in data:
                setattr(emp, field, data[field])
        if 'salary' in data:
            emp.salary = data['salary'] or None
        if 'hire_date' in data and data['hire_date']:
            from datetime import date as dt_date
            try:
                emp.hire_date = dt_date.fromisoformat(data['hire_date'])
            except ValueError:
                pass
        # Lier/délier compte TERAS
        if 'teras_email' in data:
            if data['teras_email']:
                u = User.objects.filter(email=data['teras_email']).first()
                emp.teras_user = u
            else:
                emp.teras_user = None
        emp.save()
        return Response({'success': True})

    # GET
    score = None
    if emp.teras_user:
        try:
            from scoring.models import ScoreHistory
            last = ScoreHistory.objects.filter(user=emp.teras_user).order_by('-calculated_at').first()
            if last:
                score = last.score
        except Exception:
            pass

    return Response({
        'id':          emp.id,
        'first_name':  emp.first_name,
        'last_name':   emp.last_name,
        'email':       emp.email,
        'phone':       emp.phone,
        'position':    emp.position,
        'department':  emp.department,
        'salary':      str(emp.salary) if emp.salary else None,
        'hire_date':   emp.hire_date.isoformat() if emp.hire_date else None,
        'status':      emp.status,
        'niu':         emp.niu,
        'teras_user_id': emp.teras_user_id,
        'teras_email': emp.teras_user.email if emp.teras_user else None,
        'teras_score': score,
        'created_at':  emp.created_at.isoformat(),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enterprise_employee_link_teras(request, employee_id):
    """POST /api/scoring/enterprise/employees/<id>/link-teras/"""
    Employee, _ = _get_employee_model()
    ent = _get_enterprise(request.user)
    try:
        emp  = Employee.objects.get(id=employee_id, bank_enterprise=ent)
    except Exception:
        return Response({'error': 'Employé introuvable'}, status=404)

    email = request.data.get('teras_email', '').strip().lower()
    if not email:
        return Response({'error': 'teras_email requis'}, status=400)

    u = User.objects.filter(email=email).first()
    if not u:
        return Response({'error': f"Aucun compte TERAS avec l'email {email}"}, status=404)

    emp.teras_user = u
    emp.save(update_fields=['teras_user'])
    return Response({'success': True, 'teras_score': getattr(u, 'teras_score', None)})


# ─────────────────────────────────────────────────────────────────────────────
# 2. Membres de l'équipe (accès à l'interface entreprise)
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def enterprise_team_list(request):
    """GET /api/scoring/enterprise/team/"""
    _, TeamMember = _get_employee_model()
    if not TeamMember:
        return Response({'members': [], 'roles': []})

    ent = _get_enterprise(request.user)
    if not ent:
        return Response({'members': [], 'roles': []})

    members = TeamMember.objects.filter(enterprise=ent).order_by('role', 'user__email')
    data = [
        {
            'id':         m.id,
            'email':      m.user.email,
            'name':       m.user.get_full_name() or m.user.email,
            'role':       m.role,
            'is_active':  m.is_active,
            'joined_at':  m.joined_at.isoformat() if m.joined_at else None,
        }
        for m in members
    ]
    roles = ['admin', 'manager', 'analyst', 'viewer']
    return Response({'members': data, 'roles': roles})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enterprise_team_invite(request):
    """POST /api/scoring/enterprise/team/invite/"""
    _, TeamMember = _get_employee_model()
    if not TeamMember:
        return Response({'error': 'Module équipe non disponible'}, status=503)

    ent = _get_enterprise(request.user)
    if not ent:
        return Response({'error': 'Profil entreprise introuvable'}, status=404)

    email = request.data.get('email', '').strip().lower()
    role  = request.data.get('role', 'viewer')

    if not email:
        return Response({'error': 'email requis'}, status=400)

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({'error': f"Aucun compte TERAS avec l'email {email}. L'utilisateur doit d'abord créer un compte TERAS."}, status=404)

    if TeamMember.objects.filter(enterprise=ent, user=user).exists():
        return Response({'error': 'Cet utilisateur est déjà membre de l\'équipe'}, status=400)

    member = TeamMember.objects.create(
        enterprise=ent,
        user=user,
        role=role,
        joined_at=timezone.now(),
    )
    return Response({
        'success': True,
        'member': {
            'id':       member.id,
            'email':    user.email,
            'name':     user.get_full_name() or user.email,
            'role':     member.role,
            'joined_at': member.joined_at.isoformat(),
        }
    }, status=201)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def enterprise_team_member(request, member_id):
    """PUT/DELETE /api/scoring/enterprise/team/<id>/"""
    _, TeamMember = _get_employee_model()
    ent = _get_enterprise(request.user)
    try:
        member = TeamMember.objects.get(id=member_id, enterprise=ent)
    except Exception:
        return Response({'error': 'Membre introuvable'}, status=404)

    if request.method == 'DELETE':
        member.delete()
        return Response({'success': True})

    if request.method == 'PUT':
        role = request.data.get('role')
        if role:
            member.role = role
            member.save(update_fields=['role'])
        return Response({'success': True})

# backend/users/views_auth.py
"""
Vues d'authentification TERAS — VERSION CORRIGÉE COMPLÈTE
✅ RegisterView : validation complète + création Profile + champs étendus
✅ MeView : GET + PUT/PATCH avec profil étendu
✅ ChangePasswordView : endpoint séparé
✅ UserSerializer : retourne phone_number, address, city depuis Profile
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal, InvalidOperation
from .serializers import CustomTokenObtainPairSerializer

User = get_user_model()

VALID_USER_TYPES = ['individual', 'enterprise', 'bank', 'government', 'admin']


def _parse_coordinate(value, field_name, min_value, max_value):
    if value in (None, '', 'null'):
        return None

    try:
        coord = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError(f"Champ '{field_name}' invalide.")

    if coord < Decimal(str(min_value)) or coord > Decimal(str(max_value)):
        raise ValidationError(f"Champ '{field_name}' hors limites ({min_value} à {max_value}).")

    return coord


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_or_create_profile(user):
    """Retourne le profil de l'utilisateur, le crée si inexistant."""
    try:
        from .models import Profile
        profile, _ = Profile.objects.get_or_create(user=user)
        return profile
    except Exception:
        return None


def _build_user_response(user):
    """Construit le dict utilisateur complet incluant les données de profil."""
    profile = _get_or_create_profile(user)
    return {
        'id':           user.id,
        'email':        user.email,
        'first_name':   user.first_name or '',
        'last_name':    user.last_name  or '',
        'user_type':    user.user_type,
        'is_active':    user.is_active,
        'kyc_status':   getattr(user, 'kyc_status', 'pending'),
        'country':      getattr(user, 'country', '') or '',
        'region':       getattr(user, 'region',  '') or '',
        # Champs depuis Profile
        'phone_number': getattr(profile, 'phone_number', '') or '' if profile else '',
        'address':      getattr(profile, 'address',      '') or '' if profile else '',
        'city':         getattr(profile, 'city',         '') or '' if profile else '',
        'latitude':     float(profile.latitude) if profile and profile.latitude is not None else None,
        'longitude':    float(profile.longitude) if profile and profile.longitude is not None else None,
        'location_source': getattr(profile, 'location_source', '') or '' if profile else '',
        'location_updated_at': profile.location_updated_at.isoformat() if profile and profile.location_updated_at else None,
        # Champs entreprise
        'company_name': getattr(user, 'company_name', '') or '',
        'bank_name':    getattr(user, 'bank_name',    '') or '',
        'institution_code': getattr(user, 'institution_code', '') or '',
        'date_joined':  user.date_joined.isoformat() if hasattr(user, 'date_joined') else '',
    }


# ─── Login ────────────────────────────────────────────────────────────────────

class LoginRateThrottle(AnonRateThrottle):
    rate = '5/minute'
    scope = 'login'


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Retourne : access, refresh, user (avec profil étendu)
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response(
                {'error': 'Email ou mot de passe incorrect'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        tokens = serializer.validated_data

        try:
            user = User.objects.get(email=request.data.get('email', '').lower().strip())
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=401)

        if not user.is_active:
            return Response(
                {'error': 'Compte désactivé. Contactez l\'administrateur.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response({
            'access':  tokens['access'],
            'refresh': tokens['refresh'],
            'user':    _build_user_response(user),
        }, status=status.HTTP_200_OK)


# ─── Register ─────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    """
    POST /api/auth/register/

    Champs communs :
      email, password, first_name, last_name, user_type
      phone_number, country, city, address

    Champs entreprise :
      company_name, rccm

    Champs banque :
      bank_name, institution_code

    Champs gouvernement :
      country (obligatoire)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data

        # ── Champs obligatoires ──────────────────────────────────────────
        email     = (data.get('email') or '').lower().strip()
        password  = data.get('password', '')
        user_type = data.get('user_type', 'individual')

        if not email:
            return Response({'error': 'L\'adresse email est obligatoire.'}, status=400)

        if not password:
            return Response({'error': 'Le mot de passe est obligatoire.'}, status=400)

        # ── Validation email ─────────────────────────────────────────────
        import re
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return Response({'error': 'Format d\'email invalide.'}, status=400)

        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Un compte avec cet email existe déjà.'},
                status=400
            )

        # ── Validation mot de passe ──────────────────────────────────────
        if len(password) < 8:
            return Response(
                {'error': 'Le mot de passe doit contenir au moins 8 caractères.'},
                status=400
            )

        try:
            validate_password(password)
        except ValidationError as e:
            return Response({'error': ' '.join(e.messages)}, status=400)

        # ── Validation user_type ─────────────────────────────────────────
        if user_type not in VALID_USER_TYPES:
            return Response(
                {'error': f'Type de compte invalide. Valeurs acceptées: {", ".join(VALID_USER_TYPES)}'},
                status=400
            )

        # ── Champs optionnels ────────────────────────────────────────────
        first_name    = data.get('first_name', '').strip()
        last_name     = data.get('last_name',  '').strip()
        phone_number  = data.get('phone_number') or data.get('phone', '')
        country       = data.get('country', 'CG')
        city          = data.get('city', '')
        address       = data.get('address', '')
        latitude      = data.get('latitude')
        longitude     = data.get('longitude')
        location_source = data.get('location_source', '')
        company_name  = data.get('company_name', '')
        bank_name     = data.get('bank_name', '')
        institution_code = data.get('institution_code', '')
        rccm          = data.get('rccm', '')

        # Pour les entreprises, company_name est requis
        if user_type == 'enterprise' and not company_name and not first_name:
            return Response(
                {'error': 'Le nom de l\'entreprise (company_name) est requis.'},
                status=400
            )

        try:
            # ── Créer l'utilisateur ──────────────────────────────────────
            user_kwargs = {
                'email':      email,
                'password':   password,
                'first_name': first_name,
                'last_name':  last_name,
                'user_type':  user_type,
            }

            # Champs sur CustomUser si disponibles
            if hasattr(User, 'country'):
                user_kwargs['country'] = country

            if user_type == 'enterprise':
                if hasattr(User, 'company_name'):
                    user_kwargs['company_name'] = company_name or first_name

            if user_type == 'bank':
                if hasattr(User, 'bank_name'):
                    user_kwargs['bank_name'] = bank_name or first_name
                if hasattr(User, 'institution_code'):
                    user_kwargs['institution_code'] = institution_code

            user = User.objects.create_user(**user_kwargs)

            # ── Créer le profil étendu ───────────────────────────────────
            profile = _get_or_create_profile(user)
            if profile:
                if phone_number:
                    profile.phone_number = phone_number
                if address:
                    profile.address = address
                if city:
                    profile.city = city
                if country:
                    profile.country = country

                profile.latitude = _parse_coordinate(latitude, 'latitude', -90, 90)
                profile.longitude = _parse_coordinate(longitude, 'longitude', -180, 180)
                if location_source:
                    profile.location_source = location_source
                if profile.latitude is not None and profile.longitude is not None:
                    profile.location_updated_at = timezone.now()
                profile.save()

            # ── Score TERAS initial ──────────────────────────────────────
            # Créer un score initial de 300 pour les nouveaux comptes
            try:
                from scoring.models import TerasScore
                TerasScore.objects.get_or_create(
                    user=user,
                    defaults={'score': 300, 'band': 'D'}
                )
            except Exception:
                pass  # Score sera créé à la première activité

            # ── Générer les tokens JWT ───────────────────────────────────
            refresh = RefreshToken.for_user(user)

            return Response({
                'message':  'Inscription réussie ! Bienvenue sur TERAS.',
                'access':   str(refresh.access_token),
                'refresh':  str(refresh),
                'user':     _build_user_response(user),
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Nettoyer si l'utilisateur a été créé partiellement
            try:
                User.objects.filter(email=email).delete()
            except Exception:
                pass
            return Response(
                {'error': f'Erreur lors de la création du compte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ─── Me (GET + PUT) ───────────────────────────────────────────────────────────

class MeView(APIView):
    """
    GET  /api/auth/me/   → Retourne le profil complet
    PUT  /api/auth/me/   → Met à jour le profil
    PATCH /api/auth/me/  → Mise à jour partielle
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_build_user_response(request.user))

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial=False):
        user    = request.user
        data    = request.data
        profile = _get_or_create_profile(user)

        # ── Champs sur CustomUser ────────────────────────────────────────
        user_fields = ['first_name', 'last_name', 'country', 'region',
                       'company_name', 'bank_name', 'institution_code']
        updated = False
        for field in user_fields:
            if field in data and hasattr(user, field):
                setattr(user, field, data[field])
                updated = True

        if 'email' in data:
            new_email = data['email'].lower().strip()
            if new_email != user.email:
                if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                    return Response({'error': 'Cet email est déjà utilisé.'}, status=400)
                user.email = new_email
                updated = True

        if updated:
            user.save()

        # ── Champs sur Profile ───────────────────────────────────────────
        if profile:
            profile_fields = ['phone_number', 'address', 'city', 'bio']
            # Accepter aussi 'phone' comme alias
            if 'phone' in data and 'phone_number' not in data:
                data = dict(data)
                data['phone_number'] = data['phone']

            profile_updated = False
            for field in profile_fields:
                if field in data:
                    setattr(profile, field, data[field])
                    profile_updated = True

            location_fields_provided = False
            try:
                if 'latitude' in data:
                    profile.latitude = _parse_coordinate(data.get('latitude'), 'latitude', -90, 90)
                    profile_updated = True
                    location_fields_provided = True

                if 'longitude' in data:
                    profile.longitude = _parse_coordinate(data.get('longitude'), 'longitude', -180, 180)
                    profile_updated = True
                    location_fields_provided = True
            except ValidationError as exc:
                message = exc.messages[0] if getattr(exc, 'messages', None) else str(exc)
                return Response({'error': message}, status=400)

            if 'location_source' in data:
                profile.location_source = data.get('location_source') or ''
                profile_updated = True
                location_fields_provided = True

            if location_fields_provided:
                profile.location_updated_at = timezone.now()
                profile_updated = True

            if profile_updated:
                profile.save()

        return Response({
            'message': 'Profil mis à jour.',
            'user':    _build_user_response(user),
        })


# ─── Change Password ──────────────────────────────────────────────────────────

class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Body: { old_password, new_password }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user        = request.user
        old_pwd     = request.data.get('old_password', '')
        new_pwd     = request.data.get('new_password', '')

        if not old_pwd or not new_pwd:
            return Response(
                {'error': 'old_password et new_password sont requis.'},
                status=400
            )

        if not user.check_password(old_pwd):
            return Response(
                {'error': 'Mot de passe actuel incorrect.'},
                status=400
            )

        if len(new_pwd) < 8:
            return Response(
                {'error': 'Le nouveau mot de passe doit contenir au moins 8 caractères.'},
                status=400
            )

        try:
            validate_password(new_pwd, user=user)
        except ValidationError as e:
            return Response({'error': ' '.join(e.messages)}, status=400)

        if old_pwd == new_pwd:
            return Response(
                {'error': 'Le nouveau mot de passe doit être différent de l\'ancien.'},
                status=400
            )

        user.set_password(new_pwd)
        user.save()

        # Révoquer les anciens tokens (sécurité)
        try:
            refresh = request.data.get('refresh')
            if refresh:
                from rest_framework_simplejwt.tokens import RefreshToken
                RefreshToken(refresh).blacklist()
        except Exception:
            pass

        return Response({'message': 'Mot de passe modifié avec succès.'})


# ─── Logout ───────────────────────────────────────────────────────────────────

class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Body: { refresh }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Déconnexion réussie.'})
        except Exception:
            return Response({'message': 'Déconnexion effectuée.'})

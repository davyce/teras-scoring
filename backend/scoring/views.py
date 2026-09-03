# backend/scoring/views.py
"""
Vues principales pour le module scoring TERAS
✅ IMPORTS CORRIGÉS pour structure avec sous-modules
"""

import os
import json
import csv
from pathlib import Path
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, permissions

# ✅ CORRIGÉ : Import depuis le sous-module user/
from scoring.serializers import ScoreHistorySerializer
from .serializers import ScoreInputSerializer, ScoreOutputSerializer

from .engine.teras import (
    TerasScoring, get_active, get_available_regions, get_available_countries, get_config_dict
)

# ✅ CORRIGÉ : Import depuis le sous-module user/
from scoring.models import ScoreHistory
from .permissions import IsTerasAdminOrReadOnly

# --- Fichiers de configuration
CONFIG_DIR = Path(__file__).resolve().parent / "config"
CONFIG_DIR.mkdir(parents=True, exist_ok=True)

ACTIVE_FILE = CONFIG_DIR / "active.json"
BASIC_FILE = CONFIG_DIR / "teras_basic.json"
ENTERPRISE_FILE = CONFIG_DIR / "teras_enterprise.json"
REGIONAL_FILE = CONFIG_DIR / "teras_regional.json"
COUNTRY_FILE = CONFIG_DIR / "teras_country.json"

# Valeurs par défaut minimales au cas où les JSON n'existent pas
DEFAULT_ACTIVE = {"profile": "basic", "region": "CEMAC", "country": "CG"}

def _safe_load_json(path: Path, fallback):
    try:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return fallback

def _safe_write_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

class HealthView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        return Response({"status": "ok", "service": "TERAS API", "version": "v0.6"})


class ComputeScoreView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = ScoreInputSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        data = ser.validated_data

        # Normaliser social (si envoyé 0-100 au lieu de 0-1)
        social_value = data["social"]
        if social_value > 1:
            social_value = social_value / 100

        try:
            result = TerasScoring().compute(
                t=data["transactions"],
                e=data["epargne"],
                r=data["revenus"],
                a=data["actifs"],
                s=social_value,
            )
            score_value = result.get("score", 0)
            details = result.get("details", {})
        except Exception as e:
            # Fallback : calcul simplifié si le moteur échoue
            t_score = min(200, (data["transactions"] / 500000) * 200)
            e_score = min(200, (data["epargne"] / 2000000) * 200)
            r_score = min(200, (data["revenus"] / 5000000) * 200)
            a_score = min(200, (data["actifs"] / 10000000) * 200)
            s_score = min(200, social_value * 200)

            score_value = int(t_score + e_score + r_score + a_score + s_score)
            details = {
                "T": round(t_score, 1),
                "E": round(e_score, 1),
                "R": round(r_score, 1),
                "A": round(a_score, 1),
                "S": round(s_score, 1),
            }

        # Créer le breakdown pour le frontend
        breakdown = {
            "T": details.get("T", details.get("t_normalized", 0)),
            "E": details.get("E", details.get("e_normalized", 0)),
            "R": details.get("R", details.get("r_normalized", 0)),
            "A": details.get("A", details.get("a_normalized", 0)),
            "S": details.get("S", details.get("s_normalized", 0)),
        }

        # Sauvegarder dans l'historique
        user = request.user if getattr(request.user, "is_authenticated", False) else None

        ScoreHistory.objects.create(
            user=user,
            transactions=data["transactions"],
            epargne=data["epargne"],
            revenus=data["revenus"],
            actifs=data["actifs"],
            social=data["social"],
            score=score_value,
            score_total=score_value,
            profile_type="basic",
            breakdown=breakdown,
            detail=details,
            raw_data=data,
        )

        # Réponse au format attendu par le frontend
        return Response({
            "score": int(score_value),
            "breakdown": breakdown,
            "profile_type": "basic",
            "details": details,
        }, status=status.HTTP_200_OK)

# Config du PROFIL ACTIF (GET public / PUT admin)
class ConfigView(APIView):
    permission_classes = [IsTerasAdminOrReadOnly]

    def get(self, request):
        try:
            # get_active() + get_config_dict() viennent de ton moteur
            profile, region, country = get_active()
            cfg = get_config_dict()
            return Response({
                "active_profile": profile,
                "region": region,
                "country": country,
                "config": cfg,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        try:
            profile, region, country = get_active()
            new_data = request.data if isinstance(request.data, dict) else {}
            if "weights" not in new_data or "ranges" not in new_data:
                return Response(
                    {"error": "Attendu: {'weights': {...}, 'ranges': {...}}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if profile == "basic":
                _safe_write_json(BASIC_FILE, new_data)
                return Response({"message": "Config 'basic' mise à jour", "config": new_data})

            if profile == "enterprise":
                _safe_write_json(ENTERPRISE_FILE, new_data)
                return Response({"message": "Config 'enterprise' mise à jour", "config": new_data})

            if profile == "regional":
                regional = _safe_load_json(REGIONAL_FILE, {"regions": {}})
                regions = regional.get("regions", {})
                if region not in regions:
                    return Response({"error": f"Région '{region}' inconnue"}, status=400)
                regions[region] = {
                    "weights": new_data.get("weights", regions[region].get("weights", {})),
                    "ranges": new_data.get("ranges", regions[region].get("ranges", {})),
                }
                regional["regions"] = regions
                _safe_write_json(REGIONAL_FILE, regional)
                return Response({"message": f"Config 'regional' ({region}) mise à jour", "config": regions[region]})

            if profile == "country":
                cdata = _safe_load_json(COUNTRY_FILE, {"regions": {}})
                regions = cdata.setdefault("regions", {})
                if region not in regions:
                    return Response({"error": f"Région '{region}' inconnue"}, status=400)
                countries = regions[region].setdefault("countries", {})
                if country not in countries:
                    return Response({"error": f"Pays '{country}' inconnu pour la région '{region}'"}, status=400)
                countries[country] = {
                    "weights": new_data.get("weights", countries[country].get("weights", {})),
                    "ranges": new_data.get("ranges", countries[country].get("ranges", {})),
                }
                _safe_write_json(COUNTRY_FILE, cdata)
                return Response({"message": f"Config 'country' ({region}/{country}) mise à jour", "config": countries[country]})

            return Response({"error": "Profil actif inconnu"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

# Profil/Region/Country actifs (GET public / PUT admin)
class ConfigProfileView(APIView):
    permission_classes = [IsTerasAdminOrReadOnly]

    def get(self, request):
        p, r, c = get_active()
        return Response({"active_profile": p, "region": r, "country": c})

    def put(self, request):
        try:
            payload = request.data or {}
            prof = payload.get("profile")
            reg = payload.get("region")
            cty = payload.get("country")

            active = _safe_load_json(ACTIVE_FILE, DEFAULT_ACTIVE.copy())

            if prof:
                if prof not in {"basic", "enterprise", "regional", "country"}:
                    return Response(
                        {"error": "profile doit être 'basic','enterprise','regional' ou 'country'."},
                        status=400,
                    )
                active["profile"] = prof

            if reg:
                available = list(get_available_regions().keys())
                if reg not in available:
                    return Response(
                        {"error": f"region inconnue. Choisis parmi: {', '.join(available) or 'Aucune'}"},
                        status=400,
                    )
                active["region"] = reg

            if cty:
                countries = list(get_available_countries(active.get("region", "CEMAC")).keys())
                if cty not in countries:
                    return Response(
                        {"error": f"country inconnu pour {active.get('region')}. Choisis parmi: {', '.join(countries) or 'Aucun'}"},
                        status=400,
                    )
                active["country"] = cty

            if active["profile"] == "regional" and not active.get("region"):
                active["region"] = "CEMAC"
            if active["profile"] == "country":
                if not active.get("region"):
                    active["region"] = "CEMAC"
                if not active.get("country"):
                    first = next(iter(get_available_countries(active["region"]).keys() or ["CG"]))
                    active["country"] = first

            _safe_write_json(ACTIVE_FILE, active)
            return Response({"message": "Profil actif mis à jour", **active})
        except Exception as e:
            return Response({"error": str(e)}, status=400)

# Listes (public)
class ConfigRegionsView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        regs = get_available_regions()
        return Response({"available_regions": list(regs.keys()), "definitions": regs})

class ConfigCountriesView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        region = request.query_params.get("region")
        if not region:
            _, r, _ = get_active()
            region = r
        countries = get_available_countries(region)
        return Response({"region": region, "available_countries": list(countries.keys()), "definitions": countries})

# --- EXPORT CSV de l'historique des scores
class ExportScoresCSV(APIView):
    permission_classes = [permissions.IsAuthenticated]  # impose un token pour l'export

    def get(self, request):
        response = Response(status=200)
        # On va générer le CSV par HttpResponse pour le header Content-Disposition
        from django.http import HttpResponse
        resp = HttpResponse(content_type="text/csv")
        resp["Content-Disposition"] = 'attachment; filename="scores.csv"'
        writer = csv.writer(resp)
        writer.writerow(["user_id", "transactions", "epargne", "revenus", "actifs", "social", "score_total", "timestamp"])
        qs = ScoreHistory.objects.all().select_related("user").order_by("-created_at")
        for row in qs.iterator():
            writer.writerow([
                row.user_id or "",
                row.transactions, row.epargne, row.revenus, row.actifs, row.social,
                row.score_total, row.created_at.isoformat()
            ])
        return resp


class ScoreHistoryView(APIView):
    """
    GET /api/v1/scoring/history/

    Retourne l'historique des scores de l'utilisateur connecté.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        history = ScoreHistory.objects.filter(
            user=request.user
        ).order_by("-created_at")[:20]

        # Formater la réponse pour le frontend
        data = []
        for item in history:
            data.append({
                "id": item.id,
                "score": int(item.score or item.score_total or 0),
                "profile_type": item.profile_type or "basic",
                "breakdown": item.breakdown or item.detail or {},
                "raw_data": item.raw_data or {},
                "created_at": item.created_at.isoformat(),
            })

        return Response(data, status=status.HTTP_200_OK)


# ============================================================================
# NOUVELLES VUES - FONCTIONNALITES AVANCEES
# ============================================================================

class LoanSimulatorView(APIView):
    """
    Simulateur de credit interactif
    POST /api/scoring/simulate-loan/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Simule un pret avec differents scenarios
        
        Body:
        {
            "amount": 500000,  // Montant souhaite en FCFA
            "duration": 12     // Duree en mois
        }
        """
        try:
            from django.db.models import Avg
            
            amount = float(request.data.get('amount', 0))
            duration = int(request.data.get('duration', 6))
            
            # Recuperer le score actuel
            latest_score = ScoreHistory.objects.filter(
                user=request.user
            ).order_by('-created_at').first()
            
            if not latest_score:
                return Response(
                    {'error': 'Aucun score trouve. Calculez d\'abord votre score TERAS.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            score_value = latest_score.score_total or latest_score.score or 0
            
            # Determiner le niveau (banding)
            if score_value >= 900:
                level = 'A'
            elif score_value >= 750:
                level = 'B'
            elif score_value >= 600:
                level = 'C'
            elif score_value >= 400:
                level = 'D'
            else:
                level = 'E'
            
            # Calculer revenus moyens (simulation - a remplacer par vraies donnees)
            avg_income = latest_score.revenus or 250000
            
            # Calculer CRM
            crm = avg_income * 0.30
            max_loan = crm * duration * 0.85
            
            # Determiner taux selon niveau
            taux_map = {
                'A': 0.06,  # 6%
                'B': 0.09,  # 9%
                'C': 0.11,  # 11%
                'D': 0.13,  # 13%
                'E': 0.15   # 15%
            }
            taux_annuel = taux_map.get(level, 0.11)
            taux_mensuel = taux_annuel / 12
            
            # Calculer mensualite avec interets
            if taux_mensuel > 0:
                monthly_payment = amount * (taux_mensuel * (1 + taux_mensuel)**duration) / ((1 + taux_mensuel)**duration - 1)
            else:
                monthly_payment = amount / duration
            
            total_cost = monthly_payment * duration
            total_interest = total_cost - amount
            
            # Verifier faisabilite
            is_feasible = amount <= max_loan and monthly_payment <= crm
            crm_used_percent = int((monthly_payment / crm * 100)) if crm > 0 else 100
            
            # Scenarios alternatifs
            alternative_scenarios = []
            
            # Scenario 1 : Duree optimale pour ce montant
            if amount > 0:
                optimal_duration = int((amount / 0.85) / crm) + 1
                if optimal_duration != duration and optimal_duration <= 24:
                    optimal_monthly = amount * (taux_mensuel * (1 + taux_mensuel)**optimal_duration) / ((1 + taux_mensuel)**optimal_duration - 1) if taux_mensuel > 0 else amount / optimal_duration
                    alternative_scenarios.append({
                        'label': f'Duree optimale ({optimal_duration} mois)',
                        'duration': optimal_duration,
                        'amount': amount,
                        'monthly_payment': round(optimal_monthly, 0),
                        'total_cost': round(optimal_monthly * optimal_duration, 0),
                        'is_feasible': optimal_monthly <= crm
                    })
            
            # Scenario 2 : Montant max pour cette duree
            if max_loan > 0 and abs(max_loan - amount) > 10000:
                max_monthly = max_loan * (taux_mensuel * (1 + taux_mensuel)**duration) / ((1 + taux_mensuel)**duration - 1) if taux_mensuel > 0 else max_loan / duration
                alternative_scenarios.append({
                    'label': f'Montant maximum ({duration} mois)',
                    'duration': duration,
                    'amount': round(max_loan, 0),
                    'monthly_payment': round(max_monthly, 0),
                    'total_cost': round(max_monthly * duration, 0),
                    'is_feasible': True
                })
            
            # Scenario 3 : Duree plus courte (si possible)
            if duration > 6:
                shorter_duration = max(3, duration - 6)
                shorter_monthly = amount * (taux_mensuel * (1 + taux_mensuel)**shorter_duration) / ((1 + taux_mensuel)**shorter_duration - 1) if taux_mensuel > 0 else amount / shorter_duration
                alternative_scenarios.append({
                    'label': f'Duree reduite ({shorter_duration} mois)',
                    'duration': shorter_duration,
                    'amount': amount,
                    'monthly_payment': round(shorter_monthly, 0),
                    'total_cost': round(shorter_monthly * shorter_duration, 0),
                    'is_feasible': shorter_monthly <= crm and amount <= (crm * shorter_duration * 0.85)
                })
            
            # Warnings
            warnings = []
            
            if not is_feasible:
                warnings.append({
                    'type': 'error',
                    'message': 'Montant trop eleve pour votre CRM actuel'
                })
            
            if crm_used_percent > 80:
                warnings.append({
                    'type': 'warning',
                    'message': 'Mensualite elevee (>80% du CRM). Risque de difficulte de remboursement.'
                })
            elif crm_used_percent > 50:
                warnings.append({
                    'type': 'info',
                    'message': 'Mensualite moderee. Assurez-vous de conserver une marge de securite.'
                })
            
            if level in ['D', 'E']:
                warnings.append({
                    'type': 'info',
                    'message': 'Ameliorez votre score pour acceder a de meilleurs taux.'
                })
            
            return Response({
                'is_feasible': is_feasible,
                'amount': round(amount, 0),
                'duration': duration,
                'monthly_payment': round(monthly_payment, 0),
                'total_cost': round(total_cost, 0),
                'total_interest': round(total_interest, 0),
                'interest_rate': f"{int(taux_annuel * 100)}%",
                'score_level': level,
                'score_value': score_value,
                'crm_available': round(crm, 0),
                'crm_used': round(monthly_payment, 0),
                'crm_used_percent': crm_used_percent,
                'max_loan_for_duration': round(max_loan, 0),
                'avg_income': round(avg_income, 0),
                'alternative_scenarios': alternative_scenarios,
                'warnings': warnings
            })
            
        except Exception as e:
            import logging
            logger = logging.getLogger('scoring')
            logger.error(f"Erreur simulation: {e}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================
# ✅ NOUVEAU - CALCULATEUR SCORE MANUEL
# ============================================

class ComputeScoreView(APIView):
    """
    POST /api/scoring/user/compute/ - Calcule le score TERAS à partir des valeurs de piliers
    
    Body: {
        "transactions": 150,
        "epargne": 75,
        "revenus": 100,
        "actifs": 75,
        "social": 100
    }
    
    Returns: {
        "score": 500,
        "breakdown": {"T": 150, "E": 75, "R": 100, "A": 75, "S": 100},
        "level": "D",
        "level_display": "Cuivre"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Récupérer et valider les piliers
            data = request.data
            
            piliers = {
                'transactions': int(data.get('transactions', 0)),
                'epargne': int(data.get('epargne', 0)),
                'revenus': int(data.get('revenus', 0)),
                'actifs': int(data.get('actifs', 0)),
                'social': int(data.get('social', 0))
            }
            
            # Valider les limites
            if not (0 <= piliers['transactions'] <= 300):
                return Response(
                    {'error': 'Transactions doit être entre 0 et 300'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not (0 <= piliers['epargne'] <= 150):
                return Response(
                    {'error': 'Épargne doit être entre 0 et 150'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not (0 <= piliers['revenus'] <= 200):
                return Response(
                    {'error': 'Revenus doit être entre 0 et 200'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not (0 <= piliers['actifs'] <= 150):
                return Response(
                    {'error': 'Actifs doit être entre 0 et 150'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not (0 <= piliers['social'] <= 200):
                return Response(
                    {'error': 'Social doit être entre 0 et 200'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculer le score total
            score_total = sum(piliers.values())
            
            # Déterminer le niveau
            if score_total >= 900:
                level = 'A'
                level_display = 'Or'
                db_level = 'diamant'
            elif score_total >= 750:
                level = 'B'
                level_display = 'Argent'
                db_level = 'or'
            elif score_total >= 600:
                level = 'C'
                level_display = 'Bronze'
                db_level = 'argent'
            elif score_total >= 400:
                level = 'D'
                level_display = 'Cuivre'
                db_level = 'bronze'
            else:
                level = 'E'
                level_display = 'Fer'
                db_level = 'debutant'
            
            # Créer le breakdown
            breakdown = {
                'T': piliers['transactions'],
                'E': piliers['epargne'],
                'R': piliers['revenus'],
                'A': piliers['actifs'],
                'S': piliers['social']
            }
            
            # Sauvegarder dans TerasScore (convertir sur échelle 0-100)
            teras_score = TerasScore.objects.create(
                user=request.user,
                score=score_total,
                level=db_level,
                transactions_score=int(piliers['transactions'] / 3),  # 300 → 100
                savings_score=int(piliers['epargne'] / 1.5),  # 150 → 100
                income_score=int(piliers['revenus'] / 2),  # 200 → 100
                assets_score=int(piliers['actifs'] / 1.5),  # 150 → 100
                social_score=int(piliers['social'] / 2),  # 200 → 100
                model_version='manual-compute-1.0'
            )
            
            import logging
            logger = logging.getLogger('scoring')
            logger.info(f'Score calculé manuellement pour {request.user.email}: {score_total} (niveau {level})')
            
            return Response({
                'score': score_total,
                'breakdown': breakdown,
                'profile_type': 'basic',
                'level': level,
                'level_display': level_display,
                'history_id': teras_score.id,
                'created_at': teras_score.created_at.isoformat()
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(
                {'error': f'Valeurs invalides: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import logging
            logger = logging.getLogger('scoring')
            logger.error(f'Erreur compute_score: {e}', exc_info=True)
            return Response(
                {'error': f'Erreur lors du calcul: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


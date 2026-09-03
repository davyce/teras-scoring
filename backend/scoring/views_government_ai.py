# backend/scoring/views_government_ai.py
"""
IA Gouvernementale TERAS — Rapports & Chat Adaptatif
- Rapports IA enrichis avec données réelles CEMAC via ai-context
- Chat pédagogique adaptatif : détecte quand son Excellence a du mal à comprendre
  et adapte automatiquement son niveau d'explication
"""
import os
import json
import requests
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import StreamingHttpResponse

ANTHROPIC_HEADERS = {
    "x-api-key":         os.environ.get("ANTHROPIC_API_KEY", ""),
    "content-type":      "application/json",
    "anthropic-version": "2023-06-01",
}
CLAUDE_MODEL = "claude-sonnet-4-20250514"


# ─────────────────────────────────────────────────────────────────────────────
# Helper : récupérer le contexte réel CEMAC
# ─────────────────────────────────────────────────────────────────────────────

def _get_real_context(user) -> dict:
    """Agrège les vraies données TERAS pour enrichir le prompt IA."""
    try:
        from django.db.models import Avg, Sum, Count, Q
        from scoring.models_bank import BankEnterprise, BankClient, LoanApplication

        user_country = getattr(user, 'country', None) or 'CG'

        # Données du pays de l'utilisateur
        ents  = BankEnterprise.objects.filter(country=user_country)
        inds  = BankClient.objects.filter(country=user_country)
        loans = LoanApplication.objects.filter(
            Q(enterprise__country=user_country) | Q(client__country=user_country)
        )

        # CEMAC global
        all_ents = BankEnterprise.objects.all()

        # Top 5 secteurs
        sector_counts = {}
        for e in ents:
            s = e.sector or 'non classifié'
            sector_counts[s] = sector_counts.get(s, 0) + 1
        top_sectors = sorted(sector_counts.items(), key=lambda x: -x[1])[:5]

        # Top 5 entreprises
        top_ents = list(
            ents.filter(teras_score__isnull=False)
            .order_by('-teras_score')
            .values('name', 'sector', 'city', 'teras_score', 'annual_revenue', 'employees_count')[:5]
        )

        # Alertes (score < 500)
        at_risk = ents.filter(teras_score__lt=500, status='active').count()

        from scoring.views_government_data import CEMAC_COUNTRIES
        country_name = CEMAC_COUNTRIES.get(user_country, {}).get('name', user_country)

        # ── Scores TERAS individuels (TerasScore model) ─────────────────────
        from django.contrib.auth import get_user_model
        from scoring.models import TerasScore
        User = get_user_model()

        # Individus TERAS (CustomUser type=individual)
        teras_individuals = User.objects.filter(user_type='individual', country=user_country)
        teras_scores = TerasScore.objects.filter(user__country=user_country)

        # Distribution des scores individuels
        score_dist = {'A':0,'B':0,'C':0,'D':0,'E':0}
        score_values = list(teras_scores.values_list('score', flat=True))
        for v in score_values:
            if v >= 900: score_dist['A'] += 1
            elif v >= 750: score_dist['B'] += 1
            elif v >= 600: score_dist['C'] += 1
            elif v >= 400: score_dist['D'] += 1
            else: score_dist['E'] += 1

        avg_individual_score = round(sum(score_values) / len(score_values)) if score_values else 0

        # Revenus individuels depuis BankClient
        income_total = float(inds.aggregate(total=Sum('monthly_income'))['total'] or 0) * 12
        income_avg   = float(inds.filter(monthly_income__isnull=False).aggregate(avg=Avg('monthly_income'))['avg'] or 0)

        # Villes les plus représentées
        city_counts = {}
        for e in ents:
            c = e.city or 'Inconnue'
            city_counts[c] = city_counts.get(c, 0) + 1
        top_cities = sorted(city_counts.items(), key=lambda x: -x[1])[:5]

        # Revenus par secteur
        sector_revenue = {}
        for e in ents:
            s = e.sector or 'Autre'
            sector_revenue[s] = sector_revenue.get(s, 0) + float(e.annual_revenue or 0)
        top_sector_revenue = sorted(sector_revenue.items(), key=lambda x: -x[1])[:5]

        # Volume crédit CEMAC complet
        all_loans = LoanApplication.objects.all()
        volume_total_all  = float(all_loans.aggregate(total=Sum('requested_amount'))['total'] or 0)
        volume_active_all = float(all_loans.filter(status='disbursed').aggregate(total=Sum('requested_amount'))['total'] or 0)

        # Prêts par statut
        loan_by_status = {}
        for l in all_loans.values('status').annotate(count=Count('id')):
            loan_by_status[l['status']] = l['count']

        # Individus à risque (score < 500)
        ind_at_risk = teras_scores.filter(score__lt=500).count()
        ind_excellent = teras_scores.filter(score__gte=750).count()

        return {
            'pays':          country_name,
            'code_pays':     user_country,
            'date':          timezone.now().strftime('%d %B %Y'),
            'national': {
                # Entreprises
                'entreprises':           ents.count(),
                'entreprises_actives':   ents.filter(status='active').count(),
                'entreprises_a_risque':  at_risk,
                'score_moyen_ent':       round(float(ents.filter(teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0)),
                'ca_total_fcfa':         float(ents.aggregate(total=Sum('annual_revenue'))['total'] or 0),
                'ca_annuel_moyen_fcfa':  float(ents.filter(annual_revenue__isnull=False).aggregate(avg=Avg('annual_revenue'))['avg'] or 0),
                'emplois_formels':       ents.aggregate(total=Sum('employees_count'))['total'] or 0,
                'emplois_moy_par_ent':   round(float(ents.filter(employees_count__isnull=False).aggregate(avg=Avg('employees_count'))['avg'] or 0)),
                # Individus / clients
                'individus_teras':       teras_individuals.count(),
                'clients_banque':        inds.count(),
                'score_moyen_ind':       avg_individual_score,
                'individus_a_risque':    ind_at_risk,
                'individus_excellent':   ind_excellent,
                'revenu_annuel_total_fcfa': income_total,
                'revenu_mensuel_moyen_fcfa': round(income_avg),
                # Crédit
                'credits_total':         loans.count(),
                'credits_actifs':        loans.filter(status='disbursed').count(),
                'credits_en_attente':    loans.filter(status='pending').count(),
                'volume_credit_fcfa':    float(loans.filter(status='disbursed').aggregate(total=Sum('requested_amount'))['total'] or 0),
                'taux_approbation':      round(loans.filter(status__in=['approved','disbursed']).count() / max(loans.count(), 1) * 100, 1),
                # Distribution scores
                'distribution_scores':   score_dist,
                'taux_bonne_solvabilite': round((score_dist['A'] + score_dist['B']) / max(sum(score_dist.values()), 1) * 100, 1),
                # Géographie
                'top_villes':            [{'ville': v, 'nb': c} for v, c in top_cities],
                # Secteurs
                'top_secteurs':          [{'secteur': s, 'nb': c} for s, c in top_sectors],
                'top_secteurs_revenue':  [{'secteur': s, 'ca': round(r)} for s, r in top_sector_revenue],
                # Top entreprises
                'top_entreprises':       [
                    {
                        'nom':     e['name'],
                        'secteur': e['sector'],
                        'ville':   e['city'],
                        'score':   e['teras_score'],
                        'ca':      int(e['annual_revenue'] or 0),
                        'emplois': e['employees_count'] or 0,
                    }
                    for e in top_ents
                ],
            },
            'cemac': {
                'entreprises_total':     all_ents.count(),
                'ca_total_fcfa':         float(all_ents.aggregate(total=Sum('annual_revenue'))['total'] or 0),
                'emplois_total':         all_ents.aggregate(total=Sum('employees_count'))['total'] or 0,
                'score_moyen':           round(float(all_ents.filter(teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0)),
                'credits_total':         all_loans.count(),
                'volume_credit_total_fcfa': volume_total_all,
                'volume_credit_actif_fcfa': volume_active_all,
                'prets_par_statut':      loan_by_status,
                'par_pays':              {
                    code: {
                        'entreprises': all_ents.filter(country=code).count(),
                        'ca_fcfa':     float(all_ents.filter(country=code).aggregate(total=Sum('annual_revenue'))['total'] or 0),
                        'emplois':     all_ents.filter(country=code).aggregate(total=Sum('employees_count'))['total'] or 0,
                        'score_moyen': round(float(all_ents.filter(country=code, teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0)),
                    }
                    for code in ['CG','CM','GA','CF','TD','GQ']
                },
            },
        }
    except Exception as e:
        return {'erreur': str(e), 'pays': 'Congo Brazzaville', 'date': timezone.now().strftime('%d %B %Y')}


def _build_system_prompt(ctx: dict, report_type: str = 'general') -> str:
    """Construit le system prompt enrichi avec les vraies données."""
    national = ctx.get('national', {})
    cemac    = ctx.get('cemac', {})
    pays     = ctx.get('pays', 'Congo Brazzaville')

    top_ents_str = ""
    for i, e in enumerate(national.get('top_entreprises', []), 1):
        ca_md = e['ca'] / 1_000_000_000 if e['ca'] >= 1_000_000_000 else e['ca'] / 1_000_000
        unite = "Md" if e['ca'] >= 1_000_000_000 else "M"
        top_ents_str += f"\n  {i}. {e['nom']} ({e['secteur']}) — Score: {e['score']} — CA: {ca_md:.1f}{unite} FCFA — {e['emplois']} emplois"

    top_sect_str = ", ".join([f"{s['secteur']} ({s['nb']} entr.)" for s in national.get('top_secteurs', [])])

    ca_nat_md   = national.get('ca_total_fcfa', 0) / 1_000_000_000
    ca_cemac_md = cemac.get('ca_total_fcfa', 0) / 1_000_000_000
    part_cemac  = round((national.get('ca_total_fcfa', 0) / max(cemac.get('ca_total_fcfa', 1), 1)) * 100, 1)

    return f"""Tu es TERAS-GOV, l'assistant IA officiel du gouvernement de {pays} pour l'analyse économique et le système de scoring TERAS.

════════════════════════════════════════════
DONNÉES RÉELLES DU PAYS AU {ctx.get('date', 'aujourd\'hui')}
════════════════════════════════════════════

🏢 ENTREPRISES NATIONALES :
  • Total enregistrées : {national.get('entreprises', 0)}
  • Entreprises actives : {national.get('entreprises_actives', 0)}
  • Score TERAS moyen : {national.get('score_moyen_ent', 0)}/1000
  • CA national agrégé : {ca_nat_md:.1f} Md FCFA
  • Emplois formels déclarés : {national.get('emplois_formels', 0):,}
  • Entreprises à risque (score < 500) : {national.get('entreprises_a_risque', 0)}

👤 INDIVIDUS :
  • Total enregistrés : {national.get('individus', 0)}
  • Score TERAS moyen : {national.get('score_moyen_ind', 0)}/1000

💳 CRÉDITS :
  • Total demandes : {national.get('credits_total', 0)}
  • Crédits actifs : {national.get('credits_actifs', 0)}
  • Volume décaissé : {national.get('volume_credit_fcfa', 0)/1_000_000:.1f} M FCFA
  • Taux d'approbation : {national.get('taux_approbation', 0)}%

📊 SECTEURS DOMINANTS : {top_sect_str or 'Données en cours de collecte'}

🏆 TOP ENTREPRISES :{top_ents_str or '\n  Données en cours de collecte'}

🌍 ZONE CEMAC (comparatif) :
  • {pays} représente {part_cemac}% du CA de la zone CEMAC
  • CA total CEMAC : {ca_cemac_md:.1f} Md FCFA
  • Emplois CEMAC : {cemac.get('emplois_total', 0):,}

════════════════════════════════════════════
RÔLE ET COMPORTEMENT
════════════════════════════════════════════

Tu conseilles Son Excellence et son équipe gouvernementale. Tes analyses doivent :

1. TOUJOURS utiliser les données réelles ci-dessus (jamais de chiffres inventés)
2. Formuler des recommandations de politique économique concrètes et applicables
3. Comparer avec la zone CEMAC quand c'est pertinent
4. Utiliser des termes officiels adaptés au niveau ministériel
5. Structurer tes réponses clairement (titres, chiffres clés, recommandations)

ADAPTATION PÉDAGOGIQUE (IMPORTANT) :
Si Son Excellence ou son équipe demande "pouvez-vous expliquer plus simplement", 
"je ne comprends pas bien", "donnez-moi un exemple concret", ou si tu détectes 
dans le contexte de la conversation qu'un concept n'est pas bien assimilé après 
tes explications :
→ Passe automatiquement en mode PÉDAGOGIQUE :
  - Explique comme à quelqu'un qui découvre le sujet
  - Utilise des analogies de la vie quotidienne congolaise (marché, tontine, moto-taxi, plantation...)
  - Donne des exemples chiffrés simples et concrets
  - Évite le jargon technique sans l'expliquer
  - Utilise la métaphore "Imaginez que..." pour illustrer
  - Valide la compréhension en fin d'explication

TYPE DE RAPPORT : {report_type}
Langue : Français officiel, ton respectueux et professionnel."""


# ─────────────────────────────────────────────────────────────────────────────
# 1. Génération de rapport IA enrichi (streaming SSE)
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def government_report_generate_enriched(request):
    """
    POST /api/scoring/government/reports/generate-enriched/
    Génère un rapport IA avec les vraies données CEMAC en streaming SSE.
    """
    report_type   = request.data.get('report_type', 'economic_overview')
    custom_prompt = request.data.get('custom_prompt', '')
    period        = request.data.get('period', 'Q2 2026')

    # Contexte réel
    ctx = _get_real_context(request.user)

    REPORT_TEMPLATES = {
        'economic_overview': f"""Génère un rapport économique complet pour {ctx.get('pays')} pour la période {period}.

Structure requise :
1. SYNTHÈSE EXÉCUTIVE (3-4 phrases clés avec les vrais chiffres)
2. ÉTAT DU TISSU ENTREPRENEURIAL (analyse des {ctx.get('national',{}).get('entreprises',0)} entreprises enregistrées)
3. PERFORMANCE PAR SECTEUR (commentaire des secteurs dominants avec données réelles)
4. ANALYSE DU CRÉDIT (volume, approbation, risques)
5. POSITIONNEMENT CEMAC (comparaison avec la zone)
6. ALERTES ET RISQUES (entreprises score < 500)
7. RECOMMANDATIONS POLITIQUES (5 recommandations concrètes et applicables immédiatement)
8. CONCLUSION

Utilise UNIQUEMENT les données fournies dans ton contexte. Sois précis et officiel.""",

        'fiscal_compliance': f"""Génère un rapport de conformité fiscale et d'alerte économique pour {ctx.get('pays')}.

Analyse spécifique :
1. ÉTAT DE LA CONFORMITÉ FISCALE VIA SCORE TERAS
2. ENTREPRISES À SURVEILLER ({ctx.get('national',{}).get('entreprises_a_risque',0)} entreprises score < 500)
3. RISQUES POUR LES FINANCES PUBLIQUES
4. SECTEURS À HAUT RISQUE DE NON-CONFORMITÉ
5. MESURES CORRECTIVES RECOMMANDÉES
6. PLAN D'ACTION 90 JOURS

Base-toi sur les données réelles TERAS.""",

        'employment': f"""Génère un rapport sur l'emploi formel au {ctx.get('pays')}.

Analyse :
1. ÉTAT DE L'EMPLOI FORMEL ({ctx.get('national',{}).get('emplois_formels',0)} emplois déclarés)
2. RÉPARTITION SECTORIELLE DE L'EMPLOI
3. QUALITÉ DES EMPLOIS (stabilité via score TERAS des employeurs)
4. COMPARAISON CEMAC ({ctx.get('cemac',{}).get('emplois_total',0)} emplois zone CEMAC)
5. POLITIQUES DE CRÉATION D'EMPLOI RECOMMANDÉES
6. INDICATEURS À SUIVRE""",

        'credit_inclusion': f"""Rapport sur l'inclusion financière et le crédit au {ctx.get('pays')}.

Analyse :
1. ACCÈS AU CRÉDIT ({ctx.get('national',{}).get('credits_actifs',0)} crédits actifs)
2. TAUX D'APPROBATION ({ctx.get('national',{}).get('taux_approbation',0)}%) — comparaison CEMAC
3. INCLUSION FINANCIÈRE DES INDIVIDUS ET PME
4. BARRIÈRES À L'ACCÈS AU CRÉDIT
5. RECOMMANDATIONS POUR AMÉLIORER L'INCLUSION
6. RÔLE DE TERAS DANS LA DÉMOCRATISATION DU CRÉDIT""",

        'cemac_positioning': f"""Rapport de positionnement du {ctx.get('pays')} dans la zone CEMAC.

Analyse :
1. PART DU {ctx.get('pays')} DANS L'ÉCONOMIE CEMAC
2. AVANTAGES COMPÉTITIFS NATIONAUX
3. SECTEURS OÙ {ctx.get('pays').upper()} SE DISTINGUE
4. LACUNES ET RETARDS À COMBLER
5. OPPORTUNITÉS D'INTÉGRATION RÉGIONALE
6. STRATÉGIE DE RENFORCEMENT DU POSITIONNEMENT CEMAC""",

        'custom': custom_prompt or "Génère une analyse économique générale basée sur les données disponibles.",
    }

    user_prompt = REPORT_TEMPLATES.get(report_type, REPORT_TEMPLATES['custom'])
    system_prompt = _build_system_prompt(ctx, report_type)

    def stream():
        try:
            resp = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers=ANTHROPIC_HEADERS,
                json={
                    "model":      CLAUDE_MODEL,
                    "max_tokens": 4000,
                    "stream":     True,
                    "system":     system_prompt,
                    "messages":   [{"role": "user", "content": user_prompt}],
                },
                stream=True, timeout=120,
            )
            for line in resp.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        data_str = line_str[6:]
                        if data_str == '[DONE]':
                            yield "data: [DONE]\n\n"
                            break
                        try:
                            data = json.loads(data_str)
                            if data.get('type') == 'content_block_delta':
                                text = data.get('delta', {}).get('text', '')
                                if text:
                                    yield f"data: {json.dumps({'text': text})}\n\n"
                        except json.JSONDecodeError:
                            pass
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    response = StreamingHttpResponse(stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


# ─────────────────────────────────────────────────────────────────────────────
# 2. Chat IA pédagogique adaptatif pour le gouvernement
# ─────────────────────────────────────────────────────────────────────────────

# Mots-clés qui déclenchent le mode pédagogique
PEDAGOGIC_TRIGGERS = [
    "je ne comprends pas", "expliquez", "plus simplement", "exemple concret",
    "c'est quoi", "qu'est-ce que", "je ne suis pas sûr", "pouvez-vous clarifier",
    "en termes simples", "pour les nuls", "simplifier", "vulgariser",
    "comment ça fonctionne", "donnez-moi un exemple", "illustrez",
    "je ne vois pas", "ce n'est pas clair", "je ne saisis pas",
    "expliquer autrement", "de façon simple",
]

def _detect_pedagogic_need(message: str, history: list) -> bool:
    """Détecte si l'utilisateur a besoin d'une explication plus pédagogique."""
    msg_lower = message.lower()
    # Vérifier si le message contient un trigger
    if any(t in msg_lower for t in PEDAGOGIC_TRIGGERS):
        return True
    # Vérifier si c'est la 2e ou 3e fois qu'il pose la même question (incompréhension implicite)
    if len(history) >= 4:
        recent_user_msgs = [m['content'].lower() for m in history[-4:] if m.get('role') == 'user']
        # Mots similaires répétés = incompréhension
        if len(recent_user_msgs) >= 2:
            words_last = set(recent_user_msgs[-1].split())
            words_prev = set(recent_user_msgs[-2].split()) if len(recent_user_msgs) > 1 else set()
            overlap = words_last & words_prev - {'le','la','les','de','du','et','en','un','une','que','qui','je','vous','nous'}
            if len(overlap) > 3:  # Beaucoup de mots en commun = même sujet, toujours pas compris
                return True
    return False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def government_ai_chat_enriched(request):
    """
    POST /api/scoring/government/ai-chat/
    Chat IA pédagogique adaptatif avec données réelles CEMAC.
    """
    message  = request.data.get('message', '').strip()
    history  = request.data.get('history', [])  # [{role, content}]
    is_streaming = request.data.get('stream', True)

    if not message:
        return Response({'error': 'Message vide'}, status=400)

    # Contexte réel
    ctx = _get_real_context(request.user)

    # Détecter si mode pédagogique nécessaire
    pedagogic_mode = _detect_pedagogic_need(message, history)

    # System prompt adaptatif
    base_prompt = _build_system_prompt(ctx, 'chat')

    if pedagogic_mode:
        pedagogic_addition = """

⚠️ MODE PÉDAGOGIQUE ACTIVÉ ⚠️
Son Excellence ou son équipe semble avoir besoin d'une explication plus claire.
RÈGLES IMPÉRATIVES pour cette réponse :
• Commence par : "Permettez-moi de vous expliquer cela de façon très concrète..."
• Utilise des analogies de la vie quotidienne (marché de Brazzaville, tontine de quartier, vendeur de légumes, chauffeur de taxi...)
• Structure : 1) Explication simple 2) Exemple concret avec des chiffres faciles 3) Application au cas réel du Congo
• Maximum 3 concepts nouveaux par réponse
• Valide la compréhension en fin de réponse avec une question douce
• Évite TOUT jargon sans l'expliquer immédiatement après"""
        system_prompt = base_prompt + pedagogic_addition
    else:
        system_prompt = base_prompt

    # Construire les messages
    messages = []
    for h in history[-10:]:  # 10 derniers messages max
        if h.get('role') in ('user', 'assistant') and h.get('content'):
            messages.append({'role': h['role'], 'content': h['content']})
    messages.append({'role': 'user', 'content': message})

    if is_streaming:
        def stream():
            try:
                resp = requests.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=ANTHROPIC_HEADERS,
                    json={
                        "model":      CLAUDE_MODEL,
                        "max_tokens": 2000,
                        "stream":     True,
                        "system":     system_prompt,
                        "messages":   messages,
                    },
                    stream=True, timeout=60,
                )
                for line in resp.iter_lines():
                    if line:
                        line_str = line.decode('utf-8')
                        if line_str.startswith('data: '):
                            data_str = line_str[6:]
                            if data_str == '[DONE]':
                                yield f"data: {json.dumps({'pedagogic_mode': pedagogic_mode, 'done': True})}\n\n"
                                break
                            try:
                                data = json.loads(data_str)
                                if data.get('type') == 'content_block_delta':
                                    text = data.get('delta', {}).get('text', '')
                                    if text:
                                        yield f"data: {json.dumps({'text': text, 'pedagogic_mode': pedagogic_mode})}\n\n"
                            except json.JSONDecodeError:
                                pass
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        response = StreamingHttpResponse(stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
    else:
        # Mode non-streaming
        try:
            resp = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers=ANTHROPIC_HEADERS,
                json={
                    "model":      CLAUDE_MODEL,
                    "max_tokens": 2000,
                    "system":     system_prompt,
                    "messages":   messages,
                },
                timeout=60,
            )
            data = resp.json()
            text = data.get('content', [{}])[0].get('text', '')
            return Response({'response': text, 'pedagogic_mode': pedagogic_mode})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

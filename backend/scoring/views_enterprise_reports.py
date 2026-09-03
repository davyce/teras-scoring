"""
TERAS — Enterprise Reports IA
views_enterprise_reports.py
"""

import json
import os
import requests
from datetime import datetime
from django.http import StreamingHttpResponse, HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.enums import TA_CENTER
    from io import BytesIO
    REPORTLAB_OK = True
except ImportError:
    REPORTLAB_OK = False

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_BASE    = "https://api.anthropic.com/v1"
CLAUDE_MODEL      = "claude-sonnet-4-20250514"
ANTHROPIC_HEADERS = {
    "x-api-key":         ANTHROPIC_API_KEY,
    "content-type":      "application/json",
    "anthropic-version": "2023-06-01",
}

REPORT_TYPES = {
    "teras_complet":           {"label": "Rapport TERAS Complet",        "duration": "2-3 min"},
    "analyse_financiere":      {"label": "Analyse Financière",            "duration": "3-5 min"},
    "rapport_rh":              {"label": "Rapport RH",                    "duration": "2-3 min"},
    "conformite_reglementaire":{"label": "Conformité Réglementaire",      "duration": "1-2 min"},
    "strategie_croissance":    {"label": "Stratégie de Croissance",       "duration": "3-4 min"},
}


def _get_enterprise_context(user):
    ctx = {
        "company_name":    getattr(user, "company_name", None) or user.get_full_name() or user.email,
        "email":           user.email,
        "sector":          getattr(user, "sector", "Non défini") or "Non défini",
        "employees_count": getattr(user, "employees_count", 0) or 0,
        "country":         getattr(user, "country", "Congo") or "Congo",
        "city":            getattr(user, "city", "Brazzaville") or "Brazzaville",
        "teras_score":     None,
        "score_band":      "N/A",
        "score_breakdown": {},
        "revenue_avg":     None,
        "compliance_rate": None,
    }
    return ctx


def _build_system_prompt(report_type, ctx):
    company = ctx["company_name"]
    sector  = ctx["sector"]
    score   = ctx["teras_score"]
    score_txt = f"{score}/1000" if score else "Non encore calculé"

    base = f"""Tu es TERAS IA, expert en analyse financière pour les entreprises CEMAC.
Tu analyses l'entreprise {company} dans le secteur {sector} au {ctx['country']}.

DONNÉES : Score TERAS: {score_txt} | Employés: {ctx['employees_count']} | Ville: {ctx['city']}

INSTRUCTIONS:
- Rédige en français, ton professionnel
- Utilise ## pour les titres, ### pour les sous-titres
- Fournis des chiffres en FCFA quand possible
- Cite OHADA et CEMAC quand pertinent
- Structure: Synthèse → Analyse → Points d'Attention → Recommandations
- Longueur: 600-900 mots
"""

    specifics = {
        "teras_complet":            "Analyse chaque pilier T/E/R/A/S, compare aux benchmarks CEMAC, identifie les 3 leviers d'amélioration.",
        "analyse_financiere":       "Analyse liquidité, solvabilité, rentabilité, flux de trésorerie et CRM (30% revenus nets).",
        "rapport_rh":               "Analyse effectifs, conformité sociale CNSS, turnover, formation, recommandations RH CEMAC.",
        "conformite_reglementaire": "Vérifie conformité OHADA, obligations fiscales DGI/DGD Congo, liste les actions urgentes.",
        "strategie_croissance":     "Opportunités marché CEMAC (6 pays), feuille de route 12-24 mois, intégration ZOLA/ZONE.",
    }
    return base + "\nFOCUS: " + specifics.get(report_type, "")


def _call_claude_streaming(system_prompt, user_message):
    payload = {
        "model":      CLAUDE_MODEL,
        "max_tokens": 2000,
        "stream":     True,
        "system":     system_prompt,
        "messages":   [{"role": "user", "content": user_message}],
    }
    try:
        with requests.post(
            f"{ANTHROPIC_BASE}/messages",
            headers=ANTHROPIC_HEADERS,
            json=payload,
            stream=True,
            timeout=120,
        ) as resp:
            if resp.status_code != 200:
                yield json.dumps({"text": f"Erreur API: {resp.status_code}"})
                return
            for line in resp.iter_lines():
                if not line:
                    continue
                line = line.decode("utf-8") if isinstance(line, bytes) else line
                if line.startswith("data: "):
                    raw = line[6:]
                    if raw == "[DONE]":
                        return
                    try:
                        evt = json.loads(raw)
                        if evt.get("type") == "content_block_delta":
                            text = evt.get("delta", {}).get("text", "")
                            if text:
                                yield json.dumps({"text": text})
                    except Exception:
                        continue
    except Exception as e:
        yield json.dumps({"text": f"Erreur connexion: {e}"})


def _call_claude_sync(system_prompt, user_message):
    payload = {
        "model":      CLAUDE_MODEL,
        "max_tokens": 2000,
        "system":     system_prompt,
        "messages":   [{"role": "user", "content": user_message}],
    }
    try:
        resp = requests.post(
            f"{ANTHROPIC_BASE}/messages",
            headers=ANTHROPIC_HEADERS,
            json=payload,
            timeout=120,
        )
        if resp.status_code != 200:
            return f"Erreur API: {resp.status_code}"
        return resp.json().get("content", [{}])[0].get("text", "")
    except Exception as e:
        return f"Erreur: {e}"


def _save_report(user_id, report_type, content, meta):
    try:
        from scoring.models_enterprise import EnterpriseReport
        from users.models import CustomUser
        user = CustomUser.objects.get(id=user_id)
        today = timezone.now().date()
        r = EnterpriseReport.objects.create(
            enterprise=user,
            report_type="custom",
            title=meta["label"],
            period_start=today,
            period_end=today,
            status="ready",
            report_data={"ai_type": report_type, "content": content[:500], "full_content": content},
        )
        print(f"SAVED report id={r.id} user={user.email} chars={len(content)}", flush=True)
    except Exception as e:
        import traceback
        print(f"SAVE ERROR: {e}", flush=True)
        print(traceback.format_exc(), flush=True)


class EnterpriseReportAIGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        report_type = request.data.get("report_type", "teras_complet")
        if report_type not in REPORT_TYPES:
            return Response({"error": "Type invalide"}, status=400)

        ctx      = _get_enterprise_context(request.user)
        system   = _build_system_prompt(report_type, ctx)
        meta     = REPORT_TYPES[report_type]
        user_msg = f"Génère le {meta['label']} complet pour {ctx['company_name']}. Date: {datetime.now().strftime('%d/%m/%Y')}."
        user_id  = request.user.id

        def event_stream():
            start_evt = json.dumps({"type": "start", "report_type": report_type, "label": meta["label"]})
            yield f"data: {start_evt}\n\n"
            full_text = []
            for chunk_json in _call_claude_streaming(system, user_msg):
                try:
                    payload = json.loads(chunk_json)
                    if payload.get("text"):
                        full_text.append(payload["text"])
                        yield f"data: {chunk_json}\n\n"
                except Exception:
                    pass
            # Sauvegarde après fin du stream
            final = "".join(full_text)
            print(f"STREAM DONE: {len(final)} chars", flush=True)
            _save_report(user_id, report_type, final, meta)
            done_evt = json.dumps({"type": "done"})
            yield f"data: {done_evt}\n\n"

        return StreamingHttpResponse(
            event_stream(),
            content_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )


class EnterpriseReportAIExportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not REPORTLAB_OK:
            return Response({"error": "ReportLab non installé"}, status=500)

        report_type = request.data.get("report_type", "teras_complet")
        content     = request.data.get("content", "")
        ctx         = _get_enterprise_context(request.user)
        meta        = REPORT_TYPES.get(report_type, REPORT_TYPES["teras_complet"])

        if not content:
            system   = _build_system_prompt(report_type, ctx)
            user_msg = f"Génère le {meta['label']} complet pour {ctx['company_name']}."
            content  = _call_claude_sync(system, user_msg)

        buf = BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4,
                                leftMargin=2*cm, rightMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle("T1", parent=styles["Heading1"],
                                     fontSize=18, textColor=colors.HexColor("#0ea5e9"),
                                     spaceAfter=6, fontName="Helvetica-Bold")
        h2_style    = ParagraphStyle("T2", parent=styles["Heading2"],
                                     fontSize=13, textColor=colors.HexColor("#1e293b"),
                                     spaceBefore=12, spaceAfter=4, fontName="Helvetica-Bold")
        h3_style    = ParagraphStyle("T3", parent=styles["Heading3"],
                                     fontSize=11, textColor=colors.HexColor("#334155"),
                                     spaceBefore=8, spaceAfter=2, fontName="Helvetica-Bold")
        body_style  = ParagraphStyle("B", parent=styles["Normal"],
                                     fontSize=10, leading=16,
                                     textColor=colors.HexColor("#1e293b"), spaceAfter=4)
        bullet_style = ParagraphStyle("BL", parent=body_style, leftIndent=14, firstLineIndent=-14)
        footer_style = ParagraphStyle("F", parent=styles["Normal"],
                                      fontSize=8, textColor=colors.HexColor("#94a3b8"),
                                      alignment=TA_CENTER)

        story = []
        story.append(Paragraph("TERAS IA — RAPPORT D'ENTREPRISE", title_style))
        story.append(Paragraph(meta["label"], h2_style))
        company_name = ctx["company_name"] or "Entreprise"
        sector       = ctx["sector"] or "N/A"
        story.append(Paragraph(f"{company_name} • {sector} • {datetime.now().strftime('%d/%m/%Y')}", body_style))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#0ea5e9"), spaceAfter=10))

        for line in content.split("\n"):
            line = line.strip()
            if not line:
                story.append(Spacer(1, 4))
            elif line.startswith("## "):
                story.append(Paragraph(line[3:], h2_style))
            elif line.startswith("### "):
                story.append(Paragraph(line[4:], h3_style))
            elif line.startswith("- ") or line.startswith("• "):
                story.append(Paragraph(f"• {line[2:]}", bullet_style))
            else:
                txt = line.replace("**", "<b>", 1).replace("**", "</b>", 1)
                story.append(Paragraph(txt, body_style))

        story.append(Spacer(1, 20))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0")))
        story.append(Spacer(1, 6))
        story.append(Paragraph(
            f"Généré par TERAS IA le {datetime.now().strftime('%d/%m/%Y à %H:%M')} — Confidentiel",
            footer_style,
        ))

        doc.build(story)
        buf.seek(0)

        company_safe = (ctx["company_name"] or "Entreprise").replace(" ", "_")
        filename = f"TERAS_{report_type}_{company_safe}_{datetime.now().strftime('%Y%m%d')}.pdf"
        response = HttpResponse(buf.read(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class EnterpriseReportAIHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from scoring.models_enterprise import EnterpriseReport
            reports = EnterpriseReport.objects.filter(
                enterprise=request.user
            ).order_by("-generated_at")[:20]
            data = [
                {
                    "id":              r.id,
                    "report_type":     (r.report_data or {}).get("ai_type", r.report_type),
                    "label":           r.title,
                    "generated_at":    r.generated_at.isoformat(),
                    "content_preview": (r.report_data or {}).get("content", "")[:300],
                    "full_content":    (r.report_data or {}).get("full_content", ""),
                }
                for r in reports
            ]
        except Exception as e:
            print(f"HISTORY ERROR: {e}", flush=True)
            data = []
        return Response({"reports": data, "total": len(data)})


class EnterpriseReportAIDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, report_id):
        try:
            from scoring.models_enterprise import EnterpriseReport
            r = EnterpriseReport.objects.get(id=report_id, enterprise=request.user)
            r.delete()
            return Response({"success": True})
        except Exception as e:
            return Response({"error": str(e)}, status=404)


class EnterpriseReportAITypesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"report_types": REPORT_TYPES})
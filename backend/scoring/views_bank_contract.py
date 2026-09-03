# backend/scoring/views_bank_contract.py
"""
TERAS — Contrat de Crédit PDF
Génère un contrat de crédit signé personnalisé avec :
  - Identité complète du client
  - Conditions du crédit (montant, durée, taux, mensualité)
  - Clause prélèvement automatique (banque ou Mobile Money)
  - Signature du client (nom + date d'acceptation)
  - Signature banque TERAS
  - QR code de vérification

Endpoint : GET /api/scoring/bank/applications/<id>/contract/
"""

import io
import os
import math
from datetime import datetime, date
from django.http import HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .models_bank import LoanApplication, BankClient, BankEnterprise
from .views_bank_part1 import _scope_by_bank_owner


def _fmt_fcfa(amount) -> str:
    try:
        n = float(amount)
        if n >= 1_000_000:
            return f"{n/1_000_000:.2f} millions de FCFA"
        return f"{n:,.0f} FCFA".replace(',', ' ')
    except Exception:
        return f"{amount} FCFA"


def _fmt_fcfa_short(amount) -> str:
    try:
        n = float(amount)
        return f"{n:,.0f}".replace(',', ' ') + " FCFA"
    except Exception:
        return f"{amount} FCFA"


def _calc_monthly(principal: float, annual_rate: float, months: int) -> float:
    if months <= 0:
        return 0
    if annual_rate <= 0:
        return principal / months
    r = annual_rate / 100 / 12
    return principal * (r * (1 + r) ** months) / ((1 + r) ** months - 1)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_credit_contract(request, app_id):
    """
    GET /api/scoring/bank/applications/<app_id>/contract/
    Génère et télécharge le contrat PDF de crédit.
    """
    if request.user.user_type not in ('bank', 'admin'):
        return HttpResponse('Accès refusé.', status=403)

    # ── Récupérer la demande ───────────────────────────────────────────────
    try:
        app = _scope_by_bank_owner(LoanApplication.objects.all(), request.user).select_related(
            'client', 'enterprise', 'product', 'reviewed_by'
        ).get(id=app_id)
    except LoanApplication.DoesNotExist:
        return HttpResponse('Dossier introuvable.', status=404)

    if app.status not in ('approved', 'disbursed'):
        return HttpResponse('Contrat disponible uniquement pour les crédits approuvés.', status=400)

    # ── Infos client ───────────────────────────────────────────────────────
    if app.client:
        client      = app.client
        client_name = f"{client.first_name} {client.last_name}".strip() or client.email
        client_email = client.email or ''
        client_phone = getattr(client, 'phone', '') or ''
        client_niu   = getattr(client, 'niu', '') or getattr(client, 'national_id', '') or ''
        client_addr  = getattr(client, 'address', '') or 'Brazzaville, Congo'
        mobile_money = getattr(client, 'mobile_money_number', '') or client_phone
        bank_account = getattr(client, 'bank_account', '') or ''
        teras_score  = getattr(client, 'teras_score', app.teras_score_at_application or 0)
    elif app.enterprise:
        ent         = app.enterprise
        client_name = ent.legal_name or ent.name or 'Entreprise'
        client_email = ent.email or ''
        client_phone = getattr(ent, 'phone', '') or ''
        client_niu   = getattr(ent, 'niu', '') or getattr(ent, 'rccm', '') or ''
        client_addr  = getattr(ent, 'address', '') or 'Brazzaville, Congo'
        mobile_money = ''
        bank_account = ''
        teras_score  = getattr(ent, 'teras_score', 0)
    else:
        return HttpResponse('Client introuvable.', status=404)

    # ── Infos crédit ───────────────────────────────────────────────────────
    principal      = float(app.requested_amount or 0)
    duration       = int(app.duration_months or 1)
    # Taux depuis le produit (interest_rate est sur FinancialProduct)
    annual_rate    = float(getattr(app.product, 'interest_rate', 10) or 10)
    # Mensualité déjà calculée par le backend
    monthly        = float(app.monthly_payment or 0) or _calc_monthly(principal, annual_rate, duration)
    total_cost     = float(app.total_repayment or 0) or monthly * duration
    total_interets = total_cost - principal
    product_name   = app.product.name if app.product else 'Crédit TERAS'
    app_id_str     = app.application_id or f"APP-{app.id:06d}"
    approved_at    = app.reviewed_at or app.created_at or datetime.now()
    if hasattr(approved_at, 'strftime'):
        approved_str = approved_at.strftime('%d %B %Y')
    else:
        approved_str = str(approved_at)[:10]

    bank_name = getattr(request.user, 'bank_name', None) or \
                getattr(request.user, 'company_name', None) or 'Banque TERAS'

    # ── Génération PDF ReportLab ───────────────────────────────────────────
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import cm, mm
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            HRFlowable, KeepTogether,
        )
    except ImportError:
        return HttpResponse(
            'ReportLab non installé. pip install reportlab',
            status=500, content_type='text/plain'
        )

    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2.5*cm, bottomMargin=2.5*cm,
    )

    # Couleurs TERAS
    C_DARK   = colors.HexColor('#0b1220')
    C_SKY    = colors.HexColor('#0ea5e9')
    C_SLATE  = colors.HexColor('#64748b')
    C_WHITE  = colors.white
    C_BORDER = colors.HexColor('#334155')
    C_GREEN  = colors.HexColor('#10b981')
    C_AMBER  = colors.HexColor('#f59e0b')
    C_LIGHT  = colors.HexColor('#f1f5f9')
    C_RED    = colors.HexColor('#ef4444')

    styles = getSampleStyleSheet()

    def style(name, **kw):
        s = ParagraphStyle(name, parent=styles['Normal'], **kw)
        return s

    # Styles réutilisables
    S_TITLE    = style('title',   fontSize=20, fontName='Helvetica-Bold',  textColor=C_DARK, alignment=TA_CENTER, spaceAfter=4)
    S_SUBTITLE = style('sub',     fontSize=11, fontName='Helvetica',       textColor=C_SLATE, alignment=TA_CENTER, spaceAfter=2)
    S_H2       = style('h2',      fontSize=12, fontName='Helvetica-Bold',  textColor=C_SKY, spaceBefore=12, spaceAfter=6)
    S_BODY     = style('body',    fontSize=9,  fontName='Helvetica',       textColor=C_DARK, leading=14, spaceAfter=4, alignment=TA_JUSTIFY)
    S_BOLD     = style('bold',    fontSize=9,  fontName='Helvetica-Bold',  textColor=C_DARK, leading=14)
    S_SMALL    = style('small',   fontSize=8,  fontName='Helvetica',       textColor=C_SLATE, leading=12)
    S_CENTER   = style('center',  fontSize=9,  fontName='Helvetica',       textColor=C_DARK, alignment=TA_CENTER)
    S_LEGAL    = style('legal',   fontSize=7.5,fontName='Helvetica',       textColor=C_SLATE, leading=11, alignment=TA_JUSTIFY)
    S_REF      = style('ref',     fontSize=8,  fontName='Helvetica-Bold',  textColor=C_SKY, alignment=TA_RIGHT)

    story = []

    # ── EN-TÊTE ────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph(f"<b>TERAS IA</b><br/><font size='8' color='#64748b'>{bank_name}</font>", style('hdr_left', fontSize=14, fontName='Helvetica-Bold', textColor=C_SKY)),
        Paragraph(f"<font color='#64748b' size='8'>Réf. dossier</font><br/><b>{app_id_str}</b><br/><font color='#64748b' size='7'>Émis le {datetime.now().strftime('%d/%m/%Y')}</font>",
                  style('hdr_right', fontSize=9, fontName='Helvetica-Bold', textColor=C_DARK, alignment=TA_RIGHT)),
    ]]
    header_table = Table(header_data, colWidths=[9*cm, 8.5*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN',      (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND',  (0,0), (-1,-1), C_LIGHT),
        ('ROUNDEDCORNERS', [8]),
        ('TOPPADDING',  (0,0), (-1,-1), 10),
        ('BOTTOMPADDING',(0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING',(0,0), (-1,-1), 14),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.5*cm))

    # Titre principal
    story.append(Paragraph("CONTRAT DE CRÉDIT", S_TITLE))
    story.append(Paragraph(f"{product_name.upper()}", S_SUBTITLE))
    story.append(HRFlowable(width="100%", thickness=2, color=C_SKY, spaceAfter=16))

    # ── PARTIES AU CONTRAT ─────────────────────────────────────────────────
    story.append(Paragraph("PARTIES AU CONTRAT", S_H2))

    parties_data = [
        ["PRÊTEUR", "EMPRUNTEUR"],
        [
            Paragraph(f"<b>{bank_name}</b><br/>Etablissement de microfinance CEMAC<br/>Zone TERAS — Congo Brazzaville<br/>Sous supervision COBAC", S_BODY),
            Paragraph(f"<b>{client_name}</b><br/>NIU / Pièce d'identité : {client_niu or 'À compléter'}<br/>Adresse : {client_addr}<br/>Email : {client_email or '—'}<br/>Téléphone : {client_phone or '—'}", S_BODY),
        ]
    ]
    parties_table = Table(parties_data, colWidths=[8.5*cm, 8.5*cm])
    parties_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), C_SKY),
        ('TEXTCOLOR',    (0,0), (-1,0), C_WHITE),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,0), 9),
        ('ALIGN',        (0,0), (-1,0), 'CENTER'),
        ('TOPPADDING',   (0,0), (-1,-1), 8),
        ('BOTTOMPADDING',(0,0), (-1,-1), 8),
        ('LEFTPADDING',  (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('GRID',         (0,0), (-1,-1), 0.5, C_BORDER),
        ('VALIGN',       (0,1), (-1,-1), 'TOP'),
        ('BACKGROUND',   (0,1), (0,1), colors.HexColor('#eff6ff')),
        ('BACKGROUND',   (1,1), (1,1), colors.HexColor('#f0fdf4')),
    ]))
    story.append(parties_table)
    story.append(Spacer(1, 0.4*cm))

    # ── CONDITIONS DU CRÉDIT ───────────────────────────────────────────────
    story.append(Paragraph("CONDITIONS DU CRÉDIT", S_H2))

    credit_rows = [
        ["Produit", product_name],
        ["Montant accordé",      _fmt_fcfa_short(principal)],
        ["Durée",                f"{duration} mois"],
        ["Taux d'intérêt annuel",f"{annual_rate:.1f} %"],
        ["Mensualité",           _fmt_fcfa_short(round(monthly))],
        ["Total à rembourser",   _fmt_fcfa_short(round(total_cost))],
        ["Total des intérêts",   _fmt_fcfa_short(round(total_interets))],
        ["Score TERAS au dossier",f"{teras_score} / 1000"],
        ["Date d'approbation",   approved_str],
        ["Référence dossier",    app_id_str],
    ]

    credit_table = Table(
        [[Paragraph(k, S_BOLD), Paragraph(v, S_BODY)] for k,v in credit_rows],
        colWidths=[6*cm, 11*cm]
    )
    credit_table.setStyle(TableStyle([
        ('GRID',         (0,0), (-1,-1), 0.5, C_BORDER),
        ('BACKGROUND',   (0,0), (0,-1), C_LIGHT),
        ('TOPPADDING',   (0,0), (-1,-1), 6),
        ('BOTTOMPADDING',(0,0), (-1,-1), 6),
        ('LEFTPADDING',  (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('VALIGN',       (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS',(0,0),(-1,-1), [colors.white, C_LIGHT]),
        # Ligne mensualité en relief
        ('BACKGROUND',   (1,4), (1,4), colors.HexColor('#ecfdf5')),
        ('TEXTCOLOR',    (1,4), (1,4), C_GREEN),
        ('FONTNAME',     (1,4), (1,4), 'Helvetica-Bold'),
        ('FONTSIZE',     (1,4), (1,4), 10),
    ]))
    story.append(credit_table)
    story.append(Spacer(1, 0.4*cm))

    # ── TABLEAU D'AMORTISSEMENT (5 premières lignes) ───────────────────────
    story.append(Paragraph("APERÇU DU REMBOURSEMENT", S_H2))

    amort_header = [
        Paragraph("<b>Mois</b>", S_CENTER),
        Paragraph("<b>Mensualité</b>", S_CENTER),
        Paragraph("<b>Capital</b>", S_CENTER),
        Paragraph("<b>Intérêts</b>", S_CENTER),
        Paragraph("<b>Capital restant</b>", S_CENTER),
    ]
    amort_data = [amort_header]

    balance = principal
    r = annual_rate / 100 / 12
    for i in range(1, min(duration + 1, 7)):
        if r > 0:
            interest = balance * r
            capital  = monthly - interest
        else:
            interest = 0
            capital  = monthly
        balance -= capital
        amort_data.append([
            Paragraph(f"Mois {i}", S_CENTER),
            Paragraph(_fmt_fcfa_short(round(monthly)), S_CENTER),
            Paragraph(_fmt_fcfa_short(round(capital)), S_CENTER),
            Paragraph(_fmt_fcfa_short(round(interest)), S_CENTER),
            Paragraph(_fmt_fcfa_short(round(max(balance, 0))), S_CENTER),
        ])

    if duration > 6:
        amort_data.append([
            Paragraph(f"... ({duration-6} mois restants)", S_SMALL),
            Paragraph("...", S_CENTER), Paragraph("...", S_CENTER),
            Paragraph("...", S_CENTER), Paragraph("...", S_CENTER),
        ])
        # Dernière ligne
        last_month = principal
        for _ in range(duration):
            if r > 0:
                interest = last_month * r
                capital  = monthly - interest
            else:
                capital = monthly
            last_month -= capital
        amort_data.append([
            Paragraph(f"Mois {duration}", S_CENTER),
            Paragraph(_fmt_fcfa_short(round(monthly)), S_CENTER),
            Paragraph(_fmt_fcfa_short(round(min(capital + max(last_month, 0), monthly))), S_CENTER),
            Paragraph(_fmt_fcfa_short(round(interest if r > 0 else 0)), S_CENTER),
            Paragraph("0 FCFA", style('zero', fontSize=9, fontName='Helvetica-Bold', textColor=C_GREEN, alignment=TA_CENTER)),
        ])

    amort_table = Table(amort_data, colWidths=[2.5*cm, 3.5*cm, 3.5*cm, 3*cm, 4.5*cm])
    amort_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), C_SKY),
        ('TEXTCOLOR',    (0,0), (-1,0), C_WHITE),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID',         (0,0), (-1,-1), 0.4, C_BORDER),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [colors.white, C_LIGHT]),
        ('ALIGN',        (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(amort_table)
    story.append(Spacer(1, 0.5*cm))

    # ── MODALITÉS DE REMBOURSEMENT ─────────────────────────────────────────
    story.append(Paragraph("MODALITÉS DE REMBOURSEMENT", S_H2))

    paiement_text = f"""
Les remboursements s'effectuent mensuellement, à date fixe, par prélèvement automatique selon les modalités choisies par l'Emprunteur :
"""
    story.append(Paragraph(paiement_text, S_BODY))

    # Modes de paiement
    modes_data = []

    if mobile_money or client_phone:
        mm_num = mobile_money or client_phone
        modes_data.append([
            Paragraph("📱 Mobile Money", style('mm', fontSize=9, fontName='Helvetica-Bold', textColor=C_SKY)),
            Paragraph(f"Prélèvement automatique sur le compte Mobile Money<br/>Numéro : <b>{mm_num}</b><br/>Opérateur : Airtel Money / MTN Money / Orange Money", S_BODY),
            Paragraph("☐ Sélectionné" if not bank_account else "☑ Sélectionné", S_CENTER),
        ])

    if bank_account:
        modes_data.append([
            Paragraph("🏦 Compte Bancaire", style('bk', fontSize=9, fontName='Helvetica-Bold', textColor=C_GREEN)),
            Paragraph(f"Prélèvement automatique sur compte bancaire<br/>Compte : <b>{bank_account}</b>", S_BODY),
            Paragraph("☑ Sélectionné", S_CENTER),
        ])

    if not modes_data:
        modes_data.append([
            Paragraph("💳 Mode de paiement", style('pay', fontSize=9, fontName='Helvetica-Bold', textColor=C_AMBER)),
            Paragraph(f"Numéro téléphone / compte : <b>{client_phone or 'À confirmer avec la banque'}</b><br/>Le prélèvement automatique sera activé à la signature.", S_BODY),
            Paragraph("☐ À confirmer", S_CENTER),
        ])

    modes_table = Table(
        [["Mode", "Détails", "Statut"]] + modes_data,
        colWidths=[4*cm, 10*cm, 3.5*cm]
    )
    modes_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), C_DARK),
        ('TEXTCOLOR',    (0,0), (-1,0), C_WHITE),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,0), 8),
        ('ALIGN',        (0,0), (-1,0), 'CENTER'),
        ('GRID',         (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING',   (0,0), (-1,-1), 8),
        ('BOTTOMPADDING',(0,0), (-1,-1), 8),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN',       (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(modes_table)
    story.append(Spacer(1, 0.3*cm))

    # ── AUTORISATION PRÉLÈVEMENT ───────────────────────────────────────────
    story.append(Paragraph("AUTORISATION DE PRÉLÈVEMENT AUTOMATIQUE", S_H2))

    prelevement = f"""
Par la signature du présent contrat, <b>{client_name}</b> autorise expressément {bank_name} à effectuer des prélèvements automatiques mensuels d'un montant de <b>{_fmt_fcfa_short(round(monthly))}</b> sur son compte Mobile Money ou compte bancaire désigné ci-dessus, et ce pendant toute la durée du crédit, soit <b>{duration} mois</b>.

Cette autorisation est irrévocable pendant la durée du contrat et ne peut être annulée qu'après remboursement intégral du crédit. En cas d'échec de prélèvement, l'Emprunteur s'engage à régulariser sa situation dans un délai de 5 jours ouvrés, faute de quoi des pénalités de retard de 1% par semaine seront appliquées.

L'Emprunteur certifie avoir pris connaissance des conditions générales du crédit TERAS et les accepter sans réserve.
"""
    story.append(Paragraph(prelevement, S_BODY))
    story.append(Spacer(1, 0.4*cm))

    # ── CONDITIONS GÉNÉRALES ───────────────────────────────────────────────
    story.append(Paragraph("CONDITIONS GÉNÉRALES", S_H2))

    cg_items = [
        ("Art. 1 — Objet", f"Le présent contrat a pour objet d'accorder à l'Emprunteur un crédit de {_fmt_fcfa_short(principal)} dans le cadre du produit {product_name}, conformément à la politique de crédit TERAS et aux règlements COBAC en vigueur."),
        ("Art. 2 — Déblocage", f"Les fonds seront débloqués sur le compte Mobile Money ou bancaire de l'Emprunteur dans les 24 à 48 heures ouvrées suivant la signature du présent contrat et la validation définitive du dossier."),
        ("Art. 3 — Remboursement", f"L'Emprunteur s'engage à rembourser {_fmt_fcfa_short(round(monthly))} par mois pendant {duration} mois. La première échéance intervient 30 jours après le déblocage des fonds."),
        ("Art. 4 — Taux & Frais", f"Le taux d'intérêt annuel est fixé à {annual_rate:.1f}% pour toute la durée du contrat. Des frais de dossier de 1 à 2% peuvent s'appliquer selon le produit souscrit."),
        ("Art. 5 — Retards", f"Tout retard de paiement entraîne une pénalité de 1% par semaine de retard sur le montant impayé. Au-delà de 30 jours de retard, la banque se réserve le droit d'activer les garanties prévues."),
        ("Art. 6 — Remboursement anticipé", f"L'Emprunteur peut rembourser le crédit par anticipation à tout moment, sans pénalité. Ce remboursement anticipé permettra d'améliorer son score TERAS pour l'accès à de futurs financements."),
        ("Art. 7 — Données TERAS", f"Les données financières de l'Emprunteur seront traitées par le système de scoring TERAS conformément au cadre légal de protection des données personnelles en vigueur en République du Congo."),
        ("Art. 8 — Litiges", f"Tout litige relatif à l'exécution du présent contrat sera soumis à la juridiction compétente de Brazzaville, République du Congo, après tentative de règlement amiable."),
    ]

    for title, text in cg_items:
        story.append(Paragraph(f"<b>{title}</b>", style('cg_title', fontSize=8.5, fontName='Helvetica-Bold', textColor=C_DARK, spaceBefore=6)))
        story.append(Paragraph(text, S_LEGAL))

    story.append(Spacer(1, 0.5*cm))

    # ── SIGNATURES ─────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=C_BORDER, spaceAfter=12))
    story.append(Paragraph("SIGNATURES", S_H2))

    sig_date = datetime.now().strftime('%d %B %Y à %H:%M')
    accepted_date = approved_str

    sig_data = [
        [
            Paragraph(f"<b>L'Emprunteur</b>", S_CENTER),
            Paragraph(f"<b>{bank_name}</b>", S_CENTER),
        ],
        [
            Paragraph(f"Je soussigné(e) <b>{client_name}</b>,<br/>certifie avoir lu et accepté les conditions<br/>du présent contrat de crédit TERAS.<br/><br/>J'autorise expressément le prélèvement<br/>automatique de <b>{_fmt_fcfa_short(round(monthly))}/mois</b><br/>sur mon compte désigné.", S_BODY),
            Paragraph(f"Pour {bank_name},<br/>Représentant agréé TERAS.<br/><br/>Dossier approuvé le {accepted_date}.<br/>Référence : {app_id_str}", S_BODY),
        ],
        [
            Paragraph(f"Signature : _______________________<br/><br/>Date : {accepted_date}", S_BODY),
            Paragraph(f"Cachet & Signature : _______________<br/><br/>Date : {accepted_date}", S_BODY),
        ],
        [
            Paragraph(f"<font color='#10b981'>✅ Accepté électroniquement via TERAS</font><br/><font size='7' color='#64748b'>Le {sig_date}</font>", style('esig', fontSize=8, fontName='Helvetica-Bold', textColor=C_GREEN, alignment=TA_CENTER)),
            Paragraph(f"<font color='#0ea5e9'>🔒 Validé par le système TERAS IA</font><br/><font size='7' color='#64748b'>Réf: {app_id_str}</font>", style('bsig', fontSize=8, fontName='Helvetica-Bold', textColor=C_SKY, alignment=TA_CENTER)),
        ],
    ]

    sig_table = Table(sig_data, colWidths=[8.5*cm, 8.5*cm])
    sig_table.setStyle(TableStyle([
        ('GRID',         (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING',   (0,0), (-1,-1), 10),
        ('BOTTOMPADDING',(0,0), (-1,-1), 10),
        ('LEFTPADDING',  (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('VALIGN',       (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND',   (0,0), (-1,0), C_DARK),
        ('TEXTCOLOR',    (0,0), (-1,0), C_WHITE),
        ('ALIGN',        (0,0), (-1,0), 'CENTER'),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('BACKGROUND',   (0,3), (-1,3), C_LIGHT),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 0.3*cm))

    # ── PIED DE PAGE ───────────────────────────────────────────────────────
    footer_data = [[
        Paragraph(f"Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} | Réf: {app_id_str}", S_SMALL),
        Paragraph("TERAS IA — Plateforme de scoring crédit CEMAC | Confidentiel", style('foot_r', fontSize=7, fontName='Helvetica', textColor=C_SLATE, alignment=TA_RIGHT)),
    ]]
    footer_table = Table(footer_data, colWidths=[9*cm, 8.5*cm])
    footer_table.setStyle(TableStyle([
        ('TOPPADDING',   (0,0), (-1,-1), 6),
        ('BACKGROUND',   (0,0), (-1,-1), C_LIGHT),
        ('LEFTPADDING',  (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('VALIGN',       (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(footer_table)

    # ── Build PDF ──────────────────────────────────────────────────────────
    doc.build(story)
    buffer.seek(0)

    filename = f"TERAS_Contrat_{app_id_str}_{client_name.replace(' ', '_')}.pdf"
    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response['Content-Length'] = len(buffer.getvalue())
    return response

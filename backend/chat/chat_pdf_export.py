# backend/chat/chat_pdf_export.py
"""
Service PDF dédié pour l'export des conversations TERAS
Utilise ReportLab pour un rendu professionnel sans dépendre du navigateur
"""

from io import BytesIO
from datetime import datetime
import re

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import Flowable

# ─── Couleurs TERAS ───────────────────────────────────────────────────────────
C_DARK    = HexColor('#0b1220')
C_SLATE   = HexColor('#1e293b')
C_SKY     = HexColor('#0ea5e9')
C_INDIGO  = HexColor('#6366f1')
C_VIOLET  = HexColor('#7c3aed')
C_WHITE   = HexColor('#f8fafc')
C_GRAY    = HexColor('#94a3b8')
C_LIGHT   = HexColor('#f1f5f9')
C_BORDER  = HexColor('#e2e8f0')
C_TEXT    = HexColor('#1e293b')
C_MUTED   = HexColor('#64748b')
C_USER_BG = HexColor('#0ea5e9')
C_AI_BG   = HexColor('#f8fafc')

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm


# ─── Ligne décorative ─────────────────────────────────────────────────────────
class ColorRect(Flowable):
    def __init__(self, width, height, color, radius=2):
        Flowable.__init__(self)
        self.width  = width
        self.height = height
        self.color  = color
        self.radius = radius

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.width, self.height, self.radius, fill=1, stroke=0)


# ─── Nettoyage markdown → texte ReportLab ─────────────────────────────────────
def clean_markdown(text: str) -> str:
    """Convertit markdown vers XML ReportLab (Paragraph)"""
    # Blocs code → monospace encadré
    text = re.sub(r'```[\w]*\n?([\s\S]*?)```',
                  lambda m: f'<font name="Courier" size="9" color="#475569">{m.group(1).strip()}</font>',
                  text)
    # Code inline
    text = re.sub(r'`([^`]+)`',
                  r'<font name="Courier" size="9" color="#0ea5e9">\1</font>',
                  text)
    # Titres
    text = re.sub(r'^### (.+)$', r'<b>\1</b>', text, flags=re.MULTILINE)
    text = re.sub(r'^## (.+)$',  r'<b>\1</b>', text, flags=re.MULTILINE)
    text = re.sub(r'^# (.+)$',   r'<b>\1</b>', text, flags=re.MULTILINE)
    # Gras/italique
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.+?)\*',     r'<i>\1</i>', text)
    # Listes
    text = re.sub(r'^[-•] (.+)$', r'• \1', text, flags=re.MULTILINE)
    # Sauts de ligne
    text = text.replace('\n\n', '<br/><br/>').replace('\n', '<br/>')
    # Nettoyer XML invalide simple
    text = text.replace('&', '&amp;').replace('<br/>&amp;', '<br/>&')
    # Rétablir les balises ReportLab après l'échappement &
    text = re.sub(r'&lt;(b|i|br/|font[^&]*|/b|/i|/font)&gt;', r'<\1>', text)
    return text


def split_into_chunks(text: str, max_chars: int = 800) -> list:
    """Découpe un long texte en paragraphes pour éviter overflow"""
    paragraphs = text.split('\n\n')
    chunks = []
    current = ''
    for p in paragraphs:
        if len(current) + len(p) < max_chars:
            current += ('\n\n' if current else '') + p
        else:
            if current:
                chunks.append(current)
            current = p
    if current:
        chunks.append(current)
    return chunks if chunks else [text]


# ─── Styles ───────────────────────────────────────────────────────────────────
def make_styles():
    return {
        'title': ParagraphStyle(
            'title', fontName='Helvetica-Bold', fontSize=18,
            textColor=C_WHITE, leading=22, spaceAfter=2
        ),
        'subtitle': ParagraphStyle(
            'subtitle', fontName='Helvetica', fontSize=10,
            textColor=C_GRAY, leading=14
        ),
        'meta': ParagraphStyle(
            'meta', fontName='Helvetica', fontSize=9,
            textColor=C_MUTED, leading=13
        ),
        'section': ParagraphStyle(
            'section', fontName='Helvetica-Bold', fontSize=10,
            textColor=C_MUTED, leading=14, spaceBefore=6
        ),
        'user_msg': ParagraphStyle(
            'user_msg', fontName='Helvetica', fontSize=10,
            textColor=white, leading=15, spaceAfter=2,
            leftIndent=4, rightIndent=4
        ),
        'ai_msg': ParagraphStyle(
            'ai_msg', fontName='Helvetica', fontSize=10,
            textColor=C_TEXT, leading=15, spaceAfter=2,
            leftIndent=4, rightIndent=4
        ),
        'timestamp': ParagraphStyle(
            'timestamp', fontName='Helvetica', fontSize=8,
            textColor=C_GRAY, leading=11
        ),
        'footer': ParagraphStyle(
            'footer', fontName='Helvetica', fontSize=8,
            textColor=C_GRAY, leading=12, alignment=TA_CENTER
        ),
        'source_tag': ParagraphStyle(
            'source_tag', fontName='Helvetica', fontSize=8,
            textColor=C_SKY, leading=11
        ),
    }


# ─── Header page (canvas) ─────────────────────────────────────────────────────
def draw_page_header(canvas, doc, conv_title: str):
    """En-tête sombre TERAS sur chaque page"""
    canvas.saveState()
    w = PAGE_W

    # Fond header
    canvas.setFillColor(C_DARK)
    canvas.rect(0, PAGE_H - 28*mm, w, 28*mm, fill=1, stroke=0)

    # Bande accent sky
    canvas.setFillColor(C_SKY)
    canvas.rect(0, PAGE_H - 28*mm, w, 1.2*mm, fill=1, stroke=0)

    # Logo rond gradient (simulation avec cercle)
    canvas.setFillColor(C_SKY)
    canvas.circle(MARGIN + 7*mm, PAGE_H - 14*mm, 7*mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont('Helvetica-Bold', 12)
    canvas.drawCentredString(MARGIN + 7*mm, PAGE_H - 17*mm, 'T')

    # Titre
    canvas.setFillColor(C_WHITE)
    canvas.setFont('Helvetica-Bold', 13)
    canvas.drawString(MARGIN + 17*mm, PAGE_H - 11*mm, 'TERAS IA — Rapport de Conversation')

    # Sous-titre
    canvas.setFillColor(C_GRAY)
    canvas.setFont('Helvetica', 9)
    title_short = conv_title[:60] + ('...' if len(conv_title) > 60 else '')
    canvas.drawString(MARGIN + 17*mm, PAGE_H - 17.5*mm, title_short)

    # Numéro de page (droite)
    canvas.setFillColor(C_GRAY)
    canvas.setFont('Helvetica', 8)
    canvas.drawRightString(w - MARGIN, PAGE_H - 14*mm, f'Page {doc.page}')

    canvas.restoreState()


def draw_page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(C_BORDER)
    canvas.rect(MARGIN, 12*mm, PAGE_W - 2*MARGIN, 0.3*mm, fill=1, stroke=0)
    canvas.setFillColor(C_GRAY)
    canvas.setFont('Helvetica', 7.5)
    canvas.drawCentredString(
        PAGE_W / 2, 8*mm,
        f'Généré par TERAS IA APP  ·  Système de scoring financier CEMAC  ·  {datetime.now().strftime("%d/%m/%Y")}'
    )
    canvas.restoreState()


# ─── Bulle de message ─────────────────────────────────────────────────────────
def make_message_block(msg: dict, styles: dict, available_width: float) -> list:
    """Crée les éléments ReportLab pour un message (bulle utilisateur ou IA)"""
    elements = []
    is_user = msg.get('role') == 'user'
    content  = msg.get('content', '')
    timestamp = msg.get('timestamp', '')
    sources  = msg.get('sources', [])

    bubble_w = available_width * 0.78
    pad      = 4 * mm

    if is_user:
        # ── Bulle UTILISATEUR (droite, sky→indigo) ──────────────────────────
        label_para = Paragraph('<b>Vous</b>', ParagraphStyle(
            'lbl', fontName='Helvetica-Bold', fontSize=8,
            textColor=C_SKY, alignment=TA_RIGHT
        ))

        # Contenu nettoyé
        safe_content = content.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        msg_para = Paragraph(safe_content, styles['user_msg'])

        inner_table = Table(
            [[msg_para]],
            colWidths=[bubble_w - 2*pad],
        )
        inner_table.setStyle(TableStyle([
            ('BACKGROUND',   (0,0), (-1,-1), C_USER_BG),
            ('ROUNDEDCORNERS', (0,0), (-1,-1), [6,6,2,6]),
            ('TOPPADDING',   (0,0), (-1,-1), pad),
            ('BOTTOMPADDING',(0,0), (-1,-1), pad),
            ('LEFTPADDING',  (0,0), (-1,-1), pad),
            ('RIGHTPADDING', (0,0), (-1,-1), pad),
        ]))

        # Timestamp
        ts_text = ''
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z',''))
                ts_text = dt.strftime('%H:%M')
            except Exception:
                ts_text = str(timestamp)[:5]

        ts_para = Paragraph(ts_text, ParagraphStyle(
            'ts_u', fontName='Helvetica', fontSize=8,
            textColor=C_GRAY, alignment=TA_RIGHT
        ))

        # Aligner à droite avec espace à gauche
        spacer_w = available_width - bubble_w
        outer = Table(
            [[Spacer(spacer_w, 1), inner_table]],
            colWidths=[spacer_w, bubble_w]
        )
        outer.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING',  (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING',   (0,0), (-1,-1), 0),
            ('BOTTOMPADDING',(0,0), (-1,-1), 0),
        ]))

        ts_outer = Table(
            [['', ts_para]],
            colWidths=[spacer_w, bubble_w]
        )
        ts_outer.setStyle(TableStyle([
            ('LEFTPADDING',  (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING',   (0,0), (-1,-1), 1),
            ('BOTTOMPADDING',(0,0), (-1,-1), 0),
        ]))

        elements.append(KeepTogether([label_para, Spacer(1, 1*mm), outer, ts_outer]))

    else:
        # ── Bulle IA (gauche, fond clair) ───────────────────────────────────
        label_para = Paragraph('<b>IA TERAS</b>', ParagraphStyle(
            'lbl_ai', fontName='Helvetica-Bold', fontSize=8,
            textColor=C_VIOLET
        ))

        chunks = split_into_chunks(content, max_chars=1000)
        ai_paras = []
        for chunk in chunks:
            cleaned = clean_markdown(chunk)
            try:
                p = Paragraph(cleaned, styles['ai_msg'])
                ai_paras.append(p)
                if len(chunks) > 1:
                    ai_paras.append(Spacer(1, 2*mm))
            except Exception:
                # Fallback texte brut si XML invalide
                safe = chunk.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
                ai_paras.append(Paragraph(safe, styles['ai_msg']))

        # Timestamp
        ts_text = ''
        if timestamp:
            try:
                dt = datetime.fromisoformat(str(timestamp).replace('Z',''))
                ts_text = dt.strftime('%H:%M')
            except Exception:
                ts_text = str(timestamp)[:5]

        ts_para = Paragraph(ts_text, styles['timestamp'])

        # Style de fond avec ligne gauche colorée (pas de Table pour éviter LayoutError)
        ai_style_base = ParagraphStyle(
            'ai_block', fontName='Helvetica', fontSize=10,
            textColor=C_TEXT, leading=15,
            leftIndent=8, rightIndent=int(available_width * 0.25),
            spaceAfter=2,
            borderPad=4,
        )

        # Ligne séparatrice colorée à gauche
        elements.append(label_para)
        elements.append(Spacer(1, 1*mm))

        # Barre colorée gauche
        elements.append(ColorRect(3*mm, 2*mm, C_VIOLET))

        # Paragraphes IA (sans Table — se découpe automatiquement entre pages)
        for para in ai_paras:
            elements.append(para)

        # Sources
        if sources:
            src_texts = [f'[{s.get("type","doc")}] {s.get("title","")[:30]}' for s in sources[:4]]
            src_para = Paragraph(
                '  •  '.join(src_texts),
                ParagraphStyle('src', fontName='Helvetica', fontSize=8,
                               textColor=C_SKY, leading=11, leftIndent=8)
            )
            elements.append(Spacer(1, 1*mm))
            elements.append(src_para)

        elements.append(Spacer(1, 1*mm))
        elements.append(ts_para)

    elements.append(Spacer(1, 4*mm))
    return elements


# ─── Fonction principale ──────────────────────────────────────────────────────
def generate_chat_pdf(
    messages: list,
    conv_title: str = 'Conversation',
    doc_count: int = 0,
    model: str = 'Claude Sonnet 4',
) -> bytes:
    """
    Génère un PDF professionnel pour une conversation TERAS.

    Args:
        messages:   liste de dicts {role, content, timestamp, sources?}
        conv_title: titre de la conversation
        doc_count:  nombre de documents RAG
        model:      nom du modèle IA

    Returns:
        bytes du PDF généré
    """
    buffer = BytesIO()
    styles = make_styles()

    available_width = PAGE_W - 2 * MARGIN

    # Callbacks pour header/footer sur chaque page
    def on_page(canvas, doc):
        draw_page_header(canvas, doc, conv_title)
        draw_page_footer(canvas, doc)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=32*mm,      # espace pour header
        bottomMargin=20*mm,   # espace pour footer
        title=f'TERAS — {conv_title}',
        author='TERAS IA APP',
        subject='Export conversation RAG TERAS',
        creator='TERAS IA APP v2.0',
    )

    story = []

    # ── Bloc méta ─────────────────────────────────────────────────────────────
    now = datetime.now()
    meta_data = [
        [
            Paragraph(f'💬 <b>{len(messages)}</b> messages', styles['meta']),
            Paragraph(f'📚 <b>{doc_count}</b> documents RAG', styles['meta']),
            Paragraph(f'🤖 <b>{model}</b>', styles['meta']),
            Paragraph(f'📅 <b>{now.strftime("%d/%m/%Y %H:%M")}</b>', styles['meta']),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[available_width/4]*4)
    meta_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,-1), C_LIGHT),
        ('BOX',          (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING',   (0,0), (-1,-1), 3*mm),
        ('BOTTOMPADDING',(0,0), (-1,-1), 3*mm),
        ('LEFTPADDING',  (0,0), (-1,-1), 3*mm),
        ('RIGHTPADDING', (0,0), (-1,-1), 3*mm),
        ('VALIGN',       (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6*mm))

    # Ligne séparatrice
    story.append(HRFlowable(
        width=available_width, thickness=0.5,
        color=C_BORDER, spaceAfter=4*mm
    ))

    # ── Messages ──────────────────────────────────────────────────────────────
    for msg in messages:
        if msg.get('role') in ('user', 'assistant'):
            story.extend(make_message_block(msg, styles, available_width))

    # ── Footer final ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width=available_width, thickness=0.5, color=C_BORDER))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        f'Généré par <b>TERAS IA APP</b>  ·  Système de scoring financier CEMAC  ·  {now.strftime("%d %B %Y")}',
        styles['footer']
    ))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    return buffer.getvalue()
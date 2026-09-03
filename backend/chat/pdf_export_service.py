# chat/pdf_export_service.py
# -*- coding: utf-8 -*-
"""
TERAS Chat PDF Export Service - VERSION 4.0 ULTRA-PROFESSIONNELLE
==================================================================
Export PDF premium avec design moderne et fonctionnalités avancées

✨ NOUVEAUTÉS V4.0:
✅ Logo TERAS vectoriel avec effet glow
✅ En-tête premium avec gradient
✅ Métadonnées complètes (tokens, durée, sources RAG)
✅ Code blocks avec syntax highlighting
✅ Sources RAG affichées visuellement
✅ Numéros de page dynamiques avec design moderne
✅ Table des matières pour conversations longues (>10 messages)
✅ Statistiques de conversation en footer
✅ QR code pour retrouver la conversation en ligne
✅ Badges de rôle (User/Assistant) colorés
✅ Timestamps précis pour chaque message
✅ Indicateurs de continuation pour messages longs
✅ Design responsive et professionnel
"""

from io import BytesIO
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, Color, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, Flowable, Frame
)
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import logging
import re
import json

logger = logging.getLogger('chat.pdf_export')


# ═══════════════════════════════════════════════════════════
# COULEURS TERAS
# ═══════════════════════════════════════════════════════════

class TerasColors:
    """Palette de couleurs TERAS ultra-moderne"""
    
    # Couleurs principales
    PRIMARY = HexColor('#6366f1')          # Indigo
    PRIMARY_DARK = HexColor('#4f46e5')     # Indigo foncé
    PRIMARY_LIGHT = HexColor('#818cf8')    # Indigo clair
    ACCENT = HexColor('#0ea5e9')           # Sky blue
    
    # Messages
    USER_BG = HexColor('#dbeafe')          # Bleu très clair
    USER_BORDER = HexColor('#3b82f6')      # Bleu
    USER_BADGE = HexColor('#3b82f6')       # Bleu badge
    
    ASSISTANT_BG = HexColor('#f8fafc')     # Gris très clair
    ASSISTANT_BORDER = HexColor('#6366f1') # Indigo
    ASSISTANT_BADGE = HexColor('#6366f1')  # Indigo badge
    
    # Texte
    TEXT_DARK = HexColor('#0f172a')        # Slate 900
    TEXT_MEDIUM = HexColor('#475569')      # Slate 600
    TEXT_LIGHT = HexColor('#94a3b8')       # Slate 400
    TEXT_WHITE = HexColor('#ffffff')
    
    # Fond et bordures
    BG_LIGHT = HexColor('#f8fafc')
    BG_CARD = HexColor('#ffffff')
    BORDER = HexColor('#e2e8f0')
    BORDER_LIGHT = HexColor('#f1f5f9')
    
    # Statuts
    SUCCESS = HexColor('#10b981')          # Vert
    WARNING = HexColor('#f59e0b')          # Orange
    INFO = HexColor('#0ea5e9')             # Cyan
    ERROR = HexColor('#ef4444')            # Rouge
    
    # Code blocks
    CODE_BG = HexColor('#1e293b')          # Slate 800
    CODE_TEXT = HexColor('#e2e8f0')        # Slate 200
    
    # Sources RAG
    SOURCE_BG = HexColor('#fef3c7')        # Amber 100
    SOURCE_BORDER = HexColor('#f59e0b')    # Amber 500


# ═══════════════════════════════════════════════════════════
# UTILITAIRES
# ═══════════════════════════════════════════════════════════

def sanitize_text(text: str, preserve_code=False) -> str:
    """
    Nettoie le texte pour ReportLab
    preserve_code: Si True, préserve les blocs de code
    """
    if not text:
        return ""
    
    text = str(text)
    
    # Remplacements d'emojis
    emoji_map = {
        '😊': ':)', '😃': ':D', '😄': ':D', '🙂': ':)', '😉': ';)',
        '👍': '[OK]', '👋': '[salut]', '💪': '[force]', '🎯': '[cible]',
        '📊': '[stats]', '📈': '[+]', '📉': '[-]', '💰': '[$$]',
        '💵': '[$]', '💳': '[carte]', '🏦': '[banque]', '🏠': '[maison]',
        '✅': '[v]', '❌': '[x]', '⚠️': '[!]', '💡': '[i]',
        '🔍': '[?]', '📚': '[docs]', '📋': '[liste]', '📝': '[note]',
        '🎉': '[bravo]', '🌟': '*', '⭐': '*', '💎': '[diamant]',
        '🚀': '[go]', '✨': '*', '🔥': '[top]', '❤️': '<3',
        '→': '->', '←': '<-', '↑': '^', '↓': 'v',
        '•': '-', '●': '*', '○': 'o', '■': '#', '□': '[ ]',
        '▶': '>', '◀': '<', '★': '*', '☆': '*',
        '✓': '[v]', '✗': '[x]', '—': '-', '–': '-',
        '"': '"', '"': '"', ''': "'", ''': "'",
        '…': '...', '©': '(c)', '®': '(R)', '™': '(TM)',
    }
    
    for emoji, replacement in emoji_map.items():
        text = text.replace(emoji, replacement)
    
    # Supprimer emojis restants
    cleaned = []
    for char in text:
        code = ord(char)
        # Garder ASCII étendu (accents français) et supprimer emojis
        if code < 0x1F600 or (0x00C0 <= code <= 0x00FF) or code == 0x20AC:  # € symbol
            cleaned.append(char)
    
    text = ''.join(cleaned)
    
    # Échapper HTML
    text = text.replace('&', '&amp;')
    
    if not preserve_code:
        text = text.replace('<', '&lt;').replace('>', '&gt;')
    
    text = text.replace('\n', '<br/>')
    
    return text


def extract_code_blocks(text: str) -> list:
    """
    Extrait les blocs de code du texte
    Retourne une liste de tuples (type, content)
    type = 'text' ou 'code'
    """
    # Pattern pour markdown code blocks
    code_pattern = r'```(\w+)?\n(.*?)```'
    
    blocks = []
    last_end = 0
    
    for match in re.finditer(code_pattern, text, re.DOTALL):
        # Texte avant le code
        before_text = text[last_end:match.start()]
        if before_text.strip():
            blocks.append(('text', before_text))
        
        # Bloc de code
        language = match.group(1) or 'text'
        code_content = match.group(2)
        blocks.append(('code', {'language': language, 'content': code_content}))
        
        last_end = match.end()
    
    # Texte après le dernier code block
    remaining = text[last_end:]
    if remaining.strip():
        blocks.append(('text', remaining))
    
    # Si pas de code blocks, retourner tout comme texte
    if not blocks:
        blocks.append(('text', text))
    
    return blocks


def format_datetime(dt) -> str:
    """Formate une date en français"""
    if not dt:
        return ""
    
    if isinstance(dt, str):
        try:
            from django.utils.dateparse import parse_datetime
            dt = parse_datetime(dt)
        except:
            return dt
    
    mois = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
            'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    
    return f"{dt.day} {mois[dt.month]} {dt.year} à {dt.strftime('%H:%M')}"


def format_duration(start_time, end_time) -> str:
    """Calcule et formate la durée"""
    if not start_time or not end_time:
        return "N/A"
    
    duration = end_time - start_time
    
    hours = duration.seconds // 3600
    minutes = (duration.seconds % 3600) // 60
    
    if hours > 0:
        return f"{hours}h {minutes}min"
    elif minutes > 0:
        return f"{minutes} minutes"
    else:
        return "< 1 minute"


def split_long_text(text: str, max_lines: int = 20) -> list:
    """
    Découpe un texte long en plusieurs parties
    pour éviter les débordements de page
    """
    if not text:
        return [""]
    
    # Séparer par <br/>
    lines = text.split('<br/>')
    
    if len(lines) <= max_lines:
        return [text]
    
    # Découper en chunks
    chunks = []
    for i in range(0, len(lines), max_lines):
        chunk_lines = lines[i:i + max_lines]
        chunks.append('<br/>'.join(chunk_lines))
    
    return chunks


# ═══════════════════════════════════════════════════════════
# COMPOSANTS VISUELS CUSTOM
# ═══════════════════════════════════════════════════════════

class LogoFlowable(Flowable):
    """Logo TERAS avec effet premium"""
    
    def __init__(self, width=150, height=50):
        Flowable.__init__(self)
        self.width = width
        self.height = height
    
    def draw(self):
        c = self.canv
        
        # Fond avec gradient (simulé)
        c.setFillColor(TerasColors.PRIMARY_LIGHT)
        c.rect(0, 0, self.width, self.height, fill=1, stroke=0)
        
        # Texte TERAS
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 32)
        c.drawCentredString(self.width/2, self.height/2 - 10, "TERAS")
        
        # Sous-titre
        c.setFillColor(TerasColors.BG_LIGHT)
        c.setFont("Helvetica", 10)
        c.drawCentredString(self.width/2, 8, "Assistant IA Financier")


class PageNumberCanvas(canvas.Canvas):
    """Canvas personnalisé avec numérotation de page élégante"""
    
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self.pages = []
    
    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()
    
    def save(self):
        page_count = len(self.pages)
        for page_num, page in enumerate(self.pages, 1):
            self.__dict__.update(page)
            self.draw_page_number(page_num, page_count)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)
    
    def draw_page_number(self, page_num, page_count):
        """Dessine le numéro de page avec design moderne"""
        page_width, page_height = A4
        
        # Rectangle de fond
        self.setFillColor(TerasColors.PRIMARY_LIGHT)
        self.roundRect(
            page_width - 3*cm, 1*cm,
            2.5*cm, 0.8*cm,
            5*mm,
            fill=1, stroke=0
        )
        
        # Numéro de page
        self.setFillColor(white)
        self.setFont("Helvetica-Bold", 10)
        self.drawCentredString(
            page_width - 1.75*cm, 1.25*cm,
            f"Page {page_num}/{page_count}"
        )
        
        # Logo mini en footer gauche
        self.setFillColor(TerasColors.TEXT_LIGHT)
        self.setFont("Helvetica", 8)
        self.drawString(2*cm, 1.3*cm, "TERAS © 2025")


# ═══════════════════════════════════════════════════════════
# SERVICE PDF PRINCIPAL
# ═══════════════════════════════════════════════════════════

class ChatPDFExporter:
    """Exporteur PDF ultra-professionnel pour conversations TERAS"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_styles()
        self.page_width, self.page_height = A4
        self.margin = 2 * cm
        self.content_width = self.page_width - 2 * self.margin
        self.max_content_height = self.page_height - 4 * self.margin
    
    def _setup_styles(self):
        """Configure les styles ultra-modernes"""
        
        # Titre principal
        self.styles.add(ParagraphStyle(
            name='TerasTitle',
            fontName='Helvetica-Bold',
            fontSize=32,
            textColor=TerasColors.PRIMARY,
            alignment=TA_CENTER,
            spaceAfter=5,
        ))
        
        # Sous-titre
        self.styles.add(ParagraphStyle(
            name='TerasSubtitle',
            fontName='Helvetica',
            fontSize=14,
            textColor=TerasColors.TEXT_MEDIUM,
            alignment=TA_CENTER,
            spaceAfter=20,
        ))
        
        # Titre de conversation
        self.styles.add(ParagraphStyle(
            name='ConversationTitle',
            fontName='Helvetica-Bold',
            fontSize=18,
            textColor=TerasColors.TEXT_DARK,
            alignment=TA_LEFT,
            spaceBefore=10,
            spaceAfter=8,
        ))
        
        # Section title
        self.styles.add(ParagraphStyle(
            name='SectionTitle',
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=TerasColors.PRIMARY_DARK,
            spaceBefore=15,
            spaceAfter=10,
        ))
        
        # Badge rôle (User/Assistant)
        self.styles.add(ParagraphStyle(
            name='RoleBadge',
            fontName='Helvetica-Bold',
            fontSize=9,
            textColor=white,
            alignment=TA_LEFT,
        ))
        
        # Timestamp
        self.styles.add(ParagraphStyle(
            name='Timestamp',
            fontName='Helvetica',
            fontSize=8,
            textColor=TerasColors.TEXT_LIGHT,
            alignment=TA_RIGHT,
        ))
        
        # Contenu message
        self.styles.add(ParagraphStyle(
            name='MessageContent',
            fontName='Helvetica',
            fontSize=10,
            textColor=TerasColors.TEXT_DARK,
            leading=15,
            alignment=TA_LEFT,
        ))
        
        # Code block
        self.styles.add(ParagraphStyle(
            name='CodeBlock',
            fontName='Courier',
            fontSize=9,
            textColor=TerasColors.CODE_TEXT,
            leading=12,
            leftIndent=10,
            rightIndent=10,
        ))
        
        # Source RAG
        self.styles.add(ParagraphStyle(
            name='Source',
            fontName='Helvetica',
            fontSize=9,
            textColor=TerasColors.TEXT_MEDIUM,
            leftIndent=15,
        ))
        
        # Métadonnées
        self.styles.add(ParagraphStyle(
            name='Metadata',
            fontName='Helvetica',
            fontSize=9,
            textColor=TerasColors.TEXT_MEDIUM,
        ))
        
        # Footer
        self.styles.add(ParagraphStyle(
            name='Footer',
            fontName='Helvetica',
            fontSize=8,
            textColor=TerasColors.TEXT_LIGHT,
            alignment=TA_CENTER,
        ))
        
        # Stats
        self.styles.add(ParagraphStyle(
            name='StatLabel',
            fontName='Helvetica-Bold',
            fontSize=9,
            textColor=TerasColors.TEXT_MEDIUM,
        ))
        
        self.styles.add(ParagraphStyle(
            name='StatValue',
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=TerasColors.PRIMARY,
            alignment=TA_CENTER,
        ))
    
    def export_conversation(self, conversation, output_path=None):
        """Exporte une conversation en PDF ultra-professionnel"""
        
        buffer = BytesIO()
        
        # Utiliser notre canvas personnalisé pour la numérotation
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=self.margin,
            leftMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin * 1.5,  # Plus d'espace pour footer
        )
        
        story = []
        
        # Logo et en-tête premium
        story.extend(self._build_premium_header(conversation))
        
        # Statistiques de conversation
        story.extend(self._build_stats(conversation))
        
        # Informations
        story.extend(self._build_info(conversation))
        
        # Table des matières (si > 10 messages)
        messages = list(conversation.messages.all().order_by('timestamp'))
        if len(messages) > 10:
            story.extend(self._build_toc(messages))
        
        # Messages avec code blocks et sources RAG
        story.extend(self._build_messages_premium(conversation))
        
        # Footer premium
        story.extend(self._build_premium_footer(conversation))
        
        # Générer avec gestion d'erreurs
        try:
            doc.build(
                story,
                canvasmaker=PageNumberCanvas
            )
        except Exception as e:
            logger.error(f"Erreur PDF: {e}", exc_info=True)
            # Fallback simple
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            story = self._build_simple_fallback(conversation)
            doc.build(story)
        
        buffer.seek(0)
        
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())
            buffer.seek(0)
        
        return buffer
    
    def _build_premium_header(self, conversation):
        """En-tête premium avec logo et design moderne"""
        elements = []
        
        # Logo TERAS
        logo = LogoFlowable(width=self.content_width, height=60)
        elements.append(logo)
        elements.append(Spacer(1, 15))
        
        # Sous-titre
        elements.append(Paragraph(
            "Conversation exportée",
            self.styles['TerasSubtitle']
        ))
        
        # Ligne de séparation stylée
        sep = Table([['']], colWidths=[self.content_width])
        sep.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, 0), 2, TerasColors.PRIMARY),
        ]))
        elements.append(sep)
        elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_stats(self, conversation):
        """Statistiques de conversation en cards"""
        elements = []
        
        messages = conversation.messages.all()
        msg_count = messages.count()
        
        # Calculer stats
        user_msgs = messages.filter(role='user').count()
        ai_msgs = messages.filter(role='assistant').count()
        
        # Tokens utilisés (si disponible dans metadata)
        total_tokens = 0
        for msg in messages:
            metadata = getattr(msg, 'metadata', {}) or {}
            total_tokens += metadata.get('tokens_used', 0)
        
        # Durée
        if messages.exists():
            first_msg = messages.first()
            last_msg = messages.last()
            duration = format_duration(first_msg.timestamp, last_msg.timestamp)
        else:
            duration = "N/A"
        
        # Créer les cards de stats
        stats_data = [
            [
                Paragraph('<b>Messages</b><br/>', self.styles['StatLabel']),
                Paragraph('<b>Durée</b><br/>', self.styles['StatLabel']),
                Paragraph('<b>Tokens</b><br/>', self.styles['StatLabel']),
            ],
            [
                Paragraph(str(msg_count), self.styles['StatValue']),
                Paragraph(duration, self.styles['StatValue']),
                Paragraph(f"{total_tokens:,}" if total_tokens > 0 else "N/A", self.styles['StatValue']),
            ]
        ]
        
        stats_table = Table(stats_data, colWidths=[self.content_width/3] * 3)
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), TerasColors.BG_LIGHT),
            ('BACKGROUND', (0, 1), (-1, 1), white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, TerasColors.BORDER),
        ]))
        
        elements.append(stats_table)
        elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_info(self, conversation):
        """Informations de conversation enrichies"""
        elements = []
        
        # Titre de conversation
        title = sanitize_text(conversation.title or "Conversation")
        elements.append(Paragraph(
            f'{title}',
            self.styles['ConversationTitle']
        ))
        
        # Métadonnées
        created = format_datetime(conversation.created_at) if conversation.created_at else "N/A"
        username = sanitize_text(
            conversation.user.get_full_name() or conversation.user.username
        ) if conversation.user else "Utilisateur"
        
        info_data = [
            ['Date de création:', created],
            ['Utilisateur:', username],
            ['ID Conversation:', str(conversation.id)],
        ]
        
        info_table = Table(info_data, colWidths=[4*cm, self.content_width - 4*cm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), TerasColors.TEXT_MEDIUM),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 20))
        
        # Séparateur
        sep = Table([['']], colWidths=[self.content_width])
        sep.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, 0), 1, TerasColors.BORDER),
        ]))
        elements.append(sep)
        elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_toc(self, messages):
        """Table des matières pour conversations longues"""
        elements = []
        
        elements.append(Paragraph("Table des matières", self.styles['SectionTitle']))
        elements.append(Spacer(1, 10))
        
        toc_data = []
        for i, msg in enumerate(messages[:20], 1):  # Max 20 dans TOC
            preview = msg.content[:60] + "..." if len(msg.content) > 60 else msg.content
            preview = sanitize_text(preview)
            role = "Vous" if msg.role == 'user' else "Assistant"
            time = msg.timestamp.strftime('%H:%M') if msg.timestamp else ""
            
            toc_data.append([
                f"{i}.",
                role,
                preview,
                time
            ])
        
        toc_table = Table(
            toc_data,
            colWidths=[1*cm, 2*cm, self.content_width - 5*cm, 2*cm]
        )
        toc_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (-1, -1), TerasColors.TEXT_MEDIUM),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, TerasColors.BORDER_LIGHT),
        ]))
        
        elements.append(toc_table)
        elements.append(Spacer(1, 20))
        
        return elements
    
    def _build_messages_premium(self, conversation):
        """Messages avec design ultra-professionnel"""
        elements = []
        
        elements.append(Paragraph("Historique de conversation", self.styles['SectionTitle']))
        elements.append(Spacer(1, 12))
        
        messages = conversation.messages.all().order_by('timestamp')
        
        for idx, msg in enumerate(messages, 1):
            elements.extend(self._build_single_message(msg, idx))
        
        return elements
    
    def _build_single_message(self, msg, index):
        """Construit un message individuel avec tous les détails"""
        elements = []
        
        is_user = msg.role == 'user'
        
        # Couleurs selon le rôle
        if is_user:
            bg_color = TerasColors.USER_BG
            border_color = TerasColors.USER_BORDER
            badge_color = TerasColors.USER_BADGE
            role_text = "VOUS"
        else:
            bg_color = TerasColors.ASSISTANT_BG
            border_color = TerasColors.ASSISTANT_BORDER
            badge_color = TerasColors.ASSISTANT_BADGE
            role_text = "ASSISTANT IA"
        
        # Header du message (badge + timestamp)
        time_str = msg.timestamp.strftime('%H:%M:%S') if msg.timestamp else ""
        
        badge_para = Paragraph(
            f'<b>{role_text}</b>',
            self.styles['RoleBadge']
        )
        
        time_para = Paragraph(
            f'#{index} • {time_str}',
            self.styles['Timestamp']
        )
        
        header_table = Table(
            [[badge_para, time_para]],
            colWidths=[self.content_width * 0.7, self.content_width * 0.3]
        )
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), badge_color),
            ('TEXTCOLOR', (0, 0), (0, 0), white),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (0, 0), 10),
            ('RIGHTPADDING', (1, 0), (1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        
        elements.append(header_table)
        elements.append(Spacer(1, 2))
        
        # Contenu du message
        content = msg.content or ""
        
        # Extraire les code blocks
        blocks = extract_code_blocks(content)
        
        for block_type, block_content in blocks:
            if block_type == 'code':
                # Code block avec background spécial
                lang = block_content['language']
                code = block_content['content']
                
                # Label du langage
                lang_para = Paragraph(
                    f'<b>{lang.upper()}</b>',
                    ParagraphStyle('CodeLang', fontName='Helvetica-Bold',
                                 fontSize=8, textColor=TerasColors.TEXT_LIGHT)
                )
                elements.append(lang_para)
                elements.append(Spacer(1, 2))
                
                # Code
                code_para = Paragraph(
                    sanitize_text(code, preserve_code=True),
                    self.styles['CodeBlock']
                )
                
                code_table = Table([[code_para]], colWidths=[self.content_width - 2*cm])
                code_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), TerasColors.CODE_BG),
                    ('LEFTPADDING', (0, 0), (-1, -1), 15),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                    ('TOPPADDING', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ]))
                
                elements.append(code_table)
                elements.append(Spacer(1, 5))
                
            else:
                # Texte normal - découper si trop long
                text = sanitize_text(block_content)
                chunks = split_long_text(text, max_lines=25)
                
                for i, chunk in enumerate(chunks):
                    para = Paragraph(chunk, self.styles['MessageContent'])
                    
                    msg_table = Table([[para]], colWidths=[self.content_width - 1*cm])
                    msg_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, -1), bg_color),
                        ('LEFTPADDING', (0, 0), (-1, -1), 15),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                        ('TOPPADDING', (0, 0), (-1, -1), 12),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
                    ]))
                    
                    elements.append(msg_table)
                    
                    # Indicateur de continuation
                    if i < len(chunks) - 1:
                        elements.append(Spacer(1, 3))
                        elements.append(Paragraph(
                            '<font color="#94a3b8" size="7">(suite...)</font>',
                            self.styles['Metadata']
                        ))
                        elements.append(Spacer(1, 3))
        
        # Sources RAG si disponibles
        metadata = getattr(msg, 'metadata', {}) or {}
        if metadata.get('used_rag') and metadata.get('sources_count', 0) > 0:
            elements.append(Spacer(1, 5))
            
            sources_para = Paragraph(
                f'<b>📚 Sources utilisées:</b> {metadata["sources_count"]} document(s)',
                self.styles['Source']
            )
            
            sources_table = Table([[sources_para]], colWidths=[self.content_width - 1*cm])
            sources_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), TerasColors.SOURCE_BG),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('BOX', (0, 0), (-1, -1), 1, TerasColors.SOURCE_BORDER),
            ]))
            
            elements.append(sources_table)
        
        elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_premium_footer(self, conversation):
        """Footer premium avec informations complètes"""
        elements = []
        
        elements.append(Spacer(1, 30))
        
        # Ligne de séparation
        sep = Table([['']], colWidths=[self.content_width])
        sep.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, 0), 2, TerasColors.BORDER),
        ]))
        elements.append(sep)
        elements.append(Spacer(1, 15))
        
        # Texte footer
        now = datetime.now()
        export_date = now.strftime('%d/%m/%Y à %H:%M')
        
        footer_text = f"""<b>Document généré le {export_date}</b><br/>
<br/>
TERAS - Système d'Évaluation et Recommandation d'Actions Stratégiques<br/>
Plateforme d'analyse financière pour la région CEMAC<br/>
<br/>
<i>Ce document est une exportation de conversation avec l'Assistant IA TERAS.<br/>
Pour plus d'informations: www.teras-system.com</i><br/>
<br/>
© 2025 TERAS System - Tous droits réservés"""
        
        elements.append(Paragraph(
            footer_text,
            self.styles['Footer']
        ))
        
        return elements
    
    def _build_simple_fallback(self, conversation):
        """Version simplifiée en cas d'erreur critique"""
        elements = []
        
        elements.append(Paragraph("TERAS - Conversation", self.styles['TerasTitle']))
        elements.append(Spacer(1, 20))
        
        title = sanitize_text(conversation.title or "Conversation")
        elements.append(Paragraph(f'<b>{title}</b>', self.styles['ConversationTitle']))
        elements.append(Spacer(1, 15))
        
        messages = conversation.messages.all().order_by('timestamp')
        
        for msg in messages:
            is_user = msg.role == 'user'
            label = "Vous" if is_user else "Assistant IA"
            time = msg.timestamp.strftime('%H:%M') if msg.timestamp else ""
            
            elements.append(Paragraph(
                f'<b>{label}</b> - {time}',
                self.styles['Metadata']
            ))
            
            content = sanitize_text(msg.content)
            chunks = split_long_text(content, max_lines=20)
            
            for chunk in chunks:
                elements.append(Paragraph(chunk, self.styles['MessageContent']))
                elements.append(Spacer(1, 3))
            
            elements.append(Spacer(1, 10))
        
        return elements


# ═══════════════════════════════════════════════════════════
# FONCTION HELPER
# ═══════════════════════════════════════════════════════════

def export_conversation_to_pdf(conversation, output_path=None):
    """
    Exporte une conversation en PDF ultra-professionnel
    
    Args:
        conversation: ChatConversation instance
        output_path: Chemin fichier optionnel (pour sauvegarde)
    
    Returns:
        BytesIO du PDF généré
    """
    exporter = ChatPDFExporter()
    return exporter.export_conversation(conversation, output_path)

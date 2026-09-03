# backend/scoring/pdf_export_recommendations.py
# -*- coding: utf-8 -*-
"""
TERAS Recommendations PDF Export Service - VERSION 2.0 PROFESSIONNELLE
======================================================================
Export PDF professionnel pour les plans d'action IA personnalisés

✅ Design moderne harmonisé avec l'application TERAS
✅ Support complet UTF-8 (accents français)
✅ Mise en page professionnelle avec sections colorées
✅ Plan d'action visuellement attrayant
"""

from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, Color, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, ListFlowable, ListItem
)
import logging

logger = logging.getLogger('scoring.pdf_export')


# ═══════════════════════════════════════════════════════════
# COULEURS TERAS
# ═══════════════════════════════════════════════════════════

class TerasColors:
    """Palette de couleurs TERAS harmonisée"""
    
    # Couleurs principales
    PRIMARY = HexColor('#6366f1')
    PRIMARY_DARK = HexColor('#4f46e5')
    PRIMARY_LIGHT = HexColor('#a5b4fc')
    
    # Catégories (piliers TERAS)
    TRANSACTIONS = HexColor('#3b82f6')    # Bleu
    EPARGNE = HexColor('#10b981')          # Vert
    REVENUS = HexColor('#f59e0b')          # Orange
    ACTIFS = HexColor('#8b5cf6')           # Violet
    SOCIAL = HexColor('#ec4899')           # Rose
    
    # Texte
    TEXT_DARK = HexColor('#1e293b')
    TEXT_MEDIUM = HexColor('#475569')
    TEXT_LIGHT = HexColor('#94a3b8')
    TEXT_WHITE = HexColor('#ffffff')
    
    # Fond
    BG_LIGHT = HexColor('#f8fafc')
    BG_CARD = HexColor('#ffffff')
    BORDER = HexColor('#e2e8f0')
    
    # Statuts
    SUCCESS = HexColor('#10b981')
    WARNING = HexColor('#f59e0b')
    INFO = HexColor('#0ea5e9')
    
    @classmethod
    def get_category_color(cls, category: str) -> HexColor:
        """Retourne la couleur associée à une catégorie"""
        colors = {
            'transactions': cls.TRANSACTIONS,
            'epargne': cls.EPARGNE,
            'revenus': cls.REVENUS,
            'actifs': cls.ACTIFS,
            'social': cls.SOCIAL,
        }
        return colors.get(category.lower(), cls.PRIMARY)


# ═══════════════════════════════════════════════════════════
# UTILITAIRES
# ═══════════════════════════════════════════════════════════

def sanitize_text(text: str) -> str:
    """Nettoie le texte pour ReportLab"""
    if not text:
        return ""
    
    text = str(text)
    
    # Remplacements d'emojis
    emoji_map = {
        '😊': '', '👍': '', '💪': '', '🎯': '', '📊': '',
        '📈': '', '📉': '', '💰': '', '💵': '', '💳': '',
        '✅': '[OK]', '❌': '[X]', '⚠️': '[!]', '💡': '',
        '🔍': '', '📚': '', '📋': '', '📝': '', '🎉': '',
        '🌟': '*', '⭐': '*', '🥇': '', '🥈': '', '🥉': '',
        '💎': '', '🚀': '', '✨': '', '→': '->', '←': '<-',
        '•': '-', '●': '*', '★': '*', '✓': '[v]', '✗': '[x]',
        '—': '-', '–': '-', '"': '"', '"': '"', ''': "'", ''': "'",
        '…': '...', '©': '(c)', '®': '(R)',
    }
    
    for emoji, replacement in emoji_map.items():
        text = text.replace(emoji, replacement)
    
    # Nettoyer caractères non supportés
    cleaned = []
    for char in text:
        code = ord(char)
        if code < 0x1F600 or (0x00C0 <= code <= 0x00FF):
            cleaned.append(char)
    
    text = ''.join(cleaned)
    
    # Échapper HTML
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;').replace('>', '&gt;')
    text = text.replace('\n', '<br/>')
    
    return text


def format_datetime(dt) -> str:
    """Formate une date/heure en français"""
    if not dt:
        return ""
    
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except:
            return dt
    
    mois = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
            'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    
    return f"{dt.day} {mois[dt.month]} {dt.year} à {dt.strftime('%H:%M')}"


# ═══════════════════════════════════════════════════════════
# SERVICE D'EXPORT PDF
# ═══════════════════════════════════════════════════════════

class RecommendationPDFExporter:
    """
    Génère un PDF professionnel pour les recommandations IA TERAS
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        self.page_width, self.page_height = A4
        self.margin = 2 * cm
        self.content_width = self.page_width - 2 * self.margin
    
    def _setup_custom_styles(self):
        """Configure les styles personnalisés"""
        
        # Titre principal TERAS
        self.styles.add(ParagraphStyle(
            name='TerasLogo',
            fontName='Helvetica-Bold',
            fontSize=32,
            textColor=TerasColors.PRIMARY,
            alignment=TA_CENTER,
            spaceAfter=5,
        ))
        
        # Titre du document
        self.styles.add(ParagraphStyle(
            name='DocTitle',
            fontName='Helvetica-Bold',
            fontSize=24,
            textColor=TerasColors.TEXT_DARK,
            alignment=TA_CENTER,
            spaceAfter=5,
        ))
        
        # Sous-titre (catégorie)
        self.styles.add(ParagraphStyle(
            name='DocSubtitle',
            fontName='Helvetica',
            fontSize=14,
            textColor=TerasColors.TEXT_MEDIUM,
            alignment=TA_CENTER,
            spaceAfter=20,
        ))
        
        # Titre de section
        self.styles.add(ParagraphStyle(
            name='SectionTitle',
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=TerasColors.TEXT_DARK,
            spaceBefore=20,
            spaceAfter=10,
        ))
        
        # Corps de texte
        self.styles.add(ParagraphStyle(
            name='BodyText',
            fontName='Helvetica',
            fontSize=11,
            textColor=TerasColors.TEXT_MEDIUM,
            leading=16,
            spaceAfter=10,
            alignment=TA_JUSTIFY,
        ))
        
        # Titre d'étape
        self.styles.add(ParagraphStyle(
            name='StepTitle',
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=TerasColors.TEXT_DARK,
            spaceBefore=8,
            spaceAfter=4,
        ))
        
        # Description d'étape
        self.styles.add(ParagraphStyle(
            name='StepDescription',
            fontName='Helvetica',
            fontSize=10,
            textColor=TerasColors.TEXT_MEDIUM,
            leading=14,
            leftIndent=20,
            spaceAfter=8,
        ))
        
        # Conseil
        self.styles.add(ParagraphStyle(
            name='Conseil',
            fontName='Helvetica',
            fontSize=10,
            textColor=TerasColors.TEXT_MEDIUM,
            leading=14,
            leftIndent=15,
            spaceAfter=4,
        ))
        
        # Métadonnées
        self.styles.add(ParagraphStyle(
            name='Metadata',
            fontName='Helvetica',
            fontSize=10,
            textColor=TerasColors.TEXT_LIGHT,
        ))
        
        # Pied de page
        self.styles.add(ParagraphStyle(
            name='Footer',
            fontName='Helvetica',
            fontSize=8,
            textColor=TerasColors.TEXT_LIGHT,
            alignment=TA_CENTER,
        ))
    
    def export_recommendation(self, detail_data: dict, output_path=None):
        """
        Génère le PDF de la recommandation
        
        Args:
            detail_data: Dict contenant diagnostic, objectif, plan_action, etc.
            output_path: Chemin de sortie optionnel
        
        Returns:
            BytesIO du PDF
        """
        
        buffer = BytesIO()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=self.margin,
            leftMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin,
        )
        
        story = []
        
        # Récupérer la catégorie pour la couleur
        category = detail_data.get('category', 'transactions')
        category_color = TerasColors.get_category_color(category)
        
        # === EN-TÊTE ===
        story.extend(self._build_header(detail_data, category_color))
        
        # === INFORMATIONS UTILISATEUR ===
        story.extend(self._build_user_info(detail_data))
        
        # === DIAGNOSTIC ===
        story.extend(self._build_diagnostic_section(detail_data, category_color))
        
        # === OBJECTIF ===
        story.extend(self._build_objective_section(detail_data, category_color))
        
        # === PLAN D'ACTION ===
        story.extend(self._build_action_plan_section(detail_data, category_color))
        
        # === IMPACT & DÉLAI ===
        story.extend(self._build_impact_section(detail_data, category_color))
        
        # === CONSEILS BONUS ===
        story.extend(self._build_tips_section(detail_data, category_color))
        
        # === PIED DE PAGE ===
        story.extend(self._build_footer())
        
        # Générer le PDF
        try:
            doc.build(story)
        except Exception as e:
            logger.error(f"Erreur génération PDF recommandation: {e}", exc_info=True)
            raise
        
        buffer.seek(0)
        
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())
            buffer.seek(0)
        
        logger.info(f"PDF recommandation généré: {category}")
        
        return buffer
    
    def _build_header(self, data: dict, category_color: HexColor):
        """Construit l'en-tête du document"""
        
        elements = []
        
        # Logo TERAS
        elements.append(Paragraph(
            "TERAS",
            self.styles['TerasLogo']
        ))
        
        # Titre
        elements.append(Paragraph(
            "Plan d'Action IA Personnalisé",
            self.styles['DocTitle']
        ))
        
        # Catégorie
        category = data.get('category', '')
        category_labels = {
            'transactions': 'Pilier Transactions',
            'epargne': 'Pilier Épargne',
            'revenus': 'Pilier Revenus',
            'actifs': 'Pilier Actifs',
            'social': 'Pilier Social',
        }
        category_label = category_labels.get(category, category.title())
        
        # Badge catégorie coloré
        badge_table = Table(
            [[Paragraph(f'<b>{category_label}</b>', ParagraphStyle(
                'Badge', 
                fontName='Helvetica-Bold',
                fontSize=11,
                textColor=white,
                alignment=TA_CENTER,
            ))]],
            colWidths=[5*cm]
        )
        badge_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), category_color),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ]))
        
        # Centrer le badge
        centered_badge = Table([[badge_table]], colWidths=[self.content_width])
        centered_badge.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        
        elements.append(Spacer(1, 10))
        elements.append(centered_badge)
        elements.append(Spacer(1, 20))
        
        return elements
    
    def _build_user_info(self, data: dict):
        """Construit la section informations utilisateur"""
        
        elements = []
        
        user_name = sanitize_text(data.get('user_name', 'Utilisateur'))
        current_score = data.get('current_score', 0)
        generated_at = data.get('generated_at', datetime.now().isoformat())
        
        info_data = [
            ['Utilisateur:', user_name],
            ['Score actuel:', f'{current_score}/1000'],
            ['Généré le:', format_datetime(generated_at)],
        ]
        
        info_table = Table(info_data, colWidths=[4*cm, self.content_width - 4*cm])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), TerasColors.BG_LIGHT),
            ('TEXTCOLOR', (0, 0), (-1, -1), TerasColors.TEXT_DARK),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, TerasColors.BORDER),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 20))
        
        return elements
    
    def _build_section_header(self, title: str, icon: str, color: HexColor):
        """Crée un en-tête de section coloré"""
        
        header_table = Table(
            [[Paragraph(f'{icon} <b>{title}</b>', ParagraphStyle(
                'SectionHeader',
                fontName='Helvetica-Bold',
                fontSize=12,
                textColor=color,
            ))]],
            colWidths=[self.content_width]
        )
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8fafc')),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LINEBELOW', (0, 0), (-1, -1), 2, color),
        ]))
        
        return header_table
    
    def _build_diagnostic_section(self, data: dict, color: HexColor):
        """Construit la section diagnostic"""
        
        elements = []
        
        elements.append(self._build_section_header("Diagnostic", "[!]", color))
        elements.append(Spacer(1, 10))
        
        diagnostic = sanitize_text(data.get('diagnostic', 'Diagnostic non disponible'))
        elements.append(Paragraph(diagnostic, self.styles['BodyText']))
        elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_objective_section(self, data: dict, color: HexColor):
        """Construit la section objectif"""
        
        elements = []
        
        elements.append(self._build_section_header("Objectif", "[>]", color))
        elements.append(Spacer(1, 10))
        
        objectif = sanitize_text(data.get('objectif', 'Objectif non défini'))
        
        # Encadré objectif
        obj_table = Table(
            [[Paragraph(f'<b>{objectif}</b>', ParagraphStyle(
                'Objective',
                fontName='Helvetica-Bold',
                fontSize=11,
                textColor=TerasColors.TEXT_DARK,
                alignment=TA_CENTER,
            ))]],
            colWidths=[self.content_width - 2*cm]
        )
        obj_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), TerasColors.BG_LIGHT),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('BOX', (0, 0), (-1, -1), 1, color),
        ]))
        
        elements.append(obj_table)
        elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_action_plan_section(self, data: dict, color: HexColor):
        """Construit la section plan d'action"""
        
        elements = []
        
        elements.append(self._build_section_header("Plan d'Action", "[v]", color))
        elements.append(Spacer(1, 10))
        
        plan_action = data.get('plan_action', [])
        
        for step in plan_action:
            etape_num = step.get('etape', 1)
            titre = sanitize_text(step.get('titre', ''))
            description = sanitize_text(step.get('description', ''))
            
            # Numéro d'étape avec badge coloré
            step_header = Table(
                [
                    [
                        Paragraph(f'<b>{etape_num}</b>', ParagraphStyle(
                            'StepNum',
                            fontName='Helvetica-Bold',
                            fontSize=11,
                            textColor=white,
                            alignment=TA_CENTER,
                        )),
                        Paragraph(f'<b>{titre}</b>', self.styles['StepTitle'])
                    ]
                ],
                colWidths=[1*cm, self.content_width - 1.5*cm]
            )
            step_header.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, 0), color),
                ('ALIGN', (0, 0), (0, 0), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (0, 0), 4),
                ('BOTTOMPADDING', (0, 0), (0, 0), 4),
                ('LEFTPADDING', (1, 0), (1, 0), 10),
            ]))
            
            elements.append(step_header)
            elements.append(Paragraph(description, self.styles['StepDescription']))
            elements.append(Spacer(1, 8))
        
        elements.append(Spacer(1, 10))
        
        return elements
    
    def _build_impact_section(self, data: dict, color: HexColor):
        """Construit la section impact et délai"""
        
        elements = []
        
        impact = sanitize_text(data.get('impact_points', 'Non défini'))
        delai = sanitize_text(data.get('delai', 'Non défini'))
        
        impact_data = [
            [
                Paragraph('<b>Impact estimé</b>', ParagraphStyle(
                    'ImpactHeader', fontName='Helvetica-Bold', fontSize=10,
                    textColor=white, alignment=TA_CENTER
                )),
                Paragraph('<b>Délai</b>', ParagraphStyle(
                    'DelaiHeader', fontName='Helvetica-Bold', fontSize=10,
                    textColor=white, alignment=TA_CENTER
                )),
            ],
            [
                Paragraph(impact, ParagraphStyle(
                    'ImpactValue', fontName='Helvetica-Bold', fontSize=12,
                    textColor=TerasColors.TEXT_DARK, alignment=TA_CENTER
                )),
                Paragraph(delai, ParagraphStyle(
                    'DelaiValue', fontName='Helvetica-Bold', fontSize=12,
                    textColor=TerasColors.TEXT_DARK, alignment=TA_CENTER
                )),
            ]
        ]
        
        impact_table = Table(impact_data, colWidths=[self.content_width/2, self.content_width/2])
        impact_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), color),
            ('BACKGROUND', (0, 1), (-1, 1), TerasColors.BG_LIGHT),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, TerasColors.BORDER),
        ]))
        
        elements.append(impact_table)
        elements.append(Spacer(1, 20))
        
        return elements
    
    def _build_tips_section(self, data: dict, color: HexColor):
        """Construit la section conseils bonus"""
        
        elements = []
        
        conseils = data.get('conseils_bonus', [])
        
        if conseils:
            elements.append(self._build_section_header("Conseils Bonus", "[*]", color))
            elements.append(Spacer(1, 10))
            
            for conseil in conseils:
                conseil_safe = sanitize_text(conseil)
                elements.append(Paragraph(
                    f"• {conseil_safe}",
                    self.styles['Conseil']
                ))
            
            elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_footer(self):
        """Construit le pied de page"""
        
        elements = []
        
        # Ligne de séparation
        sep_table = Table([['']], colWidths=[self.content_width])
        sep_table.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, 0), 1, TerasColors.BORDER),
        ]))
        elements.append(sep_table)
        elements.append(Spacer(1, 15))
        
        footer_text = """Ce plan a été généré par l'Assistant IA TERAS.
Pour toute question, contactez votre conseiller TERAS.

© 2025 TERAS System - Système d'évaluation financière CEMAC"""
        
        elements.append(Paragraph(
            footer_text.replace('\n', '<br/>'),
            self.styles['Footer']
        ))
        
        return elements


# ═══════════════════════════════════════════════════════════
# FONCTION HELPER
# ═══════════════════════════════════════════════════════════

def export_recommendation_to_pdf(detail_data: dict, output_path=None):
    """
    Fonction helper pour exporter une recommandation en PDF
    
    Args:
        detail_data: Dictionnaire avec les données de la recommandation
        output_path: Chemin de sortie optionnel
    
    Returns:
        BytesIO du PDF généré
    """
    exporter = RecommendationPDFExporter()
    return exporter.export_recommendation(detail_data, output_path)

# backend/admin/services/ai_service.py
"""
Service d'analyse de documents avec Claude API (Anthropic)
Analyse automatique des documents KYC avec détection de fraude
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

import anthropic
from PyPDF2 import PdfReader
from PIL import Image
import io

logger = logging.getLogger(__name__)

# Configuration
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
CLAUDE_MODEL = 'claude-sonnet-4-20250514'


class AIDocumentAnalyzer:
    """Analyseur de documents avec Claude API"""
    
    def __init__(self):
        if not ANTHROPIC_API_KEY:
            logger.warning("ANTHROPIC_API_KEY non configurée")
        
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
    
    def analyze_document(
        self, 
        document,
        user,
        legislation_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyse complète d'un document avec Claude
        
        Args:
            document: Instance du modèle Document
            user: Instance du modèle User
            legislation_context: Contexte législatif pertinent (optionnel)
        
        Returns:
            Dict avec les résultats de l'analyse
        """
        
        try:
            # 1. Extraction du texte
            extracted_text = self._extract_text(document)
            
            if not extracted_text:
                return self._create_error_response("Impossible d'extraire le texte du document")
            
            # 2. Récupérer contexte législatif si non fourni
            if not legislation_context:
                from .legislation_service import LegislationService
                leg_service = LegislationService()
                legislation_context = leg_service.get_relevant_legislation(
                    country=user.country,
                    document_type=document.document_type
                )
            
            # 3. Construire le prompt pour Claude
            prompt = self._build_analysis_prompt(
                document=document,
                user=user,
                extracted_text=extracted_text,
                legislation_context=legislation_context
            )
            
            # 4. Appeler Claude API
            if not self.client:
                logger.warning("Claude API non disponible, retour analyse mock")
                return self._create_mock_analysis(document, user)
            
            response = self.client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=2000,
                temperature=0.2,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            # 5. Parser la réponse JSON
            analysis_text = response.content[0].text
            analysis_json = self._parse_claude_response(analysis_text)
            
            # 6. Enrichir avec métadonnées
            analysis_json['analyzed_at'] = datetime.now().isoformat()
            analysis_json['model_version'] = CLAUDE_MODEL
            analysis_json['extracted_text_length'] = len(extracted_text)
            
            logger.info(f"Document {document.id} analysé avec succès")
            
            return analysis_json
            
        except Exception as e:
            logger.error(f"Erreur analyse document {document.id}: {str(e)}")
            return self._create_error_response(str(e))
    
    def _extract_text(self, document) -> str:
        """Extrait le texte d'un document (PDF ou Image)"""
        
        try:
            file_path = document.file.path
            mime_type = document.mime_type
            
            # PDF
            if 'pdf' in mime_type.lower():
                return self._extract_text_from_pdf(file_path)
            
            # Image (OCR simple - améliorer avec Tesseract si besoin)
            elif 'image' in mime_type.lower():
                return self._extract_text_from_image(file_path)
            
            else:
                logger.warning(f"Type de fichier non supporté: {mime_type}")
                return ""
                
        except Exception as e:
            logger.error(f"Erreur extraction texte: {str(e)}")
            return ""
    
    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extrait le texte d'un PDF"""
        
        try:
            reader = PdfReader(file_path)
            text = ""
            
            for page in reader.pages[:10]:  # Max 10 pages
                text += page.extract_text() + "\n"
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Erreur lecture PDF: {str(e)}")
            return ""
    
    def _extract_text_from_image(self, file_path: str) -> str:
        """
        Extrait le texte d'une image
        Note: Version simple, utiliser Tesseract OCR pour améliorer
        """
        
        try:
            # Pour l'instant, retourne message indicatif
            # TODO: Implémenter OCR avec pytesseract
            return "[Image détectée - OCR à implémenter]"
            
        except Exception as e:
            logger.error(f"Erreur lecture image: {str(e)}")
            return ""
    
    def _build_analysis_prompt(
        self,
        document,
        user,
        extracted_text: str,
        legislation_context: str
    ) -> str:
        """Construit le prompt pour Claude"""
        
        doc_type_display = document.get_document_type_display()
        
        prompt = f"""Tu es un expert en analyse de documents KYC/AML pour la région CEMAC.

CONTEXTE:
- Document: {doc_type_display}
- Pays: {user.country}
- Utilisateur: {user.get_full_name()}
- Email: {user.email}
- Type compte: {user.user_type}

TEXTE EXTRAIT DU DOCUMENT:
{extracted_text[:3000]}  

LÉGISLATION APPLICABLE:
{legislation_context[:2000] if legislation_context else 'Non disponible'}

TÂCHES À EFFECTUER:

1. EXTRACTION DE DONNÉES
   Extrais les informations clés selon le type de document:
   - Nom complet
   - Numéro d'identification
   - Dates importantes (naissance, émission, expiration)
   - Autorité émettrice
   - Autres champs pertinents

2. VÉRIFICATIONS
   - is_expired: Le document est-il expiré?
   - matches_user_info: Les infos correspondent-elles au profil user?
   - is_legible: Le texte est-il lisible et complet?
   - has_required_fields: Tous les champs requis sont présents?

3. DÉTECTION DE FRAUDE
   Analyse les indicateurs suivants:
   - Incohérences dans les dates
   - Informations contradictoires
   - Qualité suspecte du document
   - Patterns inhabituels
   
   Donne un score de fraude de 0 à 100:
   - 0-30: Risque faible
   - 31-70: Risque moyen
   - 71-100: Risque élevé

4. CONFORMITÉ LÉGALE
   - Le document respecte-t-il les exigences légales du pays?
   - Y a-t-il des problèmes de conformité?

5. RECOMMANDATION FINALE
   Choisis parmi: "approve", "reject", "review", "request_more"
   
   Justifie ta recommandation.

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de backticks):

{{
  "extracted_data": {{
    "full_name": "...",
    "id_number": "...",
    "birth_date": "YYYY-MM-DD",
    "issue_date": "YYYY-MM-DD",
    "expiry_date": "YYYY-MM-DD",
    "issuing_authority": "..."
  }},
  "checks": {{
    "is_expired": false,
    "matches_user_info": true,
    "is_legible": true,
    "has_required_fields": true
  }},
  "fraud_indicators": {{
    "score": 15,
    "flags": ["Aucune anomalie détectée"],
    "severity": "low"
  }},
  "compliance": {{
    "is_compliant": true,
    "issues": []
  }},
  "confidence_score": 87.5,
  "recommendation": "approve",
  "reason": "Document valide, toutes vérifications passées"
}}
"""
        
        return prompt
    
    def _parse_claude_response(self, response_text: str) -> Dict[str, Any]:
        """Parse la réponse JSON de Claude"""
        
        try:
            # Nettoyer les backticks markdown si présents
            clean_text = response_text.strip()
            
            if clean_text.startswith('```'):
                # Enlever les backticks
                lines = clean_text.split('\n')
                clean_text = '\n'.join(lines[1:-1] if len(lines) > 2 else lines)
            
            if clean_text.startswith('```json'):
                clean_text = clean_text[7:]
            
            clean_text = clean_text.strip('```').strip()
            
            # Parser le JSON
            analysis = json.loads(clean_text)
            
            return analysis
            
        except json.JSONDecodeError as e:
            logger.error(f"Erreur parsing JSON Claude: {str(e)}")
            logger.error(f"Réponse brute: {response_text[:500]}")
            
            # Retour par défaut
            return {
                "extracted_data": {},
                "checks": {
                    "is_expired": False,
                    "matches_user_info": False,
                    "is_legible": False,
                    "has_required_fields": False
                },
                "fraud_indicators": {
                    "score": 50,
                    "flags": ["Erreur parsing réponse IA"],
                    "severity": "medium"
                },
                "compliance": {
                    "is_compliant": False,
                    "issues": ["Erreur analyse"]
                },
                "confidence_score": 0,
                "recommendation": "review",
                "reason": "Erreur lors de l'analyse - révision manuelle requise"
            }
    
    def _create_mock_analysis(self, document, user) -> Dict[str, Any]:
        """Crée une analyse mock quand API non disponible"""
        
        return {
            "extracted_data": {
                "full_name": user.get_full_name(),
                "id_number": "MOCK-2024-001",
                "birth_date": "1990-01-01",
                "issue_date": "2024-01-01",
                "expiry_date": "2034-01-01",
                "issuing_authority": "Mock Authority"
            },
            "checks": {
                "is_expired": False,
                "matches_user_info": True,
                "is_legible": True,
                "has_required_fields": True
            },
            "fraud_indicators": {
                "score": 15,
                "flags": ["Mock analysis - API non configurée"],
                "severity": "low"
            },
            "compliance": {
                "is_compliant": True,
                "issues": []
            },
            "confidence_score": 75.0,
            "recommendation": "review",
            "reason": "Analyse mock - API Claude non configurée. Révision manuelle recommandée."
        }
    
    def _create_error_response(self, error_message: str) -> Dict[str, Any]:
        """Crée une réponse d'erreur standardisée"""
        
        return {
            "extracted_data": {},
            "checks": {
                "is_expired": False,
                "matches_user_info": False,
                "is_legible": False,
                "has_required_fields": False
            },
            "fraud_indicators": {
                "score": 100,
                "flags": [f"Erreur: {error_message}"],
                "severity": "critical"
            },
            "compliance": {
                "is_compliant": False,
                "issues": [error_message]
            },
            "confidence_score": 0,
            "recommendation": "review",
            "reason": f"Erreur lors de l'analyse: {error_message}"
        }


# Instance globale
ai_analyzer = AIDocumentAnalyzer()


def analyze_document_sync(document, user, legislation_context=None):
    """
    Fonction helper pour analyse synchrone
    """
    return ai_analyzer.analyze_document(document, user, legislation_context)

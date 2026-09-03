# backend/legislation/ai_analyzer.py
"""Analyse IA des documents de législation — Python 3.14 compatible (requests)"""

import os
import json
import requests
from typing import Dict, Any, Optional


class LegislationAIAnalyzer:
    def __init__(self):
        self.api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        self.model = "claude-sonnet-4-20250514"
        self.endpoint = "https://api.anthropic.com/v1/messages"

    def _call_claude(self, prompt: str, max_tokens: int = 2000) -> str:
        try:
            resp = requests.post(
                self.endpoint,
                headers={
                    "x-api-key": self.api_key,
                    "content-type": "application/json",
                    "anthropic-version": "2023-06-01",
                },
                json={"model": self.model, "max_tokens": max_tokens,
                      "messages": [{"role": "user", "content": prompt}]},
                timeout=60
            )
            resp.raise_for_status()
            return resp.json()["content"][0]["text"].strip()
        except Exception as e:
            print(f"Erreur Claude: {e}")
            return ""

    def analyze_document(self, file_path: str, document_type: str) -> Dict[str, Any]:
        text = self._extract_text(file_path, document_type)
        if not text:
            return {"success": False, "error": "Extraction texte impossible"}

        prompt = f"""Analyse ce document législatif CEMAC. Réponds uniquement en JSON:
{{
  "type_detected": "loi|règlement|directive|circulaire",
  "main_topic": "sujet principal",
  "key_points": ["point1", "point2"],
  "affected_sectors": ["secteur1"],
  "summary": "résumé en 2 paragraphes",
  "keywords": ["mot1", "mot2"]
}}

Document:
{text[:10000]}"""

        result_text = self._call_claude(prompt)
        try:
            clean = result_text.replace("```json", "").replace("```", "").strip()
            analysis = json.loads(clean)
        except Exception:
            analysis = {"summary": result_text or "Analyse non disponible", "key_points": []}

        return {"success": True, "extracted_text": text[:5000], "analysis": analysis}

    def _extract_text(self, file_path: str, mime_type: str) -> Optional[str]:
        try:
            if "pdf" in mime_type.lower():
                from PyPDF2 import PdfReader
                reader = PdfReader(file_path)
                return "\n\n".join(p.extract_text() or "" for p in reader.pages)
            elif "text" in mime_type.lower():
                with open(file_path, "r", encoding="utf-8") as f:
                    return f.read()
            return None
        except Exception as e:
            print(f"Extraction error: {e}")
            return None

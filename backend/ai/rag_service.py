# -*- coding: utf-8 -*-
# backend/ai/rag_service.py
"""
TERAS RAG Service - VERSION 5.0 CORRIGÉ (PATCH STABLE)
✅ Salutation MIROIR correcte (Bonjour → Bonjour Jean !)
✅ Ton PROFESSIONNEL et CHALEUREUX
✅ ULTRA-PÉDAGOGIQUE pour tous les publics
✅ Conversation NATURELLE et FLUIDE
✅ Emojis conservés

PATCH:
✅ Fix "list index out of range" (MockChromaCollection.query retourne un format cohérent type Chroma)
✅ Fix découpage salutation (bjr/slt/etc.) sans casser le reste
"""

from __future__ import annotations

import os
import logging
import requests
import re
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
from pathlib import Path

logger = logging.getLogger("ai.rag_service")


def _load_env_file():
    """Charger le fichier .env manuellement si Django ne l'a pas fait"""
    current_dir = Path(__file__).resolve().parent
    project_root = current_dir.parent.parent
    env_path = project_root / '.env'

    if env_path.exists():
        logger.info(f"📁 Chargement du .env depuis: {env_path}")
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    if key not in os.environ:
                        os.environ[key] = value
    else:
        logger.warning(f"⚠️ Fichier .env non trouvé: {env_path}")


_load_env_file()


def _safe_get_env(name: str, default: str = "") -> str:
    v = os.getenv(name)
    return v if v is not None else default


def _truncate(text: str, n: int = 2500) -> str:
    if not text:
        return ""
    return text if len(text) <= n else text[:n] + "..."


def _analyze_user_message(message: str) -> Tuple[Optional[str], bool, bool]:
    """
    Analyse le message de l'utilisateur pour détecter :
    - La salutation utilisée (si présente)
    - Si c'est principalement une salutation (juste "Bonjour" sans plus)
    - Si c'est une question

    Returns:
        (salutation, is_greeting_only, is_question)
    """
    message_clean = (message or "").strip()
    message_lower = message_clean.lower()

    # Détection de la salutation
    salutation = None
    greeting_patterns = [
        ("bonjour", "Bonjour"),
        ("bonsoir", "Bonsoir"),
        ("salut", "Salut"),
        ("hello", "Hello"),
        ("hey", "Hey"),
        ("coucou", "Coucou"),
        ("bjr", "Bonjour"),
        ("slt", "Salut"),
    ]

    for pattern, formal in greeting_patterns:
        if message_lower.startswith(pattern):
            salutation = formal
            break

    # Est-ce SEULEMENT une salutation ? (très court, pas de question)
    is_greeting_only = False
    if salutation:
        # ✅ PATCH: ne pas découper via len(salutation) (Bonjour) si l'utilisateur a écrit bjr/slt.
        # On retire simplement le premier "mot" (la salutation brute) et on regarde ce qu'il reste.
        parts = message_clean.split(maxsplit=1)
        remaining = parts[1] if len(parts) > 1 else ""
        remaining_clean = re.sub(r'[^\w\s]', '', remaining).strip()
        if len(remaining_clean) < 10:
            is_greeting_only = True

    # Est-ce une question ?
    is_question = '?' in message_clean or any(
        message_lower.startswith(q) for q in [
            'comment', 'pourquoi', 'quand', 'où', 'qui', 'que', 'quel', 'quelle',
            'est-ce', 'puis-je', 'peux-tu', 'pouvez-vous', 'c\'est quoi', "c'est quoi",
            'combien', 'qu\'est', "qu'est"
        ]
    )

    return salutation, is_greeting_only, is_question


# ═══════════════════════════════════════════════════════════════════════════════
# 🎓 SYSTEM PROMPT - VERSION 5.0 PROFESSIONNEL PÉDAGOGIQUE
# ═══════════════════════════════════════════════════════════════════════════════

SYSTEM_PROMPT_PEDAGOGIQUE = """Tu es l'Assistant IA TERAS, un conseiller financier simple, bienveillant et pédagogue.

RÈGLE PRINCIPALE : Tu parles à des personnes qui découvrent la finance. Si c'est une question de suivi dans une conversation, NE répète JAMAIS l'introduction — va directement à la réponse. Certains n'ont pas fait d'études supérieures. Ton rôle est de les AIDER À COMPRENDRE, pas d'impressionner.

COMMENT TU RÉPONDS :
1. Commence par expliquer simplement CE QUE C'EST, comme si tu parlais à un ami
2. Donne UN exemple concret de la vie quotidienne congolaise (marché, taxi, tontine, famille...)
3. Explique POURQUOI c'est important pour eux personnellement
4. Si tu donnes des chiffres, explique toujours ce qu'ils signifient en pratique
5. Termine par 1-2 conseils simples et actionnables

LANGAGE :
- Phrases courtes, moyenne. Pas de jargon.
- Si tu dois utiliser un mot technique, explique-le immédiatement entre parenthèses
- Utilise des comparaisons du quotidien (ex: "comme une réputation dans ton quartier")
- Sois chaleureux, encourageant, jamais condescendant

LONGUEUR : Moyenne. Ni trop court (inutile), ni trop long (décourage la lecture). 3 à 7 maximums paragraphes bien structurés.

CONTEXTE : Tu connais la réalité congolaise — tontines, marchés, revenus informels, ZOLA, FCFA. Utilise ces références pour rendre tes réponses concrètes et proches de leur vie."""


# ═══════════════════════════════════════════════════════════
# CLASSE PRINCIPALE RAG SERVICE
# ═══════════════════════════════════════════════════════════

class SimpleLLMClient:
    """Client LLM simplifié utilisant l'API REST Anthropic directement"""

    def __init__(self):
        self.api_key = _safe_get_env("ANTHROPIC_API_KEY", "")
        self.base_url = "https://api.anthropic.com/v1/messages"
        self.model = "claude-sonnet-4-20250514"

    def is_available(self) -> bool:
        return bool(self.api_key)

    def chat(
            self,
            prompt: str,
            system: str = "",
            max_tokens: int = 4096,
            temperature: float = 0.7,
    ) -> str:
        if not self.is_available():
            raise ValueError("ANTHROPIC_API_KEY non configurée")

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        payload = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system if system else SYSTEM_PROMPT_PEDAGOGIQUE,
            "messages": [{"role": "user", "content": prompt}],
        }

        try:
            resp = requests.post(
                self.base_url,
                headers=headers,
                json=payload,
                timeout=120,
            )
            resp.raise_for_status()
            data = resp.json()

            if "content" in data and len(data["content"]) > 0:
                return data["content"][0].get("text", "")
            else:
                logger.error(f"Format de réponse inattendu: {data}")
                return "Désolé, je n'ai pas pu générer de réponse."

        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erreur API Anthropic: {e}")
            raise


class MockChromaCollection:
    """Collection ChromaDB mockée pour retrouver les documents pertinents"""

    def __init__(self, collection_name: str, documents: List[Dict] = None):
        self.name = collection_name
        self.documents = documents or []
        logger.info(f"📚 Collection mockée '{collection_name}' avec {len(self.documents)} documents")

    def query(
            self,
            query_texts: List[str],
            n_results: int = 5,
    ) -> Dict[str, Any]:
        """
        Recherche simple par mots-clés dans le contenu

        ✅ PATCH IMPORTANT:
        Retourne une structure cohérente "façon Chroma":
        {
          "ids": [[id1, id2, ...]],
          "documents": [[doc1, doc2, ...]],
          "metadatas": [[meta1, meta2, ...]],
          "distances": [[dist1, dist2, ...]]
        }
        """
        if not query_texts or not self.documents:
            return {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}

        query = (query_texts[0] or "").lower().strip()
        if not query:
            return {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}

        ranked: List[Dict[str, Any]] = []

        for doc in self.documents:
            content = (doc.get("content", "") or "").lower()
            title = (doc.get("title", "") or "").lower()

            score = 0
            if query in content:
                score += content.count(query) * 2
            if query in title:
                score += 5

            for word in query.split():
                if len(word) > 3:
                    if word in content:
                        score += content.count(word)
                    if word in title:
                        score += 2

            if score > 0:
                ranked.append({"doc": doc, "score": score})

        ranked.sort(key=lambda x: x["score"], reverse=True)
        ranked = ranked[:max(1, int(n_results or 5))]

        # ✅ Format "Chroma-like" (listes alignées)
        ids = [d["doc"].get("doc_id", "") for d in ranked]
        docs = [d["doc"].get("content", "") for d in ranked]
        metas = [d["doc"] for d in ranked]
        distances = [1.0 / (d["score"] + 1) for d in ranked]  # distance faible = meilleur

        return {
            "ids": [ids],
            "documents": [docs],
            "metadatas": [metas],
            "distances": [distances],
        }



SYSTEM_PROMPT_GOVERNMENT = """Tu es l'Assistant IA TERAS - Conseiller Economique d'Etat pour la Republique du Congo. Tu produits des analyses EXHAUSTIVES et DETAILLEES. Tu connais parfaitement le contexte congolais : marches informels, tontines, agriculture, economie petroliere. Tu compares avec Gabon (720), Cameroun (695). Tu quantifies TOUJOURS en FCFA. Tu ne resumes JAMAIS - tu developpes chaque point avec des exemples concrets congolais, des chiffres precis et des recommandations actionnables avec impact chiffre en FCFA. Minimum 4-5 sections detaillees par reponse."""


SYSTEM_PROMPT_ADMIN = """Tu es l'Assistant IA TERAS - Outil d'analyse pour administrateurs. Tu fournis des analyses objectives, structurées et techniques sur le système TERAS. Pas de formules d'adresse personnalisées. Réponses structurées : contexte, analyse, données clés, recommandations actionables."""
class RAGService:
    """Service RAG avec contexte utilisateur enrichi et conversation naturelle"""

    def __init__(self):
        self.llm = SimpleLLMClient()

        self.system_docs = [
            {
                "doc_id": "teras_system_001",
                "collection": "TERAS_SYSTEM",
                "title": "Système TERAS - Vue d'ensemble",
                "content": """Le système TERAS évalue la fiabilité financière sur 5 piliers (T.E.R.A.S):

T - Transactions (300 pts): Utilisation régulière de ZOLA, diversité, fréquence
E - Épargne (150 pts): Montants mis de côté régulièrement, constance
R - Revenus (200 pts): Stabilité et diversité des sources de revenus
A - Actifs (150 pts): Biens possédés avec preuves (moto, terrain, stock)
S - Social (200 pts): Réputation, avis, ancienneté, participation communautaire

Score total sur 1000 points.
Niveaux: A (900-1000), B (750-899), C (600-749), D (400-599), E (<400)""",
                "source": "/mnt/project/Teras_System.pdf"
            },
            {
                "doc_id": "credit_capacity_001",
                "collection": "CREDIT_RULES",
                "title": "Calcul de la capacité d'emprunt (CRM)",
                "content": """Capacité de Remboursement Mensuelle (CRM):

Formule: CRM = 30% des revenus nets moyens sur 90 jours

Exemple:
- Revenus moyens: 200,000 FCFA/mois
- Sorties vitales estimées: 100,000 FCFA
- Revenus nets: 100,000 FCFA
- CRM = 30% × 100,000 = 30,000 FCFA

Plafond de crédit = CRM × durée (mois) × 0.85

Exemples:
- 6 mois: 30,000 × 6 × 0.85 = 153,000 FCFA
- 12 mois: 30,000 × 12 × 0.85 = 306,000 FCFA
- 24 mois: 30,000 × 24 × 0.85 = 612,000 FCFA""",
                "source": "/mnt/project/ALGO_ZOLA_TXT.pdf"
            },
            {
                "doc_id": "interest_rates_001",
                "collection": "CREDIT_RULES",
                "title": "Taux d'intérêt par niveau de score",
                "content": """Taux d'intérêt selon le niveau TERAS:

Niveau A (900-1000): 5-7% - Excellent
Niveau B (750-899): 8-10% - Très bon
Niveau C (600-749): 10-12% - Bon
Niveau D (400-599): 12-15% - Moyen
Niveau E (<400): 15%+ - À améliorer

Bonus possibles:
- Épargne bloquée: -1 à -2 pts
- Co-emprunteur solide: -1 pt
- Historique parfait: -1 pt

Frais:
- Dossier: 1-2% (plafonné)
- Remboursement anticipé: gratuit""",
                "source": "/mnt/project/ALGO_ZOLA_TXT.pdf"
            }
        ]

        self.collections: Dict[str, MockChromaCollection] = {
            "TERAS_SYSTEM": MockChromaCollection("TERAS_SYSTEM", self.system_docs),
            "CREDIT_RULES": MockChromaCollection("CREDIT_RULES", self.system_docs),
        }

        logger.info(f"✅ RAG Service initialisé avec {len(self.system_docs)} documents système")

    def is_available(self) -> bool:
        """Vérifie si le service RAG est disponible"""
        return self.llm.is_available()

    def retrieve_context(
            self,
            query: str,
            max_docs: int = 5,
            document_types: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Récupère les documents pertinents"""
        if not query.strip():
            return []

        all_docs: List[Dict[str, Any]] = []
        collections_to_search = document_types if document_types else list(self.collections.keys())

        for col_name in collections_to_search:
            if col_name not in self.collections:
                continue

            collection = self.collections[col_name]
            try:
                results = collection.query(query_texts=[query], n_results=max_docs)

                # ✅ PATCH: robustesse shape
                docs_list = (results.get("documents") or [[]])[0] or []
                metas_list = (results.get("metadatas") or [[]])[0] or []
                dist_list = (results.get("distances") or [[]])[0] or []

                for i, doc_content in enumerate(docs_list):
                    metadata = metas_list[i] if i < len(metas_list) else {}
                    distance = dist_list[i] if i < len(dist_list) else 1.0

                    all_docs.append({
                        "content": doc_content,
                        "title": metadata.get("title", "Document"),
                        "source": metadata.get("source", ""),
                        "collection": metadata.get("collection", col_name),
                        "doc_id": metadata.get("doc_id", ""),
                        "score": 1.0 - float(distance) if distance is not None else 0.0
                    })

            except Exception as e:
                logger.error(f"Erreur lors de la recherche dans {col_name}: {e}")
                continue

        all_docs.sort(key=lambda d: (d.get("score") if d.get("score") is not None else -1), reverse=True)
        return all_docs[: max_docs or 0]

    def chat_with_rag(
            self,
            query: str,
            max_docs: int = 5,
            document_types: Optional[List[str]] = None,
            conversation_history: Optional[List[Dict[str, Any]]] = None,
            n_results: Optional[int] = None,
            user: Any = None,
            use_rag: bool = True,
            **kwargs: Any,
    ) -> Dict[str, Any]:
        start_time = datetime.now()

        q = (query or "").strip()
        if not q:
            return {
                "answer": "Comment puis-je vous aider aujourd'hui ? 😊",
                "response": "Comment puis-je vous aider aujourd'hui ? 😊",
                "used_rag": False,
                "sources": [],
                "context": "",
                "tokens_used": 0,
                "response_time_ms": 0,
            }

        if n_results is not None:
            max_docs = int(n_results)

        # ✅ ANALYSE DU MESSAGE UTILISATEUR
        user_greeting, is_greeting_only, is_question = _analyze_user_message(q)
        logger.info(f"📝 Message analysé: greeting={user_greeting}, greeting_only={is_greeting_only}, question={is_question}")

        # ✅ CONSTRUCTION DU CONTEXTE UTILISATEUR ENRICHI
        user_context = {}
        if user:
            from chat.context_builder import build_user_context
            user_context = build_user_context(user, include_full_data=True)
            logger.info(
                f"📊 Contexte utilisateur enrichi pour {user_context.get('user', {}).get('first_name', 'utilisateur')}")

        # Retrieve documents
        docs: List[Dict[str, Any]] = []
        if use_rag and max_docs and max_docs > 0:
            docs = self.retrieve_context(query=q, max_docs=max_docs, document_types=document_types)

        used_rag = len(docs) > 0

        # Context
        context_chunks: List[str] = []
        sources: List[Dict[str, Any]] = []

        for d in docs:
            title = d.get("title", "")
            src = d.get("source", "")
            col = d.get("collection", "")

            sources.append({
                "title": title,
                "source": src,
                "collection": col,
                "doc_id": d.get("doc_id"),
                "score": d.get("score"),
            })

            content = d.get("content", "")
            context_chunks.append(f"[{col}] {title}\n{_truncate(content, 2000)}")

        context_text = "\n\n---\n\n".join(context_chunks).strip()

        # ✅ HISTORIQUE DE CONVERSATION
        history_txt = ""
        has_history = False
        message_count = 0

        if conversation_history and len(conversation_history) > 0:
            pieces: List[str] = []
            for m in conversation_history[-10:]:
                role = (m.get("role") or "").lower()
                content = m.get("content") or m.get("message") or ""
                if role in ("user", "assistant") and content:
                    pieces.append(f"{role.upper()}: {content}")
                    if role == "user":
                        message_count += 1
            history_txt = "\n".join(pieces).strip()
            has_history = message_count > 0

        # ✅ FORMATAGE DU CONTEXTE UTILISATEUR
        user_context_str = self._format_user_context_pedagogique(user_context)

        # ✅ INSTRUCTIONS DE SALUTATION DYNAMIQUES
        prenom = user_context.get('user', {}).get('first_name', 'l\'utilisateur')

        if has_history and not user_greeting:
            greeting_instruction = f"""
═══════════════════════════════════════════════════════════
💬 CONVERSATION EN COURS
═══════════════════════════════════════════════════════════

C'est une SUITE de conversation. L'utilisateur a déjà été salué.

✅ À FAIRE :
- Enchaîne NATURELLEMENT (pas de salutation)
- {"Utilise une transition comme : 'Excellente question !', 'Je vous explique...', 'Bien sûr !'" if is_question else "Utilise une transition comme : 'Absolument !', 'Avec plaisir !', 'Je comprends.'"}

❌ À NE PAS FAIRE :
- Ne dis PAS "Bonjour" ou "Salut"
- Ne dis PAS "Très bonne question !" si ce n'est pas une question

"""
        elif user_greeting:
            if is_greeting_only:
                greeting_instruction = f"""
═══════════════════════════════════════════════════════════
👋 L'UTILISATEUR VOUS SALUE
═══════════════════════════════════════════════════════════

L'utilisateur dit : "{q}"

✅ VOTRE RÉPONSE DOIT :
1. Commencer par : "{user_greeting} {prenom} ! 😊"
2. Présenter un RÉSUMÉ de sa situation (score, niveau, capacités)
3. Proposer votre aide : "Comment puis-je vous aider aujourd'hui ?"

❌ NE DITES PAS :
- "Très bonne question !" (ce n'est PAS une question)
- Une salutation différente de celle de l'utilisateur

"""
            else:
                greeting_instruction = f"""
═══════════════════════════════════════════════════════════
👋 L'UTILISATEUR VOUS SALUE ET POSE UNE QUESTION
═══════════════════════════════════════════════════════════

L'utilisateur dit : "{q}"

✅ VOTRE RÉPONSE DOIT :
1. Commencer par : "{user_greeting} {prenom} ! 😊"
2. Répondre à sa question/demande

"""
        else:
            greeting_instruction = f"""
═══════════════════════════════════════════════════════════
🆕 PREMIÈRE INTERACTION (pas de salutation de l'utilisateur)
═══════════════════════════════════════════════════════════

L'utilisateur pose directement une question sans saluer.

✅ À FAIRE :
- Répondez directement à sa question/demande
- Soyez chaleureux mais professionnel
- Vous pouvez commencer par "Bonjour {prenom} !" si approprié

"""

        # ✅ CONSTRUCTION DU PROMPT FINAL
        prompt = f"""{greeting_instruction}

{user_context_str}

═══════════════════════════════════════════════════════════
📚 DOCUMENTATION TERAS (pour référence)
═══════════════════════════════════════════════════════════

{context_text if context_text else "Pas de documentation spécifique nécessaire."}

═══════════════════════════════════════════════════════════
💬 HISTORIQUE DE LA CONVERSATION
═══════════════════════════════════════════════════════════

{history_txt if history_txt else "Première interaction (pas d'historique)"}

═══════════════════════════════════════════════════════════
❓ MESSAGE DE L'UTILISATEUR
═══════════════════════════════════════════════════════════

{q}

═══════════════════════════════════════════════════════════
📝 RAPPEL IMPORTANT
═══════════════════════════════════════════════════════════

- Utilisez les VRAIES DONNÉES de l'utilisateur (score: {user_context.get('score', {}).get('current', 'N/A')}, revenus: {user_context.get('financial', {}).get('income', {}).get('monthly_average', 'N/A')} FCFA)
- Expliquez SIMPLEMENT avec des exemples de la vie quotidienne
- Soyez PROFESSIONNEL mais CHALEUREUX
- Utilisez 3-5 émojis pour aider à la compréhension
- {"Répondez à la salutation avec la MÊME salutation + prénom" if user_greeting else "Enchaînez naturellement"}

Répondez maintenant :"""

        # Call LLM
        if not self.llm.is_available():
            answer = (
                "Désolé, l'Assistant IA TERAS n'est pas disponible pour le moment. "
                "Veuillez réessayer dans quelques instants. 🙏"
            )
            tokens_used = 0
        else:
            try:
                # Choisir le system prompt selon le type d'utilisateur
                _user_type = user_context.get('user', {}).get('user_type', 'individual') if user_context else 'individual'
                _system = SYSTEM_PROMPT_GOVERNMENT if _user_type in ('government', 'regional') else (SYSTEM_PROMPT_ADMIN if _user_type == 'admin' else SYSTEM_PROMPT_PEDAGOGIQUE)
                # Pour government, ajouter instruction de réponse longue dans le prompt
                _final_prompt = prompt
                if _user_type in ('government', 'regional'):
                    _final_prompt = prompt + """

═══════════════════════════════════════════════════════════
📋 INSTRUCTIONS FINALES POUR CETTE RÉPONSE
═══════════════════════════════════════════════════════════

⚠️ RÉPONSE LONGUE ET COMPLÈTE OBLIGATOIRE :
- Développe CHAQUE section en profondeur (minimum 3-4 paragraphes par section)
- Inclus des exemples CONCRETS du contexte congolais pour chaque point
- Quantifie TOUT en FCFA avec le bon ordre de grandeur
- Compare avec Gabon (720), Cameroun (695) et la moyenne CEMAC
- Termine par des recommandations ACTIONNABLES avec impact chiffré en FCFA
- Utilise le contexte national fourni ci-dessus
- Ne résume JAMAIS — développe et explique en détail

Répondez maintenant avec une analyse complète et détaillée :"""
                answer = self.llm.chat(prompt=_final_prompt, system=_system)
                tokens_used = len(prompt.split()) + len(answer.split())
            except Exception as e:
                logger.error("❌ Erreur LLM: %s", e, exc_info=True)
                answer = (
                    "Je suis désolé, j'ai rencontré un problème technique. 😅\n\n"
                    "Pouvez-vous reformuler votre question ou réessayer dans quelques instants ? Merci !"
                )
                tokens_used = 0

        response_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        return {
            "answer": answer,
            "response": answer,
            "used_rag": used_rag,
            "sources": sources,
            "context": context_text,
            "user_context": user_context,
            "tokens_used": tokens_used,
            "response_time_ms": response_time_ms,
        }

    def _format_user_context_pedagogique(self, context: Dict) -> str:
        """Formate le contexte utilisateur de façon claire et structurée"""

        if not context or 'error' in context:
            return """
═══════════════════════════════════════════════════════════
📊 DONNÉES UTILISATEUR
═══════════════════════════════════════════════════════════

⚠️ Données non disponibles pour cet utilisateur.
→ Répondez de manière générale sur le système TERAS.
"""

        user = context.get('user', {})
        score = context.get('score', {})
        financial = context.get('financial', {})
        interest_rates = context.get('interest_rates', {})
        recommendations = context.get('recommendations', {})

        prenom = user.get('first_name', 'l\'utilisateur')

        # Construction du contexte formaté
        parts = [
            "═══════════════════════════════════════════════════════════",
            "📊 DONNÉES DE L'UTILISATEUR (À UTILISER !)",
            "═══════════════════════════════════════════════════════════",
            "",
            f"👤 **Prénom :** {prenom}",
            f"📱 **Type de compte :** {user.get('user_type', 'individual')}",
            ""
        ]

        # Score
        if score and 'current' in score:
            parts.extend([
                "─────────────────────────────────────────────────────────",
                "🎯 SCORE TERAS",
                "─────────────────────────────────────────────────────────",
                "",
                f"**Score actuel :** {score['current']}/1000",
                f"**Niveau :** {score.get('band', 'N/A')} - {score.get('band_display', '')}",
                ""
            ])

            if 'pillars' in score:
                pillars = score['pillars']
                percentages = score.get('pillar_percentages', {})
                parts.extend([
                    "**Les 5 piliers :**",
                    f"  • Transactions : {pillars.get('T_transactions', 0)}/300 ({percentages.get('T', 0)}%)",
                    f"  • Épargne : {pillars.get('E_savings', 0)}/150 ({percentages.get('E', 0)}%)",
                    f"  • Revenus : {pillars.get('R_income', 0)}/200 ({percentages.get('R', 0)}%)",
                    f"  • Actifs : {pillars.get('A_assets', 0)}/150 ({percentages.get('A', 0)}%)",
                    f"  • Social : {pillars.get('S_social', 0)}/200 ({percentages.get('S', 0)}%)",
                    ""
                ])

            if 'strengths' in score and score['strengths']:
                parts.append("**✅ Points forts :**")
                for strength in score['strengths'][:3]:
                    parts.append(f"  • {strength['name']} : {strength['percentage']}%")
                parts.append("")

            if 'weaknesses' in score and score['weaknesses']:
                parts.append("**📈 À améliorer :**")
                for weakness in score['weaknesses'][:2]:
                    parts.append(f"  • {weakness['name']} : {weakness['percentage']}% (potentiel : +{weakness.get('potential', 0)} pts)")
                parts.append("")

        # Données financières
        if financial:
            parts.extend([
                "─────────────────────────────────────────────────────────",
                "💰 SITUATION FINANCIÈRE",
                "─────────────────────────────────────────────────────────",
                ""
            ])

            if 'income' in financial:
                income = financial['income']
                parts.append(f"**Revenus mensuels :** {income.get('monthly_average', 0):,.0f} FCFA")

            if 'crm' in financial:
                crm = financial['crm']
                parts.append(f"**CRM (capacité de remboursement) :** {crm.get('monthly', 0):,.0f} FCFA/mois")

            if 'loan_capacity' in financial:
                loan = financial['loan_capacity']
                parts.extend([
                    "",
                    "**Capacités d'emprunt :**",
                    f"  • Sur 6 mois : {loan.get('6_months', 0):,.0f} FCFA",
                    f"  • Sur 12 mois : {loan.get('12_months', 0):,.0f} FCFA",
                    f"  • Sur 18 mois : {loan.get('18_months', 0):,.0f} FCFA",
                    f"  • Sur 24 mois : {loan.get('24_months', 0):,.0f} FCFA",
                ])

            if 'transactions' in financial:
                txn = financial['transactions']
                parts.append(f"\n**Transactions (30 jours) :** {txn.get('last_30_days', {}).get('count', 0)}")

            if 'assets' in financial and financial['assets'].get('count', 0) > 0:
                assets = financial['assets']
                parts.append(f"**Actifs :** {assets.get('count', 0)} biens ({assets.get('total_value', 0):,.0f} FCFA)")

            parts.append("")

        # Taux d'intérêt
        if interest_rates:
            parts.extend([
                "─────────────────────────────────────────────────────────",
                "💳 TAUX APPLICABLE",
                "─────────────────────────────────────────────────────────",
                "",
                f"**Taux :** {interest_rates.get('taux', 'N/A')} ({interest_rates.get('qualite', '')} {interest_rates.get('emoji', '')})",
                ""
            ])

        parts.extend([
            "═══════════════════════════════════════════════════════════",
            ""
        ])

        return "\n".join(parts)

    def semantic_search(
            self,
            query: str,
            document_types: Optional[List[str]] = None,
            n_results: int = 10,
    ) -> List[Dict[str, Any]]:
        return self.retrieve_context(query=query, max_docs=n_results, document_types=document_types)


_rag_service_singleton: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    global _rag_service_singleton
    if _rag_service_singleton is None:
        _rag_service_singleton = RAGService()
    return _rag_service_singleton
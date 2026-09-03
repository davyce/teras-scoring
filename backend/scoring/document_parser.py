# backend/scoring/document_parser.py
"""
TERAS Document Parser — Moteur de traitement documentaire complet
Pipeline : Upload → Détection → Parsing → Normalisation → Contrôle qualité → TERAS

Formats supportés :
  ✅ PDF  (relevés bancaires — pdfplumber + pdfminer)
  ✅ XLSX / XLS / CSV (exports ZOLA, bancaires)
  ✅ OFX / QIF (formats bancaires internationaux)
  ✅ MT940 (SWIFT — format Afriland, BGFI)
  🟡 Images JPG/PNG (OCR Tesseract — optionnel)

Auteur : TERAS IA APP
"""

import os
import re
import hashlib
import logging
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTES
# ─────────────────────────────────────────────────────────────────────────────

# Catégories MCC → Pilier TERAS
MCC_TO_TERAS = {
    # Alimentation / Commerce
    '5411': 'commerce',  '5412': 'commerce', '5422': 'commerce',
    '5441': 'commerce',  '5451': 'commerce', '5461': 'commerce',
    '5499': 'commerce',  '5812': 'commerce', '5814': 'commerce',
    # Transport
    '4111': 'transport', '4121': 'transport', '4131': 'transport',
    '5571': 'transport', '5599': 'transport', '7523': 'transport',
    # Carburant
    '5541': 'energie',   '5542': 'energie',
    # Télécommunications / Mobile Money
    '4812': 'telecom',   '4813': 'telecom',  '4899': 'telecom',
    '6012': 'mobile_money', '6011': 'mobile_money',
    # Santé
    '5912': 'sante',     '8011': 'sante',    '8049': 'sante',
    # Éducation
    '8220': 'education', '8299': 'education',
    # Services financiers
    '6010': 'banque',    '6051': 'banque',   '6099': 'banque',
    # Salaire / Transfert
    '6540': 'salaire',
}

CURRENCY_RATES_TO_XAF = {
    'XAF': 1.0,
    'CDF': 0.00028,   # Franc congolais (RDC) → XAF approximatif
    'USD': 655.957,   # 1 USD = 655.957 XAF (parité FCFA)
    'EUR': 655.957,   # 1 EUR = 655.957 XAF (fixe FCFA)
    'GBP': 820.0,     # Approximatif
    'XOF': 1.0,       # Même zone franc
}

VITAL_EXPENSES_KEYWORDS = [
    'loyer', 'lover', 'location', 'electricite', 'eau', 'eneo', 'snde',
    'snec', 'alimentation', 'marche', 'nourriture', 'pharmacie', 'sante',
    'hopital', 'clinique', 'ecole', 'scolarite', 'frais scolaire',
    'transport', 'carburant', 'essence',
]

INCOME_KEYWORDS = [
    'salaire', 'salary', 'paie', 'paiment', 'paiement', 'virement salaire',
    'vir sal', 'vir. sal', 'remuneration', 'traitement', 'solde',
    'transfert', 'envoi', 'receive', 'depot', 'dépôt', 'credit', 'reçu',
    'airtel money', 'mtn money', 'zola', 'm-pesa', 'orange money',
    'western union', 'moneygram', 'wari',
]

TONTINE_KEYWORDS = [
    'tontine', 'cotisation', 'association', 'avec', 'mutuelle',
    'solidarite', 'coop', 'cooperative',
]


# ─────────────────────────────────────────────────────────────────────────────
# DÉTECTION DE FORMAT
# ─────────────────────────────────────────────────────────────────────────────

def detect_format(file_path: str, filename: str, mime_type: str = '') -> str:
    """
    Détecte le format du fichier par extension + magic bytes.

    Returns: 'pdf' | 'excel' | 'csv' | 'ofx' | 'qif' | 'mt940' | 'image' | 'unknown'
    """
    ext = Path(filename).suffix.lower().lstrip('.')

    # Par extension
    ext_map = {
        'pdf':  'pdf',
        'xlsx': 'excel', 'xls': 'excel',
        'csv':  'csv',
        'ofx':  'ofx',   'qfx': 'ofx',
        'qif':  'qif',
        'sta':  'mt940',  'mt940': 'mt940', 'mt9': 'mt940',
        'jpg':  'image',  'jpeg': 'image',  'png': 'image',
        'tiff': 'image',  'bmp':  'image',
    }
    if ext in ext_map:
        return ext_map[ext]

    # Par MIME
    mime_map = {
        'application/pdf':   'pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
        'application/vnd.ms-excel': 'excel',
        'text/csv':           'csv',
        'text/plain':         'csv',
        'image/jpeg':         'image',
        'image/png':          'image',
    }
    if mime_type in mime_map:
        return mime_map[mime_type]

    # Magic bytes (lecture des premiers octets)
    try:
        with open(file_path, 'rb') as f:
            header = f.read(16)
        if header[:4] == b'%PDF':
            return 'pdf'
        if header[:4] in (b'PK\x03\x04', b'PK\x05\x06'):
            return 'excel'     # XLSX = ZIP
        if header[:8] == b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1':
            return 'excel'     # XLS = OLE2
        if header[:3] in (b'\xff\xd8\xff', b'\x89PN'):
            return 'image'

        # Lire comme texte pour OFX/QIF/MT940/CSV
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            sample = f.read(512).upper()
        if 'OFXHEADER' in sample or '<OFX>' in sample:
            return 'ofx'
        if sample.startswith('!TYPE:') or sample.startswith('!OPTION:'):
            return 'qif'
        if ':20:' in sample or ':25:' in sample or ':60F:' in sample:
            return 'mt940'
        if ',' in sample or ';' in sample:
            return 'csv'
    except Exception:
        pass

    return 'unknown'


# ─────────────────────────────────────────────────────────────────────────────
# NORMALISATION
# ─────────────────────────────────────────────────────────────────────────────

def normalize_date(raw: str) -> Optional[date]:
    """Convertit une date en format ISO (YYYY-MM-DD)."""
    if not raw:
        return None
    raw = str(raw).strip()

    formats = [
        '%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%m/%d/%Y',
        '%d.%m.%Y', '%Y%m%d', '%d %b %Y', '%d %B %Y',
        '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S',
    ]
    for fmt in formats:
        try:
            return datetime.strptime(raw[:19], fmt).date()
        except ValueError:
            continue
    return None


def normalize_amount(raw) -> Optional[float]:
    """Convertit un montant en float positif."""
    if raw is None or raw == '':
        return None
    if isinstance(raw, (int, float)):
        return abs(float(raw))

    s = str(raw).strip()
    # Supprimer espaces, symboles monétaires
    s = re.sub(r'[^\d,.\-]', '', s)
    # Gérer séparateurs européens (1.234,56 → 1234.56)
    if re.match(r'^\d{1,3}(\.\d{3})*(,\d+)?$', s):
        s = s.replace('.', '').replace(',', '.')
    else:
        s = s.replace(',', '.')

    try:
        return abs(float(s))
    except (ValueError, TypeError):
        return None


def to_xaf(amount: float, currency: str) -> float:
    """Convertit un montant en XAF (FCFA)."""
    rate = CURRENCY_RATES_TO_XAF.get(currency.upper(), 1.0)
    return round(amount * rate, 2)


def detect_transaction_category(description: str) -> dict:
    """Détecte la catégorie et le type d'une transaction."""
    desc = description.lower()

    category = 'autre'
    tx_type  = 'unknown'
    is_income   = False
    is_vital    = False
    is_tontine  = False

    # Type (crédit / débit)
    credit_words = ['credit', 'reçu', 'recu', 'depot', 'dépôt', 'versement',
                    'virement reçu', 'transfert reçu', 'remise', 'salaire',
                    'receive', 'received', 'in', 'entree', 'entrée']
    debit_words  = ['debit', 'retrait', 'paiement', 'achat', 'frais',
                    'commission', 'virement emis', 'out', 'sortie', 'paid']

    if any(w in desc for w in credit_words):
        tx_type  = 'credit'
        is_income = True
    elif any(w in desc for w in debit_words):
        tx_type = 'debit'

    # Revenu spécifique
    if any(k in desc for k in INCOME_KEYWORDS):
        is_income = True
        tx_type   = 'credit'
        category  = 'revenus'

    # Dépenses vitales
    if any(k in desc for k in VITAL_EXPENSES_KEYWORDS):
        is_vital = True
        tx_type  = 'debit'
        category = 'vital'

    # Tontine
    if any(k in desc for k in TONTINE_KEYWORDS):
        is_tontine = True
        category   = 'tontine'

    # Mobile Money
    if any(k in desc for k in ['zola', 'airtel', 'mtn money', 'orange money', 'm-pesa', 'mobile money']):
        category = 'mobile_money'
        if tx_type == 'unknown':
            tx_type = 'credit' if any(w in desc for w in ['reçu', 'recu', 'receive']) else 'debit'

    return {
        'category':  category,
        'type':      tx_type,
        'is_income': is_income,
        'is_vital':  is_vital,
        'is_tontine':is_tontine,
    }


def compute_transaction_hash(date_val, description: str, amount: float) -> str:
    """Hash MD5 pour déduplication des transactions."""
    key = f"{date_val}|{description.strip().lower()[:50]}|{round(amount, 0)}"
    return hashlib.md5(key.encode()).hexdigest()


# ─────────────────────────────────────────────────────────────────────────────
# PARSERS SPÉCIALISÉS
# ─────────────────────────────────────────────────────────────────────────────

def parse_pdf(file_path: str) -> dict:
    """
    Parse un relevé bancaire PDF.
    Stratégie : pdfplumber (tableaux) + pdfminer (texte brut)
    """
    transactions = []
    metadata     = {}
    errors       = []

    # ── Méthode 1 : pdfplumber (tableaux structurés) ──────────────────────
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            metadata['pages']    = len(pdf.pages)
            metadata['producer'] = pdf.metadata.get('Producer', '')

            for page_num, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue

                    # Détecter les colonnes
                    headers = [str(h or '').lower().strip() for h in table[0]]
                    col_map = _detect_columns(headers)

                    for row in table[1:]:
                        if not row or all(c is None or str(c).strip() == '' for c in row):
                            continue

                        txn = _extract_row(row, col_map, headers)
                        if txn:
                            transactions.append(txn)

    except ImportError:
        errors.append("pdfplumber non installé — pip install pdfplumber")
    except Exception as e:
        errors.append(f"pdfplumber erreur : {e}")

    # ── Méthode 2 : pdfminer (texte brut — fallback) ──────────────────────
    if not transactions:
        try:
            from pdfminer.high_level import extract_text
            text = extract_text(file_path)
            transactions = _parse_text_transactions(text)
        except ImportError:
            errors.append("pdfminer non installé — pip install pdfminer.six")
        except Exception as e:
            errors.append(f"pdfminer erreur : {e}")

    return {
        'transactions': transactions,
        'metadata':     metadata,
        'errors':       errors,
        'format':       'pdf',
    }


def parse_excel(file_path: str) -> dict:
    """
    Parse un relevé Excel/CSV.
    Auto-détection des colonnes (date, débit, crédit, solde, description).
    """
    transactions = []
    metadata     = {}
    errors       = []

    try:
        import pandas as pd

        ext = Path(file_path).suffix.lower()

        if ext == '.csv':
            # Détecter le séparateur automatiquement
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                sample = f.read(2048)

            sep = ';' if sample.count(';') > sample.count(',') else ','
            df = pd.read_csv(file_path, sep=sep, encoding='utf-8',
                             header=None, dtype=str, on_bad_lines='skip')
        else:
            df = pd.read_excel(file_path, header=None, dtype=str)

        metadata['rows']    = len(df)
        metadata['columns'] = len(df.columns)

        # Chercher la ligne d'en-tête (première ligne avec mots reconnus)
        header_row   = _find_header_row(df)
        df.columns   = df.iloc[header_row].str.lower().str.strip()
        df           = df.iloc[header_row + 1:].reset_index(drop=True)

        col_map = _detect_columns(list(df.columns))

        for _, row in df.iterrows():
            txn = _extract_row(row.tolist(), col_map, list(df.columns))
            if txn:
                transactions.append(txn)

    except ImportError:
        errors.append("pandas non installé — pip install pandas openpyxl")
    except Exception as e:
        errors.append(f"Erreur Excel : {e}")

    return {
        'transactions': transactions,
        'metadata':     metadata,
        'errors':       errors,
        'format':       'excel',
    }


def parse_csv(file_path: str) -> dict:
    """Parse CSV — délègue à parse_excel."""
    return parse_excel(file_path)


def parse_ofx(file_path: str) -> dict:
    """
    Parse un fichier OFX/QFX (Open Financial Exchange).
    Format utilisé par Afriland First Bank, quelques banques CEMAC.
    """
    transactions = []
    metadata     = {}
    errors       = []

    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # En-tête OFX
        meta_match = re.search(r'<DTSTART>(\d+)', content)
        if meta_match:
            metadata['period_start'] = meta_match.group(1)

        meta_match = re.search(r'<DTEND>(\d+)', content)
        if meta_match:
            metadata['period_end'] = meta_match.group(1)

        acct_match = re.search(r'<ACCTID>(.*?)<', content)
        if acct_match:
            metadata['account'] = acct_match.group(1).strip()

        # Transactions
        txn_blocks = re.findall(r'<STMTTRN>(.*?)</STMTTRN>', content, re.DOTALL)

        for block in txn_blocks:
            def get_tag(tag):
                m = re.search(rf'<{tag}>(.*?)(?:<|$)', block)
                return m.group(1).strip() if m else ''

            raw_date = get_tag('DTPOSTED')[:8]    # YYYYMMDD
            raw_amt  = get_tag('TRNAMT')
            trntype  = get_tag('TRNTYPE')          # CREDIT / DEBIT / OTHER
            desc     = get_tag('MEMO') or get_tag('NAME')
            fitid    = get_tag('FITID')

            txn_date = normalize_date(raw_date)
            amount   = normalize_amount(raw_amt)

            if not txn_date or amount is None:
                continue

            cat = detect_transaction_category(desc)
            tx_type = 'credit' if trntype == 'CREDIT' else 'debit' if trntype == 'DEBIT' else cat['type']

            transactions.append({
                'date':        txn_date.isoformat(),
                'description': desc,
                'amount':      amount,
                'currency':    get_tag('CURRENCY') or 'XAF',
                'amount_xaf':  to_xaf(amount, get_tag('CURRENCY') or 'XAF'),
                'type':        tx_type,
                'category':    cat['category'],
                'is_income':   cat['is_income'],
                'is_vital':    cat['is_vital'],
                'is_tontine':  cat['is_tontine'],
                'external_id': fitid,
                'hash':        compute_transaction_hash(txn_date, desc, amount),
            })

    except Exception as e:
        errors.append(f"Erreur OFX : {e}")

    return {
        'transactions': transactions,
        'metadata':     metadata,
        'errors':       errors,
        'format':       'ofx',
    }


def parse_qif(file_path: str) -> dict:
    """
    Parse un fichier QIF (Quicken Interchange Format).
    """
    transactions = []
    metadata     = {'format_note': 'QIF — Quicken Interchange Format'}
    errors       = []
    current_txn  = {}

    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()

        for line in lines:
            line = line.strip()
            if not line:
                continue

            code, value = line[0], line[1:].strip()

            if code == 'D':    current_txn['date']        = value
            elif code == 'T':  current_txn['amount']      = value
            elif code == 'P':  current_txn['description'] = value
            elif code == 'M':  current_txn['memo']        = value
            elif code == 'L':  current_txn['category']    = value
            elif code == '^':
                # Fin d'une transaction
                if current_txn.get('date') and current_txn.get('amount'):
                    txn_date = normalize_date(current_txn['date'])
                    amount   = normalize_amount(current_txn['amount'])
                    desc     = current_txn.get('description', '') or current_txn.get('memo', '')

                    if txn_date and amount is not None:
                        cat     = detect_transaction_category(desc)
                        tx_type = 'credit' if amount > 0 else 'debit'

                        transactions.append({
                            'date':        txn_date.isoformat(),
                            'description': desc,
                            'amount':      abs(amount),
                            'currency':    'XAF',
                            'amount_xaf':  abs(amount),
                            'type':        tx_type,
                            'category':    cat['category'],
                            'is_income':   cat['is_income'],
                            'is_vital':    cat['is_vital'],
                            'is_tontine':  cat['is_tontine'],
                            'hash':        compute_transaction_hash(txn_date, desc, abs(amount)),
                        })
                current_txn = {}

    except Exception as e:
        errors.append(f"Erreur QIF : {e}")

    return {
        'transactions': transactions,
        'metadata':     metadata,
        'errors':       errors,
        'format':       'qif',
    }


def parse_mt940(file_path: str) -> dict:
    """
    Parse un fichier MT940 (SWIFT — utilisé par BGFI, Ecobank, Société Générale).
    Format : :tag:valeur
    """
    transactions = []
    metadata     = {}
    errors       = []

    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Compte (tag :25:)
        acct = re.search(r':25:(.*?)(?:\r?\n|$)', content)
        if acct:
            metadata['account'] = acct.group(1).strip()

        # Solde d'ouverture (tag :60F: ou :60M:)
        opening = re.search(r':60[FM]:[CD](\d{6})([A-Z]{3})([\d,]+)', content)
        if opening:
            metadata['opening_balance'] = normalize_amount(opening.group(3).replace(',', '.'))
            metadata['currency']        = opening.group(2)
            metadata['statement_date']  = opening.group(1)

        # Transactions (tag :61:)
        # Format: :61:YYMMDD[MMDD]D/CAmount//Ref
        txn_blocks = re.findall(
            r':61:(\d{6})(\d{4})?([DC])R?N?([\d,]+)([^\r\n]*)\r?\n(?::86:(.*?))?(?=:61:|\Z)',
            content,
            re.DOTALL
        )

        for block in txn_blocks:
            date_str, value_date, dc_indicator, amount_str, ref, description = block

            txn_date = normalize_date('20' + date_str)  # YYMMDD → YYYYMMDD
            amount   = normalize_amount(amount_str)
            desc     = description.strip().replace('\r\n', ' ').replace('\n', ' ')

            if not txn_date or amount is None:
                continue

            tx_type = 'credit' if dc_indicator == 'C' else 'debit'
            cat     = detect_transaction_category(desc)
            currency = metadata.get('currency', 'XAF')

            transactions.append({
                'date':        txn_date.isoformat(),
                'description': desc or ref.strip(),
                'amount':      amount,
                'currency':    currency,
                'amount_xaf':  to_xaf(amount, currency),
                'type':        tx_type,
                'category':    cat['category'],
                'is_income':   tx_type == 'credit',
                'is_vital':    cat['is_vital'],
                'is_tontine':  cat['is_tontine'],
                'reference':   ref.strip(),
                'hash':        compute_transaction_hash(txn_date, desc, amount),
            })

    except Exception as e:
        errors.append(f"Erreur MT940 : {e}")

    return {
        'transactions': transactions,
        'metadata':     metadata,
        'errors':       errors,
        'format':       'mt940',
    }


def parse_image_ocr(file_path: str) -> dict:
    """
    Parse une image scannée via OCR (Tesseract).
    Nécessite : pip install pytesseract Pillow + tesseract-ocr installé OS
    """
    transactions = []
    metadata     = {'format_note': 'Image OCR — Tesseract'}
    errors       = []

    try:
        import pytesseract
        from PIL import Image

        # Prétraitement image pour améliorer l'OCR
        img = Image.open(file_path)

        # Convertir en niveaux de gris
        img = img.convert('L')

        # Upscale si petite résolution
        if img.width < 1000:
            ratio = 1000 / img.width
            img   = img.resize((int(img.width * ratio), int(img.height * ratio)),
                               Image.LANCZOS)

        # OCR avec config française
        text = pytesseract.image_to_string(
            img,
            lang='fra+eng',   # Français + Anglais
            config='--psm 6'  # Page segmentation mode 6 = bloc uniforme
        )
        metadata['ocr_text_length'] = len(text)

        # Parser le texte extrait
        transactions = _parse_text_transactions(text)

    except ImportError:
        errors.append(
            "pytesseract ou Pillow non installé.\n"
            "pip install pytesseract Pillow\n"
            "Installer tesseract-ocr : brew install tesseract (Mac) "
            "ou apt install tesseract-ocr (Ubuntu)"
        )
    except Exception as e:
        errors.append(f"Erreur OCR : {e}")

    return {
        'transactions': transactions,
        'metadata':     metadata,
        'errors':       errors,
        'format':       'image_ocr',
    }


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS INTERNES
# ─────────────────────────────────────────────────────────────────────────────

def _detect_columns(headers: list) -> dict:
    """
    Mappe les noms de colonnes trouvés vers un schéma unifié.
    Retourne {unified_name: column_index}
    """
    # Patterns de noms de colonnes acceptés (multilingue FR/EN)
    PATTERNS = {
        'date': [
            'date', 'date opération', 'date operation', 'date valeur',
            'date transaction', 'dt', 'day', 'jour', 'op date',
        ],
        'description': [
            'description', 'libelle', 'libellé', 'label', 'motif',
            'details', 'detail', 'memo', 'narration', 'particulars',
            'reference', 'réf', 'ref', 'nature', 'operation',
        ],
        'debit': [
            'debit', 'débit', 'montant debit', 'retrait', 'sortie',
            'withdrawal', 'amount debit', 'deb', 'dr',
        ],
        'credit': [
            'credit', 'crédit', 'montant credit', 'depot', 'dépôt',
            'entree', 'entrée', 'deposit', 'amount credit', 'cre', 'cr',
        ],
        'amount': [
            'montant', 'amount', 'solde mouvement', 'valeur', 'value',
        ],
        'balance': [
            'solde', 'balance', 'running balance', 'solde après',
        ],
        'currency': [
            'devise', 'currency', 'monnaie', 'cur',
        ],
    }

    col_map = {}
    for col_name, patterns in PATTERNS.items():
        for i, header in enumerate(headers):
            if header is None:
                continue
            h = str(header).lower().strip()
            if any(p in h or h in p for p in patterns):
                col_map[col_name] = i
                break

    return col_map


def _find_header_row(df) -> int:
    """Trouve la ligne d'en-tête dans un DataFrame."""
    header_keywords = {
        'date', 'montant', 'amount', 'description', 'libellé', 'libelle',
        'debit', 'credit', 'solde', 'balance', 'operation',
    }
    for i in range(min(10, len(df))):
        row_values = [str(v or '').lower().strip() for v in df.iloc[i]]
        if len(set(row_values) & header_keywords) >= 2:
            return i
    return 0


def _extract_row(row, col_map: dict, headers: list) -> Optional[dict]:
    """Extrait une transaction depuis une ligne de tableau."""

    def get(key):
        idx = col_map.get(key)
        if idx is not None and idx < len(row):
            val = row[idx]
            return str(val).strip() if val is not None else ''
        return ''

    raw_date = get('date')
    txn_date = normalize_date(raw_date)
    if not txn_date:
        return None

    # Montant : crédit/débit séparés ou montant unique
    amount   = None
    tx_type  = 'unknown'

    credit_idx = col_map.get('credit')
    debit_idx  = col_map.get('debit')
    amount_idx = col_map.get('amount')

    credit_raw = get('credit')
    debit_raw  = get('debit')
    amount_raw = get('amount')
    # Chercher colonne type directement par index (col_map peut la rater)
    type_raw   = get('tx_type')
    if not type_raw:
        # Fallback : chercher une colonne littéralement nommée 'type' ou 'nature'
        for i, h in enumerate(headers):
            if str(h).lower().strip() in ('type', 'nature', 'sens', 'direction', 'cr/dr'):
                type_raw = str(row[i]).strip() if i < len(row) else ''
                break

    # Détecter le type depuis la colonne 'type'/'nature' si disponible
    if type_raw:
        tl = type_raw.lower().strip()
        if any(w in tl for w in ['credit', 'crédit', 'cr', 'in', 'entree', 'entrée', '+']):
            tx_type = 'credit'
        elif any(w in tl for w in ['debit', 'débit', 'dr', 'out', 'sortie', '-']):
            tx_type = 'debit'

    # Colonnes crédit/débit séparées (indices différents)
    if credit_idx is not None and debit_idx is not None and credit_idx != debit_idx:
        credit = normalize_amount(credit_raw)
        debit  = normalize_amount(debit_raw)
        if credit and credit > 0:
            amount  = credit
            if tx_type == 'unknown': tx_type = 'credit'
        elif debit and debit > 0:
            amount  = debit
            if tx_type == 'unknown': tx_type = 'debit'
    # Montant unique (même colonne ou colonne 'montant')
    else:
        amt = normalize_amount(amount_raw or credit_raw)
        if amt:
            amount = abs(amt)
            # Si pas de colonne type, déduire du signe original
            if tx_type == 'unknown':
                raw_val = str(amount_raw or credit_raw or '').strip()
                if raw_val.startswith('-'):
                    tx_type = 'debit'
                else:
                    tx_type = 'credit'  # Défaut : crédit si montant positif sans indication

    if not amount:
        return None

    desc     = get('description') or ''
    currency = get('currency') or 'XAF'
    balance  = normalize_amount(get('balance'))
    cat      = detect_transaction_category(desc)

    if tx_type == 'unknown':
        tx_type = cat['type']

    # ── Override final : colonne 'type'/'nature' explicite ──────────────
    type_col_val = get('tx_type')
    if type_col_val:
        tv = type_col_val.lower().strip()
        if tv in ('credit', 'crédit', 'cr', 'in', 'entree'):
            tx_type = 'credit'
        elif tv in ('debit', 'débit', 'dr', 'out', 'sortie', 'retrait'):
            tx_type = 'debit'

    return {
        'date':        txn_date.isoformat(),
        'description': desc,
        'amount':      amount,
        'currency':    currency,
        'amount_xaf':  to_xaf(amount, currency),
        'type':        tx_type,
        'balance':     balance,
        'category':    cat['category'],
        'is_income':   cat['is_income'] or tx_type == 'credit',
        'is_vital':    cat['is_vital'],
        'is_tontine':  cat['is_tontine'],
        'hash':        compute_transaction_hash(txn_date, desc, amount),
    }


def _parse_text_transactions(text: str) -> list:
    """
    Parser de texte brut — dernière chance (PDF texte libre ou OCR).
    Cherche des patterns date + montant dans le texte.
    """
    transactions = []

    # Pattern : DATE  DESCRIPTION  MONTANT (avec variantes)
    patterns = [
        # DD/MM/YYYY ... MONTANT
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.{5,60}?)\s+([\d\s,.]+(?:\s*FCFA)?)',
        # YYYY-MM-DD ... MONTANT
        r'(\d{4}-\d{2}-\d{2})\s+(.{5,60}?)\s+([\d\s,.]+)',
        # Patterns avec débit/crédit explicites
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.{3,50}?)\s+([\d,.]+)\s+([\d,.]+)',
    ]

    for pattern in patterns:
        matches = re.findall(pattern, text, re.MULTILINE)
        if matches:
            for match in matches[:200]:   # Max 200 transactions
                raw_date = match[0]
                desc     = match[1].strip() if len(match) > 1 else ''
                amount   = normalize_amount(match[2] if len(match) > 2 else '0')

                txn_date = normalize_date(raw_date)
                if not txn_date or not amount:
                    continue

                cat = detect_transaction_category(desc)
                transactions.append({
                    'date':        txn_date.isoformat(),
                    'description': desc,
                    'amount':      amount,
                    'currency':    'XAF',
                    'amount_xaf':  amount,
                    'type':        cat['type'] or 'unknown',
                    'category':    cat['category'],
                    'is_income':   cat['is_income'],
                    'is_vital':    cat['is_vital'],
                    'is_tontine':  cat['is_tontine'],
                    'hash':        compute_transaction_hash(txn_date, desc, amount),
                })
            break   # Utiliser le premier pattern qui fonctionne

    return transactions


# ─────────────────────────────────────────────────────────────────────────────
# CONTRÔLES QUALITÉ
# ─────────────────────────────────────────────────────────────────────────────

def quality_check(transactions: list, metadata: dict) -> dict:
    """
    Contrôles qualité sur les transactions parsées.

    Retourne :
    - score authenticité 0-1
    - doublons détectés
    - anomalies (outliers)
    - statistiques de base
    """
    if not transactions:
        return {
            'authenticity_score': 0.0,
            'duplicates':         [],
            'anomalies':          [],
            'stats':              {},
            'warnings':           ['Aucune transaction trouvée'],
        }

    # Déduplication
    hashes  = [t.get('hash', '') for t in transactions]
    seen    = set()
    duplicates = []
    for i, h in enumerate(hashes):
        if h in seen:
            duplicates.append(i)
        seen.add(h)

    # Transactions uniques
    unique_txns = [t for i, t in enumerate(transactions) if i not in duplicates]

    # Montants
    amounts = [t['amount_xaf'] for t in unique_txns if t.get('amount_xaf')]
    if not amounts:
        return {
            'authenticity_score': 0.2,
            'duplicates':         duplicates,
            'anomalies':          [],
            'stats':              {},
            'warnings':           ['Aucun montant valide'],
        }

    import statistics
    avg    = statistics.mean(amounts)
    stdev  = statistics.stdev(amounts) if len(amounts) > 1 else 0
    median = statistics.median(amounts)

    # Anomalies (> 3σ)
    anomalies = []
    if stdev > 0:
        for i, t in enumerate(unique_txns):
            if abs(t.get('amount_xaf', 0) - avg) > 3 * stdev:
                anomalies.append({
                    'index':       i,
                    'date':        t['date'],
                    'amount':      t['amount_xaf'],
                    'description': t['description'][:50],
                    'reason':      f"Montant anormal (>{round(avg + 3*stdev, 0)} XAF)",
                })

    # Statistiques
    credits = [t['amount_xaf'] for t in unique_txns if t.get('type') == 'credit']
    debits  = [t['amount_xaf'] for t in unique_txns if t.get('type') == 'debit']
    incomes = [t['amount_xaf'] for t in unique_txns if t.get('is_income')]
    vitals  = [t['amount_xaf'] for t in unique_txns if t.get('is_vital')]

    # Dates
    dates = sorted([t['date'] for t in unique_txns if t.get('date')])

    # Score authenticité (heuristique)
    score = 0.0
    if len(unique_txns) >= 5:     score += 0.3
    if credits and debits:         score += 0.2   # Transactions bidirectionnelles
    if len(anomalies) < len(unique_txns) * 0.1:   score += 0.2  # < 10% anomalies
    if len(duplicates) < len(transactions) * 0.05: score += 0.15 # < 5% doublons
    if stdev / avg < 3 if avg > 0 else False:      score += 0.15 # Variance raisonnable
    score = min(1.0, score)

    stats = {
        'total_transactions':  len(unique_txns),
        'duplicates_removed':  len(duplicates),
        'anomalies_count':     len(anomalies),
        'date_from':           dates[0] if dates else None,
        'date_to':             dates[-1] if dates else None,
        'total_credits_xaf':   round(sum(credits), 2),
        'total_debits_xaf':    round(sum(debits), 2),
        'net_cashflow_xaf':    round(sum(credits) - sum(debits), 2),
        'avg_credit_xaf':      round(statistics.mean(credits), 2) if credits else 0,
        'avg_debit_xaf':       round(statistics.mean(debits), 2) if debits else 0,
        'income_total_xaf':    round(sum(incomes), 2),
        'vital_expenses_xaf':  round(sum(vitals), 2),
        'amount_avg_xaf':      round(avg, 2),
        'amount_median_xaf':   round(median, 2),
        'amount_stdev_xaf':    round(stdev, 2),
        'months_covered':      _count_months(dates),
        'monthly_avg_income_xaf': round(sum(incomes) / max(_count_months(dates), 1), 2),
    }

    return {
        'authenticity_score': round(score, 2),
        'duplicates':         duplicates,
        'anomalies':          anomalies[:10],  # Max 10 dans le rapport
        'stats':              stats,
        'warnings':           [],
    }


def _count_months(dates: list) -> int:
    """Compte le nombre de mois distincts dans une liste de dates ISO."""
    if not dates:
        return 1
    months = set()
    for d in dates:
        try:
            months.add(d[:7])  # YYYY-MM
        except Exception:
            pass
    return max(len(months), 1)


# ─────────────────────────────────────────────────────────────────────────────
# CALCUL PILIERS TERAS DEPUIS LES TRANSACTIONS
# ─────────────────────────────────────────────────────────────────────────────

def compute_teras_signals(transactions: list, quality: dict) -> dict:
    """
    Calcule les signaux TERAS depuis les transactions parsées.
    Alimente les piliers T (Transactions), E (Épargne), R (Revenus).

    Returns: dict compatible avec calculate_teras_basic()
    """
    stats  = quality.get('stats', {})
    months = stats.get('months_covered', 1)

    # ── Pilier T — Transactions ────────────────────────────────────
    total_txns  = stats.get('total_transactions', 0)
    # Fréquence mensuelle normalisée (objectif : 30 txn/mois)
    freq_monthly = total_txns / months
    freq_score   = min(freq_monthly / 30.0, 1.0)

    # Régularité : CV inversé des montants
    import statistics as stat_lib
    amounts = [t['amount_xaf'] for t in transactions if t.get('amount_xaf', 0) > 0]
    if len(amounts) > 1:
        try:
            cv = stat_lib.stdev(amounts) / stat_lib.mean(amounts)
            regularity = max(0, 1 - min(cv, 2) / 2)
        except Exception:
            regularity = 0.5
    else:
        regularity = 0.3

    # Diversité canaux
    channels   = set(t.get('category', 'autre') for t in transactions)
    diversity  = min(len(channels) / 5.0, 1.0)

    # Ratio crédit/débit
    credits_total = stats.get('total_credits_xaf', 0)
    debits_total  = stats.get('total_debits_xaf', 1)
    cd_ratio      = min(credits_total / max(debits_total, 1), 2.0) / 2.0

    t_signal = {
        'frequency_monthly':     round(freq_monthly, 1),
        'frequency_score':       round(freq_score, 3),
        'regularity_cv':         round(1 - regularity, 3),
        'regularity_score':      round(regularity, 3),
        'channel_diversity':     len(channels),
        'diversity_score':       round(diversity, 3),
        'credit_debit_ratio':    round(cd_ratio, 3),
        'total_transactions':    total_txns,
    }

    # ── Pilier E — Épargne ─────────────────────────────────────────
    # Dépôts détectés (transactions crédit sans dépenses vitales)
    savings_txns    = [t for t in transactions
                       if t.get('type') == 'credit' and not t.get('is_vital')]
    deposit_monthly = sum(t['amount_xaf'] for t in savings_txns) / months

    # Streak : nb de mois consécutifs avec dépôt
    months_with_deposit = set()
    for t in savings_txns:
        try:
            months_with_deposit.add(t['date'][:7])
        except Exception:
            pass
    streak = len(months_with_deposit)

    e_signal = {
        'monthly_deposit_avg_xaf': round(deposit_monthly, 2),
        'streak_months':           streak,
        'saving_transactions':     len(savings_txns),
    }

    # ── Pilier R — Revenus ─────────────────────────────────────────
    income_txns = [t for t in transactions if t.get('is_income')]

    # Revenus mensuels
    monthly_income: dict = {}
    for t in income_txns:
        try:
            month = t['date'][:7]
            monthly_income[month] = monthly_income.get(month, 0) + t['amount_xaf']
        except Exception:
            pass

    income_values = list(monthly_income.values())
    if income_values:
        avg_income = sum(income_values) / len(income_values)
        try:
            income_cv = stat_lib.stdev(income_values) / avg_income if avg_income > 0 else 0
        except Exception:
            income_cv = 0
    else:
        avg_income = stats.get('monthly_avg_income_xaf', 0)
        income_cv  = 0.5

    r_signal = {
        'monthly_avg_xaf':    round(avg_income, 2),
        'income_history':     income_values,
        'income_cv':          round(income_cv, 3),
        'income_stability':   round(max(0, 1 - income_cv), 3),
        'income_months':      len(income_values),
        'sources_count':      len(set(t.get('category') for t in income_txns)),
    }

    # ── CRM estimé ────────────────────────────────────────────────
    vital_monthly = stats.get('vital_expenses_xaf', 0) / months
    net_income    = max(0, avg_income - vital_monthly)
    crm_estimated = net_income * 0.30

    return {
        'transactions_signal': t_signal,
        'savings_signal':      e_signal,
        'income_signal':       r_signal,
        'crm_estimated_xaf':   round(crm_estimated, 2),
        'net_income_monthly_xaf': round(net_income, 2),
        'vital_expenses_monthly_xaf': round(vital_monthly, 2),
        'tontine_transactions': len([t for t in transactions if t.get('is_tontine')]),
        'data_quality_score':  quality.get('authenticity_score', 0),
        'months_analyzed':     months,
    }


# ─────────────────────────────────────────────────────────────────────────────
# POINT D'ENTRÉE PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────

def parse_document(file_path: str, filename: str, mime_type: str = '') -> dict:
    """
    Point d'entrée principal du pipeline documentaire.

    Workflow complet :
    1. Détection format
    2. Parsing spécialisé
    3. Déduplication transactions
    4. Contrôles qualité
    5. Calcul signaux TERAS
    6. Recommandations

    Args:
        file_path: Chemin absolu du fichier
        filename:  Nom original du fichier (pour détecter l'extension)
        mime_type: MIME type (optionnel)

    Returns:
        dict complet : {
            format, transactions, metadata, quality, teras_signals,
            recommendations, errors, parsing_success
        }
    """
    result = {
        'format':           'unknown',
        'filename':         filename,
        'transactions':     [],
        'metadata':         {},
        'quality':          {},
        'teras_signals':    {},
        'recommendations':  [],
        'errors':           [],
        'parsing_success':  False,
        'parsed_at':        datetime.now().isoformat(),
    }

    # ── Étape 1 : Détection format ────────────────────────────────
    fmt = detect_format(file_path, filename, mime_type)
    result['format'] = fmt
    logger.info(f"[TERAS Parser] Format détecté : {fmt} pour {filename}")

    # ── Étape 2 : Parsing spécialisé ──────────────────────────────
    parser_map = {
        'pdf':       parse_pdf,
        'excel':     parse_excel,
        'csv':       parse_csv,
        'ofx':       parse_ofx,
        'qif':       parse_qif,
        'mt940':     parse_mt940,
        'image':     parse_image_ocr,
    }

    if fmt == 'unknown':
        result['errors'].append(
            f"Format non reconnu pour '{filename}'. "
            "Formats supportés : PDF, XLSX, CSV, OFX, QIF, MT940, JPG/PNG"
        )
        return result

    parser = parser_map.get(fmt)
    if not parser:
        result['errors'].append(f"Pas de parser disponible pour le format : {fmt}")
        return result

    try:
        parsed = parser(file_path)
        result['transactions'] = parsed.get('transactions', [])
        result['metadata']     = parsed.get('metadata', {})
        result['errors']      += parsed.get('errors', [])
    except Exception as e:
        result['errors'].append(f"Erreur critique parsing : {e}")
        logger.error(f"[TERAS Parser] Erreur {fmt} sur {filename} : {e}", exc_info=True)
        return result

    # ── Étape 3 : Contrôles qualité ───────────────────────────────
    result['quality'] = quality_check(result['transactions'], result['metadata'])

    # ── Étape 4 : Déduplication ────────────────────────────────────
    duplicates = result['quality'].get('duplicates', [])
    if duplicates:
        result['transactions'] = [
            t for i, t in enumerate(result['transactions']) if i not in duplicates
        ]

    # ── Étape 5 : Signaux TERAS ────────────────────────────────────
    if result['transactions']:
        result['teras_signals'] = compute_teras_signals(
            result['transactions'], result['quality']
        )
        result['parsing_success'] = True

    # ── Étape 6 : Recommandations ──────────────────────────────────
    result['recommendations'] = _generate_recommendations(
        result['quality'], result['teras_signals']
    )

    n = len(result['transactions'])
    logger.info(f"[TERAS Parser] ✅ {n} transactions extraites de {filename} (score auth: {result['quality'].get('authenticity_score', 0)})")
    return result


def _generate_recommendations(quality: dict, signals: dict) -> list:
    """Génère des recommandations basées sur le résultat du parsing."""
    recs = []
    stats = quality.get('stats', {})

    if stats.get('total_transactions', 0) < 10:
        recs.append({
            'type':    'warning',
            'message': "Peu de transactions trouvées. Fournir un relevé de 3-6 mois pour un meilleur score.",
        })

    months = stats.get('months_covered', 1)
    if months < 3:
        recs.append({
            'type':    'info',
            'message': f"Relevé couvre {months} mois. Un historique de 3+ mois améliore la fiabilité du score.",
        })

    if quality.get('authenticity_score', 0) < 0.5:
        recs.append({
            'type':    'warning',
            'message': "Score d'authenticité bas. Vérifier que le document est un relevé bancaire officiel.",
        })

    crm = signals.get('crm_estimated_xaf', 0)
    if crm > 0:
        recs.append({
            'type':    'success',
            'message': f"CRM estimé : {round(crm):,} FCFA/mois. Eligible à un crédit max {round(crm * 6 * 0.85):,} FCFA sur 6 mois.",
        })

    if len(quality.get('anomalies', [])) > 0:
        recs.append({
            'type':    'info',
            'message': f"{len(quality['anomalies'])} transaction(s) inhabituelles détectées. "
                      "Celles-ci seront examinées lors de la validation.",
        })

    tontine = signals.get('tontine_transactions', 0)
    if tontine > 0:
        recs.append({
            'type':    'success',
            'message': f"{tontine} transaction(s) de tontine détectées. "
                      "Cela améliore votre pilier Social (S) TERAS.",
        })

    return recs

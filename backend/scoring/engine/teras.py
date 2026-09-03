# backend/scoring/engine/teras.py
import json
from dataclasses import dataclass
from typing import Dict, Tuple
from pathlib import Path

CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
CONFIG_DIR.mkdir(parents=True, exist_ok=True)

ACTIVE_FILE = CONFIG_DIR / "active.json"
BASIC_FILE = CONFIG_DIR / "teras_basic.json"
ENTERPRISE_FILE = CONFIG_DIR / "teras_enterprise.json"
REGIONAL_FILE = CONFIG_DIR / "teras_regional.json"
COUNTRY_FILE = CONFIG_DIR / "teras_country.json"

def _load_json(path: Path, fallback: dict = None) -> dict:
    """
    Charge un fichier JSON si possible, sinon retourne un fallback.
    """
    if fallback is None:
        fallback = {}
    try:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return fallback

def get_active() -> Tuple[str, str, str]:
    """
    Retourne (profile, region, country).
    profile ∈ {"basic","enterprise","regional","country"}.
    """
    data = _load_json(ACTIVE_FILE, {"profile": "basic", "region": "CEMAC", "country": "CG"})
    return (
        data.get("profile", "basic"),
        data.get("region", "CEMAC"),
        data.get("country", "CG"),
    )

def get_available_regions() -> Dict[str, dict]:
    return _load_json(REGIONAL_FILE, {}).get("regions", {})

def get_available_countries(region: str) -> Dict[str, dict]:
    data = _load_json(COUNTRY_FILE, {}).get("regions", {})
    return data.get(region, {}).get("countries", {})

def get_config_dict() -> Dict:
    """
    Renvoie la configuration active selon le profil :
      - basic       → teras_basic.json
      - enterprise  → teras_enterprise.json
      - regional    → sous-profil de la région dans teras_regional.json
      - country     → sous-profil du pays dans la région dans teras_country.json
    """
    profile, region, country = get_active()

    if profile == "enterprise":
        return _load_json(ENTERPRISE_FILE, {"weights": {}, "ranges": {}})

    if profile == "regional":
        regions = get_available_regions()
        if region not in regions and regions:
            region = next(iter(regions))
        sel = regions.get(region, {})
        return {
            "meta": {"profile": "regional", "region": region},
            "weights": sel.get("weights", {}),
            "ranges": sel.get("ranges", {}),
        }

    if profile == "country":
        countries = get_available_countries(region)
        if country not in countries and countries:
            country = next(iter(countries))
        sel = countries.get(country, {})
        return {
            "meta": {"profile": "country", "region": region, "country": country},
            "weights": sel.get("weights", {}),
            "ranges": sel.get("ranges", {}),
        }

    # défaut → basic
    return _load_json(BASIC_FILE, {"weights": {}, "ranges": {}})

@dataclass
class TerasWeights:
    T: float
    E: float
    R: float
    A: float
    S: float

class TerasScoring:
    """
    Moteur de calcul TERAS multi-profils (basic / enterprise / regional / country)
    """
    def __init__(self):
        self.active_profile, self.active_region, self.active_country = get_active()
        self.config = get_config_dict()
        self.weights = TerasWeights(**self.config.get("weights", {"T":0.25,"E":0.20,"R":0.25,"A":0.20,"S":0.10}))
        self.ranges = self.config.get("ranges", {})

    @staticmethod
    def normalize(x: float, min_v: float, max_v: float) -> float:
        if max_v == min_v:
            return 0.0
        n = (x - min_v) / (max_v - min_v)
        return max(0.0, min(1.0, n))

    def compute(self, t: float, e: float, r: float, a: float, s: float) -> Dict:
        tn = self.normalize(t, *self.ranges.get("transactions", [0, 1]))
        en = self.normalize(e, *self.ranges.get("epargne", [0, 1]))
        rn = self.normalize(r, *self.ranges.get("revenus", [0, 1]))
        an = self.normalize(a, *self.ranges.get("actifs", [0, 1]))
        sn = self.normalize(s, *self.ranges.get("social", [0, 1]))

        # Score global : pondération et mise à l’échelle
        score = (
            tn * self.weights.T +
            en * self.weights.E +
            rn * self.weights.R +
            an * self.weights.A +
            sn * self.weights.S
        ) * 1000.0  # 0–1000 points

        return {
            "score": round(score, 2),
            "details": {
                "normalized": {"T": tn, "E": en, "R": rn, "A": an, "S": sn},
                "weights": vars(self.weights),
                "ranges": self.ranges,
                "active_profile": self.active_profile,
                "active_region": self.active_region if self.active_profile in {"regional", "country"} else None,
                "active_country": self.active_country if self.active_profile == "country" else None,
                "formula": "score = Σ(normalized * weight) * 1000",
            },
        }

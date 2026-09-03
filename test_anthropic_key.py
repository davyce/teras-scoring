#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de test de la clé Anthropic API
Usage : python test_anthropic_key.py
"""

import os
import requests
from pathlib import Path

# Charger le .env
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    print(f"✅ Fichier .env trouvé: {env_path}")
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()
else:
    print(f"❌ Fichier .env non trouvé: {env_path}")

# Récupérer la clé
api_key = os.getenv('ANTHROPIC_API_KEY', '').strip()

print(f"\n📋 Test de la clé Anthropic API")
print(f"=" * 60)

if not api_key:
    print("❌ ANTHROPIC_API_KEY non trouvée dans .env")
    exit(1)

# Masquer la clé
key_preview = api_key[:10] + "..." + api_key[-4:] if len(api_key) > 20 else "***"
print(f"🔑 Clé détectée: {key_preview}")
print(f"📏 Longueur: {len(api_key)} caractères")

# Vérifier le format
if not api_key.startswith('sk-ant-'):
    print(f"⚠️  WARNING: La clé ne commence pas par 'sk-ant-'")
    print(f"   Début de la clé: {api_key[:10]}...")

# Test de l'API
print(f"\n🧪 Test de l'API Anthropic...")

url = "https://api.anthropic.com/v1/messages"
headers = {
    "content-type": "application/json",
    "x-api-key": api_key,
    "anthropic-version": "2023-06-01",
}

payload = {
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 100,
    "messages": [
        {"role": "user", "content": "Réponds simplement 'OK' si tu me reçois."}
    ]
}

try:
    print(f"📡 Envoi de la requête à {url}...")
    response = requests.post(url, json=payload, headers=headers, timeout=30)
    
    print(f"\n📊 Résultat:")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print(f"✅ SUCCÈS ! L'API fonctionne correctement.")
        data = response.json()
        content = data.get('content', [{}])[0].get('text', '')
        print(f"📝 Réponse de Claude: {content}")
    else:
        print(f"❌ ERREUR {response.status_code}")
        print(f"📄 Réponse complète:")
        print(response.text)
        
        if response.status_code == 401:
            print(f"\n💡 Solution:")
            print(f"   1. Vérifier que la clé est valide sur https://console.anthropic.com/")
            print(f"   2. Vérifier qu'il n'y a pas d'espace avant/après dans le .env")
            print(f"   3. Régénérer une nouvelle clé si nécessaire")
        
except requests.exceptions.RequestException as e:
    print(f"❌ Erreur réseau: {e}")

print(f"\n" + "=" * 60)

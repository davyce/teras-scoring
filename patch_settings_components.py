#!/usr/bin/env python3
"""
patch_settings_components.py
Intègre LinkedAccounts et TeamManagement dans les pages Settings.
"""
import os, re

BASE = 'teras-frontend/src/pages'

# ═══════════════════════════════════════════════════════════════════════════════
# 1. BANK SETTINGS — ajouter onglets "Comptes liés" + "Équipe" (si pas déjà)
# ═══════════════════════════════════════════════════════════════════════════════
def patch_bank_settings():
    path = f"{BASE}/bank/BankSettings.tsx"
    c = open(path).read()

    # Import
    if 'LinkedAccounts' not in c:
        c = c.replace(
            "import { authFetch } from '../../utils/authFetch';",
            "import { authFetch } from '../../utils/authFetch';\nimport LinkedAccounts from '../../components/shared/LinkedAccounts';\nimport TeamManagement from '../../components/shared/TeamManagement';"
        )
        print("✅ Bank: imports ajoutés")

    # Ajouter onglets dans tabs array (avant l'onglet audit)
    if 'comptes' not in c and 'linked' not in c:
        c = c.replace(
            "    { id: 'audit',         label: 'Audit & Logs',      icon: Shield },",
            "    { id: 'comptes',       label: 'Comptes liés',      icon: Wallet },\n    { id: 'equipe_staff',  label: 'Équipe',            icon: Users  },\n    { id: 'audit',         label: 'Audit & Logs',      icon: Shield },"
        )
        print("✅ Bank: onglets ajoutés dans tabs")

    # Ajouter Wallet aux imports lucide si absent
    if 'Wallet' not in c:
        c = c.replace(
            "from 'lucide-react';",
            ", Wallet } from 'lucide-react';"
        ).replace(
            "  Shield,\n} from 'lucide-react';",
            "  Shield, Wallet,\n} from 'lucide-react';"
        )

    # Ajouter les panels de rendu (avant le dernier bloc de rendu Audit)
    if 'activeTab === \'comptes\'' not in c:
        insert = """
          {/* ══ COMPTES LIÉS ══════════════════════════════════════════════════ */}
          {activeTab === 'comptes' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <LinkedAccounts
                title="Comptes Mobile Money & Bancaires"
                subtitle="Liez vos comptes pour automatiser les prélèvements et enrichir l'analyse risque de vos clients"
              />
            </div>
          )}

          {/* ══ ÉQUIPE STAFF ════════════════════════════════════════════════ */}
          {activeTab === 'equipe_staff' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
              <TeamManagement interface="bank" title="Gestion de l'Équipe Bancaire"/>
            </div>
          )}

"""
        # Insérer avant l'onglet Audit
        c = c.replace(
            "          {/* ══ AUDIT & LOGS ════════════════",
            insert + "          {/* ══ AUDIT & LOGS ════════════════"
        )
        # Fallback si format différent
        if 'activeTab === \'comptes\'' not in c:
            c = c.replace(
                "          {activeTab === 'audit' &&",
                insert + "\n          {activeTab === 'audit' &&"
            )
        print("✅ Bank: panels comptes + équipe ajoutés")

    open(path, 'w').write(c)
    print("✅ BankSettings.tsx mis à jour")


# ═══════════════════════════════════════════════════════════════════════════════
# 2. ENTERPRISE SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════
def patch_enterprise_settings():
    path = f"{BASE}/enterprise/EnterpriseSettings.tsx"
    if not os.path.exists(path):
        print(f"⚠️  {path} non trouvé — création d'une version basique")
        _create_enterprise_settings()
        return

    c = open(path).read()

    if 'LinkedAccounts' not in c:
        # Ajouter imports
        if "from '../../utils/authFetch'" in c:
            c = c.replace(
                "from '../../utils/authFetch';",
                "from '../../utils/authFetch';\nimport LinkedAccounts from '../../components/shared/LinkedAccounts';\nimport TeamManagement from '../../components/shared/TeamManagement';"
            )
        elif "import React" in c:
            c = "import LinkedAccounts from '../../components/shared/LinkedAccounts';\nimport TeamManagement from '../../components/shared/TeamManagement';\n" + c
        else:
            c = "import LinkedAccounts from '../../components/shared/LinkedAccounts';\nimport TeamManagement from '../../components/shared/TeamManagement';\n" + c
        print("✅ Enterprise: imports ajoutés")

    # Chercher la structure tabs et ajouter
    if 'comptes' not in c and 'LinkedAccounts' in c:
        # Pattern générique : trouver le return principal et ajouter les sections
        _inject_enterprise_sections(c, path)
        return

    open(path, 'w').write(c)
    print("✅ EnterpriseSettings.tsx mis à jour")


def _inject_enterprise_sections(c: str, path: str):
    """Inject sections dans EnterpriseSettings."""
    # Trouver le dernier </div> avant export
    sections = """

  {/* ── Comptes liés Mobile Money ────────────────────────────────────── */}
  <div className="mt-8">
    <LinkedAccounts
      title="Comptes Mobile Money & Bancaires"
      subtitle="Liez vos comptes pour automatiser les paiements salaires et les opérations de votre entreprise"
    />
  </div>

  {/* ── Gestion équipe entreprise ─────────────────────────────────────── */}
  <div className="mt-8">
    <TeamManagement interface="enterprise" title="Gestion de l'Équipe"/>
  </div>
"""
    # Insérer avant le dernier return de fermeture du composant
    # Chercher le pattern de fermeture
    for closing in ["  );\n};\n\nexport default", "  );\n}\n\nexport default", "  );\n};\nexport default"]:
        if closing in c:
            c = c.replace(closing, sections + closing)
            break
    else:
        # Fallback: ajouter avant la dernière accolade
        last_idx = c.rfind('\n}')
        c = c[:last_idx] + sections + c[last_idx:]

    open(path, 'w').write(c)
    print("✅ EnterpriseSettings.tsx — sections injectées")


def _create_enterprise_settings():
    """Créer EnterpriseSettings si inexistant."""
    content = """// src/pages/enterprise/EnterpriseSettings.tsx
import { useState } from 'react';
import { authFetch } from '../../utils/authFetch';
import LinkedAccounts from '../../components/shared/LinkedAccounts';
import TeamManagement from '../../components/shared/TeamManagement';
import { Settings, Users, Wallet, User, Lock, Bell } from 'lucide-react';

const TABS = [
  { id: 'profile',  label: 'Profil',        icon: User    },
  { id: 'comptes',  label: 'Comptes liés',  icon: Wallet  },
  { id: 'equipe',   label: 'Équipe',        icon: Users   },
  { id: 'notifs',   label: 'Notifications', icon: Bell    },
];

export default function EnterpriseSettings() {
  const [tab, setTab] = useState('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-400 mt-1">Configuration de votre interface entreprise</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 space-y-2">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    tab === t.id ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
                  <Icon className="w-5 h-5"/><span className="font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-3">
          {tab === 'comptes' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <LinkedAccounts
                title="Comptes Mobile Money & Bancaires"
                subtitle="Liez vos comptes pour automatiser les paiements et enrichir votre score TERAS entreprise"/>
            </div>
          )}
          {tab === 'equipe' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <TeamManagement interface="enterprise" title="Gestion de l'Équipe"/>
            </div>
          )}
          {tab === 'profile' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <p className="text-slate-400">Profil entreprise — à compléter</p>
            </div>
          )}
          {tab === 'notifs' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <p className="text-slate-400">Notifications — à configurer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"""
    path = f"{BASE}/enterprise/EnterpriseSettings.tsx"
    open(path, 'w').write(content)
    print("✅ EnterpriseSettings.tsx créé")


# ═══════════════════════════════════════════════════════════════════════════════
# 3. USER SETTINGS — ajouter onglet "Comptes liés"
# ═══════════════════════════════════════════════════════════════════════════════
def patch_user_settings():
    path = f"{BASE}/user/UserSettings.tsx"
    if not os.path.exists(path):
        print(f"⚠️  {path} non trouvé")
        return

    c = open(path).read()

    if 'LinkedAccounts' not in c:
        # Import
        if "from '../../utils/authFetch'" in c:
            c = c.replace(
                "from '../../utils/authFetch';",
                "from '../../utils/authFetch';\nimport LinkedAccounts from '../../components/shared/LinkedAccounts';"
            )
        elif "import React" in c:
            c = "import LinkedAccounts from '../../components/shared/LinkedAccounts';\n" + c
        else:
            c = "import LinkedAccounts from '../../components/shared/LinkedAccounts';\n" + c
        print("✅ User: import LinkedAccounts ajouté")

    # Injecter la section Mobile Money avant la fermeture du composant
    if 'LinkedAccounts' in c and 'Mes Comptes Mobile Money' not in c:
        section = """
  {/* ── Comptes Mobile Money ──────────────────────────────────────────── */}
  <div className="mt-8">
    <LinkedAccounts title="Mes Comptes Mobile Money"/>
  </div>
"""
        for closing in ["  );\n};\n\nexport default", "  );\n}\n\nexport default",
                         "    </div>\n  );\n}", "  );\n};"]:
            if closing in c:
                c = c.replace(closing, section + closing, 1)
                print("✅ User: section Mobile Money injectée")
                break

    open(path, 'w').write(c)
    print("✅ UserSettings.tsx mis à jour")


# ═══════════════════════════════════════════════════════════════════════════════
# 4. GOVERNMENT SETTINGS — ajouter onglet "Équipe"
# ═══════════════════════════════════════════════════════════════════════════════
def patch_government_settings():
    path = f"{BASE}/government/GovernmentSettings.tsx"
    if not os.path.exists(path):
        print(f"⚠️  {path} non trouvé — création")
        _create_government_settings()
        return

    c = open(path).read()

    if 'TeamManagement' not in c:
        if "import React" in c or "from 'react'" in c:
            c = "import TeamManagement from '../../components/shared/TeamManagement';\n" + c
        else:
            c = "import TeamManagement from '../../components/shared/TeamManagement';\n" + c
        print("✅ Gov: import TeamManagement ajouté")

    if 'TeamManagement' in c and 'interface="government"' not in c:
        section = """
  {/* ── Gestion équipe gouvernement ──────────────────────────────────── */}
  <div className="mt-8">
    <TeamManagement interface="government" title="Gestion de l'Équipe Gouvernementale"/>
  </div>
"""
        for closing in ["  );\n};\n\nexport default", "  );\n}\n\nexport default",
                         "    </div>\n  );\n}", "  );\n};"]:
            if closing in c:
                c = c.replace(closing, section + closing, 1)
                print("✅ Gov: section équipe injectée")
                break

    open(path, 'w').write(c)
    print("✅ GovernmentSettings.tsx mis à jour")


def _create_government_settings():
    content = """// src/pages/government/GovernmentSettings.tsx
import { useState } from 'react';
import TeamManagement from '../../components/shared/TeamManagement';
import { Settings, Users, Bell, Shield } from 'lucide-react';

const TABS = [
  { id: 'general', label: 'Général',  icon: Settings },
  { id: 'equipe',  label: 'Équipe',   icon: Users   },
  { id: 'securite',label: 'Sécurité', icon: Shield  },
];

export default function GovernmentSettings() {
  const [tab, setTab] = useState('general');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-400 mt-1">Configuration de votre interface gouvernementale</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 space-y-2">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    tab === t.id ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
                  <Icon className="w-5 h-5"/><span className="font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-3">
          {tab === 'equipe' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <TeamManagement interface="government" title="Gestion de l'Équipe Gouvernementale"/>
            </div>
          )}
          {tab === 'general' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <p className="text-slate-400 text-sm">Paramètres généraux du tableau de bord gouvernemental.</p>
            </div>
          )}
          {tab === 'securite' && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
              <p className="text-slate-400 text-sm">Paramètres de sécurité et authentification.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"""
    path = f"{BASE}/government/GovernmentSettings.tsx"
    open(path, 'w').write(content)
    print("✅ GovernmentSettings.tsx créé")


# ═══════════════════════════════════════════════════════════════════════════════
# EXÉCUTION
# ═══════════════════════════════════════════════════════════════════════════════
print("=== Intégration LinkedAccounts + TeamManagement ===\n")

print("[1] BankSettings")
patch_bank_settings()

print("\n[2] EnterpriseSettings")
patch_enterprise_settings()

print("\n[3] UserSettings")
patch_user_settings()

print("\n[4] GovernmentSettings")
patch_government_settings()

print("\n=== Terminé ===")
print("Vérifier avec: cd teras-frontend && npm run build 2>&1 | head -30")

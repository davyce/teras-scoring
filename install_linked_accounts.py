#!/usr/bin/env python3
"""
install_linked_accounts.py
Installe le système Linked Accounts + Staff dans le projet TERAS.
Exécuter depuis la racine du projet avec le venv activé.
"""
import os, sys, subprocess

BASE = os.getcwd()
BACKEND = os.path.join(BASE, 'backend')

def run(cmd, cwd=BASE):
    r = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"❌ Erreur: {r.stderr[:200]}")
    else:
        print(f"✅ {cmd[:60]}")
    return r.returncode == 0

print("=== Installation Linked Accounts + Staff TERAS ===\n")

# 1. Ajouter les modèles dans scoring/models.py
models_py = os.path.join(BACKEND, 'scoring', 'models.py')
content   = open(models_py).read()

if 'LinkedAccount' not in content:
    content += """

# ✅ Linked Accounts + Staff system
from .models_linked_accounts import (
    LinkedAccount, ImportedTransaction,
    StaffMember, StaffActivityLog,
)
"""
    open(models_py, 'w').write(content)
    print("✅ models.py — imports LinkedAccount + StaffMember ajoutés")
else:
    print("⏭  models.py — déjà à jour")

# 2. Ajouter les URLs dans scoring/urls.py
urls_py = os.path.join(BACKEND, 'scoring', 'urls.py')
content  = open(urls_py).read()

if 'linked_accounts' not in content:
    # Import
    import_str = """from .views_linked_accounts import (
    list_linked_accounts, add_linked_account, verify_linked_account,
    sync_linked_account, get_linked_account_transactions,
    apply_linked_transactions_to_score, delete_linked_account,
    set_primary_account, list_staff, invite_staff,
    update_staff_permissions, remove_staff, get_my_staff_access,
)
"""
    # URLs à ajouter dans user_urlpatterns
    user_linked_urls = """    path('linked-accounts/',                                  list_linked_accounts,                   name='user-linked-accounts'),
    path('linked-accounts/add/',                              add_linked_account,                      name='user-linked-add'),
    path('linked-accounts/<int:account_id>/verify/',          verify_linked_account,                   name='user-linked-verify'),
    path('linked-accounts/<int:account_id>/sync/',            sync_linked_account,                     name='user-linked-sync'),
    path('linked-accounts/<int:account_id>/transactions/',    get_linked_account_transactions,          name='user-linked-txns'),
    path('linked-accounts/<int:account_id>/apply-to-score/',  apply_linked_transactions_to_score,      name='user-linked-apply'),
    path('linked-accounts/<int:account_id>/delete/',          delete_linked_account,                   name='user-linked-delete'),
    path('linked-accounts/<int:account_id>/set-primary/',     set_primary_account,                     name='user-linked-primary'),
"""
    # URLs staff globales
    staff_urls = """
# ── Staff (toutes interfaces) ──────────────────────────────────────────────────
staff_urlpatterns = [
    path('staff/list/',                           list_staff,                  name='staff-list'),
    path('staff/invite/',                         invite_staff,                name='staff-invite'),
    path('staff/my-access/',                      get_my_staff_access,         name='staff-my-access'),
    path('staff/<int:member_id>/permissions/',    update_staff_permissions,    name='staff-permissions'),
    path('staff/<int:member_id>/remove/',         remove_staff,                name='staff-remove'),
]
"""
    # Trouver où insérer l'import
    idx = content.find('app_name')
    content = content[:idx] + import_str + '\n' + content[idx:]

    # Ajouter les URLs user (avant la fermeture user_urlpatterns)
    content = content.replace(
        "    path('documents/upload/'",
        user_linked_urls + "\n    path('documents/upload/'"
    )

    # Ajouter staff_urlpatterns à la fin
    content += staff_urls

    # Inclure staff dans urlpatterns principal
    content = content.replace(
        "urlpatterns = [",
        "urlpatterns = [\n    path('scoring/staff/', include(staff_urlpatterns)),"
    )

    open(urls_py, 'w').write(content)
    print("✅ urls.py — URLs linked_accounts + staff ajoutées")
else:
    print("⏭  urls.py — déjà à jour")

# 3. Faire la migration
print("\n--- Migrations ---")
run(f"python manage.py makemigrations scoring --name linked_accounts_staff", cwd=BASE)
run(f"python manage.py migrate", cwd=BASE)

# 4. Vérification finale
run(f"python manage.py check", cwd=BASE)
print("\n=== Installation terminée ===")
print("Prochaines étapes :")
print("  1. cp ~/Downloads/models_linked_accounts.py  backend/scoring/")
print("  2. cp ~/Downloads/views_linked_accounts.py   backend/scoring/")
print("  3. python install_linked_accounts.py")
print("  4. cp ~/Downloads/LinkedAccounts.tsx  teras-frontend/src/components/shared/")
print("  5. cp ~/Downloads/TeamManagement.tsx  teras-frontend/src/components/shared/")

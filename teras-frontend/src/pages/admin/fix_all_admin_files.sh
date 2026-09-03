#!/bin/bash

# Script de correction automatique - Enlève AdminLayout de tous les fichiers Admin

echo "🔧 CORRECTION AUTOMATIQUE DES FICHIERS ADMIN"
echo "=============================================="
echo ""

# Fonction pour corriger un fichier
fix_file() {
    local file="$1"
    local filename=$(basename "$file")
    
    echo "📝 Correction: $filename"
    
    # 1. Enlever l'import AdminLayout
    sed -i.bak "/import AdminLayout from/d" "$file"
    
    # 2. Enlever les balises <AdminLayout> ouvrantes
    sed -i.bak "s/<AdminLayout>//g" "$file"
    
    # 3. Enlever les balises </AdminLayout> fermantes  
    sed -i.bak "s/<\/AdminLayout>//g" "$file"
    
    # 4. Nettoyer les lignes vides multiples
    sed -i.bak '/^$/N;/^\n$/D' "$file"
    
    echo "   ✅ Corrigé"
}

# Liste des fichiers à corriger
FILES=(
    "AdminActivityMonitor.tsx"
    "AdminAIChat.tsx"
    "AdminDashboard.tsx"
    "AdminDataAnalytics.tsx"
    "AdminDocumentUpload.tsx"
    "AdminDocumentViewer.tsx"
    "AdminLegislation.tsx"
    "AdminProfile.tsx"
    "AdminSettings.tsx"
    "AdminSupport.tsx"
    "AdminUserDetails.tsx"
    "AdminUserEdit.tsx"
    "AdminUsers.tsx"
    "AdminValidation.tsx"
)

echo "Fichiers à corriger: ${#FILES[@]}"
echo ""

# Vérifier si on est dans le bon dossier
if [ ! -d "/Users/davyokemba/Desktop/teras/teras-frontend/src/pages/admin" ]; then
    echo "❌ Dossier admin introuvable !"
    echo "   Naviguez d'abord vers: cd /Users/davyokemba/Desktop/teras/teras-frontend/src/pages/admin"
    exit 1
fi

cd /Users/davyokemba/Desktop/teras/teras-frontend/src/pages/admin

# Backup complet
echo "📦 Création backup..."
tar -czf admin_backup_$(date +%Y%m%d_%H%M%S).tar.gz *.tsx 2>/dev/null
echo "   ✅ Backup créé"
echo ""

# Corriger chaque fichier
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        fix_file "$file"
    else
        echo "⚠️  Fichier non trouvé: $file"
    fi
done

# Nettoyer les fichiers .bak
rm -f *.bak 2>/dev/null

echo ""
echo "✅ CORRECTION TERMINÉE !"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. cd /Users/davyokemba/Desktop/teras/teras-frontend"
echo "   2. npm run dev"
echo "   3. Tester http://localhost:5173/admin/dashboard"
echo ""
echo "🎉 Votre interface Admin devrait maintenant fonctionner !"


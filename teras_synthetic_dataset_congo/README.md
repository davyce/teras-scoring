# TERAS Synthetic Dataset Congo

Ce dossier contient un jeu de donnees synthetiques realistes destine a TERAS, centre sur la Republique du Congo.

## Objectif

Preparer un dataset de demonstration et de QA permettant de tester :

- la creation de profils banque, utilisateur et entreprise
- l'upload de documents separes
- l'OCR et le parsing PDF / Excel
- l'enrichissement automatique
- le calcul de score TERAS
- la remontee des agregats vers les vues gouvernement Congo

## Etat actuel

- 63 profils synthetiques generes et importables dans TERAS
- 625 documents profil generes dans les dossiers `users/`, `companies/` et `banks/`
- 85 documents marques `dirty` pour tests OCR/PDF plus severes
- 120 documents propres d'actifs individuels et entreprise
- 154 classeurs `.xlsx` generes pour mapping, budgets, ventes, achats et portefeuilles
- identifiants de connexion exportes dans `seeds/login_credentials.*`

## Structure

- `mapping/` : correspondance profil -> documents
- `seeds/` : exports de seed, identifiants et SQL optionnel
- `master-data/` : fichiers maitres globaux
- `users/` : sous-dossiers utilisateurs avec documents reels
- `companies/` : sous-dossiers entreprises avec documents reels
- `banks/` : sous-dossiers banques avec documents reels
- `government/` : apercus et agregats cibles
- `scripts/` : generateurs, importeurs et validateurs dataset

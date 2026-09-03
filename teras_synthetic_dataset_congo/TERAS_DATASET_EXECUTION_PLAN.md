# TERAS Dataset Execution Plan

## Objectif

Construire un dataset synthetique Congo-Brazzaville coherent avec les modeles reeles de TERAS.

## Mapping recommande avec le projet

### Comptes banque

- Type `bank` dans `CustomUser`
- Profil enrichi dans `Profile`

### Portefeuille banque

- Particuliers : `BankClient`
- Entreprises : `BankEnterprise`
- Produits : `FinancialProduct`
- Demandes : `LoanApplication`

### Proprietaire banque

Les modeles banque doivent porter un lien `bank_owner` pour garantir :

- la repartition reelle par banque
- la segregation des portefeuilles
- la coherence des vues banque
- la coherence du dataset de demo

## Phases

### Phase 1

Scaffold, planification, scripts squelettes, placeholders.

### Phase 2

Generation des 3 banques et des profils maitres :

- 30 utilisateurs
- 30 entreprises
- 3 banques

### Phase 3

Generation des documents :

- PDF
- Excel
- images OCR degradees
- notes markdown

### Phase 4

Validation, import dans TERAS, controle des vues admin/gouvernement.

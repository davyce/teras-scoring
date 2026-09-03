# Import Plan

## Ordre recommande d'injection dans TERAS

1. Creation des 3 comptes banque
2. Creation des profils bancaires portefeuille :
   - `BankClient`
   - `BankEnterprise`
3. Verification de l'auto-creation des comptes TERAS lies
4. Export des identifiants de demonstration :
   - `login_credentials.json`
   - `login_credentials.xlsx`
5. Verification des connexions demo :
   - comptes banque
   - comptes individuels lies
   - comptes entreprise lies
6. Upload automatique ou progressif des documents dataset :
   - utilisateurs via `/api/scoring/user/documents/upload/`
   - entreprises via `/api/scoring/enterprise/documents/upload/`
   - banques via `/api/scoring/bank/documents/upload/`
7. Export des resultats d'upload :
   - `upload_results.json`
   - `upload_results.xlsx`
8. Validation du parsing OCR / PDF / Excel
9. Verification du scoring TERAS
10. Verification des vues admin, banque et gouvernement

## Remarque importante

Le projet TERAS distingue actuellement :

- les comptes plateforme : `CustomUser + Profile`
- les portefeuilles banque : `BankClient + BankEnterprise`

Le dataset devra respecter cette separation.

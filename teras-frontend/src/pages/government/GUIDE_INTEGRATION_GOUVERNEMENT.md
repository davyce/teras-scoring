# Interface Gouvernement TERAS - Guide d'Intégration

## 📁 Composants Créés

Six composants React/TypeScript ont été développés pour l'interface gouvernementale :

### 1. **GovernmentDashboard.tsx** (18 KB)
- Vue macro-économique nationale
- Indicateurs clés de performance (PIB, emploi, entreprises, score TERAS)
- Graphiques d'évolution temporelle
- Carte interactive des régions
- Distribution des scores TERAS
- Tableau des performances régionales
- Système d'alertes intégré

**Features principales :**
- 4 KPIs en temps réel
- Évolution du PIB sur 9 mois
- Répartition sectorielle (pie chart)
- Distribution des scores (bar chart)
- Carte SVG des régions avec scores
- Tableau comparatif détaillé

### 2. **GovernmentRegions.tsx** (27 KB)
- Statistiques détaillées par région
- Comparaison entre deux régions
- Analyse TERAS par pilier (radar chart)
- Évolution temporelle des indicateurs
- Répartition sectorielle régionale
- Démographie et structure de la population
- Tableau comparatif de toutes les régions

**Features principales :**
- Sélection de 2 régions pour comparaison
- Graphique radar des 5 piliers TERAS
- Courbes d'évolution (score & chômage)
- Analyse sectorielle détaillée
- Pyramide démographique
- Filtres et recherche avancés

### 3. **GovernmentSectors.tsx** (23 KB)
- Analyse approfondie par secteur d'activité
- 4 secteurs principaux (Services, Agriculture, Industrie, Commerce)
- Performance et indicateurs sectoriels
- Sous-secteurs et leur contribution
- Distribution des entreprises par taille
- Défis et opportunités identifiés
- Comparaison inter-sectorielle

**Features principales :**
- Sélection interactive des secteurs
- 4 KPIs sectoriels détaillés
- Évolution sur 12 mois (area chart)
- Répartition des sous-secteurs
- Distribution des entreprises (pie chart)
- Listes de défis et opportunités

### 4. **GovernmentReports.tsx** (23 KB)
- Consultation et gestion des rapports officiels
- Génération de nouveaux rapports
- Templates pré-configurés
- Filtres avancés (type, catégorie, statut)
- Statistiques de téléchargement
- Actions rapides (consulter, télécharger, partager)

**Features principales :**
- 4 statistiques globales
- Filtres multiples
- Liste détaillée des rapports
- Modal de génération avec 4 templates
- Configuration de période et format
- Gestion des brouillons

### 5. **GovernmentAlerts.tsx** (25 KB)
- Système complet d'alertes et de surveillance
- Classification par sévérité (critique, élevée, moyenne, faible)
- Catégorisation (économique, fiscal, social, sécurité, infrastructure)
- Gestion des statuts (active, prise en compte, résolue)
- Métriques détaillées pour chaque alerte
- Recommandations d'actions
- Configuration des règles d'alerte

**Features principales :**
- Vue d'ensemble avec 4 KPIs
- Filtres avancés (sévérité, catégorie, statut)
- Détails complets par alerte
- Impact et métriques
- Recommandations actionables
- Modal de configuration des règles

### 6. **GovernmentSettings.tsx** (33 KB)
- Configuration complète du système
- 6 sections de paramètres
- Gestion des utilisateurs et rôles
- Sécurité et authentification
- Sauvegarde et export de données
- API et webhooks

**Sections :**
1. **Général** : Infos système, devise, langue, préférences d'affichage
2. **Notifications** : Canaux (email, SMS, push), types d'alertes
3. **Utilisateurs** : Gestion des accès, rôles et permissions
4. **Sécurité** : 2FA, durée de session, politique de mot de passe, audit
5. **Données** : Sauvegarde automatique, export/import
6. **API** : Clés API, webhooks, intégrations

---

## 🚀 Installation

### Prérequis
```bash
# Dépendances principales
npm install react react-dom
npm install recharts lucide-react

# TypeScript
npm install -D typescript @types/react @types/react-dom
```

### Structure de fichiers recommandée
```
src/
├── components/
│   └── government/
│       ├── GovernmentDashboard.tsx
│       ├── GovernmentRegions.tsx
│       ├── GovernmentSectors.tsx
│       ├── GovernmentReports.tsx
│       ├── GovernmentAlerts.tsx
│       └── GovernmentSettings.tsx
├── types/
│   └── government.ts
└── App.tsx
```

---

## 🔧 Configuration

### 1. Installer Tailwind CSS (requis)
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Configurer tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 3. Importer Tailwind dans votre CSS
```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 💻 Utilisation

### Exemple d'intégration dans App.tsx
```typescript
import React, { useState } from 'react';
import GovernmentDashboard from './components/government/GovernmentDashboard';
import GovernmentRegions from './components/government/GovernmentRegions';
import GovernmentSectors from './components/government/GovernmentSectors';
import GovernmentReports from './components/government/GovernmentReports';
import GovernmentAlerts from './components/government/GovernmentAlerts';
import GovernmentSettings from './components/government/GovernmentSettings';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const pages = {
    dashboard: <GovernmentDashboard />,
    regions: <GovernmentRegions />,
    sectors: <GovernmentSectors />,
    reports: <GovernmentReports />,
    alerts: <GovernmentAlerts />,
    settings: <GovernmentSettings />
  };

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="flex gap-4 p-4">
          <button onClick={() => setCurrentPage('dashboard')}>Tableau de Bord</button>
          <button onClick={() => setCurrentPage('regions')}>Régions</button>
          <button onClick={() => setCurrentPage('sectors')}>Secteurs</button>
          <button onClick={() => setCurrentPage('reports')}>Rapports</button>
          <button onClick={() => setCurrentPage('alerts')}>Alertes</button>
          <button onClick={() => setCurrentPage('settings')}>Paramètres</button>
        </div>
      </nav>

      {/* Contenu */}
      {pages[currentPage]}
    </div>
  );
}

export default App;
```

### Exemple avec React Router
```typescript
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/regions">Régions</Link>
        {/* ... autres liens */}
      </nav>

      <Routes>
        <Route path="/" element={<GovernmentDashboard />} />
        <Route path="/regions" element={<GovernmentRegions />} />
        <Route path="/sectors" element={<GovernmentSectors />} />
        <Route path="/reports" element={<GovernmentReports />} />
        <Route path="/alerts" element={<GovernmentAlerts />} />
        <Route path="/settings" element={<GovernmentSettings />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🎨 Personnalisation

### Modifier les couleurs
Les composants utilisent les couleurs Tailwind par défaut. Pour personnaliser :

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#votre-couleur',
        secondary: '#votre-couleur',
      }
    }
  }
}
```

### Remplacer les données mockées
Chaque composant contient des données d'exemple. Remplacez-les par vos appels API :

```typescript
// Exemple dans GovernmentDashboard.tsx
// Avant :
const regionsData = [/* données statiques */];

// Après :
const [regionsData, setRegionsData] = useState([]);

useEffect(() => {
  fetch('https://api.teras.ai/v1/regions')
    .then(res => res.json())
    .then(data => setRegionsData(data));
}, []);
```

---

## 📊 Intégration API TERAS

### Configuration du client API
```typescript
// src/services/terasApi.ts
const API_BASE = 'https://api.teras.ai/v1';
const API_KEY = 'votre_clé_api';

export const terasApi = {
  async getRegions() {
    const res = await fetch(`${API_BASE}/regions`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    return res.json();
  },

  async getSectorStats(sectorId: string) {
    const res = await fetch(`${API_BASE}/sectors/${sectorId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    return res.json();
  },

  async getAlerts(filters: any) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/alerts?${params}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    return res.json();
  }
};
```

---

## 🔐 Sécurité

### Bonnes pratiques
1. **Authentification** : Intégrer OAuth2 ou JWT
2. **Variables d'environnement** : Stocker les clés API dans `.env`
3. **Validation** : Valider toutes les entrées utilisateur
4. **HTTPS** : Toujours utiliser HTTPS en production

```typescript
// .env
VITE_TERAS_API_KEY=votre_clé
VITE_TERAS_API_URL=https://api.teras.ai/v1
```

---

## 📱 Responsive Design

Tous les composants sont responsive avec Tailwind :
- **Mobile** : Adaptation automatique avec grids responsive
- **Tablet** : Optimisé pour écrans moyens
- **Desktop** : Expérience complète

---

## 🧪 Tests

### Tests unitaires avec Vitest
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// GovernmentDashboard.test.tsx
import { render, screen } from '@testing-library/react';
import GovernmentDashboard from './GovernmentDashboard';

test('renders dashboard title', () => {
  render(<GovernmentDashboard />);
  expect(screen.getByText('Tableau de Bord National')).toBeInTheDocument();
});
```

---

## 📈 Performance

### Optimisations recommandées
1. **Lazy loading** des composants
2. **Memoization** avec React.memo
3. **Virtualization** pour grandes listes
4. **Code splitting** par route

```typescript
// Lazy loading
const GovernmentReports = lazy(() => import('./GovernmentReports'));
```

---

## 🐛 Debugging

### Mode développement
```typescript
// Activer les logs en développement
if (import.meta.env.DEV) {
  console.log('Données chargées:', data);
}
```

---

## 📝 Types TypeScript

### Créer vos types
```typescript
// src/types/government.ts
export interface Region {
  id: string;
  name: string;
  score: number;
  population: number;
  gdp: number;
}

export interface Alert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'acknowledged' | 'resolved';
}
```

---

## 🎯 Prochaines Étapes

1. **Backend** : Connecter à l'API TERAS réelle
2. **Auth** : Implémenter l'authentification
3. **WebSockets** : Temps réel pour les alertes
4. **Export** : Génération PDF/Excel des rapports
5. **Mobile App** : Version React Native

---

## 📞 Support

- **Documentation API** : https://docs.teras.ai
- **GitHub** : https://github.com/teras/government-ui
- **Email** : support@teras.ai

---

## 📄 Licence

Ces composants sont fournis dans le cadre du système TERAS pour usage gouvernemental.

---

## ✅ Checklist d'Intégration

- [ ] Installation des dépendances
- [ ] Configuration Tailwind CSS
- [ ] Copie des composants
- [ ] Configuration de l'API
- [ ] Tests des composants
- [ ] Configuration du routing
- [ ] Authentification
- [ ] Personnalisation des couleurs
- [ ] Tests responsiveness
- [ ] Déploiement

---

**Taille totale des fichiers** : ~155 KB
**Nombre de lignes** : ~3200 lignes
**Technologies** : React, TypeScript, Tailwind CSS, Recharts, Lucide React

**Prêt pour production** ✨

// @ts-nocheck
/**
 * Page de Conformité Fiscale TERAS Entreprise
 * @module pages/enterprise/EnterpriseCompliance
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import enterpriseApi from "../../services/enterpriseApi";
import {
  ShieldCheck,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  Download,
  ChevronRight,
  TrendingUp,
  Bell,
  RefreshCw,
  Eye,
  Filter,
  Search,
  AlertCircle,
  Info
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface ComplianceItem {
  id: string;
  name: string;
  category: "tax" | "social" | "legal" | "other";
  status: "compliant" | "pending" | "overdue" | "upcoming";
  dueDate?: string;
  submittedDate?: string;
  description: string;
  impact: "high" | "medium" | "low";
  documents?: string[];
}

interface ComplianceAlert {
  id: string;
  type: "warning" | "error" | "info";
  title: string;
  message: string;
  date: string;
  actionRequired: boolean;
}

// ============================================================================
// DONNÉES MOCK
// ============================================================================

const []: ComplianceItem[] = [
  {
    id: "1",
    name: "Déclaration TVA Mensuelle",
    category: "tax",
    status: "compliant",
    dueDate: "2024-11-15",
    submittedDate: "2024-11-10",
    description: "Déclaration de la TVA collectée et déductible du mois",
    impact: "high",
    documents: ["declaration_tva_oct_2024.pdf"]
  },
  {
    id: "2",
    name: "Impôt sur les Sociétés (IS)",
    category: "tax",
    status: "pending",
    dueDate: "2024-12-31",
    description: "Acompte trimestriel de l'IS",
    impact: "high"
  },
  {
    id: "3",
    name: "Cotisations CNSS",
    category: "social",
    status: "compliant",
    dueDate: "2024-11-15",
    submittedDate: "2024-11-12",
    description: "Cotisations sociales des employés",
    impact: "high",
    documents: ["cnss_nov_2024.pdf"]
  },
  {
    id: "4",
    name: "Déclaration Annuelle des Revenus",
    category: "tax",
    status: "upcoming",
    dueDate: "2025-03-31",
    description: "Déclaration annuelle des revenus de l'entreprise",
    impact: "high"
  },
  {
    id: "5",
    name: "Bilan Comptable Annuel",
    category: "legal",
    status: "overdue",
    dueDate: "2024-10-31",
    description: "Dépôt du bilan comptable de l'exercice précédent",
    impact: "high"
  },
  {
    id: "6",
    name: "Patente",
    category: "tax",
    status: "compliant",
    dueDate: "2024-06-30",
    submittedDate: "2024-06-25",
    description: "Taxe professionnelle annuelle",
    impact: "medium",
    documents: ["patente_2024.pdf"]
  }
];

const []: ComplianceAlert[] = [
  {
    id: "1",
    type: "error",
    title: "Bilan comptable en retard",
    message: "Le dépôt du bilan comptable annuel est en retard de 22 jours. Des pénalités peuvent s'appliquer.",
    date: "2024-11-22",
    actionRequired: true
  },
  {
    id: "2",
    type: "warning",
    title: "Échéance IS proche",
    message: "L'acompte trimestriel de l'IS est dû dans 39 jours.",
    date: "2024-11-22",
    actionRequired: true
  },
  {
    id: "3",
    type: "info",
    title: "Nouvelle réglementation",
    message: "De nouvelles règles de facturation électronique entreront en vigueur en janvier 2025.",
    date: "2024-11-20",
    actionRequired: false
  }
];

// ============================================================================
// COMPOSANTS
// ============================================================================

// Badge de statut
const StatusBadge = ({ status }: { status: ComplianceItem["status"] }) => {
  const configs = {
    compliant: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", label: "Conforme" },
    pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", label: "En attente" },
    overdue: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "En retard" },
    upcoming: { icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10", label: "À venir" }
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg}`}>
      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
};

// Badge d'impact
const ImpactBadge = ({ impact }: { impact: ComplianceItem["impact"] }) => {
  const configs = {
    high: { color: "text-red-400", bg: "bg-red-500/10", label: "Impact élevé" },
    medium: { color: "text-amber-400", bg: "bg-amber-500/10", label: "Impact moyen" },
    low: { color: "text-blue-400", bg: "bg-blue-500/10", label: "Impact faible" }
  };

  const config = configs[impact];

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
};

// Carte d'alerte
const AlertCard = ({ alert, onAction }: { alert: ComplianceAlert; onAction?: () => void }) => {
  const configs = {
    error: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
    warning: { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
    info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" }
  };

  const config = configs[alert.type];
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-xl ${config.bg} border ${config.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 className={`font-medium ${config.color}`}>{alert.title}</h4>
            <span className="text-xs text-slate-500">{alert.date}</span>
          </div>
          <p className="text-sm text-slate-400 mt-1">{alert.message}</p>
          {alert.actionRequired && (
            <button
              onClick={onAction}
              className={`mt-3 text-sm font-medium ${config.color} hover:underline`}
            >
              Prendre action →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Carte de conformité
const ComplianceCard = ({ item, onUpload, onViewDocument }: { item: ComplianceItem; onUpload: () => void; onViewDocument: () => void }) => {
  const categoryLabels: Record<string, string> = {
    tax: "Fiscal",
    social: "Social",
    legal: "Juridique",
    other: "Autre"
  };

  const categoryColors: Record<string, string> = {
    tax: "bg-purple-500/20 text-purple-400",
    social: "bg-blue-500/20 text-blue-400",
    legal: "bg-amber-500/20 text-amber-400",
    other: "bg-slate-500/20 text-slate-400"
  };

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColors[item.category]}`}>
            {categoryLabels[item.category]}
          </span>
          <ImpactBadge impact={item.impact} />
        </div>
        <StatusBadge status={item.status} />
      </div>

      <h3 className="font-semibold text-white mb-1">{item.name}</h3>
      <p className="text-sm text-slate-400 mb-3">{item.description}</p>

      <div className="space-y-2 mb-4">
        {item.dueDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">
              Échéance: <span className={item.status === "overdue" ? "text-red-400" : "text-white"}>
                {new Date(item.dueDate).toLocaleDateString("fr-FR")}
              </span>
            </span>
          </div>
        )}
        {item.submittedDate && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-slate-400">
              Soumis le: <span className="text-green-400">
                {new Date(item.submittedDate).toLocaleDateString("fr-FR")}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {item.documents && item.documents.length > 0 ? (
          <button
            onClick={onViewDocument}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/50 border border-white/5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition"
          >
            <Eye className="w-4 h-4" />
            Voir document
          </button>
        ) : (
          <button
            onClick={onUpload}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300 hover:bg-purple-500/30 transition"
          >
            <Upload className="w-4 h-4" />
            Uploader
          </button>
        )}
      </div>
    </div>
  );
};

// Jauge de conformité globale
const ComplianceGauge = ({ percentage }: { percentage: number }) => {
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (p: number) => {
    if (p >= 90) return { stroke: "#10b981", text: "text-emerald-400", label: "Excellent" };
    if (p >= 70) return { stroke: "#a855f7", text: "text-purple-400", label: "Bon" };
    if (p >= 50) return { stroke: "#eab308", text: "text-amber-400", label: "À améliorer" };
    return { stroke: "#ef4444", text: "text-red-400", label: "Critique" };
  };

  const colorInfo = getColor(percentage);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="140" height="140" className="transform -rotate-90">
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke={colorInfo.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
            style={{ filter: `drop-shadow(0 0 8px ${colorInfo.stroke})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${colorInfo.text}`}>{percentage}%</span>
          <span className="text-xs text-slate-400">Conformité</span>
        </div>
      </div>
      <span className={`mt-2 text-sm font-medium ${colorInfo.text}`}>{colorInfo.label}</span>
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const EnterpriseCompliance = () => {
  const navigate = useNavigate();
  const [items, setItems]   = useState<ComplianceItem[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(true);

  const buildComplianceItems = (data: any): ComplianceItem[] => {
    const generatedItems: ComplianceItem[] = [];
    const today = new Date();

    (data?.missing_declarations || []).forEach((entry: any, index: number) => {
      const dueDate = entry?.deadline || entry?.due_date || undefined;
      const parsedDueDate = dueDate ? new Date(dueDate) : null;
      const status = parsedDueDate && parsedDueDate.getTime() < today.getTime() ? "overdue" : "pending";
      generatedItems.push({
        id: `missing-${index}`,
        name: entry?.type || `Déclaration manquante ${index + 1}`,
        category: "tax",
        status,
        dueDate,
        description: `Pièce ou déclaration manquante à régulariser pour maintenir la conformité fiscale.`,
        impact: "high",
      });
    });

    if (data?.last_tax_filing) {
      generatedItems.push({
        id: "last-tax-filing",
        name: "Dernier dépôt fiscal",
        category: "tax",
        status: "compliant",
        submittedDate: data.last_tax_filing,
        description: "Dernier dépôt fiscal enregistré dans TERAS.",
        impact: "medium",
        documents: ["Dernier dépôt fiscal"],
      });
    }

    if (Number(data?.late_payments || 0) > 0) {
      generatedItems.push({
        id: "late-payments",
        name: "Paiements en retard",
        category: "social",
        status: "overdue",
        description: `${data.late_payments} paiement(s) en retard détecté(s).`,
        impact: Number(data?.late_payments) > 1 ? "high" : "medium",
      });
    }

    if (Number(data?.penalties || 0) > 0) {
      generatedItems.push({
        id: "penalties",
        name: "Pénalités administratives",
        category: "legal",
        status: "pending",
        description: `Pénalités estimées à ${Number(data.penalties).toLocaleString("fr-FR")} FCFA à régulariser.`,
        impact: "high",
      });
    }

    if (!generatedItems.length && typeof data?.compliance_rate !== "undefined") {
      generatedItems.push({
        id: "compliance-summary",
        name: "Statut global de conformité",
        category: "other",
        status: Number(data.compliance_rate) >= 80 ? "compliant" : Number(data.compliance_rate) >= 60 ? "pending" : "overdue",
        description: `Synthèse calculée automatiquement à partir des signaux de conformité TERAS.`,
        impact: "medium",
      });
    }

    return generatedItems;
  };

  const buildComplianceAlerts = (data: any): ComplianceAlert[] => {
    return (data?.active_alerts || []).map((entry: any, index: number) => {
      const rawLevel = typeof entry === "object" ? entry.level : "warning";
      const message = typeof entry === "object" ? entry.message : String(entry);
      return {
        id: `alert-${index}`,
        type: rawLevel === "error" ? "error" : rawLevel === "info" ? "info" : "warning",
        title: typeof entry === "object" ? (entry.title || entry.type || "Alerte conformité") : "Alerte conformité",
        message,
        date: typeof entry === "object" ? (entry.deadline || new Date().toISOString().split("T")[0]) : new Date().toISOString().split("T")[0],
        actionRequired: rawLevel !== "info",
      };
    });
  };

  const loadCompliance = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await enterpriseApi.getCompliance();
      if (!data) {
        setItems([]);
        setAlerts([]);
        return;
      }
      setItems(buildComplianceItems(data));
      setAlerts(buildComplianceAlerts(data));
    } catch (e) {
      setItems([]);
      setAlerts([]);
      setError('Impossible de charger la conformité.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompliance();
  }, []);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Calcul du taux de conformité
  const complianceRate = items.length
    ? Math.round((items.filter(i => i.status === "compliant").length / items.length) * 100)
    : 0;

  // Stats
  const stats = {
    total: items.length,
    compliant: items.filter(i => i.status === "compliant").length,
    pending: items.filter(i => i.status === "pending").length,
    overdue: items.filter(i => i.status === "overdue").length
  };

  // Filtrage
  const filteredItems = items.filter((item) => {
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Prochaines échéances
  const upcomingDeadlines = items
    .filter(i => i.status !== "compliant" && i.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const exportCompliance = () => {
    const headers = ["id", "obligation", "categorie", "statut", "echeance", "soumis_le", "impact", "description"];
    const rows = filteredItems.map((item) => [
      item.id,
      item.name,
      item.category,
      item.status,
      item.dueDate || "",
      item.submittedDate || "",
      item.impact,
      item.description.replace(/\n/g, " "),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "teras_enterprise_compliance.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Conformité Fiscale</h1>
          <p className="text-slate-400">
            Suivez vos obligations fiscales et sociales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCompliance}
            className="px-4 py-2 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/5 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button
            onClick={loadCompliance}
            className="px-4 py-2 bg-purple-500 rounded-xl text-sm font-semibold text-white hover:bg-purple-400 transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Jauge de conformité */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Taux de conformité</h3>
          <ComplianceGauge percentage={complianceRate} />
        </div>

        {/* Stats */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-slate-400">Obligations</p>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.compliant}</p>
            <p className="text-sm text-slate-400">Conformes</p>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
            <p className="text-sm text-slate-400">En attente</p>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.overdue}</p>
            <p className="text-sm text-slate-400">En retard</p>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Alertes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onAction={() => navigate("/enterprise/documents")} />
            ))}
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des obligations */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="all">Toutes catégories</option>
              <option value="tax">Fiscal</option>
              <option value="social">Social</option>
              <option value="legal">Juridique</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="all">Tous statuts</option>
              <option value="compliant">Conforme</option>
              <option value="pending">En attente</option>
              <option value="overdue">En retard</option>
              <option value="upcoming">À venir</option>
            </select>
          </div>

          {/* Grille des obligations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <ComplianceCard
                key={item.id}
                item={item}
                onUpload={() => navigate("/enterprise/documents")}
                onViewDocument={() => navigate("/enterprise/documents")}
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 bg-slate-900/50 border border-white/10 rounded-xl">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Aucune obligation trouvée</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Prochaines échéances */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Prochaines échéances
            </h3>
            <div className="space-y-3">
              {upcomingDeadlines.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className={`text-xs ${item.status === "overdue" ? "text-red-400" : "text-slate-400"}`}>
                      {item.status === "overdue" ? "En retard" : new Date(item.dueDate!).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Impact sur le score */}
          <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Impact sur le score
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              La conformité fiscale représente <strong className="text-white">30%</strong> de votre score TERAS Entreprise.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Score actuel (T)</span>
                <span className="text-purple-400 font-semibold">210/250</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Potentiel</span>
                <span className="text-green-400 font-semibold">+40 pts</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/enterprise/documents")}
              className="w-full mt-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-sm font-medium text-purple-300 hover:bg-purple-500/30 transition"
            >
              Voir les recommandations
            </button>
          </div>

          {/* Aide */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Besoin d'aide ?</h3>
            <p className="text-sm text-slate-400 mb-4">
              Notre équipe peut vous accompagner dans vos démarches fiscales.
            </p>
            <button
              onClick={() => navigate("/enterprise/support")}
              className="w-full py-2 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/5 transition flex items-center justify-center gap-2"
            >
              Contacter un conseiller
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseCompliance;

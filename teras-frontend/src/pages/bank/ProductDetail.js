import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, Calculator, Users, TrendingUp, Clock, Shield, Edit, Trash2, BarChart3, } from 'lucide-react';
export default function ProductDetail() {
    const navigate = useNavigate();
    const { productId } = useParams();
    // Mock product data (en production, fetch depuis API)
    const product = {
        id: productId,
        name: 'Crédit Personnel Express',
        category: 'credit_personal',
        description: 'Crédit rapide pour vos besoins urgents',
        minScore: 650,
        maxAmount: 2000000,
        interestRate: { min: 12, max: 18 },
        duration: { min: 6, max: 36 },
        requirements: [
            'Score TERAS ≥ 650',
            'Revenus réguliers justifiables',
            'Pièce d\'identité valide',
            'Justificatif de domicile récent',
            'Relevé bancaire 3 derniers mois'
        ],
        features: [
            'Décaissement sous 48h',
            'Pas de garantie matérielle requise',
            'Remboursement flexible',
            'Possibilité de remboursement anticipé sans pénalité',
            'Assurance emprunteur incluse',
            'Accompagnement personnalisé'
        ],
        isActive: true,
        totalCustomers: 245,
        totalVolume: 185000000,
        createdAt: '2024-01-15',
        updatedAt: '2024-12-10',
    };
    const stats = [
        {
            label: 'Clients Actifs',
            value: product.totalCustomers.toString(),
            icon: Users,
            color: 'blue',
            trend: '+12%',
        },
        {
            label: 'Volume Total',
            value: `${(product.totalVolume / 1000000).toFixed(1)}M CFA`,
            icon: TrendingUp,
            color: 'green',
            trend: '+18%',
        },
        {
            label: 'Taux d\'Approbation',
            value: '68.5%',
            icon: CheckCircle,
            color: 'cyan',
            trend: '+5%',
        },
        {
            label: 'Délai Moyen',
            value: '1.8 jours',
            icon: Clock,
            color: 'purple',
            trend: '-15%',
        },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: () => navigate('/bank/products'), className: "p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors", children: _jsx(ArrowLeft, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 mb-1", children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: product.name }), product.isActive && (_jsxs("span", { className: "px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full font-medium flex items-center gap-1", children: [_jsx("span", { className: "w-1.5 h-1.5 bg-green-400 rounded-full" }), "Actif"] }))] }), _jsx("p", { className: "text-slate-400", children: product.description })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { onClick: () => navigate("/bank/simulator"), className: "px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2", children: [_jsx(Calculator, { className: "w-5 h-5" }), "Simuler"] }), _jsxs("button", { onClick: () => navigate("/bank/products"), className: "px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2", children: [_jsx(Edit, { className: "w-5 h-5" }), "Modifier"] })] })] }), _jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-6", children: stats.map((stat, index) => (_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("div", { className: `w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`, children: _jsx(stat.icon, { className: `w-6 h-6 text-${stat.color}-400` }) }), _jsx("span", { className: "text-green-400 text-sm font-medium", children: stat.trend })] }), _jsx("p", { className: "text-2xl font-bold text-white mb-1", children: stat.value }), _jsx("p", { className: "text-slate-400 text-sm", children: stat.label })] }, index))) }), _jsxs("div", { className: "grid lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-white mb-6", children: "D\u00E9tails du Produit" }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "Score TERAS Minimum" }), _jsx("p", { className: "text-white text-lg font-semibold", children: product.minScore })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "Montant Maximum" }), _jsxs("p", { className: "text-white text-lg font-semibold", children: [(product.maxAmount / 1000000).toFixed(1), "M CFA"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "Taux d'Int\u00E9r\u00EAt" }), _jsxs("p", { className: "text-white text-lg font-semibold", children: [product.interestRate.min === product.interestRate.max
                                                                ? `${product.interestRate.min}%`
                                                                : `${product.interestRate.min}-${product.interestRate.max}%`, " /an"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "Dur\u00E9e" }), _jsx("p", { className: "text-white text-lg font-semibold", children: product.duration.min === product.duration.max
                                                            ? `${product.duration.max} mois`
                                                            : `${product.duration.min}-${product.duration.max} mois` })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-white mb-6 flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-orange-400" }), "Conditions d'\u00C9ligibilit\u00E9"] }), _jsx("ul", { className: "space-y-3", children: product.requirements.map((req, idx) => (_jsxs("li", { className: "flex items-start gap-3 text-slate-300", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" }), _jsx("span", { children: req })] }, idx))) })] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-white mb-6 flex items-center gap-2", children: [_jsx(Shield, { className: "w-5 h-5 text-blue-400" }), "Avantages & Caract\u00E9ristiques"] }), _jsx("ul", { className: "grid md:grid-cols-2 gap-3", children: product.features.map((feature, idx) => (_jsxs("li", { className: "flex items-start gap-3 text-slate-300", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" }), _jsx("span", { children: feature })] }, idx))) })] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-white flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-5 h-5 text-purple-400" }), "Performance du Produit"] }), _jsx("button", { onClick: () => navigate("/bank/analytics"), className: "text-blue-400 hover:text-blue-300 text-sm font-medium", children: "Voir d\u00E9tails \u2192" })] }), _jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-slate-800/30 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Taux de D\u00E9faut" }), _jsx("p", { className: "text-white text-2xl font-bold", children: "2.3%" }), _jsx("p", { className: "text-green-400 text-xs mt-1", children: "\u2193 -0.8% vs mois dernier" })] }), _jsxs("div", { className: "bg-slate-800/30 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "NPS Client" }), _jsx("p", { className: "text-white text-2xl font-bold", children: "85/100" }), _jsx("p", { className: "text-green-400 text-xs mt-1", children: "\u2191 +3 pts vs mois dernier" })] }), _jsxs("div", { className: "bg-slate-800/30 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "ROI Moyen" }), _jsx("p", { className: "text-white text-2xl font-bold", children: "18.4%" }), _jsx("p", { className: "text-green-400 text-xs mt-1", children: "\u2191 +1.2% vs mois dernier" })] })] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "Informations" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "ID Produit" }), _jsx("p", { className: "text-white font-mono text-sm", children: product.id })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Cat\u00E9gorie" }), _jsx("span", { className: "px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full", children: "Cr\u00E9dit Particulier" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Date de Cr\u00E9ation" }), _jsx("p", { className: "text-white text-sm", children: new Date(product.createdAt).toLocaleDateString('fr-FR') })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm mb-1", children: "Derni\u00E8re Modification" }), _jsx("p", { className: "text-white text-sm", children: new Date(product.updatedAt).toLocaleDateString('fr-FR') })] })] })] }), _jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6", children: [_jsx("h3", { className: "text-white font-semibold mb-4", children: "Actions Rapides" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("button", { onClick: () => navigate("/bank/simulator"), className: "w-full px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors flex items-center gap-3", children: [_jsx(Calculator, { className: "w-5 h-5" }), "Lancer Simulation"] }), _jsxs("button", { onClick: () => navigate("/bank/products"), className: "w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-3", children: [_jsx(Edit, { className: "w-5 h-5" }), "Modifier Produit"] }), _jsxs("button", { onClick: () => navigate("/bank/analytics"), className: "w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-3", children: [_jsx(BarChart3, { className: "w-5 h-5" }), "Voir Analytics"] }), _jsxs("button", { onClick: () => {
                                                    if (confirm('Êtes-vous sûr de vouloir désactiver ce produit ?')) {
                                                        // Logique de désactivation
                                                    }
                                                }, className: "w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors flex items-center gap-3", children: [_jsx(Trash2, { className: "w-5 h-5" }), "D\u00E9sactiver Produit"] })] })] }), _jsx("div", { className: "bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-orange-400 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "text-orange-400 font-semibold text-sm mb-1", children: "Attention" }), _jsx("p", { className: "text-orange-300 text-xs", children: "Toute modification des conditions du produit affectera les nouvelles demandes uniquement. Les cr\u00E9dits en cours ne sont pas impact\u00E9s." })] })] }) })] })] })] }));
}

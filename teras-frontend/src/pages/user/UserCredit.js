import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../utils/authFetch';
const UserCredit = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('products');
    const [userScore, setUserScore] = useState(0);
    const [userBand, setUserBand] = useState('');
    const [crm, setCRM] = useState(null);
    const [creditProducts, setCreditProducts] = useState([]);
    const [creditRequests, setCreditRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    // Formulaire demande crédit
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [requestForm, setRequestForm] = useState({
        amount: 0,
        duration: 3,
        purpose: '',
        monthlyIncome: 0,
        hasGuarantee: false,
        guaranteeType: '',
        guaranteeValue: 0
    });
    // Chat IA Assistant
    const [showAIChat, setShowAIChat] = useState(false);
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    // Produits de crédit selon protocole ZOLA
    const allCreditProducts = [
        // SEED - Test/Urgence
        {
            id: 'seed-micro',
            name: 'Micro-Crédit SEED',
            category: 'seed',
            minScore: 0,
            maxScore: 499,
            minAmount: 25000,
            maxAmount: 100000,
            duration: '14-30 jours',
            interestRate: '30% /an',
            guarantees: 'Aucune',
            description: 'Premier crédit test pour construire votre historique TERAS',
            eligibility: 'conditional',
            conditions: ['Score minimum 450', 'Activité ZOLA 1 mois', 'KYC validé']
        },
        // STARTER - Trésorerie
        {
            id: 'starter-tresorerie',
            name: 'Crédit STARTER Trésorerie',
            category: 'starter',
            minScore: 500,
            maxScore: 599,
            minAmount: 100000,
            maxAmount: 300000,
            duration: '1-3 mois',
            interestRate: '24-30% /an',
            guarantees: 'Co-emprunteur ou gage',
            description: 'Trésorerie pour micro-entreprise ou besoin ponctuel',
            eligibility: 'immediate',
            conditions: ['Score 500+', 'Activité ZOLA 3 mois', 'Revenus réguliers']
        },
        // GROWTH - Stock/Équipement
        {
            id: 'growth-stock',
            name: 'Crédit GROWTH Stock',
            category: 'growth',
            minScore: 600,
            maxScore: 699,
            minAmount: 300000,
            maxAmount: 1000000,
            duration: '3-6 mois',
            interestRate: '18-24% /an',
            guarantees: 'Gage matériel obligatoire',
            description: 'Financement stock, petit équipement professionnel',
            eligibility: 'immediate',
            conditions: ['Score 600+', 'CRM suffisant', 'Gage déclaré']
        },
        {
            id: 'growth-equipement',
            name: 'Crédit GROWTH Équipement',
            category: 'growth',
            minScore: 600,
            maxScore: 699,
            minAmount: 500000,
            maxAmount: 1000000,
            duration: '6 mois',
            interestRate: '18-24% /an',
            guarantees: 'Gage équipement + co-emprunteur',
            description: 'Achat équipement professionnel (congélateur, groupe, etc.)',
            eligibility: 'conditional',
            conditions: ['Score 620+', 'Devis fournisseur', 'Gage équipement acheté']
        },
        // PRO - Expansion
        {
            id: 'pro-expansion',
            name: 'Crédit PRO Expansion',
            category: 'pro',
            minScore: 700,
            maxScore: 1000,
            minAmount: 1000000,
            maxAmount: 5000000,
            duration: '6-24 mois',
            interestRate: '6-18% /an',
            guarantees: 'Selon montant',
            description: 'Expansion business, moto-taxi, kiosque, local commercial',
            eligibility: 'immediate',
            conditions: ['Score 700+', 'Business plan', 'Garanties adaptées']
        },
        {
            id: 'pro-moto',
            name: 'Crédit PRO Moto-Taxi',
            category: 'pro',
            minScore: 700,
            maxScore: 1000,
            minAmount: 1500000,
            maxAmount: 3000000,
            duration: '12-18 mois',
            interestRate: '12-18% /an',
            guarantees: 'Nantissement moto',
            description: 'Achat moto-taxi neuve ou occasion récente',
            eligibility: 'immediate',
            conditions: ['Score 720+', 'Permis conduire', 'Nantissement moto']
        },
        {
            id: 'pro-local',
            name: 'Crédit PRO Local Commercial',
            category: 'pro',
            minScore: 750,
            maxScore: 1000,
            minAmount: 2000000,
            maxAmount: 5000000,
            duration: '12-24 mois',
            interestRate: '10-15% /an',
            guarantees: 'Hypothèque ou caution solidaire',
            description: 'Location ou achat local commercial pour business',
            eligibility: 'conditional',
            conditions: ['Score 750+', 'Business plan détaillé', 'Garanties solides']
        }
    ];
    useEffect(() => {
        fetchUserData();
        fetchCreditRequests();
    }, []);
    useEffect(() => {
        if (userScore > 0) {
            filterEligibleProducts();
        }
    }, [userScore]);
    const fetchUserData = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/scoring/user/dashboard/');
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            const data = await res.json();
            const score = data.score?.current ?? data.teras_score ?? 0;
            const band = score >= 900 ? 'A' : score >= 750 ? 'B' : score >= 600 ? 'C' : score >= 400 ? 'D' : 'E';
            setUserScore(score);
            setUserBand(band);
            // CRM depuis le dashboard (protocol ZOLA : 30% des revenus nets)
            if (data.crm || data.credit_data) {
                const c = data.crm ?? data.credit_data;
                setCRM({
                    crm: c.crm ?? c.monthly_payment_capacity ?? 0,
                    revenue_avg: c.revenue_avg ?? c.monthly_income ?? 0,
                    vital_expenses: c.vital_expenses ?? 0,
                    net_revenue: c.net_revenue ?? 0,
                    max_monthly_payment: c.max_monthly_payment ?? c.crm ?? 0,
                });
            }
            else if (data.score?.revenue_avg) {
                const rev = data.score.revenue_avg;
                const net = rev * 0.6;
                setCRM({ crm: Math.round(net * 0.3), revenue_avg: rev,
                    vital_expenses: Math.round(rev * 0.4), net_revenue: Math.round(net),
                    max_monthly_payment: Math.round(net * 0.3) });
            }
        }
        catch (error) {
            console.error('Erreur récupération données:', error.message);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchCreditRequests = async () => {
        try {
            const res = await authFetch('/api/scoring/user/credit/simulate/');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.requests))
                    setCreditRequests(data.requests);
                else if (Array.isArray(data))
                    setCreditRequests(data);
                // Sinon on garde [] — pas de mock
            }
        }
        catch (error) {
            console.error('Erreur récupération demandes:', error.message);
        }
    };
    const filterEligibleProducts = () => {
        const eligible = allCreditProducts.map(product => {
            if (userScore >= product.minScore && userScore <= product.maxScore) {
                return { ...product, eligibility: 'immediate' };
            }
            else if (userScore >= product.minScore - 50 && userScore < product.minScore) {
                return { ...product, eligibility: 'conditional' };
            }
            else {
                return { ...product, eligibility: 'not_eligible' };
            }
        });
        // Trier : immediate > conditional > not_eligible
        eligible.sort((a, b) => {
            const order = { immediate: 0, conditional: 1, not_eligible: 2 };
            return order[a.eligibility] - order[b.eligibility];
        });
        setCreditProducts(eligible);
    };
    const handleRequestCredit = (product) => {
        setSelectedProduct(product);
        setRequestForm({
            ...requestForm,
            amount: product.minAmount,
            duration: product.category === 'seed' ? 1 : product.category === 'starter' ? 2 : 6
        });
        setShowRequestForm(true);
    };
    const calculateLoanDetails = (amount, duration, rate) => {
        // Extraire taux d'intérêt (prendre la moyenne si plage)
        const rateMatch = rate.match(/(\d+)-?(\d+)?/);
        const avgRate = rateMatch ? (parseInt(rateMatch[1]) + (rateMatch[2] ? parseInt(rateMatch[2]) : parseInt(rateMatch[1]))) / 2 / 100 : 0.20;
        const monthlyRate = avgRate / 12;
        const totalMonths = duration;
        // Formule mensualité : M = P * (r(1+r)^n) / ((1+r)^n - 1)
        const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        const totalCost = monthlyPayment * totalMonths;
        const totalInterest = totalCost - amount;
        return {
            monthlyPayment: Math.round(monthlyPayment),
            totalCost: Math.round(totalCost),
            totalInterest: Math.round(totalInterest),
            effortRate: crm ? Math.round((monthlyPayment / crm.net_revenue) * 100) : 0
        };
    };
    const submitCreditRequest = async () => {
        if (!selectedProduct)
            return;
        setLoading(true);
        try {
            const loanDetails = calculateLoanDetails(requestForm.amount, requestForm.duration, selectedProduct.interestRate);
            // TODO: Appel API réel
            const newRequest = {
                id: `req-${Date.now()}`,
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                amount: requestForm.amount,
                duration: requestForm.duration,
                purpose: requestForm.purpose,
                status: 'pending',
                submittedAt: new Date().toISOString(),
                monthlyPayment: loanDetails.monthlyPayment,
                totalCost: loanDetails.totalCost
            };
            setCreditRequests([newRequest, ...creditRequests]);
            setShowRequestForm(false);
            setActiveTab('requests');
            // Notification succès
            alert('✅ Demande de crédit soumise avec succès ! Vous recevrez une réponse sous 24-48h.');
        }
        catch (error) {
            console.error('Erreur soumission demande:', error);
            alert('❌ Erreur lors de la soumission. Veuillez réessayer.');
        }
        finally {
            setLoading(false);
        }
    };
    const sendAIMessage = async () => {
        if (!aiInput.trim())
            return;
        const userMessage = aiInput;
        setAiInput('');
        setAiMessages([...aiMessages, { role: 'user', content: userMessage }]);
        setAiLoading(true);
        try {
            // TODO: Appel API réel avec contexte utilisateur
            const context = {
                score: userScore,
                band: userBand,
                crm: crm,
                selectedProduct: selectedProduct,
                requestForm: requestForm
            };
            // Simuler réponse IA
            await new Promise(resolve => setTimeout(resolve, 1500));
            const aiResponse = generateAIResponse(userMessage, context);
            setAiMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        }
        catch (error) {
            console.error('Erreur IA:', error);
            setAiMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Désolé, une erreur est survenue. Veuillez réessayer.'
                }]);
        }
        finally {
            setAiLoading(false);
        }
    };
    const generateAIResponse = (message, context) => {
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('eligible') || lowerMsg.includes('puis-je')) {
            return `Avec votre score de ${context.score} (Bande ${context.band}), vous êtes éligible aux produits suivants :\n\n✅ **Éligibilité Immédiate** :\n- Crédit STARTER Trésorerie (100-300K CDF)\n- Crédit GROWTH Stock (300K-1M CDF)\n\n⚠️ **Éligibilité Conditionnelle** :\n- Crédit GROWTH Équipement (avec garanties)\n\nVotre CRM de ${context.crm?.crm.toLocaleString()} CDF/mois vous permet une mensualité maximale de ${context.crm?.max_monthly_payment.toLocaleString()} CDF.`;
        }
        if (lowerMsg.includes('améliorer') || lowerMsg.includes('score')) {
            return `Pour améliorer votre score de ${context.score} et accéder à de meilleurs taux :\n\n1. **Épargne régulière** : Épargnez 10-15K CDF/mois → +40 pts en 3 mois\n2. **Actifs déclarés** : Ajoutez votre moto/congélateur → +20-30 pts\n3. **Transactions ZOLA** : Continuez vos paiements réguliers → +10 pts/mois\n\n🎯 Objectif : Atteindre 700+ pour accéder aux crédits PRO (taux 6-18% au lieu de 18-24%)`;
        }
        if (lowerMsg.includes('garantie') || lowerMsg.includes('gage')) {
            return `Les garanties acceptées dépendent du montant :\n\n💰 **< 500K CDF** : Co-emprunteur suffit\n💰 **500K - 1M CDF** : Gage matériel (moto, équipement) + photos\n💰 **> 1M CDF** : Nantissement notarié ou hypothèque\n\n✅ Types de gages acceptés :\n- Moto/véhicule (valeur ≥ 70% du crédit)\n- Équipement professionnel\n- Stock marchandises\n- Terrain avec titre foncier\n\n📄 Documents requis : Photos HD, carte grise/facture, attestation possession`;
        }
        if (lowerMsg.includes('mensualité') || lowerMsg.includes('rembours')) {
            const amount = context.requestForm?.amount || 500000;
            const duration = context.requestForm?.duration || 6;
            const rate = context.selectedProduct?.interestRate || '20% /an';
            const details = calculateLoanDetails(amount, duration, rate);
            return `Pour un crédit de ${amount.toLocaleString()} CDF sur ${duration} mois :\n\n💳 **Mensualité** : ${details.monthlyPayment.toLocaleString()} CDF/mois\n💰 **Coût total** : ${details.totalCost.toLocaleString()} CDF\n📊 **Intérêts** : ${details.totalInterest.toLocaleString()} CDF\n⚖️ **Taux d'effort** : ${details.effortRate}% (limite 30%)\n\n${details.effortRate > 30 ? '⚠️ Attention : Taux d\'effort trop élevé. Réduisez le montant ou augmentez la durée.' : '✅ Taux d\'effort acceptable. Votre dossier est solide !'}`;
        }
        return `Je suis là pour vous aider avec votre demande de crédit !\n\n💬 **Questions fréquentes** :\n- "Suis-je éligible au crédit GROWTH ?"\n- "Comment améliorer mon score ?"\n- "Quelles garanties fournir ?"\n- "Calculer ma mensualité pour 500K CDF"\n\nPosez-moi votre question spécifique et je vous guiderai ! 😊`;
    };
    const getEligibilityBadge = (eligibility) => {
        switch (eligibility) {
            case 'immediate':
                return _jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white", children: "\u2705 \u00C9ligible Imm\u00E9diatement" });
            case 'conditional':
                return _jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-white", children: "\u26A0\uFE0F \u00C9ligible Sous Conditions" });
            default:
                return _jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white", children: "\u274C Non \u00C9ligible" });
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return _jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white", children: "\u23F3 En Attente" });
            case 'under_review':
                return _jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-white", children: "\uD83D\uDD0D En Examen" });
            case 'approved':
                return _jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white", children: "\u2705 Approuv\u00E9" });
            case 'rejected':
                return _jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white", children: "\u274C Refus\u00E9" });
            default:
                return null;
        }
    };
    const getCategoryColor = (category) => {
        switch (category) {
            case 'seed': return 'from-gray-500 to-gray-700';
            case 'starter': return 'from-amber-500 to-amber-700';
            case 'growth': return 'from-blue-500 to-blue-700';
            case 'pro': return 'from-purple-500 to-purple-700';
            default: return 'from-gray-500 to-gray-700';
        }
    };
    if (loading && creditProducts.length === 0) {
        return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black", children: [_jsx(Navbar, {}), _jsx("div", { className: "container mx-auto px-4 py-20 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto" }), _jsx("p", { className: "mt-4 text-white", children: "Chargement de vos options de cr\u00E9dit..." })] }) }), _jsx(Footer, {})] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black", children: [_jsx(Navbar, {}), _jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-4xl font-bold text-white mb-2", children: "\uD83D\uDCB3 Mes Options de Cr\u00E9dit" }), _jsx("p", { className: "text-gray-400", children: "D\u00E9couvrez les produits financiers adapt\u00E9s \u00E0 votre profil TERAS" })] }), _jsx("div", { className: "bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gray-400 text-sm mb-1", children: "Score TERAS" }), _jsx("p", { className: "text-3xl font-bold text-cyan-400", children: userScore }), _jsxs("p", { className: "text-gray-400 text-sm mt-1", children: ["Bande ", userBand] })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gray-400 text-sm mb-1", children: "CRM Mensuel" }), _jsxs("p", { className: "text-2xl font-bold text-white", children: [crm?.crm.toLocaleString(), " CDF"] }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: "Capacit\u00E9 remboursement" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gray-400 text-sm mb-1", children: "Revenus Nets" }), _jsxs("p", { className: "text-2xl font-bold text-white", children: [crm?.net_revenue.toLocaleString(), " CDF"] }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: "Moyenne mensuelle" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gray-400 text-sm mb-1", children: "Mensualit\u00E9 Max" }), _jsxs("p", { className: "text-2xl font-bold text-green-400", children: [crm?.max_monthly_payment.toLocaleString(), " CDF"] }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: "30% revenus nets" })] })] }) }), _jsxs("div", { className: "flex space-x-4 mb-6", children: [_jsx("button", { onClick: () => setActiveTab('products'), className: `px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'products'
                                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'}`, children: "\uD83D\uDCE6 Produits Disponibles" }), _jsxs("button", { onClick: () => setActiveTab('requests'), className: `px-6 py-3 rounded-lg font-semibold transition-all relative ${activeTab === 'requests'
                                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'}`, children: ["\uD83D\uDCCB Mes Demandes", creditRequests.length > 0 && (_jsx("span", { className: "absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center", children: creditRequests.length }))] }), _jsx("button", { onClick: () => setActiveTab('simulator'), className: `px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'simulator'
                                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'}`, children: "\uD83E\uDDEE Simulateur" })] }), activeTab === 'products' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: "\u2705 \u00C9ligibles Imm\u00E9diatement" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: creditProducts.filter(p => p.eligibility === 'immediate').map(product => (_jsxs("div", { className: "bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-cyan-500/20 transition-all", children: [_jsx("div", { className: `h-2 w-full rounded-t-xl bg-gradient-to-r ${getCategoryColor(product.category)} mb-4` }), _jsx("h3", { className: "text-xl font-bold text-white mb-2", children: product.name }), _jsx("div", { className: "mb-4", children: getEligibilityBadge(product.eligibility) }), _jsx("p", { className: "text-gray-300 text-sm mb-4", children: product.description }), _jsxs("div", { className: "space-y-2 mb-4", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-400", children: "Montant :" }), _jsxs("span", { className: "text-white font-semibold", children: [product.minAmount.toLocaleString(), " - ", product.maxAmount.toLocaleString(), " CDF"] })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-400", children: "Dur\u00E9e :" }), _jsx("span", { className: "text-white font-semibold", children: product.duration })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-400", children: "Taux :" }), _jsx("span", { className: "text-green-400 font-semibold", children: product.interestRate })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-400", children: "Garanties :" }), _jsx("span", { className: "text-white font-semibold", children: product.guarantees })] })] }), product.conditions && (_jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-gray-400 text-xs mb-2", children: "Conditions :" }), _jsx("ul", { className: "space-y-1", children: product.conditions.map((cond, idx) => (_jsxs("li", { className: "text-xs text-gray-300 flex items-start", children: [_jsx("span", { className: "text-green-400 mr-2", children: "\u2713" }), cond] }, idx))) })] })), _jsx("button", { onClick: () => handleRequestCredit(product), className: "w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all", children: "Demander ce cr\u00E9dit" })] }, product.id))) })] }), creditProducts.filter(p => p.eligibility === 'conditional').length > 0 && (_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: "\u26A0\uFE0F \u00C9ligibles Sous Conditions" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: creditProducts.filter(p => p.eligibility === 'conditional').map(product => (_jsxs("div", { className: "bg-white/10 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-6 opacity-75 hover:opacity-100 transition-all", children: [_jsx("div", { className: `h-2 w-full rounded-t-xl bg-gradient-to-r ${getCategoryColor(product.category)} mb-4` }), _jsx("h3", { className: "text-xl font-bold text-white mb-2", children: product.name }), _jsx("div", { className: "mb-4", children: getEligibilityBadge(product.eligibility) }), _jsx("p", { className: "text-gray-300 text-sm mb-4", children: product.description }), _jsxs("div", { className: "bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4", children: [_jsx("p", { className: "text-yellow-400 text-xs font-semibold mb-2", children: "Conditions \u00E0 remplir :" }), _jsx("ul", { className: "space-y-1", children: product.conditions?.map((cond, idx) => (_jsxs("li", { className: "text-xs text-gray-300 flex items-start", children: [_jsx("span", { className: "text-yellow-400 mr-2", children: "\u25B8" }), cond] }, idx))) })] }), _jsx("button", { onClick: () => handleRequestCredit(product), className: "w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all", children: "Faire une demande" })] }, product.id))) })] })), creditProducts.filter(p => p.eligibility === 'not_eligible').length > 0 && (_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: "\u2139\uFE0F Pas Encore \u00C9ligible (Objectif Futur)" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: creditProducts.filter(p => p.eligibility === 'not_eligible').slice(0, 3).map(product => (_jsxs("div", { className: "bg-white/5 backdrop-blur-md border border-gray-700/30 rounded-2xl p-6 opacity-50", children: [_jsx("div", { className: `h-2 w-full rounded-t-xl bg-gradient-to-r ${getCategoryColor(product.category)} mb-4` }), _jsx("h3", { className: "text-xl font-bold text-white mb-2", children: product.name }), _jsx("div", { className: "mb-4", children: getEligibilityBadge(product.eligibility) }), _jsx("p", { className: "text-gray-300 text-sm mb-4", children: product.description }), _jsxs("div", { className: "bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4", children: [_jsxs("p", { className: "text-red-400 text-xs font-semibold mb-2", children: ["Am\u00E9liorez votre score \u00E0 ", product.minScore, "+ pour y acc\u00E9der"] }), _jsx("button", { onClick: () => navigate('/mon-espace'), className: "text-cyan-400 text-xs underline", children: "Voir comment am\u00E9liorer mon score \u2192" })] })] }, product.id))) })] }))] })), activeTab === 'requests' && (_jsx("div", { children: creditRequests.length === 0 ? (_jsxs("div", { className: "bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDCCB" }), _jsx("h3", { className: "text-2xl font-bold text-white mb-2", children: "Aucune demande en cours" }), _jsx("p", { className: "text-gray-400 mb-6", children: "Explorez les produits disponibles et faites votre premi\u00E8re demande de cr\u00E9dit !" }), _jsx("button", { onClick: () => setActiveTab('products'), className: "px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all", children: "Voir les produits" })] })) : (_jsx("div", { className: "space-y-6", children: creditRequests.map(request => (_jsxs("div", { className: "bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-cyan-500/20 transition-all", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold text-white mb-1", children: request.productName }), _jsxs("p", { className: "text-gray-400 text-sm", children: ["Soumis le ", new Date(request.submittedAt).toLocaleDateString('fr-FR', {
                                                                day: '2-digit',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })] })] }), getStatusBadge(request.status)] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4", children: [_jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("p", { className: "text-gray-400 text-sm mb-1", children: "Montant demand\u00E9" }), _jsxs("p", { className: "text-2xl font-bold text-white", children: [request.amount.toLocaleString(), " CDF"] })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("p", { className: "text-gray-400 text-sm mb-1", children: "Dur\u00E9e" }), _jsxs("p", { className: "text-2xl font-bold text-white", children: [request.duration, " mois"] })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("p", { className: "text-gray-400 text-sm mb-1", children: "Mensualit\u00E9 estim\u00E9e" }), _jsxs("p", { className: "text-2xl font-bold text-green-400", children: [request.monthlyPayment?.toLocaleString(), " CDF"] })] })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4 mb-4", children: [_jsx("p", { className: "text-gray-400 text-sm mb-2", children: "Motif de la demande :" }), _jsx("p", { className: "text-white", children: request.purpose })] }), request.aiRecommendation && (_jsxs("div", { className: "bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4", children: [_jsx("p", { className: "text-cyan-400 text-sm font-semibold mb-2", children: "\uD83E\uDD16 Analyse IA :" }), _jsx("p", { className: "text-gray-300 text-sm", children: request.aiRecommendation })] })), request.status === 'approved' && (_jsxs("div", { className: "mt-4 flex space-x-4", children: [_jsx("button", { className: "flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all", children: "Accepter l'offre" }), _jsx("button", { className: "px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all", children: "Voir d\u00E9tails" })] }))] }, request.id))) })) })), activeTab === 'simulator' && (_jsxs("div", { className: "bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-6", children: "\uD83E\uDDEE Simulateur de Cr\u00E9dit" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-gray-300 text-sm font-semibold mb-2", children: "Montant souhait\u00E9 (CDF)" }), _jsx("input", { type: "number", value: requestForm.amount, onChange: (e) => setRequestForm({ ...requestForm, amount: parseInt(e.target.value) || 0 }), className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500", placeholder: "Ex: 500000" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-300 text-sm font-semibold mb-2", children: "Dur\u00E9e (mois)" }), _jsxs("select", { value: requestForm.duration, onChange: (e) => setRequestForm({ ...requestForm, duration: parseInt(e.target.value) }), className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500", children: [_jsx("option", { value: 1, children: "1 mois" }), _jsx("option", { value: 2, children: "2 mois" }), _jsx("option", { value: 3, children: "3 mois" }), _jsx("option", { value: 6, children: "6 mois" }), _jsx("option", { value: 12, children: "12 mois" }), _jsx("option", { value: 18, children: "18 mois" }), _jsx("option", { value: 24, children: "24 mois" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-300 text-sm font-semibold mb-2", children: "Produit de cr\u00E9dit" }), _jsxs("select", { onChange: (e) => {
                                                            const product = creditProducts.find(p => p.id === e.target.value);
                                                            setSelectedProduct(product || null);
                                                        }, className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500", children: [_jsx("option", { value: "", children: "S\u00E9lectionner un produit" }), creditProducts.filter(p => p.eligibility !== 'not_eligible').map(product => (_jsxs("option", { value: product.id, children: [product.name, " (", product.interestRate, ")"] }, product.id)))] })] })] }), _jsx("div", { children: selectedProduct && requestForm.amount > 0 ? (_jsxs("div", { className: "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "\uD83D\uDCCA R\u00E9sultats de Simulation" }), (() => {
                                                    const details = calculateLoanDetails(requestForm.amount, requestForm.duration, selectedProduct.interestRate);
                                                    const isAffordable = details.effortRate <= 30;
                                                    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-300", children: "Mensualit\u00E9 :" }), _jsxs("span", { className: "text-2xl font-bold text-white", children: [details.monthlyPayment.toLocaleString(), " CDF"] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-300", children: "Co\u00FBt total :" }), _jsxs("span", { className: "text-xl font-bold text-white", children: [details.totalCost.toLocaleString(), " CDF"] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-300", children: "Dont int\u00E9r\u00EAts :" }), _jsxs("span", { className: "text-xl font-bold text-yellow-400", children: [details.totalInterest.toLocaleString(), " CDF"] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-300", children: "Taux d'effort :" }), _jsxs("span", { className: `text-xl font-bold ${isAffordable ? 'text-green-400' : 'text-red-400'}`, children: [details.effortRate, "%"] })] })] }), _jsx("div", { className: `mt-6 p-4 rounded-lg ${isAffordable ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`, children: isAffordable ? (_jsxs("div", { children: [_jsx("p", { className: "text-green-400 font-semibold mb-2", children: "\u2705 Cr\u00E9dit Soutenable" }), _jsxs("p", { className: "text-gray-300 text-sm", children: ["Votre taux d'effort de ", details.effortRate, "% est acceptable (\u226430%). Ce cr\u00E9dit ne mettra pas en danger votre \u00E9quilibre financier."] })] })) : (_jsxs("div", { children: [_jsx("p", { className: "text-red-400 font-semibold mb-2", children: "\u26A0\uFE0F Taux d'effort trop \u00E9lev\u00E9" }), _jsxs("p", { className: "text-gray-300 text-sm", children: ["Votre taux d'effort de ", details.effortRate, "% d\u00E9passe la limite de 30%. R\u00E9duisez le montant ou augmentez la dur\u00E9e pour un cr\u00E9dit soutenable."] })] })) }), _jsx("button", { onClick: () => {
                                                                    if (isAffordable) {
                                                                        handleRequestCredit(selectedProduct);
                                                                    }
                                                                    else {
                                                                        alert('⚠️ Ce crédit n\'est pas soutenable pour votre profil. Ajustez les paramètres.');
                                                                    }
                                                                }, disabled: !isAffordable, className: `w-full mt-6 py-3 font-semibold rounded-lg transition-all ${isAffordable
                                                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/50'
                                                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`, children: isAffordable ? 'Faire une demande' : 'Non soutenable' })] }));
                                                })()] })) : (_jsxs("div", { className: "bg-white/5 rounded-xl p-6 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83E\uDDEE" }), _jsx("p", { className: "text-gray-400", children: "Remplissez les param\u00E8tres \u00E0 gauche pour simuler votre cr\u00E9dit" })] })) })] })] }))] }), showRequestForm && selectedProduct && (_jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-gray-900 border border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsx("div", { className: "p-6 border-b border-white/10", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h2", { className: "text-2xl font-bold text-white", children: ["Demande de Cr\u00E9dit : ", selectedProduct.name] }), _jsx("button", { onClick: () => setShowRequestForm(false), className: "text-gray-400 hover:text-white transition-colors", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }) }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-gray-300 text-sm font-semibold mb-2", children: "Montant souhait\u00E9 (CDF) *" }), _jsx("input", { type: "number", value: requestForm.amount, onChange: (e) => setRequestForm({ ...requestForm, amount: parseInt(e.target.value) || 0 }), min: selectedProduct.minAmount, max: selectedProduct.maxAmount, className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500", placeholder: `Entre ${selectedProduct.minAmount.toLocaleString()} et ${selectedProduct.maxAmount.toLocaleString()}` }), _jsxs("p", { className: "text-gray-400 text-xs mt-1", children: ["Min: ", selectedProduct.minAmount.toLocaleString(), " CDF | Max: ", selectedProduct.maxAmount.toLocaleString(), " CDF"] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-300 text-sm font-semibold mb-2", children: "Dur\u00E9e de remboursement *" }), _jsxs("select", { value: requestForm.duration, onChange: (e) => setRequestForm({ ...requestForm, duration: parseInt(e.target.value) }), className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500", children: [selectedProduct.category === 'seed' && (_jsxs(_Fragment, { children: [_jsx("option", { value: 0.5, children: "14 jours" }), _jsx("option", { value: 1, children: "1 mois" })] })), selectedProduct.category === 'starter' && (_jsxs(_Fragment, { children: [_jsx("option", { value: 1, children: "1 mois" }), _jsx("option", { value: 2, children: "2 mois" }), _jsx("option", { value: 3, children: "3 mois" })] })), selectedProduct.category === 'growth' && (_jsxs(_Fragment, { children: [_jsx("option", { value: 3, children: "3 mois" }), _jsx("option", { value: 6, children: "6 mois" })] })), selectedProduct.category === 'pro' && (_jsxs(_Fragment, { children: [_jsx("option", { value: 6, children: "6 mois" }), _jsx("option", { value: 12, children: "12 mois" }), _jsx("option", { value: 18, children: "18 mois" }), _jsx("option", { value: 24, children: "24 mois" })] }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-300 text-sm font-semibold mb-2", children: "Motif de la demande * (minimum 20 caract\u00E8res)" }), _jsx("textarea", { value: requestForm.purpose, onChange: (e) => setRequestForm({ ...requestForm, purpose: e.target.value }), rows: 4, className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500", placeholder: "Ex: Achat de stock de marchandises pour mon magasin, besoin de tr\u00E9sorerie pour expansion, etc." }), _jsxs("p", { className: "text-gray-400 text-xs mt-1", children: [requestForm.purpose.length, "/20 caract\u00E8res minimum"] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-300 text-sm font-semibold mb-2", children: "Revenus mensuels d\u00E9clar\u00E9s (CDF)" }), _jsx("input", { type: "number", value: requestForm.monthlyIncome, onChange: (e) => setRequestForm({ ...requestForm, monthlyIncome: parseInt(e.target.value) || 0 }), className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500", placeholder: "Ex: 200000" })] }), selectedProduct.guarantees !== 'Aucune' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: requestForm.hasGuarantee, onChange: (e) => setRequestForm({ ...requestForm, hasGuarantee: e.target.checked }), className: "w-4 h-4 text-cyan-500 bg-white/5 border-white/20 rounded focus:ring-cyan-500" }), _jsx("label", { className: "ml-2 text-gray-300 text-sm", children: "Je dispose d'une garantie (obligatoire pour ce cr\u00E9dit)" })] }), requestForm.hasGuarantee && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-gray-300 text-sm font-semibold mb-2", children: "Type de garantie" }), _jsxs("select", { value: requestForm.guaranteeType, onChange: (e) => setRequestForm({ ...requestForm, guaranteeType: e.target.value }), className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500", children: [_jsx("option", { value: "", children: "S\u00E9lectionner" }), _jsx("option", { value: "coemprunteur", children: "Co-emprunteur" }), _jsx("option", { value: "gage_moto", children: "Gage moto/v\u00E9hicule" }), _jsx("option", { value: "gage_equipement", children: "Gage \u00E9quipement" }), _jsx("option", { value: "nantissement", children: "Nantissement stock" }), _jsx("option", { value: "hypotheque", children: "Hypoth\u00E8que/terrain" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-300 text-sm font-semibold mb-2", children: "Valeur estim\u00E9e de la garantie (CDF)" }), _jsx("input", { type: "number", value: requestForm.guaranteeValue, onChange: (e) => setRequestForm({ ...requestForm, guaranteeValue: parseInt(e.target.value) || 0 }), className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500", placeholder: "Ex: 1000000" })] })] }))] })), requestForm.amount > 0 && requestForm.duration > 0 && (_jsxs("div", { className: "bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4", children: [_jsx("h4", { className: "text-cyan-400 font-semibold mb-3", children: "\uD83D\uDCCA Aper\u00E7u de votre cr\u00E9dit" }), (() => {
                                            const details = calculateLoanDetails(requestForm.amount, requestForm.duration, selectedProduct.interestRate);
                                            return (_jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-300", children: "Mensualit\u00E9 :" }), _jsxs("span", { className: "text-white font-semibold", children: [details.monthlyPayment.toLocaleString(), " CDF"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-300", children: "Co\u00FBt total :" }), _jsxs("span", { className: "text-white font-semibold", children: [details.totalCost.toLocaleString(), " CDF"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-300", children: "Taux d'effort :" }), _jsxs("span", { className: `font-semibold ${details.effortRate <= 30 ? 'text-green-400' : 'text-red-400'}`, children: [details.effortRate, "% ", details.effortRate <= 30 ? '✅' : '⚠️'] })] })] }));
                                        })()] }))] }), _jsxs("div", { className: "p-6 border-t border-white/10 flex space-x-4", children: [_jsx("button", { onClick: () => setShowRequestForm(false), className: "flex-1 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all", children: "Annuler" }), _jsx("button", { onClick: submitCreditRequest, disabled: loading ||
                                        requestForm.amount < selectedProduct.minAmount ||
                                        requestForm.amount > selectedProduct.maxAmount ||
                                        requestForm.purpose.length < 20 ||
                                        (selectedProduct.guarantees !== 'Aucune' && !requestForm.hasGuarantee), className: "flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? 'Envoi...' : 'Soumettre la demande' })] })] }) })), _jsx("button", { onClick: () => setShowAIChat(!showAIChat), className: "fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full shadow-lg shadow-purple-500/50 flex items-center justify-center text-white text-2xl hover:scale-110 transition-all z-40", children: "\uD83E\uDD16" }), showAIChat && (_jsxs("div", { className: "fixed bottom-28 right-8 w-96 h-[500px] bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl z-40 flex flex-col", children: [_jsxs("div", { className: "p-4 border-b border-white/10 flex justify-between items-center", children: [_jsx("h3", { className: "text-white font-semibold", children: "\uD83E\uDD16 Assistant Cr\u00E9dit IA" }), _jsx("button", { onClick: () => setShowAIChat(false), className: "text-gray-400 hover:text-white transition-colors", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [aiMessages.length === 0 ? (_jsxs("div", { className: "text-center text-gray-400 mt-20", children: [_jsx("div", { className: "text-4xl mb-2", children: "\uD83D\uDCAC" }), _jsx("p", { className: "text-sm", children: "Posez-moi vos questions sur le cr\u00E9dit !" }), _jsx("p", { className: "text-xs mt-2", children: "Ex: \"Suis-je \u00E9ligible ?\", \"Am\u00E9liorer mon score\"" })] })) : (aiMessages.map((msg, idx) => (_jsx("div", { className: `flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsx("div", { className: `max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-white/10 text-gray-300'}`, children: _jsx("p", { className: "text-sm whitespace-pre-line", children: msg.content }) }) }, idx)))), aiLoading && (_jsx("div", { className: "flex justify-start", children: _jsx("div", { className: "bg-white/10 p-3 rounded-lg", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.4s' } })] }) }) }))] }), _jsx("div", { className: "p-4 border-t border-white/10", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { type: "text", value: aiInput, onChange: (e) => setAiInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && sendAIMessage(), placeholder: "Posez votre question...", className: "flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" }), _jsx("button", { onClick: sendAIMessage, disabled: !aiInput.trim() || aiLoading, className: "px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" }) }) })] }) })] })), _jsx(Footer, {})] }));
};
export default UserCredit;

// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../utils/authFetch';

// Types
interface CreditProduct {
  id: string;
  name: string;
  category: 'seed' | 'starter' | 'growth' | 'pro';
  minScore: number;
  maxScore: number;
  minAmount: number;
  maxAmount: number;
  duration: string;
  interestRate: string;
  guarantees: string;
  description: string;
  eligibility: 'immediate' | 'conditional' | 'not_eligible';
  conditions?: string[];
}

interface CreditRequest {
  id: string;
  productId: string;
  productName: string;
  amount: number;
  duration: number;
  purpose: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string;
  monthlyPayment?: number;
  totalCost?: number;
  aiRecommendation?: string;
}

interface CRM {
  crm: number;
  revenue_avg: number;
  vital_expenses: number;
  net_revenue: number;
  max_monthly_payment: number;
}

const UserCredit: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'products' | 'requests' | 'simulator'>('products');
  const [userScore, setUserScore] = useState<number>(0);
  const [userBand, setUserBand] = useState<string>('');
  const [crm, setCRM] = useState<CRM | null>(null);
  const [creditProducts, setCreditProducts] = useState<CreditProduct[]>([]);
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Formulaire demande crédit
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CreditProduct | null>(null);
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
  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Produits de crédit selon protocole ZOLA
  const allCreditProducts: CreditProduct[] = [
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
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();

      const score = data.score?.current ?? data.teras_score ?? 0;
      const band  = score >= 900 ? 'A' : score >= 750 ? 'B' : score >= 600 ? 'C' : score >= 400 ? 'D' : 'E';

      setUserScore(score);
      setUserBand(band);

      // CRM depuis le dashboard (protocol ZOLA : 30% des revenus nets)
      if (data.crm || data.credit_data) {
        const c = data.crm ?? data.credit_data;
        setCRM({
          crm:                 c.crm                 ?? c.monthly_payment_capacity ?? 0,
          revenue_avg:         c.revenue_avg          ?? c.monthly_income ?? 0,
          vital_expenses:      c.vital_expenses       ?? 0,
          net_revenue:         c.net_revenue          ?? 0,
          max_monthly_payment: c.max_monthly_payment  ?? c.crm ?? 0,
        });
      } else if (data.score?.revenue_avg) {
        const rev = data.score.revenue_avg;
        const net = rev * 0.6;
        setCRM({ crm: Math.round(net * 0.3), revenue_avg: rev,
                 vital_expenses: Math.round(rev * 0.4), net_revenue: Math.round(net),
                 max_monthly_payment: Math.round(net * 0.3) });
      }
    } catch (error: any) {
      console.error('Erreur récupération données:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditRequests = async () => {
    try {
      const res = await authFetch('/api/scoring/user/credit/simulate/');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.requests)) setCreditRequests(data.requests);
        else if (Array.isArray(data)) setCreditRequests(data);
        // Sinon on garde [] — pas de mock
      }
    } catch (error: any) {
      console.error('Erreur récupération demandes:', error.message);
    }
  };

  const filterEligibleProducts = () => {
    const eligible = allCreditProducts.map(product => {
      if (userScore >= product.minScore && userScore <= product.maxScore) {
        return { ...product, eligibility: 'immediate' as const };
      } else if (userScore >= product.minScore - 50 && userScore < product.minScore) {
        return { ...product, eligibility: 'conditional' as const };
      } else {
        return { ...product, eligibility: 'not_eligible' as const };
      }
    });

    // Trier : immediate > conditional > not_eligible
    eligible.sort((a, b) => {
      const order = { immediate: 0, conditional: 1, not_eligible: 2 };
      return order[a.eligibility] - order[b.eligibility];
    });

    setCreditProducts(eligible);
  };

  const handleRequestCredit = (product: CreditProduct) => {
    setSelectedProduct(product);
    setRequestForm({
      ...requestForm,
      amount: product.minAmount,
      duration: product.category === 'seed' ? 1 : product.category === 'starter' ? 2 : 6
    });
    setShowRequestForm(true);
  };

  const calculateLoanDetails = (amount: number, duration: number, rate: string) => {
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
    if (!selectedProduct) return;

    setLoading(true);
    try {
      const loanDetails = calculateLoanDetails(
        requestForm.amount,
        requestForm.duration,
        selectedProduct.interestRate
      );

      // TODO: Appel API réel
      const newRequest: CreditRequest = {
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
    } catch (error) {
      console.error('Erreur soumission demande:', error);
      alert('❌ Erreur lors de la soumission. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const sendAIMessage = async () => {
    if (!aiInput.trim()) return;

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
    } catch (error) {
      console.error('Erreur IA:', error);
      setAiMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.' 
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const generateAIResponse = (message: string, context: any) => {
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

  const getEligibilityBadge = (eligibility: string) => {
    switch (eligibility) {
      case 'immediate':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">✅ Éligible Immédiatement</span>;
      case 'conditional':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-white">⚠️ Éligible Sous Conditions</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">❌ Non Éligible</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">⏳ En Attente</span>;
      case 'under_review':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-white">🔍 En Examen</span>;
      case 'approved':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">✅ Approuvé</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">❌ Refusé</span>;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'seed': return 'from-gray-500 to-gray-700';
      case 'starter': return 'from-amber-500 to-amber-700';
      case 'growth': return 'from-blue-500 to-blue-700';
      case 'pro': return 'from-purple-500 to-purple-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  if (loading && creditProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-white">Chargement de vos options de crédit...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            💳 Mes Options de Crédit
          </h1>
          <p className="text-gray-400">
            Découvrez les produits financiers adaptés à votre profil TERAS
          </p>
        </div>

        {/* Score Summary Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Score TERAS</p>
              <p className="text-3xl font-bold text-cyan-400">{userScore}</p>
              <p className="text-gray-400 text-sm mt-1">Bande {userBand}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">CRM Mensuel</p>
              <p className="text-2xl font-bold text-white">{crm?.crm.toLocaleString()} CDF</p>
              <p className="text-gray-400 text-sm mt-1">Capacité remboursement</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Revenus Nets</p>
              <p className="text-2xl font-bold text-white">{crm?.net_revenue.toLocaleString()} CDF</p>
              <p className="text-gray-400 text-sm mt-1">Moyenne mensuelle</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Mensualité Max</p>
              <p className="text-2xl font-bold text-green-400">{crm?.max_monthly_payment.toLocaleString()} CDF</p>
              <p className="text-gray-400 text-sm mt-1">30% revenus nets</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'products'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            📦 Produits Disponibles
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
              activeTab === 'requests'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            📋 Mes Demandes
            {creditRequests.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {creditRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'simulator'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            🧮 Simulateur
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Produits Éligibles Immédiatement */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                ✅ Éligibles Immédiatement
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creditProducts.filter(p => p.eligibility === 'immediate').map(product => (
                  <div
                    key={product.id}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-cyan-500/20 transition-all"
                  >
                    <div className={`h-2 w-full rounded-t-xl bg-gradient-to-r ${getCategoryColor(product.category)} mb-4`}></div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                    <div className="mb-4">{getEligibilityBadge(product.eligibility)}</div>
                    
                    <p className="text-gray-300 text-sm mb-4">{product.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Montant :</span>
                        <span className="text-white font-semibold">
                          {product.minAmount.toLocaleString()} - {product.maxAmount.toLocaleString()} CDF
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Durée :</span>
                        <span className="text-white font-semibold">{product.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Taux :</span>
                        <span className="text-green-400 font-semibold">{product.interestRate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Garanties :</span>
                        <span className="text-white font-semibold">{product.guarantees}</span>
                      </div>
                    </div>

                    {product.conditions && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-xs mb-2">Conditions :</p>
                        <ul className="space-y-1">
                          {product.conditions.map((cond, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start">
                              <span className="text-green-400 mr-2">✓</span>
                              {cond}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={() => handleRequestCredit(product)}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                    >
                      Demander ce crédit
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Produits Éligibles Sous Conditions */}
            {creditProducts.filter(p => p.eligibility === 'conditional').length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  ⚠️ Éligibles Sous Conditions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creditProducts.filter(p => p.eligibility === 'conditional').map(product => (
                    <div
                      key={product.id}
                      className="bg-white/10 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-6 opacity-75 hover:opacity-100 transition-all"
                    >
                      <div className={`h-2 w-full rounded-t-xl bg-gradient-to-r ${getCategoryColor(product.category)} mb-4`}></div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                      <div className="mb-4">{getEligibilityBadge(product.eligibility)}</div>
                      
                      <p className="text-gray-300 text-sm mb-4">{product.description}</p>
                      
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                        <p className="text-yellow-400 text-xs font-semibold mb-2">Conditions à remplir :</p>
                        <ul className="space-y-1">
                          {product.conditions?.map((cond, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start">
                              <span className="text-yellow-400 mr-2">▸</span>
                              {cond}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleRequestCredit(product)}
                        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
                      >
                        Faire une demande
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Produits Non Éligibles (pour information) */}
            {creditProducts.filter(p => p.eligibility === 'not_eligible').length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  ℹ️ Pas Encore Éligible (Objectif Futur)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creditProducts.filter(p => p.eligibility === 'not_eligible').slice(0, 3).map(product => (
                    <div
                      key={product.id}
                      className="bg-white/5 backdrop-blur-md border border-gray-700/30 rounded-2xl p-6 opacity-50"
                    >
                      <div className={`h-2 w-full rounded-t-xl bg-gradient-to-r ${getCategoryColor(product.category)} mb-4`}></div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                      <div className="mb-4">{getEligibilityBadge(product.eligibility)}</div>
                      
                      <p className="text-gray-300 text-sm mb-4">{product.description}</p>
                      
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                        <p className="text-red-400 text-xs font-semibold mb-2">
                          Améliorez votre score à {product.minScore}+ pour y accéder
                        </p>
                        <button 
                          onClick={() => navigate('/mon-espace')}
                          className="text-cyan-400 text-xs underline"
                        >
                          Voir comment améliorer mon score →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            {creditRequests.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-2xl font-bold text-white mb-2">Aucune demande en cours</h3>
                <p className="text-gray-400 mb-6">
                  Explorez les produits disponibles et faites votre première demande de crédit !
                </p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                >
                  Voir les produits
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {creditRequests.map(request => (
                  <div
                    key={request.id}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-cyan-500/20 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{request.productName}</h3>
                        <p className="text-gray-400 text-sm">
                          Soumis le {new Date(request.submittedAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-1">Montant demandé</p>
                        <p className="text-2xl font-bold text-white">{request.amount.toLocaleString()} CDF</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-1">Durée</p>
                        <p className="text-2xl font-bold text-white">{request.duration} mois</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-1">Mensualité estimée</p>
                        <p className="text-2xl font-bold text-green-400">{request.monthlyPayment?.toLocaleString()} CDF</p>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 mb-4">
                      <p className="text-gray-400 text-sm mb-2">Motif de la demande :</p>
                      <p className="text-white">{request.purpose}</p>
                    </div>

                    {request.aiRecommendation && (
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                        <p className="text-cyan-400 text-sm font-semibold mb-2">🤖 Analyse IA :</p>
                        <p className="text-gray-300 text-sm">{request.aiRecommendation}</p>
                      </div>
                    )}

                    {request.status === 'approved' && (
                      <div className="mt-4 flex space-x-4">
                        <button className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                          Accepter l'offre
                        </button>
                        <button className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all">
                          Voir détails
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              🧮 Simulateur de Crédit
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Montant souhaité (CDF)
                  </label>
                  <input
                    type="number"
                    value={requestForm.amount}
                    onChange={(e) => setRequestForm({...requestForm, amount: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Ex: 500000"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Durée (mois)
                  </label>
                  <select
                    value={requestForm.duration}
                    onChange={(e) => setRequestForm({...requestForm, duration: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value={1}>1 mois</option>
                    <option value={2}>2 mois</option>
                    <option value={3}>3 mois</option>
                    <option value={6}>6 mois</option>
                    <option value={12}>12 mois</option>
                    <option value={18}>18 mois</option>
                    <option value={24}>24 mois</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Produit de crédit
                  </label>
                  <select
                    onChange={(e) => {
                      const product = creditProducts.find(p => p.id === e.target.value);
                      setSelectedProduct(product || null);
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Sélectionner un produit</option>
                    {creditProducts.filter(p => p.eligibility !== 'not_eligible').map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.interestRate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                {selectedProduct && requestForm.amount > 0 ? (
                  <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">📊 Résultats de Simulation</h3>
                    
                    {(() => {
                      const details = calculateLoanDetails(requestForm.amount, requestForm.duration, selectedProduct.interestRate);
                      const isAffordable = details.effortRate <= 30;
                      
                      return (
                        <>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Mensualité :</span>
                              <span className="text-2xl font-bold text-white">{details.monthlyPayment.toLocaleString()} CDF</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Coût total :</span>
                              <span className="text-xl font-bold text-white">{details.totalCost.toLocaleString()} CDF</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Dont intérêts :</span>
                              <span className="text-xl font-bold text-yellow-400">{details.totalInterest.toLocaleString()} CDF</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Taux d'effort :</span>
                              <span className={`text-xl font-bold ${isAffordable ? 'text-green-400' : 'text-red-400'}`}>
                                {details.effortRate}%
                              </span>
                            </div>
                          </div>

                          <div className={`mt-6 p-4 rounded-lg ${isAffordable ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                            {isAffordable ? (
                              <div>
                                <p className="text-green-400 font-semibold mb-2">✅ Crédit Soutenable</p>
                                <p className="text-gray-300 text-sm">
                                  Votre taux d'effort de {details.effortRate}% est acceptable (≤30%). 
                                  Ce crédit ne mettra pas en danger votre équilibre financier.
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-red-400 font-semibold mb-2">⚠️ Taux d'effort trop élevé</p>
                                <p className="text-gray-300 text-sm">
                                  Votre taux d'effort de {details.effortRate}% dépasse la limite de 30%. 
                                  Réduisez le montant ou augmentez la durée pour un crédit soutenable.
                                </p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              if (isAffordable) {
                                handleRequestCredit(selectedProduct);
                              } else {
                                alert('⚠️ Ce crédit n\'est pas soutenable pour votre profil. Ajustez les paramètres.');
                              }
                            }}
                            disabled={!isAffordable}
                            className={`w-full mt-6 py-3 font-semibold rounded-lg transition-all ${
                              isAffordable
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/50'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {isAffordable ? 'Faire une demande' : 'Non soutenable'}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-6 text-center">
                    <div className="text-6xl mb-4">🧮</div>
                    <p className="text-gray-400">
                      Remplissez les paramètres à gauche pour simuler votre crédit
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Formulaire de Demande Modal */}
      {showRequestForm && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  Demande de Crédit : {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Montant souhaité (CDF) *
                </label>
                <input
                  type="number"
                  value={requestForm.amount}
                  onChange={(e) => setRequestForm({...requestForm, amount: parseInt(e.target.value) || 0})}
                  min={selectedProduct.minAmount}
                  max={selectedProduct.maxAmount}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder={`Entre ${selectedProduct.minAmount.toLocaleString()} et ${selectedProduct.maxAmount.toLocaleString()}`}
                />
                <p className="text-gray-400 text-xs mt-1">
                  Min: {selectedProduct.minAmount.toLocaleString()} CDF | Max: {selectedProduct.maxAmount.toLocaleString()} CDF
                </p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Durée de remboursement *
                </label>
                <select
                  value={requestForm.duration}
                  onChange={(e) => setRequestForm({...requestForm, duration: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  {selectedProduct.category === 'seed' && (
                    <>
                      <option value={0.5}>14 jours</option>
                      <option value={1}>1 mois</option>
                    </>
                  )}
                  {selectedProduct.category === 'starter' && (
                    <>
                      <option value={1}>1 mois</option>
                      <option value={2}>2 mois</option>
                      <option value={3}>3 mois</option>
                    </>
                  )}
                  {selectedProduct.category === 'growth' && (
                    <>
                      <option value={3}>3 mois</option>
                      <option value={6}>6 mois</option>
                    </>
                  )}
                  {selectedProduct.category === 'pro' && (
                    <>
                      <option value={6}>6 mois</option>
                      <option value={12}>12 mois</option>
                      <option value={18}>18 mois</option>
                      <option value={24}>24 mois</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Motif de la demande * (minimum 20 caractères)
                </label>
                <textarea
                  value={requestForm.purpose}
                  onChange={(e) => setRequestForm({...requestForm, purpose: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Ex: Achat de stock de marchandises pour mon magasin, besoin de trésorerie pour expansion, etc."
                />
                <p className="text-gray-400 text-xs mt-1">
                  {requestForm.purpose.length}/20 caractères minimum
                </p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Revenus mensuels déclarés (CDF)
                </label>
                <input
                  type="number"
                  value={requestForm.monthlyIncome}
                  onChange={(e) => setRequestForm({...requestForm, monthlyIncome: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Ex: 200000"
                />
              </div>

              {selectedProduct.guarantees !== 'Aucune' && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={requestForm.hasGuarantee}
                      onChange={(e) => setRequestForm({...requestForm, hasGuarantee: e.target.checked})}
                      className="w-4 h-4 text-cyan-500 bg-white/5 border-white/20 rounded focus:ring-cyan-500"
                    />
                    <label className="ml-2 text-gray-300 text-sm">
                      Je dispose d'une garantie (obligatoire pour ce crédit)
                    </label>
                  </div>

                  {requestForm.hasGuarantee && (
                    <>
                      <div>
                        <label className="block text-gray-300 text-sm font-semibold mb-2">
                          Type de garantie
                        </label>
                        <select
                          value={requestForm.guaranteeType}
                          onChange={(e) => setRequestForm({...requestForm, guaranteeType: e.target.value})}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">Sélectionner</option>
                          <option value="coemprunteur">Co-emprunteur</option>
                          <option value="gage_moto">Gage moto/véhicule</option>
                          <option value="gage_equipement">Gage équipement</option>
                          <option value="nantissement">Nantissement stock</option>
                          <option value="hypotheque">Hypothèque/terrain</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-300 text-sm font-semibold mb-2">
                          Valeur estimée de la garantie (CDF)
                        </label>
                        <input
                          type="number"
                          value={requestForm.guaranteeValue}
                          onChange={(e) => setRequestForm({...requestForm, guaranteeValue: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                          placeholder="Ex: 1000000"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Aperçu calculs */}
              {requestForm.amount > 0 && requestForm.duration > 0 && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <h4 className="text-cyan-400 font-semibold mb-3">📊 Aperçu de votre crédit</h4>
                  {(() => {
                    const details = calculateLoanDetails(requestForm.amount, requestForm.duration, selectedProduct.interestRate);
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Mensualité :</span>
                          <span className="text-white font-semibold">{details.monthlyPayment.toLocaleString()} CDF</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Coût total :</span>
                          <span className="text-white font-semibold">{details.totalCost.toLocaleString()} CDF</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Taux d'effort :</span>
                          <span className={`font-semibold ${details.effortRate <= 30 ? 'text-green-400' : 'text-red-400'}`}>
                            {details.effortRate}% {details.effortRate <= 30 ? '✅' : '⚠️'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex space-x-4">
              <button
                onClick={() => setShowRequestForm(false)}
                className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={submitCreditRequest}
                disabled={
                  loading ||
                  requestForm.amount < selectedProduct.minAmount ||
                  requestForm.amount > selectedProduct.maxAmount ||
                  requestForm.purpose.length < 20 ||
                  (selectedProduct.guarantees !== 'Aucune' && !requestForm.hasGuarantee)
                }
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi...' : 'Soumettre la demande'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Button */}
      <button
        onClick={() => setShowAIChat(!showAIChat)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full shadow-lg shadow-purple-500/50 flex items-center justify-center text-white text-2xl hover:scale-110 transition-all z-40"
      >
        🤖
      </button>

      {/* AI Chat Popup */}
      {showAIChat && (
        <div className="fixed bottom-28 right-8 w-96 h-[500px] bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl z-40 flex flex-col">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-white font-semibold">🤖 Assistant Crédit IA</h3>
            <button
              onClick={() => setShowAIChat(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiMessages.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm">Posez-moi vos questions sur le crédit !</p>
                <p className="text-xs mt-2">Ex: "Suis-je éligible ?", "Améliorer mon score"</p>
              </div>
            ) : (
              aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 p-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10">
            <div className="flex space-x-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendAIMessage()}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={sendAIMessage}
                disabled={!aiInput.trim() || aiLoading}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default UserCredit;

// src/components/shared/LinkedAccounts.tsx
// Composant réutilisable pour tous les types d'utilisateurs
// Lier comptes Mobile Money, ZOLA, Bancaires

import { useState, useEffect, useCallback } from 'react';
import {
  Smartphone, Building2, Plus, Trash2, CheckCircle, AlertCircle,
  RefreshCw, Loader2, X, Shield, TrendingUp, Wallet, Eye, EyeOff,
  ChevronDown, ChevronUp, Star, Link as LinkIcon,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkedAccount {
  id: number;
  operator: string;
  operator_label: string;
  account_type: string;
  phone_number: string | null;
  account_number: string | null;
  account_name: string | null;
  bank_name: string | null;
  is_primary: boolean;
  is_verified: boolean;
  status: string;
  balance_xaf: number;
  transactions_imported: number;
  last_sync_at: string | null;
  consent_given: boolean;
  created_at: string;
}

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance_after: number | null;
  category: string;
  is_income: boolean;
}

// ─── Config opérateurs ────────────────────────────────────────────────────────

const OPERATORS = [
  {
    value: 'airtel_money',
    label: 'Airtel Money',
    icon: '📱',
    color: 'from-red-600 to-red-700',
    border: 'border-red-500/40',
    bg: 'bg-red-900/20',
    description: 'Congo · RDC · Ouganda',
    type: 'mobile_money',
  },
  {
    value: 'mtn_money',
    label: 'MTN Money',
    icon: '📱',
    color: 'from-yellow-500 to-yellow-600',
    border: 'border-yellow-500/40',
    bg: 'bg-yellow-900/20',
    description: 'Cameroun · Congo · RDC',
    type: 'mobile_money',
  },
  {
    value: 'zola',
    label: 'ZOLA',
    icon: '⚡',
    color: 'from-sky-500 to-blue-600',
    border: 'border-sky-500/40',
    bg: 'bg-sky-900/20',
    description: 'Portefeuille TERAS natif',
    type: 'wallet',
  },
  {
    value: 'orange_money',
    label: 'Orange Money',
    icon: '📱',
    color: 'from-orange-500 to-orange-600',
    border: 'border-orange-500/40',
    bg: 'bg-orange-900/20',
    description: 'Cameroun · Mali · Sénégal',
    type: 'mobile_money',
  },
  {
    value: 'bank_account',
    label: 'Compte Bancaire',
    icon: '🏦',
    color: 'from-emerald-600 to-teal-700',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-900/20',
    description: 'Afriland · BGFI · Ecobank · LCB',
    type: 'bank_account',
  },
];

const FCFA = (n: number) => {
  if (!n) return '0 FCFA';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M FCFA`;
  return `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
};

// ─── Modal : Ajouter un compte ────────────────────────────────────────────────

function AddAccountModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [operator, setOperator]   = useState('');
  const [phone, setPhone]         = useState('');
  const [accountNum, setAccountNum] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName]   = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [consent, setConsent]     = useState(false);
  const [otp, setOtp]             = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [devOtp, setDevOtp]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const selectedOp = OPERATORS.find(o => o.value === operator);
  const isBankAccount = operator === 'bank_account';

  const handleAdd = async () => {
    if (!operator) { setError('Sélectionnez un opérateur.'); return; }
    if (!isBankAccount && !phone) { setError('Numéro de téléphone requis.'); return; }
    if (isBankAccount && !accountNum) { setError('Numéro de compte requis.'); return; }
    if (!consent) { setError('Vous devez donner votre consentement.'); return; }

    setLoading(true); setError('');
    try {
      const res  = await authFetch('/api/scoring/user/linked-accounts/add/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator,
          phone_number:   phone || undefined,
          account_number: accountNum || undefined,
          account_name:   accountName || undefined,
          bank_name:      bankName || undefined,
          is_primary:     isPrimary,
          consent_given:  consent,
          account_type:   selectedOp?.type || 'mobile_money',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAccountId(data.account_id);
        setDevOtp(data.otp_code || '');   // Code de dev (à retirer en prod)
        setStep(2);
      } else {
        setError(data.error || 'Erreur lors de l\'ajout.');
      }
    } catch { setError('Erreur réseau.'); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 4) { setError('Code OTP à 4 chiffres requis.'); return; }
    if (!accountId) return;
    setLoading(true); setError('');
    try {
      const res  = await authFetch(`/api/scoring/user/linked-accounts/${accountId}/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp_code: otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`✅ ${selectedOp?.label} vérifié avec succès !`);
        setStep(3);
        setTimeout(() => { onSuccess(); onClose(); }, 2000);
      } else {
        setError(data.error || 'Code OTP incorrect.');
      }
    } catch { setError('Erreur réseau.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <LinkIcon className="w-4 h-4 text-sky-400"/>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Lier un compte</h3>
              <p className="text-slate-500 text-xs">Étape {step} / 3</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Barre de progression */}
        <div className="h-1 bg-slate-800">
          <div className="h-full bg-sky-500 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}/>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-900/20 border border-rose-700/40 rounded-xl text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0"/>{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-900/20 border border-emerald-700/40 rounded-xl text-emerald-300 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0"/>{success}
            </div>
          )}

          {/* ── Étape 1 : Choisir opérateur + saisir infos ── */}
          {step === 1 && (
            <>
              <div>
                <p className="text-slate-300 text-sm font-medium mb-3">Choisir l'opérateur</p>
                <div className="grid grid-cols-2 gap-2">
                  {OPERATORS.map(op => (
                    <button key={op.value} onClick={() => setOperator(op.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        operator === op.value
                          ? `${op.border} ${op.bg}`
                          : 'border-slate-800 hover:border-slate-700 bg-slate-800/30'
                      }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{op.icon}</span>
                        <span className="text-white text-sm font-medium">{op.label}</span>
                      </div>
                      <p className="text-slate-500 text-xs">{op.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {operator && (
                <>
                  {!isBankAccount ? (
                    <div>
                      <label className="text-slate-300 text-sm mb-1.5 block">
                        Numéro de téléphone {selectedOp?.label} *
                      </label>
                      <input value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="+242 06 XXX XXXX"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600"/>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-300 text-sm mb-1.5 block">Nom de la banque</label>
                          <input value={bankName} onChange={e => setBankName(e.target.value)}
                            placeholder="Ex: Afriland"
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600"/>
                        </div>
                        <div>
                          <label className="text-slate-300 text-sm mb-1.5 block">N° de compte *</label>
                          <input value={accountNum} onChange={e => setAccountNum(e.target.value)}
                            placeholder="IBAN ou N° compte"
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600"/>
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-300 text-sm mb-1.5 block">Nom du titulaire</label>
                        <input value={accountName} onChange={e => setAccountName(e.target.value)}
                          placeholder="Nom tel qu'il apparaît sur le compte"
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600"/>
                      </div>
                    </>
                  )}

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-sky-500"/>
                    <span className="text-slate-400 text-xs">Définir comme compte principal (prélèvement automatique)</span>
                  </label>

                  {/* Consentement RGPD */}
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-sky-500"/>
                      <span className="text-slate-300 text-xs leading-relaxed">
                        <strong className="text-white">Je consens</strong> à ce que TERAS accède à mes transactions
                        et solde {selectedOp?.label} pour calculer mon score de crédit.
                        Ces données sont protégées et ne seront pas partagées sans mon accord.
                      </span>
                    </label>
                  </div>
                </>
              )}

              <button onClick={handleAdd} disabled={loading || !operator || !consent}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Ajout en cours...</> : 'Continuer'}
              </button>
            </>
          )}

          {/* ── Étape 2 : Vérification OTP ── */}
          {step === 2 && (
            <>
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center mx-auto">
                  <Smartphone className="w-7 h-7 text-sky-400"/>
                </div>
                <p className="text-white font-semibold">Code de vérification</p>
                <p className="text-slate-400 text-sm">
                  Un SMS a été envoyé au <strong className="text-white">{phone || accountNum}</strong>
                </p>
                {devOtp && (
                  <div className="px-3 py-2 bg-amber-900/20 border border-amber-700/40 rounded-xl">
                    <p className="text-amber-300 text-xs">⚠️ Mode développement — Code OTP : <strong className="text-white text-base">{devOtp}</strong></p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block text-center">Code OTP à 4 chiffres</label>
                <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,4))}
                  placeholder="0000" maxLength={4}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-3 text-xl text-center font-bold tracking-[0.5em] focus:outline-none focus:border-sky-500"/>
              </div>

              <button onClick={handleVerify} disabled={loading || otp.length !== 4}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Vérification...</> : '✅ Valider le code'}
              </button>
              <button onClick={() => setStep(1)} className="w-full py-2 text-slate-400 hover:text-white text-sm transition">
                ← Retour
              </button>
            </>
          )}

          {/* ── Étape 3 : Succès ── */}
          {step === 3 && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto"/>
              <p className="text-white font-bold text-lg">{success}</p>
              <p className="text-slate-400 text-sm">Vous pouvez maintenant synchroniser vos transactions et enrichir votre score TERAS.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Carte compte lié ─────────────────────────────────────────────────────────

function AccountCard({
  account, onSync, onDelete, onSetPrimary, onViewTransactions, syncing
}: {
  account: LinkedAccount;
  onSync: (id: number) => void;
  onDelete: (id: number) => void;
  onSetPrimary: (id: number) => void;
  onViewTransactions: (id: number) => void;
  syncing: boolean;
}) {
  const op = OPERATORS.find(o => o.value === account.operator);

  return (
    <div className={`border rounded-2xl p-4 transition-all ${
      account.is_primary
        ? 'border-sky-500/40 bg-sky-900/10'
        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${op?.color || 'from-slate-600 to-slate-700'} flex items-center justify-center text-xl shrink-0`}>
            {op?.icon || '💳'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-semibold text-sm">{account.operator_label}</p>
              {account.is_primary && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-sky-900/40 border border-sky-700/40 text-sky-400 text-xs rounded-lg">
                  <Star className="w-2.5 h-2.5"/> Principal
                </span>
              )}
              {account.is_verified ? (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-900/40 text-emerald-400 text-xs rounded-lg">
                  <CheckCircle className="w-2.5 h-2.5"/> Vérifié
                </span>
              ) : (
                <span className="px-1.5 py-0.5 bg-amber-900/40 text-amber-400 text-xs rounded-lg">En attente</span>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              {account.phone_number || account.account_number || '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!account.is_primary && account.is_verified && (
            <button onClick={() => onSetPrimary(account.id)}
              title="Définir comme principal"
              className="p-1.5 text-slate-500 hover:text-sky-400 hover:bg-sky-900/30 rounded-lg transition">
              <Star className="w-4 h-4"/>
            </button>
          )}
          {account.is_verified && (
            <button onClick={() => onViewTransactions(account.id)}
              title="Voir les transactions"
              className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition">
              <Eye className="w-4 h-4"/>
            </button>
          )}
          <button onClick={() => onDelete(account.id)}
            className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition">
            <Trash2 className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Solde + stats */}
      {account.is_verified && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
            <p className="text-slate-500 text-xs mb-0.5">Solde</p>
            <p className="text-emerald-400 font-bold text-sm">{FCFA(account.balance_xaf)}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
            <p className="text-slate-500 text-xs mb-0.5">Transactions</p>
            <p className="text-white font-bold text-sm">{account.transactions_imported}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
            <p className="text-slate-500 text-xs mb-0.5">Dernière sync</p>
            <p className="text-slate-400 text-xs">
              {account.last_sync_at
                ? new Date(account.last_sync_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                : 'Jamais'}
            </p>
          </div>
        </div>
      )}

      {/* Bouton sync */}
      {account.is_verified && (
        <button onClick={() => onSync(account.id)} disabled={syncing}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-slate-800/60 hover:bg-slate-700/60 disabled:opacity-50 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition">
          {syncing ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Synchronisation...</>
            : <><RefreshCw className="w-3.5 h-3.5"/> Synchroniser les transactions</>}
        </button>
      )}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface LinkedAccountsProps {
  title?: string;
  subtitle?: string;
}

export default function LinkedAccounts({ title = "Comptes Liés", subtitle }: LinkedAccountsProps) {
  const [accounts, setAccounts]       = useState<LinkedAccount[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncingId, setSyncingId]     = useState<number | null>(null);
  const [error, setError]             = useState('');
  const [successMsg, setSuccessMsg]   = useState('');
  const [viewingTxId, setViewingTxId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx]     = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const res  = await authFetch('/api/scoring/user/linked-accounts/');
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch { setError('Erreur chargement comptes liés.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleSync = async (id: number) => {
    setSyncingId(id); setError(''); setSuccessMsg('');
    try {
      const res  = await authFetch(`/api/scoring/user/linked-accounts/${id}/sync/`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`✅ ${data.imported} nouvelles transactions importées.`);
        fetchAccounts();
      } else setError(data.error || 'Erreur sync.');
    } catch { setError('Erreur sync.'); }
    finally { setSyncingId(null); setTimeout(() => setSuccessMsg(''), 5000); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Délier ce compte ? Les transactions importées seront conservées.')) return;
    try {
      await authFetch(`/api/scoring/user/linked-accounts/${id}/delete/`, { method: 'DELETE' });
      fetchAccounts();
    } catch { setError('Erreur suppression.'); }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      await authFetch(`/api/scoring/user/linked-accounts/${id}/set-primary/`, { method: 'PATCH' });
      fetchAccounts();
    } catch { setError('Erreur.'); }
  };

  const handleViewTransactions = async (id: number) => {
    if (viewingTxId === id) { setViewingTxId(null); return; }
    setViewingTxId(id); setLoadingTx(true);
    try {
      const res  = await authFetch(`/api/scoring/user/linked-accounts/${id}/transactions/`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch { setError('Erreur transactions.'); }
    finally { setLoadingTx(false); }
  };

  return (
    <div className="space-y-6">
      {showAddModal && (
        <AddAccountModal onClose={() => setShowAddModal(false)} onSuccess={fetchAccounts}/>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-slate-400 text-sm mt-1">
            {subtitle || 'Liez vos comptes Mobile Money pour enrichir votre score TERAS automatiquement'}
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-semibold transition">
          <Plus className="w-4 h-4"/> Lier un compte
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-700/40 rounded-xl">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0"/>
          <p className="text-emerald-300 text-sm">{successMsg}</p>
          <button onClick={() => setSuccessMsg('')} className="ml-auto"><X className="w-4 h-4 text-emerald-500"/></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0"/>
          <p className="text-rose-300 text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4 text-rose-500"/></button>
        </div>
      )}

      {/* Explication */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Smartphone, label: 'Liaison sécurisée', desc: 'Vérification par OTP sur votre téléphone', color: 'sky' },
          { icon: TrendingUp, label: 'Score enrichi',     desc: 'Vos transactions améliorent votre score TERAS', color: 'emerald' },
          { icon: Shield,     label: 'Données protégées', desc: 'Consentement requis, données chiffrées', color: 'violet' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl bg-${item.color}-500/20 flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 text-${item.color}-400`}/>
              </div>
              <div>
                <p className="text-white text-xs font-medium">{item.label}</p>
                <p className="text-slate-500 text-xs">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Liste des comptes */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 text-sky-400 animate-spin mr-2"/>
          <span className="text-slate-400">Chargement...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Wallet className="w-12 h-12 text-slate-700 mx-auto mb-3"/>
          <p className="text-slate-500 font-medium">Aucun compte lié</p>
          <p className="text-slate-600 text-sm mt-1 mb-4">
            Liez votre Airtel Money, MTN Money ou compte bancaire pour enrichir votre score TERAS
          </p>
          <button onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-400 rounded-xl text-sm transition">
            + Lier mon premier compte
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id}>
              <AccountCard
                account={acc}
                onSync={handleSync}
                onDelete={handleDelete}
                onSetPrimary={handleSetPrimary}
                onViewTransactions={handleViewTransactions}
                syncing={syncingId === acc.id}
              />
              {/* Transactions */}
              {viewingTxId === acc.id && (
                <div className="mt-2 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                  {loadingTx ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-4 h-4 text-sky-400 animate-spin mr-2"/>
                      <span className="text-slate-400 text-sm">Chargement...</span>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                        <p className="text-white text-sm font-medium">{transactions.length} transactions</p>
                        <button onClick={() => setViewingTxId(null)} className="text-slate-500 hover:text-white">
                          <X className="w-4 h-4"/>
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {transactions.map((t, i) => (
                          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/60 ${i % 2 ? 'bg-slate-900/30' : ''}`}>
                            <span className={`text-sm ${t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.type === 'credit' ? '↑' : '↓'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs truncate">{t.description}</p>
                              <p className="text-slate-500 text-xs">{t.date}</p>
                            </div>
                            <p className={`text-sm font-medium shrink-0 ${t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.type === 'credit' ? '+' : '-'}{FCFA(t.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// AdminUserDetails.tsx - VERSION AMÉLIORÉE TERAS
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { User, Mail, Calendar, Activity, Ban, Edit, Shield, AlertCircle, ArrowLeft, CheckCircle, Clock, Award, BarChart2, FileText, RefreshCw, TrendingUp } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

const PILLAR_COLORS: Record<string, string> = { T: '#38bdf8', E: '#34d399', R: '#a78bfa', A: '#fb923c', S: '#f472b6' };
const PILLAR_LABELS: Record<string, string> = { T: 'Transactions', E: 'Épargne', R: 'Revenus', A: 'Actifs', S: 'Social' };
const TYPE_LABELS: Record<string, string> = { individual: 'Individu', enterprise: 'Entreprise', government: 'Gouvernement', bank: 'Banque', admin: 'Admin' };
type Notice = { type: 'success' | 'error'; text: string };

function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(score / 1000, 1);
  const r = 54; const circ = 2 * Math.PI * r;
  const color = score >= 750 ? '#34d399' : score >= 500 ? '#38bdf8' : '#f87171';
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-black" style={{ color }}>{score}</p>
        <p className="text-xs text-slate-500">/ 1000</p>
      </div>
    </div>
  );
}

export default function AdminUserDetails() {
  const { id: userId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'kyc'>('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => { if (userId) loadUser(); }, [userId]);

  const loadUser = async () => {
    if (!userId) return;
    try { setLoading(true); setError(null);
      const r = await adminApi.getUserDetail(parseInt(userId));
      if (r.data) setUser(r.data); else setError(r.error || 'Introuvable');
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleSuspend = async () => {
    if (!userId || !confirm('Suspendre cet utilisateur ?')) return;
    try {
      setActionLoading(true);
      const r = await adminApi.suspendUser(parseInt(userId));
      if (r.data) {
        setNotice({ type: 'success', text: 'Utilisateur suspendu.' });
        loadUser();
      } else {
        setNotice({ type: 'error', text: r.error || 'Suspension impossible.' });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Suspension impossible.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!userId || !confirm('Réactiver cet utilisateur ?')) return;
    try {
      setActionLoading(true);
      const r = await adminApi.restoreUser(parseInt(userId));
      if (r.data) {
        setNotice({ type: 'success', text: 'Utilisateur réactivé.' });
        loadUser();
      } else {
        setNotice({ type: 'error', text: r.error || 'Réactivation impossible.' });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Réactivation impossible.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Chargement...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-slate-300 font-medium mb-1">Erreur</p>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <button onClick={() => navigate('/admin/users')} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm">← Retour</button>
      </div>
    </div>
  );

  if (!user) return null;

  const score = user.last_score?.score || 0;
  const breakdown = user.last_score?.breakdown || {};
  const scoreHistory = (user.score_history || []).map((h: any) => ({
    date: new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    score: h.score,
  })).reverse();
  const pillarsData = Object.entries(PILLAR_LABELS).map(([key, name]) => ({
    name, score: Math.round((breakdown[key] || 0) * 100), key
  }));

  const riskColor = score < 450 ? '#f87171' : score < 650 ? '#fb923c' : '#34d399';
  const riskLabel = score < 450 ? 'Élevé' : score < 650 ? 'Moyen' : 'Faible';
  const stats = user.statistics || {};

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="min-h-screen p-6" style={{ background: '#0b1220' }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <button onClick={() => navigate('/admin/users')} className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Utilisateurs
        </button>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300">{user.email}</span>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-6 ${
            notice.type === 'success'
              ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
              : 'border-red-400/25 bg-red-400/10 text-red-300'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{notice.text}</p>
        </div>
      )}

      {/* Hero Card */}
      <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Avatar + info */}
          <div className="flex items-start gap-5 flex-1">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' }}>
                {(user.first_name || user.username || user.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username || user.email}
              </h1>
              <p className="text-slate-400 text-sm mb-3">{user.email}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${user.is_active ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {user.is_active ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                  {user.is_active ? 'Actif' : 'Suspendu'}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium text-sky-400 bg-sky-400/10">
                  {TYPE_LABELS[user.user_type] || user.user_type}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${user.kyc_status === 'approved' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                  <Shield className="w-3 h-3" /> KYC {user.kyc_status || 'N/A'}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ color: riskColor, background: `${riskColor}18` }}>
                  Risque {riskLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { icon: Mail, label: 'Email', value: user.email },
                  { icon: Calendar, label: 'Depuis', value: new Date(user.date_joined).toLocaleDateString('fr-FR') },
                  { icon: Clock, label: 'Dernière co.', value: user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'Jamais' },
                  { icon: Activity, label: 'Région', value: user.region || 'N/A' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3 h-3 text-sky-400" />
                      <span className="text-xs text-slate-500">{label}</span>
                    </div>
                    <p className="text-sm text-slate-200 font-medium truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Score + Actions */}
          <div className="flex flex-col items-center lg:items-end gap-4">
            {score > 0 && <ScoreRing score={score} />}
            <div className="flex gap-2">
              <button onClick={loadUser} className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => navigate(`/admin/users/${userId}/edit`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
                <Edit className="w-4 h-4" /> Modifier
              </button>
              {user.is_active ? (
                <button onClick={handleSuspend} disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 text-sm font-medium border border-red-400/25 hover:bg-red-400/10 transition-all">
                  <Ban className="w-4 h-4" /> Suspendre
                </button>
              ) : (
                <button onClick={handleRestore} disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-emerald-400 text-sm font-medium border border-emerald-400/25 hover:bg-emerald-400/10 transition-all">
                  <CheckCircle className="w-4 h-4" /> Réactiver
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {[
          { id: 'overview', label: 'Statistiques', icon: BarChart2 },
          { id: 'scores', label: 'Scores TERAS', icon: TrendingUp },
          { id: 'kyc', label: 'KYC & Docs', icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id as any)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={activeTab === id ? { background: 'rgba(14,165,233,0.15)', color: '#38bdf8' } : { color: '#64748b' }}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Calculs Totaux', value: stats.total_calculations ?? 0, icon: BarChart2, color: '#38bdf8' },
            { label: 'Score Moyen', value: typeof stats.average_score === 'number' ? stats.average_score.toFixed(0) : 0, icon: TrendingUp, color: '#a78bfa' },
            { label: 'Score Min', value: stats.min_score ?? 0, icon: Activity, color: '#fb923c' },
            { label: 'Score Max', value: stats.max_score ?? 0, icon: Award, color: '#34d399' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              <p className="text-3xl font-black" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Scores */}
      {activeTab === 'scores' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h3 className="text-white font-semibold mb-4">Évolution du score</h3>
            {scoreHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#475569" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#475569" style={{ fontSize: '11px' }} domain={[0, 1000]} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                  <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2} dot={{ fill: '#38bdf8', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Aucun historique</div>
            )}
          </div>

          <div className="rounded-2xl p-5" style={cardStyle}>
            <h3 className="text-white font-semibold mb-4">Détail T.E.R.A.S</h3>
            {pillarsData.some(p => p.score > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pillarsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" domain={[0, 100]} stroke="#475569" style={{ fontSize: '11px' }} />
                  <YAxis dataKey="name" type="category" stroke="#475569" style={{ fontSize: '11px' }} width={90} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {pillarsData.map((entry) => (
                      <Cell key={entry.key} fill={PILLAR_COLORS[entry.key]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Aucun score calculé</div>
            )}
          </div>
        </div>
      )}

      {/* KYC */}
      {activeTab === 'kyc' && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h3 className="text-white font-semibold mb-4">Demandes KYC</h3>
          {!(user.kyc_requests?.length) ? (
            <div className="text-center py-12 text-slate-500 text-sm">Aucune demande KYC</div>
          ) : (
            <div className="space-y-3">
              {user.kyc_requests.map((k: any) => (
                <div key={k.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <div>
                      <p className="text-sm text-white font-medium capitalize">{k.document_type?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-500">{new Date(k.submitted_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${k.status === 'approved' ? 'text-emerald-400 bg-emerald-400/10' : k.status === 'pending' ? 'text-amber-400 bg-amber-400/10' : 'text-red-400 bg-red-400/10'}`}>
                    {k.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

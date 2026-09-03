// teras-frontend/src/pages/Dashboard.tsx

import {
  ArrowUp,
  Bell,
  FileText,
  TrendingUp,
  CreditCard,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3,
  Brain
} from 'lucide-react'
import { Button } from '../components/Button'
import {
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface DashboardPageProps {
  onNavigate?: (page: string) => void
}

const scoreEvolutionData = [
  { month: 'Jan', score: 680, target: 700 },
  { month: 'Fév', score: 695, target: 710 },
  { month: 'Mar', score: 710, target: 720 },
  { month: 'Avr', score: 728, target: 730 },
  { month: 'Mai', score: 745, target: 740 },
  { month: 'Juin', score: 765, target: 750 }
]

const creditUsageData = [
  { name: 'Cartes', value: 35, color: '#9BD2FF' },
  { name: 'Prêts', value: 25, color: '#4ADE80' },
  { name: 'Disponible', value: 40, color: '#223556' }
]

const paymentHistoryData = [
  { month: 'Jan', onTime: 100, late: 0 },
  { month: 'Fév', onTime: 100, late: 0 },
  { month: 'Mar', onTime: 95, late: 5 },
  { month: 'Avr', onTime: 100, late: 0 },
  { month: 'Mai', onTime: 100, late: 0 },
  { month: 'Juin', onTime: 100, late: 0 }
]

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="w-full px-12 py-8" style={{ backgroundColor: '#0B1220', minHeight: '100vh' }}>
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ color: '#EAF2FF', marginBottom: '8px' }}>Tableau de bord</h1>
            <p style={{ color: '#9CB5DD' }}>Bienvenue sur votre espace personnel TERAS</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary">
              <Bell className="w-4 h-4 mr-2 inline" />
              Alertes (3)
            </Button>
            <Button variant="primary" onClick={() => onNavigate?.('improve')}>
              <TrendingUp className="w-4 h-4 mr-2 inline" />
              Améliorer mon score
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-6">
          {[
            {
              label: 'Score TERAS',
              value: '765',
              change: '+23 ce mois',
              trend: 'up',
              icon: TrendingUp,
              color: '#9BD2FF',
              bgColor: '#0F172A'
            },
            {
              label: 'Utilisation crédit',
              value: '28%',
              change: 'Excellent',
              trend: 'up',
              icon: CreditCard,
              color: '#4ADE80',
              bgColor: '#0F172A'
            },
            {
              label: 'Paiements à temps',
              value: '100%',
              change: '6 mois consécutifs',
              trend: 'up',
              icon: CheckCircle2,
              color: '#4ADE80',
              bgColor: '#0F172A'
            },
            {
              label: 'Âge du crédit',
              value: '8.5 ans',
              change: 'Très bon',
              trend: 'neutral',
              icon: Clock,
              color: '#9BD2FF',
              bgColor: '#0F172A'
            }
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-xl border" style={{ backgroundColor: stat.bgColor, borderColor: '#223556' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#121A2C' }}>
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                {stat.trend === 'up' && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#10B98114', color: '#4ADE80' }}>
                    <ArrowUp className="w-3 h-3" />
                    <span className="text-[12px]">+5%</span>
                  </div>
                )}
              </div>
              <p className="text-[14px] mb-1" style={{ color: '#9CB5DD' }}>{stat.label}</p>
              <p className="text-[28px] mb-1" style={{ color: '#EAF2FF', fontWeight: 700 }}>{stat.value}</p>
              <p className="text-[12px]" style={{ color: '#7B92B8' }}>{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Évolution du score */}
          <div className="col-span-2 p-6 rounded-xl border" style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 style={{ color: '#EAF2FF', marginBottom: '4px' }}>Évolution du score</h3>
                <p className="text-[14px]" style={{ color: '#9CB5DD' }}>Historique sur 6 mois</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9BD2FF' }} />
                  <span className="text-[12px]" style={{ color: '#9CB5DD' }}>Score actuel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
                  <span className="text-[12px]" style={{ color: '#9CB5DD' }}>Objectif</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={scoreEvolutionData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9BD2FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9BD2FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#223556" />
                <XAxis dataKey="month" stroke="#9CB5DD" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9CB5DD" style={{ fontSize: '12px' }} domain={[650, 800]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #223556',
                    borderRadius: '8px',
                    color: '#EAF2FF'
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#9BD2FF" strokeWidth={3} fill="url(#colorScore)" />
                <Line type="monotone" dataKey="target" stroke="#4ADE80" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats droites */}
          <div className="space-y-6">
            {/* Paiements */}
            <div className="p-6 rounded-xl border" style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}>
              <h3 className="mb-4" style={{ color: '#EAF2FF' }}>Historique de paiement</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={paymentHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#223556" />
                  <XAxis dataKey="month" stroke="#9CB5DD" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#9CB5DD" style={{ fontSize: '10px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #223556',
                      borderRadius: '8px',
                      color: '#EAF2FF'
                    }}
                  />
                  <Bar dataKey="onTime" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Utilisation crédit */}
            <div className="p-6 rounded-xl border" style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}>
              <h3 className="mb-4" style={{ color: '#EAF2FF' }}>Utilisation du crédit</h3>
              <div className="space-y-3">
                {creditUsageData.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px]" style={{ color: '#9CB5DD' }}>{item.name}</span>
                      <span className="text-[14px]" style={{ color: '#EAF2FF', fontWeight: 600 }}>
                        {item.value}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#121A2C' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recos IA */}
        <div
          className="p-8 rounded-xl border relative overflow-hidden"
          style={{ backgroundColor: '#0F172A', borderColor: '#9BD2FF50', boxShadow: '0 0 40px rgba(155, 210, 255, 0.1)' }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: '#9BD2FF' }} />
          <div className="relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#9BD2FF15', border: '1px solid #9BD2FF30' }}>
                <Brain className="w-8 h-8" style={{ color: '#9BD2FF' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 style={{ color: '#EAF2FF' }}>TERAS IA</h2>
                  <span className="px-3 py-1 rounded-full text-[12px]" style={{ backgroundColor: '#9BD2FF20', color: '#9BD2FF', border: '1px solid #9BD2FF30' }}>
                    Intelligence Artificielle
                  </span>
                </div>
                <p style={{ color: '#9CB5DD' }}>Recommandations personnalisées basées sur votre profil</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* 1 */}
              <div className="p-6 rounded-xl border" style={{ backgroundColor: '#121A2C', borderColor: '#223556' }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#4ADE8020', border: '1px solid #4ADE8030' }}>
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#4ADE80' }} />
                  </div>
                  <div>
                    <h4 className="mb-2" style={{ color: '#EAF2FF' }}>Excellent historique de paiement</h4>
                    <p className="text-[14px] mb-3" style={{ color: '#9CB5DD' }}>
                      Vous avez maintenu 100% de paiements à temps pendant 6 mois. Continuez ainsi pour augmenter votre score de 15 points supplémentaires d'ici 3 mois.
                    </p>
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: '#4ADE80' }}>
                      <span>Impact: +15 points potentiels</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2 */}
              <div className="p-6 rounded-xl border" style={{ backgroundColor: '#121A2C', borderColor: '#223556' }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#9BD2FF20', border: '1px solid #9BD2FF30' }}>
                    <TrendingUp className="w-5 h-5" style={{ color: '#9BD2FF' }} />
                  </div>
                  <div>
                    <h4 className="mb-2" style={{ color: '#EAF2FF' }}>Réduire l'utilisation du crédit</h4>
                    <p className="text-[14px] mb-3" style={{ color: '#9CB5DD' }}>
                      Votre taux d'utilisation est à 28%. En le réduisant à moins de 20%, vous pourriez gagner jusqu'à 25 points sur votre score.
                    </p>
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: '#9BD2FF' }}>
                      <span>Impact: +25 points potentiels</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 */}
              <div className="p-6 rounded-xl border" style={{ backgroundColor: '#121A2C', borderColor: '#223556' }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F59E0B20', border: '1px solid #F59E0B30' }}>
                    <AlertCircle className="w-5 h-5" style={{ color: '#F59E0B' }} />
                  </div>
                  <div>
                    <h4 className="mb-2" style={{ color: '#EAF2FF' }}>Diversifier votre mix de crédit</h4>
                    <p className="text-[14px] mb-3" style={{ color: '#9CB5DD' }}>
                      Vous avez principalement des cartes de crédit. Ajouter un prêt personnel ou automobile pourrait améliorer votre score de 10 points.
                    </p>
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: '#F59E0B' }}>
                      <span>Impact: +10 points potentiels</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 (✅ guillemets corrigés ici) */}
              <div className="p-6 rounded-xl border" style={{ backgroundColor: '#121A2C', borderColor: '#223556' }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                       style={{ backgroundColor: '#9BD2FF20', border: '1px solid #9BD2FF30' }}>
                    <FileText className="w-5 h-5" style={{ color: '#9BD2FF' }} />
                  </div>
                  <div>
                    <h4 className="mb-2" style={{ color: '#EAF2FF' }}>Vérifier votre rapport de crédit</h4>
                    <p className="text-[14px] mb-3" style={{ color: '#9CB5DD' }}>
                      Dernière vérification il y a 2 mois. Une vérification mensuelle vous permet de détecter rapidement toute erreur ou fraude potentielle.
                    </p>
                    <Button variant="primary" onClick={() => onNavigate?.('history')} className="mt-2">
                      Voir le rapport complet
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: '#9BD2FF10', border: '1px solid #9BD2FF20' }}>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5" style={{ color: '#9BD2FF' }} />
                <div>
                  <p style={{ color: '#EAF2FF', fontWeight: 600 }}>Score potentiel avec ces actions: 815 points</p>
                  <p className="text-[14px]" style={{ color: '#9CB5DD' }}>+50 points en suivant toutes les recommandations</p>
                </div>
              </div>
              <Button variant="primary" onClick={() => onNavigate?.('improve')}>Plan d'action détaillé</Button>
            </div>
          </div>
        </div>

        {/* Activité & actions */}
        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border" style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ color: '#EAF2FF' }}>Activité récente</h3>
              <button onClick={() => onNavigate?.('history')} className="text-[14px]" style={{ color: '#9BD2FF' }}>
                Voir tout →
              </button>
            </div>
            <div className="space-y-4">
              {[
                { icon: TrendingUp, title: 'Score mis à jour', description: 'Votre score est passé à 765 (+23)', time: 'Il y a 2 heures', color: '#4ADE80' },
                { icon: CreditCard, title: 'Paiement enregistré', description: 'Carte Visa ****1234 - 450€', time: 'Il y a 1 jour', color: '#9BD2FF' },
                { icon: FileText, title: 'Document ajouté', description: 'Relevé bancaire de mai 2025', time: 'Il y a 3 jours', color: '#9BD2FF' },
                { icon: Activity, title: 'Analyse complétée', description: 'Rapport mensuel disponible', time: 'Il y a 5 jours', color: '#9BD2FF' }
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-lg hover:bg-opacity-50 transition-all cursor-pointer" style={{ backgroundColor: '#121A2C' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0F172A' }}>
                    <activity.icon className="w-5 h-5" style={{ color: activity.color }} />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: '#EAF2FF', fontWeight: 500, marginBottom: '4px' }}>{activity.title}</p>
                    <p className="text-[14px]" style={{ color: '#9CB5DD' }}>{activity.description}</p>
                    <p className="text-[12px] mt-1" style={{ color: '#7B92B8' }}>{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl border" style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}>
              <h3 className="mb-4" style={{ color: '#EAF2FF' }}>Alertes importantes</h3>
              <div className="space-y-3">
                {[
                  { icon: AlertCircle, text: 'Paiement de carte de crédit dû dans 5 jours', color: '#F59E0B', urgent: true },
                  { icon: CheckCircle2, text: '2 recommandations IA disponibles', color: '#4ADE80', urgent: false },
                  { icon: Bell, text: 'Nouveau rapport mensuel disponible', color: '#9BD2FF', urgent: false }
                ].map((alert, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      backgroundColor: alert.urgent ? '#F59E0B10' : '#121A2C',
                      border: alert.urgent ? '1px solid #F59E0B30' : 'none'
                    }}
                  >
                    <alert.icon className="w-5 h-5 flex-shrink-0" style={{ color: alert.color }} />
                    <p className="text-[14px]" style={{ color: '#EAF2FF' }}>{alert.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl border" style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}>
              <h3 className="mb-4" style={{ color: '#EAF2FF' }}>Actions rapides</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Améliorer score', icon: TrendingUp, page: 'improve' },
                  { label: 'Historique', icon: Activity, page: 'history' },
                  { label: 'Ajouter document', icon: FileText, page: 'dashboard' },
                  { label: 'Support', icon: Bell, page: 'support' }
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigate?.(action.page)}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-opacity-50 transition-all"
                    style={{ backgroundColor: '#121A2C' }}
                  >
                    <action.icon className="w-6 h-6" style={{ color: '#9BD2FF' }} />
                    <span className="text-[14px]" style={{ color: '#C8D5EE' }}>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

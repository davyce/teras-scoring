// src/pages/user/ImprovePage.tsx
import { CheckSquare, TrendingUp, DollarSign, FileText, Users } from 'lucide-react';

interface ImprovePageProps {
  onNavigate?: (page: string) => void;
}

export default function ImprovePage({ onNavigate }: ImprovePageProps) {
  const actions = [
    { icon: CheckSquare, title: 'Compléter votre profil', points: '+15 pts', priority: 'high' },
    { icon: DollarSign, title: 'Ajouter vos relevés bancaires', points: '+25 pts', priority: 'high' },
    { icon: FileText, title: 'Uploader vos justificatifs de revenus', points: '+20 pts', priority: 'medium' },
    { icon: Users, title: 'Connecter votre réseau professionnel', points: '+10 pts', priority: 'low' },
    { icon: TrendingUp, title: 'Maintenir une épargne régulière', points: '+30 pts', priority: 'medium' }
  ];

  const priorityColors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#9CB5DD'
  };

  const priorityLabels = {
    high: 'Priorité haute',
    medium: 'Priorité moyenne',
    low: 'Priorité basse'
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Actions recommandées</h1>
          <p className="text-slate-400">
            Conseils personnalisés pour gagner des points rapidement et améliorer votre score TERAS.
          </p>
        </div>

        {/* Liste des actions */}
        <div className="space-y-4">
          {actions.map((action, i) => {
            const Icon = action.icon;
            
            return (
              <div 
                key={i}
                className="p-6 rounded-xl border border-[#223556] bg-[#0F172A] flex items-center justify-between hover:border-[#9BD2FF] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Icône */}
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#121A2C]"
                  >
                    <Icon className="w-6 h-6 text-[#9BD2FF]" />
                  </div>
                  
                  {/* Contenu */}
                  <div>
                    <h3 className="mb-1 text-[#EAF2FF] font-medium">{action.title}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[#4ADE80] font-semibold">
                        {action.points}
                      </span>
                      <span 
                        className="text-xs px-2 py-0.5 rounded bg-white/5"
                        style={{ 
                          color: priorityColors[action.priority as keyof typeof priorityColors]
                        }}
                      >
                        {priorityLabels[action.priority as keyof typeof priorityLabels]}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Bouton */}
                <button 
                  className="px-4 py-2 rounded-lg bg-[#9BD2FF] text-[#0B1220] font-medium hover:bg-[#7ec5f5] transition-colors"
                  onClick={() => onNavigate?.(action.title)}
                >
                  Commencer
                </button>
              </div>
            );
          })}
        </div>

        {/* Section d'aide */}
        <div className="mt-8 p-6 rounded-xl border border-sky-500/30 bg-sky-500/10">
          <h3 className="text-lg font-semibold text-sky-300 mb-2">💡 Astuce</h3>
          <p className="text-sm text-slate-300">
            Concentrez-vous d'abord sur les actions à haute priorité pour maximiser l'impact sur votre score TERAS.
            Chaque action complétée améliore votre profil et augmente vos chances d'obtenir de meilleures conditions de crédit.
          </p>
        </div>
      </div>
    </div>
  );
}

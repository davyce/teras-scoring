// @ts-nocheck
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';
import { Check } from 'lucide-react';

interface PricingPageProps {
  onNavigate?: (page: string) => void;
}

export function PricingPage({ onNavigate }: PricingPageProps) {
  const plans = [
    {
      name: 'Basic',
      price: 'Gratuit',
      features: [
        'Score TERAS personnel',
        'Mise à jour mensuelle',
        'Historique 6 mois',
        'Support email',
        'Conseils de base'
      ]
    },
    {
      name: 'Entreprise',
      price: 'Sur devis',
      features: [
        'Score TERAS Entreprise',
        'Mise à jour en temps réel',
        'Historique illimité',
        'Support prioritaire 24/7',
        'API & Intégrations',
        'Tableau de bord avancé',
        'Analyse prédictive',
        'Accompagnement dédié'
      ],
      highlighted: true
    }
  ];

  return (
    <Hero
      title="Tarifs simples et transparents"
      subtitle="Commencez gratuitement avec TERAS Basic. Passez à Entreprise pour des fonctionnalités avancées."
      showScoreCard={false}
    >
      <div className="mt-8 grid grid-cols-2 gap-6 max-w-[900px]">
        {plans.map((plan, i) => (
          <div 
            key={i}
            className="p-8 rounded-2xl border"
            style={{ 
              backgroundColor: plan.highlighted ? '#0F172A' : '#0B1220',
              borderColor: plan.highlighted ? '#9BD2FF' : '#223556',
              borderWidth: plan.highlighted ? '2px' : '1px'
            }}
          >
            <h3 className="mb-2" style={{ color: '#EAF2FF' }}>{plan.name}</h3>
            <div className="mb-6">
              <span className="text-[40px]" style={{ color: '#9BD2FF', fontWeight: '700' }}>
                {plan.price}
              </span>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-start gap-2">
                  <Check className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#4ADE80' }} />
                  <span className="text-[14px]" style={{ color: '#C8D5EE' }}>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              variant={plan.highlighted ? 'primary' : 'secondary'}
              className="w-full"
              onClick={() => onNavigate?.(plan.highlighted ? 'contact' : 'register')}
            >
              {plan.highlighted ? 'Contacter les ventes' : 'Commencer gratuitement'}
            </Button>
          </div>
        ))}
      </div>
    </Hero>
  );
}

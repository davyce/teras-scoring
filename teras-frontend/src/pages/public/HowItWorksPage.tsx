// @ts-nocheck
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';

interface HowItWorksPageProps {
  onNavigate?: (page: string) => void;
}

export function HowItWorksPage({ onNavigate }: HowItWorksPageProps) {
  return (
    <Hero
      title="Comment fonctionne le score TERAS"
      subtitle="Transferts, Épargne, Revenus, Actifs & Social — tout est pondéré pour vous offrir un score précis et équitable."
      buttons={
        <Button variant="primary" onClick={() => onNavigate?.('register')}>
          Commencer
        </Button>
      }
      showScoreCard={false}
    >
      <div className="grid grid-cols-2 gap-6 mt-8 max-w-[700px]">
        {[
          { letter: 'T', title: 'Transferts', desc: 'Analyse de vos transactions régulières' },
          { letter: 'E', title: 'Épargne', desc: 'Capacité d\'épargne et stabilité' },
          { letter: 'R', title: 'Revenus', desc: 'Sources et régularité des revenus' },
          { letter: 'A', title: 'Actifs', desc: 'Patrimoine et actifs financiers' },
          { letter: 'S', title: 'Social', desc: 'Réputation et réseau professionnel' }
        ].map((item, i) => (
          <div 
            key={i}
            className="p-6 rounded-xl border"
            style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[20px]"
                style={{ backgroundColor: '#9BD2FF', color: '#0B1220', fontWeight: '700' }}
              >
                {item.letter}
              </div>
              <h3 style={{ color: '#EAF2FF' }}>{item.title}</h3>
            </div>
            <p className="text-[14px]" style={{ color: '#9CB5DD' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </Hero>
  );
}

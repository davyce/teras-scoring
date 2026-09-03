// @ts-nocheck
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';
import { BookOpen, Code, Zap, Shield } from 'lucide-react';

interface DocsPageProps {
  onNavigate?: (page: string) => void;
}

export function DocsPage({ onNavigate }: DocsPageProps) {
  const sections = [
    { icon: BookOpen, title: 'Guide de démarrage', desc: 'Premiers pas avec l\'API TERAS' },
    { icon: Code, title: 'Référence API', desc: 'Tous les endpoints et paramètres' },
    { icon: Zap, title: 'SDK & Librairies', desc: 'JavaScript, Python, PHP, Ruby' },
    { icon: Shield, title: 'Sécurité', desc: 'Bonnes pratiques et authentification' }
  ];

  return (
    <Hero
      title="Documentation technique"
      subtitle="Guides, schémas, webhooks et exemples pour intégrer TERAS rapidement et en toute sécurité."
      buttons={
        <Button variant="primary" onClick={() => onNavigate?.('api')}>
          Voir l'API
        </Button>
      }
      showScoreCard={false}
    >
      <div className="mt-8 grid grid-cols-2 gap-4 max-w-[800px]">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <div 
              key={i}
              className="p-6 rounded-xl border hover:border-[#9BD2FF] transition-all cursor-pointer"
              style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
            >
              <Icon className="w-8 h-8 mb-3" style={{ color: '#9BD2FF' }} />
              <h3 className="mb-2" style={{ color: '#EAF2FF' }}>{section.title}</h3>
              <p className="text-[14px]" style={{ color: '#9CB5DD' }}>{section.desc}</p>
            </div>
          );
        })}
      </div>
    </Hero>
  );
}

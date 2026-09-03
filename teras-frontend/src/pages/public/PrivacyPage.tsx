// @ts-nocheck
import { Hero } from '../components/Hero';
import { Shield, Eye, Lock, Database } from 'lucide-react';

interface PrivacyPageProps {
  onNavigate?: (page: string) => void;
}

export function PrivacyPage({ onNavigate }: PrivacyPageProps) {
  return (
    <Hero
      title="Politique de confidentialité"
      subtitle="Vos données, vos règles. Transparence totale sur la collecte, l'utilisation et la protection de vos informations."
      showScoreCard={false}
    >
      <div className="mt-8 max-w-[900px] space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Database, title: 'Données collectées', desc: 'Informations financières nécessaires au calcul du score' },
            { icon: Shield, title: 'Protection', desc: 'Chiffrement et sécurité de niveau bancaire' },
            { icon: Eye, title: 'Transparence', desc: 'Accès complet à toutes vos données' },
            { icon: Lock, title: 'Vos droits', desc: 'Accès, rectification, suppression à tout moment' }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div 
                key={i}
                className="p-6 rounded-xl border"
                style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
              >
                <Icon className="w-6 h-6 mb-3" style={{ color: '#9BD2FF' }} />
                <h3 className="mb-2" style={{ color: '#EAF2FF' }}>{item.title}</h3>
                <p className="text-[14px]" style={{ color: '#9CB5DD' }}>{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div 
          className="p-8 rounded-xl border"
          style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
        >
          <h2 className="mb-4" style={{ color: '#EAF2FF' }}>Finalités du traitement</h2>
          <ul className="space-y-2">
            {[
              'Calcul et mise à jour de votre score TERAS',
              'Amélioration de nos services',
              'Communication et support client',
              'Conformité réglementaire'
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px]" style={{ color: '#C8D5EE' }}>
                <span style={{ color: '#9BD2FF' }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div 
          className="p-8 rounded-xl border"
          style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
        >
          <h2 className="mb-4" style={{ color: '#EAF2FF' }}>Durée de conservation</h2>
          <p className="text-[15px] leading-relaxed" style={{ color: '#C8D5EE' }}>
            Vos données sont conservées pendant toute la durée de votre utilisation du service, plus 5 ans pour des raisons légales. Vous pouvez demander la suppression de vos données à tout moment.
          </p>
        </div>

        <div 
          className="p-8 rounded-xl border"
          style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
        >
          <h2 className="mb-4" style={{ color: '#EAF2FF' }}>Contact DPO</h2>
          <p className="text-[15px]" style={{ color: '#C8D5EE' }}>
            Pour toute question sur vos données : <a href="mailto:dpo@teras.io" className="underline hover:no-underline" style={{ color: '#9BD2FF' }}>dpo@teras.io</a>
          </p>
        </div>
      </div>
    </Hero>
  );
}

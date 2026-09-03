// @ts-nocheck
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';
import { Building2, Link as LinkIcon, Globe } from 'lucide-react';

interface PartnersPageProps {
  onNavigate?: (page: string) => void;
}

export function PartnersPage({ onNavigate }: PartnersPageProps) {
  const partners = [
    { name: 'ZOLA', type: 'Plateforme financière', status: 'Intégré' },
    { name: 'SFEC', type: 'Institution de crédit', status: 'Intégré' },
    { name: 'Banques locales', type: 'Réseau bancaire', status: 'Disponible' },
    { name: 'Agrégateurs', type: 'Services de données', status: 'En cours' }
  ];

  return (
    <Hero
      title="Partenaires & banques"
      subtitle="Connectez vos comptes et établissements en un clic. Réseau étendu de partenaires financiers."
      buttons={
        <Button variant="primary">
          Devenir partenaire
        </Button>
      }
      showScoreCard={false}
    >
      <div className="mt-8 grid grid-cols-2 gap-4 max-w-[800px]">
        {partners.map((partner, i) => (
          <div 
            key={i}
            className="p-6 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#121A2C' }}
              >
                <Building2 className="w-6 h-6" style={{ color: '#9BD2FF' }} />
              </div>
              <div>
                <h3 className="mb-0.5" style={{ color: '#EAF2FF' }}>{partner.name}</h3>
                <p className="text-[13px]" style={{ color: '#9CB5DD' }}>{partner.type}</p>
              </div>
            </div>
            <span 
              className="text-[12px] px-3 py-1 rounded-full"
              style={{ 
                backgroundColor: partner.status === 'Intégré' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(155, 210, 255, 0.1)',
                color: partner.status === 'Intégré' ? '#4ADE80' : '#9BD2FF'
              }}
            >
              {partner.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-8 max-w-[800px]">
        {[
          { icon: LinkIcon, value: '50+', label: 'Partenaires actifs' },
          { icon: Globe, value: '15', label: 'Pays couverts' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="flex items-center gap-3">
              <Icon className="w-6 h-6" style={{ color: '#9BD2FF' }} />
              <div>
                <div className="text-[32px]" style={{ color: '#EAF2FF', fontWeight: '700' }}>
                  {stat.value}
                </div>
                <p className="text-[13px]" style={{ color: '#9CB5DD' }}>{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Hero>
  );
}

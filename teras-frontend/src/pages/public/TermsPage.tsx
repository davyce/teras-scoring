// @ts-nocheck
import { Hero } from '../components/Hero';
import { FileText, Scale, AlertCircle } from 'lucide-react';

interface TermsPageProps {
  onNavigate?: (page: string) => void;
}

export function TermsPage({ onNavigate }: TermsPageProps) {
  return (
    <Hero
      title="Conditions générales d'utilisation"
      subtitle="Cadre d'utilisation du service TERAS. Droits, obligations et responsabilités."
      showScoreCard={false}
    >
      <div className="mt-8 max-w-[900px] space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: FileText, title: 'Licence', desc: 'Droit d\'utilisation non exclusif' },
            { icon: Scale, title: 'Juridiction', desc: 'Tribunaux compétents' },
            { icon: AlertCircle, title: 'Responsabilité', desc: 'Limites et exclusions' }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div 
                key={i}
                className="p-6 rounded-xl border text-center"
                style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
              >
                <Icon className="w-8 h-8 mx-auto mb-3" style={{ color: '#9BD2FF' }} />
                <h3 className="mb-2" style={{ color: '#EAF2FF' }}>{item.title}</h3>
                <p className="text-[14px]" style={{ color: '#9CB5DD' }}>{item.desc}</p>
              </div>
            );
          })}
        </div>

        {[
          {
            title: '1. Objet',
            content: 'Les présentes conditions générales ont pour objet de définir les modalités et conditions d\'utilisation du service TERAS.'
          },
          {
            title: '2. Accès au service',
            content: 'L\'accès au service est réservé aux personnes physiques et morales capables juridiquement. L\'utilisateur garantit l\'exactitude des informations fournies.'
          },
          {
            title: '3. Utilisation du score',
            content: 'Le score TERAS est fourni à titre informatif. Il ne constitue pas une garantie d\'obtention de crédit. Chaque établissement de crédit reste seul décisionnaire.'
          },
          {
            title: '4. Propriété intellectuelle',
            content: 'TERAS et tous ses éléments (marques, logos, algorithmes) sont protégés par le droit de la propriété intellectuelle.'
          },
          {
            title: '5. Résiliation',
            content: 'L\'utilisateur peut résilier son compte à tout moment. TERAS se réserve le droit de suspendre ou résilier l\'accès en cas de violation des CGU.'
          }
        ].map((section, i) => (
          <div 
            key={i}
            className="p-8 rounded-xl border"
            style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
          >
            <h2 className="mb-3" style={{ color: '#EAF2FF' }}>{section.title}</h2>
            <p className="text-[15px] leading-relaxed" style={{ color: '#C8D5EE' }}>
              {section.content}
            </p>
          </div>
        ))}

        <div 
          className="p-6 rounded-xl border"
          style={{ backgroundColor: 'rgba(155, 210, 255, 0.05)', borderColor: '#9BD2FF' }}
        >
          <p className="text-[14px]" style={{ color: '#C8D5EE' }}>
            <strong style={{ color: '#EAF2FF' }}>Dernière mise à jour :</strong> 23 octobre 2025
          </p>
        </div>
      </div>
    </Hero>
  );
}

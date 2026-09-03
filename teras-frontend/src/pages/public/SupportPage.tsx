// @ts-nocheck
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';
import { MessageCircle, Mail, HelpCircle, Clock } from 'lucide-react';

interface SupportPageProps {
  onNavigate?: (page: string) => void;
}

export function SupportPage({ onNavigate }: SupportPageProps) {
  const faqs = [
    { q: 'Comment est calculé mon score TERAS ?', a: 'Le score est basé sur 5 facteurs principaux...' },
    { q: 'Combien de temps pour obtenir mon score ?', a: 'Votre score est généré instantanément...' },
    { q: 'Puis-je contester mon score ?', a: 'Oui, vous pouvez soumettre une demande de révision...' }
  ];

  return (
    <Hero
      title="Support & centre d'aide"
      subtitle="FAQ, tickets et assistance prioritaire. Notre équipe est là pour vous aider."
      buttons={
        <Button variant="primary">
          <MessageCircle className="w-4 h-4 mr-2 inline" />
          Ouvrir un ticket
        </Button>
      }
      showScoreCard={false}
    >
      <div className="mt-8 grid grid-cols-3 gap-4 max-w-[900px]">
        {[
          { icon: MessageCircle, title: 'Chat en direct', desc: 'Disponible 9h-18h' },
          { icon: Mail, title: 'Email', desc: 'support@teras.io' },
          { icon: Clock, title: 'Temps de réponse', desc: '< 2 heures' }
        ].map((channel, i) => {
          const Icon = channel.icon;
          return (
            <div 
              key={i}
              className="p-6 rounded-xl border text-center"
              style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
            >
              <Icon className="w-8 h-8 mx-auto mb-3" style={{ color: '#9BD2FF' }} />
              <h3 className="mb-1" style={{ color: '#EAF2FF' }}>{channel.title}</h3>
              <p className="text-[14px]" style={{ color: '#9CB5DD' }}>{channel.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 max-w-[900px]">
        <h2 className="mb-4" style={{ color: '#EAF2FF' }}>Questions fréquentes</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details 
              key={i}
              className="p-6 rounded-xl border cursor-pointer"
              style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
            >
              <summary className="flex items-center gap-3" style={{ color: '#EAF2FF' }}>
                <HelpCircle className="w-5 h-5 shrink-0" style={{ color: '#9BD2FF' }} />
                <span>{faq.q}</span>
              </summary>
              <p className="mt-3 ml-8 text-[14px]" style={{ color: '#9CB5DD' }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Hero>
  );
}

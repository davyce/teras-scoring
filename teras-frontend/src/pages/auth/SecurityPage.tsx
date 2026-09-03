// @ts-nocheck
import { Hero } from '../components/Hero';
import { Shield, Lock, Eye, FileCheck } from 'lucide-react';

interface SecurityPageProps {
  onNavigate?: (page: string) => void;
}

export function SecurityPage({ onNavigate }: SecurityPageProps) {
  const features = [
    { 
      icon: Shield, 
      title: 'Chiffrement de bout en bout', 
      desc: 'Toutes vos données sont chiffrées avec AES-256 et TLS 1.3' 
    },
    { 
      icon: Lock, 
      title: 'Permissions granulaires', 
      desc: 'Contrôle d\'accès basé sur les rôles (RBAC) et authentification multi-facteurs' 
    },
    { 
      icon: Eye, 
      title: 'Audit et traçabilité', 
      desc: 'Logs complets de toutes les actions et accès aux données' 
    },
    { 
      icon: FileCheck, 
      title: 'Conformité locale', 
      desc: 'Respect des réglementations locales et hébergement des données dans votre région' 
    }
  ];

  return (
    <Hero
      title="Sécurité & conformité"
      subtitle="Vos données sont protégées avec les plus hauts standards de sécurité. Chiffrement, permissions, audit et conformité locale."
      showScoreCard={false}
    >
      <div className="mt-8 grid grid-cols-2 gap-6 max-w-[900px]">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div 
              key={i}
              className="p-8 rounded-xl border"
              style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(155, 210, 255, 0.1)' }}
              >
                <Icon className="w-7 h-7" style={{ color: '#9BD2FF' }} />
              </div>
              <h3 className="mb-2" style={{ color: '#EAF2FF' }}>{feature.title}</h3>
              <p className="text-[14px] leading-relaxed" style={{ color: '#9CB5DD' }}>
                {feature.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div 
        className="mt-8 p-6 rounded-xl border max-w-[900px]"
        style={{ backgroundColor: 'rgba(155, 210, 255, 0.05)', borderColor: '#9BD2FF' }}
      >
        <p className="text-[14px]" style={{ color: '#C8D5EE' }}>
          <strong style={{ color: '#EAF2FF' }}>Note importante :</strong> TERAS n'est pas conçu pour la collecte de données personnelles identifiables (PII) sensibles. Nous respectons votre vie privée et suivons les meilleures pratiques en matière de protection des données.
        </p>
      </div>
    </Hero>
  );
}

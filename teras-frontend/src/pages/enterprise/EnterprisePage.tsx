// @ts-nocheck
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';

interface EnterprisePageProps {
  onNavigate?: (page: string) => void;
}

export function EnterprisePage({ onNavigate }: EnterprisePageProps) {
  return (
    <Hero
      title="TERAS Entreprise"
      subtitle="T – Transparence • E – Emploi • R – Rétention • A – Activité • S – Stabilité. Solution complète pour évaluer la santé financière de votre entreprise."
      buttons={
        <>
          <Button variant="primary" onClick={() => onNavigate?.('contact')}>
            Demander une démo
          </Button>
          <Button variant="secondary" onClick={() => onNavigate?.('pricing')}>
            Voir les tarifs
          </Button>
        </>
      }
      showScoreCard={true}
    />
  );
}

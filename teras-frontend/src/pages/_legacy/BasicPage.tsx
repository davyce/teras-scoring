import { Hero } from '../components/Hero';
import { Button } from '../components/Button';

interface BasicPageProps {
  onNavigate?: (page: string) => void;
}

export function BasicPage({ onNavigate }: BasicPageProps) {
  return (
    <Hero
      title="TERAS Basic"
      subtitle="Score personnel : Transactions • Épargne • Revenus • Actifs • Social. Obtenez votre score de crédit personnel en quelques minutes."
      buttons={
        <>
          <Button variant="primary" onClick={() => onNavigate?.('register')}>
            Commencer gratuitement
          </Button>
          <Button variant="secondary" onClick={() => onNavigate?.('how-it-works')}>
            En savoir plus
          </Button>
        </>
      }
      showScoreCard={true}
    />
  );
}

import { Button } from '../components/Button';

interface RegisterPageProps {
  onNavigate?: (page: string) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  return (
    <div className="w-full min-h-[600px] flex items-center justify-center px-6">
      <div className="w-full max-w-[480px] space-y-6">
        <h1 className="text-center mb-2" style={{ color: '#EAF2FF' }}>
          Créez votre compte TERAS
        </h1>
        <p className="text-center text-[16px] mb-8" style={{ color: '#C8D5EE' }}>
          Démarrez en quelques étapes, gratuitement.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Prénom"
              className="px-4 py-3 rounded-lg border bg-transparent outline-none focus:border-[#9BD2FF] transition-colors"
              style={{ borderColor: '#1B2740', color: '#EAF2FF', backgroundColor: '#0F172A' }}
            />
            <input
              type="text"
              placeholder="Nom"
              className="px-4 py-3 rounded-lg border bg-transparent outline-none focus:border-[#9BD2FF] transition-colors"
              style={{ borderColor: '#1B2740', color: '#EAF2FF', backgroundColor: '#0F172A' }}
            />
          </div>

          <input
            type="email"
            placeholder="E-mail"
            className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none focus:border-[#9BD2FF] transition-colors"
            style={{ borderColor: '#1B2740', color: '#EAF2FF', backgroundColor: '#0F172A' }}
          />

          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none focus:border-[#9BD2FF] transition-colors"
            style={{ borderColor: '#1B2740', color: '#EAF2FF', backgroundColor: '#0F172A' }}
          />

          {/* Account Type */}
          <div className="space-y-2">
            <label className="text-[14px]" style={{ color: '#C8D5EE' }}>Type de compte</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                className="px-4 py-3 rounded-lg border transition-all"
                style={{ backgroundColor: '#0F172A', borderColor: '#9BD2FF', color: '#EAF2FF' }}
              >
                Basic
              </button>
              <button 
                className="px-4 py-3 rounded-lg border transition-all hover:border-[#9BD2FF]"
                style={{ backgroundColor: '#0F172A', borderColor: '#1B2740', color: '#C8D5EE' }}
              >
                Entreprise
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2 text-[13px] cursor-pointer">
            <input type="checkbox" className="mt-0.5" />
            <span style={{ color: '#9CB5DD' }}>
              J'accepte les <button className="underline hover:no-underline" style={{ color: '#9BD2FF' }}>conditions d'utilisation</button> et la <button className="underline hover:no-underline" style={{ color: '#9BD2FF' }}>politique de confidentialité</button>
            </span>
          </label>

          <Button variant="primary" className="w-full" onClick={() => onNavigate?.('dashboard')}>
            Créer mon compte
          </Button>

          <div className="text-center text-[14px] mt-6" style={{ color: '#9CB5DD' }}>
            Vous avez déjà un compte?{' '}
            <button 
              onClick={() => onNavigate?.('login')}
              className="hover:underline" 
              style={{ color: '#EAF2FF' }}
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

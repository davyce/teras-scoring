/**
 * Page d'attente de validation du compte
 * Pour les comptes Entreprise, Gouvernement et Partenaire
 * @module pages/auth/RegisterPendingPage
 */

import { Link, useLocation } from "react-router-dom";
import {
  Clock,
  Mail,
  FileText,
  Building2,
  Landmark,
  Handshake,
  ArrowLeft,
  HelpCircle,
  CheckCircle2,
  Shield
} from "lucide-react";

import type { AccountType } from "../../types/auth.types";

// Import du logo TERAS
import terasLogoUrl from "../../assets/logo-teras.svg";

// Configuration par type de compte
const PENDING_CONFIGS: Record<string, {
  icon: typeof Building2;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  steps: string[];
  delay: string;
}> = {
  enterprise: {
    icon: Building2,
    title: 'Entreprise',
    description: 'Votre demande de compte entreprise est en cours de vérification',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    steps: [
      'Vérification des informations de l\'entreprise',
      'Validation du numéro d\'identification fiscale (NIF)',
      'Contrôle du représentant légal',
      'Activation du compte'
    ],
    delay: '24 à 48 heures'
  },
  government: {
    icon: Landmark,
    title: 'Opérateur Gouvernemental',
    description: 'Votre demande d\'accès gouvernemental est en cours de validation',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    steps: [
      'Vérification de votre matricule',
      'Confirmation auprès de votre institution',
      'Attribution des niveaux d\'accès',
      'Activation du compte'
    ],
    delay: '2 à 5 jours ouvrables'
  },
  partner: {
    icon: Handshake,
    title: 'Partenaire Financier',
    description: 'Votre demande de partenariat est en cours d\'examen',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    steps: [
      'Vérification de la licence / agrément',
      'Validation de l\'organisation',
      'Configuration des accès API',
      'Activation du compte partenaire'
    ],
    delay: '3 à 7 jours ouvrables'
  }
};

const RegisterPendingPage = () => {
  const location = useLocation();
  const state = location.state as { account_type?: AccountType; email?: string } | null;
  
  const accountType = state?.account_type || 'enterprise';
  const email = state?.email || 'votre adresse email';
  
  const config = PENDING_CONFIGS[accountType] || PENDING_CONFIGS.enterprise;
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] text-white px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Carte principale */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-white/10 shadow-xl overflow-hidden">
          
          {/* Header coloré */}
          <div className={`${config.bgColor} ${config.borderColor} border-b p-8 text-center`}>
            <div className={`w-20 h-20 ${config.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 border ${config.borderColor}`}>
              <IconComponent className={`w-10 h-10 ${config.color}`} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Demande enregistrée !
            </h1>
            <p className={`${config.color} font-medium`}>
              Compte {config.title}
            </p>
          </div>

          {/* Contenu */}
          <div className="p-8">
            {/* Statut */}
            <div className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-6">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-amber-400">En attente de validation</p>
                <p className="text-sm text-slate-400">Délai estimé : {config.delay}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-400 mb-6">
              {config.description}. Nous vous enverrons un email à{' '}
              <span className="text-white font-medium">{email}</span>{' '}
              dès que votre compte sera activé.
            </p>

            {/* Étapes de validation */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">
                Processus de validation :
              </h3>
              <div className="space-y-3">
                {config.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold
                      ${index === 0 
                        ? `${config.bgColor} ${config.color} border ${config.borderColor}` 
                        : 'bg-slate-800/50 text-slate-500 border border-white/5'
                      }
                    `}>
                      {index === 0 ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`text-sm ${index === 0 ? 'text-white' : 'text-slate-500'}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info email */}
            <div className="p-4 bg-slate-800/50 border border-white/5 rounded-xl mb-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-sky-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">Vérifiez votre boîte mail</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Un email de confirmation a été envoyé. Pensez à vérifier vos spams.
                  </p>
                </div>
              </div>
            </div>

            {/* Documents requis */}
            <div className="p-4 bg-slate-800/50 border border-white/5 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">Documents éventuels</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Notre équipe pourrait vous contacter pour des documents complémentaires 
                    (attestation d'immatriculation, pièce d'identité, etc.)
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg hover:bg-sky-400 transition-all"
              >
                Retour à l'accueil
              </Link>
              
              <Link
                to="/help"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 transition-all"
              >
                <HelpCircle className="w-4 h-4" />
                Besoin d'aide ?
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Une question ?{' '}
            <a href="mailto:support@teras.ai" className="text-sky-400 hover:underline">
              support@teras.ai
            </a>
          </p>
        </div>

        {/* Lien vers login */}
        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-400 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPendingPage;

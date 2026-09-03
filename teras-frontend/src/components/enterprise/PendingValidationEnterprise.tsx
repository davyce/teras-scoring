/**
 * Page affichée quand un compte Enterprise est en attente de validation admin
 * Composant à placer dans : frontend/src/components/PendingValidationEnterprise.tsx
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import terasLogoUrl from '../assets/logo-teras.svg';

const PendingValidationEnterprise: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Nettoyer tous les tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('teras_access_token');
    localStorage.removeItem('teras_token');
    localStorage.removeItem('teras_refresh_token');
    localStorage.removeItem('teras-auth');
    localStorage.removeItem('teras_auth_context');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        
        {/* Logo TERAS */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative group">
              <img
                src={terasLogoUrl}
                alt="TERAS"
                className="w-20 h-20"
              />
              <div className="absolute inset-0 bg-cyan-500/20 rounded-lg blur-xl opacity-50"></div>
            </div>
          </div>
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
            TERAS Entreprise
          </p>
        </div>

        {/* Card principale */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          
          {/* Header avec icône */}
          <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-b border-amber-800/30 p-8 text-center">
            <div className="bg-amber-500/10 border border-amber-500/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-12 h-12 text-amber-400 animate-pulse" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">
              Compte en attente de validation
            </h1>

            <p className="text-slate-300 text-lg">
              Votre demande d'accès TERAS Entreprise est en cours d'examen
            </p>
          </div>

          {/* Contenu */}
          <div className="p-8 space-y-6">

            {/* Message principal */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Pourquoi cette étape ?
                  </h3>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    Pour garantir la sécurité et la fiabilité de notre plateforme TERAS, 
                    tous les comptes entreprises doivent être validés par notre équipe administrative 
                    avant d'accéder au tableau de bord et aux fonctionnalités complètes.
                  </p>
                  <p className="text-slate-400 text-sm">
                    Cette procédure nous permet de vérifier l'authenticité de votre entreprise 
                    et d'assurer la protection des données sensibles.
                  </p>
                </div>
              </div>
            </div>

            {/* Prochaines étapes */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Prochaines étapes
              </h3>

              <div className="space-y-4">
                {/* Étape 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center">
                    <span className="text-cyan-400 font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium mb-1">Examen de votre demande</p>
                    <p className="text-slate-400 text-sm">
                      Notre équipe vérifie les informations de votre entreprise et les documents fournis
                    </p>
                  </div>
                </div>

                {/* Étape 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-slate-400 font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium mb-1">Validation du compte</p>
                    <p className="text-slate-400 text-sm">
                      Une fois approuvé, votre compte sera activé automatiquement
                    </p>
                  </div>
                </div>

                {/* Étape 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-slate-400 font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium mb-1">Notification par email</p>
                    <p className="text-slate-400 text-sm">
                      Vous recevrez un email de confirmation avec vos accès
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Délais */}
            <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-800/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-wide mb-2">
                    Délai habituel
                  </h3>
                  <p className="text-slate-300 mb-3">
                    <strong className="text-white">24 à 48 heures ouvrées</strong>
                  </p>
                  <p className="text-slate-400 text-sm">
                    Si votre demande n'est pas traitée sous 48h, vous pouvez contacter notre support 
                    à l'adresse : <a href="mailto:support@teras.com" className="text-cyan-400 hover:text-cyan-300 underline">support@teras.com</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Informations importantes */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                ⚠️ Informations importantes
              </h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Assurez-vous que l'adresse email fournie est correcte et accessible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Consultez régulièrement votre boîte de réception (y compris les spams)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Conservez vos identifiants de connexion en lieu sûr</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Une fois validé, vous aurez accès à toutes les fonctionnalités TERAS Entreprise</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl transition-all border border-slate-700 hover:border-slate-600"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour à la connexion
              </button>

              <a
                href="mailto:support@teras.com"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/50"
              >
                <Mail className="w-5 h-5" />
                Contacter le support
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            Merci de votre patience. Nous examinons votre demande avec attention.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PendingValidationEnterprise;

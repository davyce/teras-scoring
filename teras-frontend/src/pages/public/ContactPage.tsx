// src/pages/public/ContactPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  Loader2,
  Building2,
  Users,
  Headphones,
} from "lucide-react";
import PublicNavbar from "../../components/PublicNavbar";

export default function ContactPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "general",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    // Simulation d'envoi
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSending(false);
    setSent(true);

    // Reset après 3 secondes
    setTimeout(() => {
      setSent(false);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        type: "general",
      });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: <Mail className="h-5 w-5" />,
      label: "Email",
      value: "contact@teras.io",
      href: "mailto:contact@teras.io",
    },
    {
      icon: <Phone className="h-5 w-5" />,
      label: "Téléphone",
      value: "+242 06 XXX XX XX",
      href: "tel:+242060000000",
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      label: "Adresse",
      value: "Brazzaville, République du Congo",
      href: null,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Horaires",
      value: "Lun - Ven, 8h - 18h",
      href: null,
    },
  ];

  const supportOptions = [
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Support Général",
      description: "Questions sur TERAS, votre compte ou votre score.",
      action: "general",
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: "Entreprises & API",
      description: "Intégration API, partenariats et solutions B2B.",
      action: "business",
    },
    {
      icon: <Headphones className="h-6 w-6" />,
      title: "Support Technique",
      description: "Problèmes techniques, bugs ou suggestions.",
      action: "technical",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <PublicNavbar />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 pt-16 pb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-sky-200/90 mb-6">
              <MessageSquare className="h-4 w-4" />
              Nous contacter
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Comment pouvons-nous{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                vous aider
              </span>{" "}
              ?
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Notre équipe est à votre disposition pour répondre à toutes vos
              questions. Choisissez le canal qui vous convient le mieux.
            </p>
          </div>
        </section>

        {/* Options de support */}
        <section className="mx-auto max-w-7xl px-6 pb-12">
          <div className="grid gap-6 md:grid-cols-3">
            {supportOptions.map((option, i) => (
              <button
                key={i}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, type: option.action }))
                }
                className={`rounded-2xl border p-6 text-left transition ${
                  formData.type === option.action
                    ? "border-sky-500/50 bg-sky-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div
                  className={`mb-4 inline-flex items-center justify-center rounded-lg p-2 ${
                    formData.type === option.action
                      ? "bg-sky-500/20 text-sky-400"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {option.icon}
                </div>
                <h3 className="font-semibold mb-2">{option.title}</h3>
                <p className="text-sm text-slate-400">{option.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Formulaire et Infos */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Formulaire */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-semibold mb-6">
                Envoyez-nous un message
              </h2>

              {sent ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Message envoyé !</h3>
                  <p className="text-slate-400">
                    Nous vous répondrons dans les plus brefs délais.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Type */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">
                      Type de demande
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
                    >
                      <option value="general">Support Général</option>
                      <option value="business">Entreprises & API</option>
                      <option value="technical">Support Technique</option>
                    </select>
                  </div>

                  {/* Nom */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
                      placeholder="Jean Dupont"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
                      placeholder="vous@exemple.com"
                    />
                  </div>

                  {/* Sujet */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">
                      Sujet
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
                      placeholder="Comment pouvons-nous vous aider ?"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition resize-none"
                      placeholder="Décrivez votre demande en détail..."
                    />
                  </div>

                  {/* Bouton */}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 px-6 py-3 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-wait transition"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Envoyer le message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Informations de contact */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Informations de contact
              </h2>

              <div className="space-y-4 mb-10">
                {contactInfo.map((info, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5"
                  >
                    <div className="inline-flex items-center justify-center rounded-lg bg-sky-500/10 p-2 text-sky-400">
                      {info.icon}
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-0.5">
                        {info.label}
                      </div>
                      {info.href ? (
                        <a
                          href={info.href}
                          className="text-white hover:text-sky-400 transition"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <span className="text-white">{info.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* FAQ rapide */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-sky-400" />
                  Questions fréquentes
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      q: "Quel est le délai de réponse ?",
                      a: "Nous répondons généralement sous 24h ouvrées.",
                    },
                    {
                      q: "Comment obtenir un support prioritaire ?",
                      a: "Les plans Pro et Entreprise incluent un support prioritaire.",
                    },
                    {
                      q: "Proposez-vous des démonstrations ?",
                      a: "Oui, contactez-nous pour planifier une démo personnalisée.",
                    },
                  ].map((faq, i) => (
                    <div key={i}>
                      <div className="font-medium text-sm mb-1">{faq.q}</div>
                      <div className="text-sm text-slate-400">{faq.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map ou CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2">
                  Vous préférez nous appeler ?
                </h3>
                <p className="text-slate-300">
                  Notre équipe est disponible du lundi au vendredi, de 8h à 18h.
                </p>
              </div>
              <a
                href="tel:+242060000000"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3 font-semibold text-slate-900 transition"
              >
                <Phone className="h-4 w-4" />
                +242 06 XXX XX XX
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-900/50 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} TERAS. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}

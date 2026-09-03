// @ts-nocheck
import { Hero } from '../components/Hero';
import { Calendar, User, ArrowRight } from 'lucide-react';

interface BlogPageProps {
  onNavigate?: (page: string) => void;
}

export function BlogPage({ onNavigate }: BlogPageProps) {
  const articles = [
    { 
      title: 'Comment améliorer votre score en 30 jours', 
      date: '15 Oct 2025', 
      author: 'Marie Dupont',
      category: 'Conseils'
    },
    { 
      title: 'TERAS Entreprise : Nouveautés du mois', 
      date: '10 Oct 2025', 
      author: 'Jean Martin',
      category: 'Produit'
    },
    { 
      title: 'Tendances du crédit en Afrique francophone', 
      date: '5 Oct 2025', 
      author: 'Sophie Laurent',
      category: 'Analyses'
    }
  ];

  return (
    <Hero
      title="Analyses & actualités"
      subtitle="Tendances crédit, guides pratiques, mises à jour produit et insights du marché."
      showScoreCard={false}
    >
      <div className="mt-8 space-y-4 max-w-[900px]">
        {articles.map((article, i) => (
          <div 
            key={i}
            className="p-6 rounded-xl border hover:border-[#9BD2FF] transition-all cursor-pointer group"
            style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span 
                  className="text-[12px] px-2 py-1 rounded mb-2 inline-block"
                  style={{ backgroundColor: 'rgba(155, 210, 255, 0.1)', color: '#9BD2FF' }}
                >
                  {article.category}
                </span>
                <h3 className="mb-2 group-hover:text-[#9BD2FF] transition-colors" style={{ color: '#EAF2FF' }}>
                  {article.title}
                </h3>
                <div className="flex items-center gap-4 text-[13px]" style={{ color: '#9CB5DD' }}>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{article.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>{article.author}</span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" style={{ color: '#9BD2FF' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button 
          className="px-6 py-3 rounded-xl border hover:border-[#9BD2FF] transition-all"
          style={{ backgroundColor: '#0F172A', borderColor: '#223556', color: '#C8D5EE' }}
        >
          Voir tous les articles
        </button>
      </div>
    </Hero>
  );
}

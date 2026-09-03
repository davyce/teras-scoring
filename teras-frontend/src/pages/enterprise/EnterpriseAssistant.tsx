/**
 * Page Assistant IA TERAS Entreprise
 * Interface complète avec suggestions, historique et analyse contextuelle
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  Sparkles,
  Loader2,
  TrendingUp,
  Users,
  FileText,
  Shield,
  BarChart3,
  Lightbulb,
  Clock,
  Trash2,
  RefreshCw,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import DOMPurify from 'dompurify';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SuggestedQuestion {
  id: string;
  category: string;
  icon: typeof TrendingUp;
  question: string;
  color: string;
}

const suggestedQuestions: SuggestedQuestion[] = [
  {
    id: '1',
    category: 'Score TERAS',
    icon: TrendingUp,
    question: 'Comment puis-je améliorer mon score TERAS Entreprise de 720 à 800+ ?',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: '2',
    category: 'Emploi',
    icon: Users,
    question: 'Quelle est l\'impact du taux d\'emploi local sur mon score TERAS ?',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: '3',
    category: 'Transparence',
    icon: FileText,
    question: 'Quels documents dois-je fournir pour maximiser ma transparence fiscale ?',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: '4',
    category: 'Conformité',
    icon: Shield,
    question: 'Comment corriger mon statut de conformité qui est à 72% ?',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: '5',
    category: 'Analyse',
    icon: BarChart3,
    question: 'Analyse mes performances par rapport aux entreprises similaires dans mon secteur',
    color: 'from-red-500 to-rose-500',
  },
  {
    id: '6',
    category: 'Conseils',
    icon: Lightbulb,
    question: 'Quelles sont les 3 actions prioritaires pour améliorer ma rétention clients ?',
    color: 'from-indigo-500 to-purple-500',
  },
];

const EnterpriseAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 **Bienvenue dans l\'Assistant IA TERAS Entreprise**\n\nJe suis votre conseiller intelligent propulsé par **Claude Sonnet 4**. Je peux vous aider à :\n\n• 📊 **Analyser** votre score TERAS en détail\n• 🎯 **Optimiser** chacun des 5 piliers (T.E.R.A.S)\n• 📈 **Comparer** vos performances sectorielles\n• 💡 **Recommander** des actions concrètes\n• 📄 **Interpréter** vos rapports et données\n\nChoisissez une question suggérée ci-dessous ou posez-moi directement votre question !',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputMessage;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Ajouter à l'historique
    setConversationHistory(prev => [...prev, messageText]);

    try {
      const res = await authFetch('/api/scoring/enterprise/ai/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      // Extraire la réponse selon le format du backend
      const replyContent =
        data?.response || data?.message?.content || data?.message ||
        'Désolé, je n\'ai pas pu traiter votre demande.';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: typeof replyContent === 'string' ? replyContent : JSON.stringify(replyContent),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Erreur chat:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Une erreur est survenue. Veuillez réessayer dans quelques instants.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '👋 Conversation réinitialisée. Comment puis-je vous aider ?',
        timestamp: new Date(),
      },
    ]);
    setConversationHistory([]);
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300 font-bold">$1</strong>')
      .replace(/^• (.+)$/gm, '<div class="ml-4 mb-1">• $1</div>')
      .replace(/^- (.+)$/gm, '<div class="ml-4 mb-1">• $1</div>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Assistant IA TERAS</h1>
              <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Propulsé par Claude Sonnet 4</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Zone principale - Chat */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)]">

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-start gap-3">
                        {message.role === 'assistant' && (
                          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-xl flex-shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                        )}

                        <div className="flex-1">
                          <div
                            className={`rounded-2xl px-5 py-4 ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                : 'bg-slate-800/50 text-slate-200 border border-slate-700/50'
                            }`}
                          >
                            <div
                              className="text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatMessage(message.content)) }}
                            />
                          </div>
                          <div className={`text-xs mt-2 flex items-center gap-2 ${
                            message.role === 'user' ? 'justify-end text-slate-500' : 'text-slate-500'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        {message.role === 'user' && (
                          <div className="bg-cyan-500 p-2 rounded-xl flex-shrink-0">
                            <span className="text-white text-sm font-bold">👤</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-xl">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                          <span className="text-slate-400">L'assistant analyse votre demande...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-slate-900 border-t border-slate-800">
                <div className="flex gap-3">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Posez votre question à l'assistant IA..."
                    disabled={isLoading}
                    rows={2}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50 resize-none"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                  >
                    <Send className="w-5 h-5" />
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Questions suggérées & Historique */}
          <div className="space-y-6">

            {/* Questions suggérées */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white">Questions suggérées</h3>
              </div>

              <div className="space-y-3">
                {suggestedQuestions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSuggestedQuestion(item.question)}
                      disabled={isLoading}
                      className="w-full text-left p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all disabled:opacity-50 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`bg-gradient-to-r ${item.color} p-2 rounded-lg flex-shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-500 mb-1">{item.category}</p>
                          <p className="text-sm text-slate-300 group-hover:text-white transition-colors line-clamp-2">
                            {item.question}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Historique */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-white">Historique</h3>
                </div>
                {conversationHistory.length > 0 && (
                  <button
                    onClick={clearConversation}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Effacer
                  </button>
                )}
              </div>

              {conversationHistory.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Aucune conversation</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {conversationHistory.slice(-5).reverse().map((question, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-800/30 border border-slate-700/30 rounded-lg"
                    >
                      <p className="text-xs text-slate-400 line-clamp-2">{question}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-800/30 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-cyan-300 mb-2">💡 Astuce</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Pour de meilleurs résultats, soyez précis dans vos questions et mentionnez les piliers TERAS concernés (Transparence, Emploi, Rétention, Activité, Stabilité).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseAssistant;
// @ts-nocheck
// frontend/src/components/government/ChatbotDemo.tsx
/**
 * Interface de chat TERAS pleine page (style Messenger/WhatsApp)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, Sparkles, MessageCircle } from 'lucide-react';
import { sendChatMessage } from '../../utils/authFetch';
import DOMPurify from 'dompurify';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatbotDemo: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Bonjour ! Je suis l\'**Assistant IA TERAS**, propulsé par Claude Sonnet 4.\n\nJe peux vous aider à :\n\n• 📊 Analyser les scores TERAS nationaux\n• 🗺️ Comparer les performances régionales\n• 🏢 Évaluer les secteurs économiques\n• ⚠️ Interpréter les alertes système\n• 📄 Générer des rapports détaillés\n\nPosez-moi une question sur les données TERAS !',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const data = await sendChatMessage(inputMessage, 'government', messages);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Désolé, je n\'ai pas pu traiter votre demande.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Erreur chat:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Désolé, une erreur est survenue. Veuillez réessayer.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300 font-bold">$1</strong>')
      .replace(/^• (.+)$/gm, '<div class="ml-4 mb-1">• $1</div>')
      .replace(/^- (.+)$/gm, '<div class="ml-4 mb-1">• $1</div>')
      .replace(/^# (.+)$/gm, '<h3 class="text-lg font-bold mt-3 mb-2 text-white">$1</h3>')
      .replace(/\n/g, '<br/>');
  };

  const suggestedQuestions = [
    "Quel est le score TERAS moyen actuel ?",
    "Compare les performances de Kinshasa et Lubumbashi",
    "Quelles sont les alertes critiques ?",
    "Analyse le secteur de la santé",
    "Génère un rapport trimestriel"
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar avec suggestions */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Assistant IA</h2>
              <p className="text-slate-400 text-xs">Claude Sonnet 4</p>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-2">Données TERAS</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-300 text-sm">Score moyen</span>
              <span className="text-cyan-400 font-bold">676/1000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300 text-sm">Utilisateurs</span>
              <span className="text-green-400 font-bold">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300 text-sm">Entreprises</span>
              <span className="text-purple-400 font-bold">1,247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300 text-sm">Alertes</span>
              <span className="text-red-400 font-bold">12</span>
            </div>
          </div>
        </div>

        {/* Questions suggérées */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <h3 className="text-white font-semibold text-sm">Questions suggérées</h3>
          </div>
          <div className="space-y-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(question)}
                className="w-full text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 rounded-lg p-3 text-sm text-slate-300 hover:text-white transition-all"
              >
                💬 {question}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-white text-xs font-semibold">Conversations : {messages.length - 1}</span>
            </div>
            <p className="text-slate-400 text-xs">Propulsé par Claude Sonnet 4</p>
          </div>
        </div>
      </div>

      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-bold mb-1">Assistant IA TERAS</h1>
              <p className="text-slate-400">Posez vos questions sur les données TERAS</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-slate-400">En ligne</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3xl ${message.role === 'user' ? 'w-auto' : 'w-full'}`}>
                {/* Avatar */}
                <div className="flex items-start gap-3">
                  {message.role === 'assistant' && (
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className="flex-1">
                    {/* Message */}
                    <div
                      className={`rounded-2xl px-5 py-4 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white ml-auto'
                          : 'bg-slate-800/50 text-slate-200 border border-slate-700/50'
                      }`}
                      style={{ maxWidth: message.role === 'user' ? '80%' : '100%' }}
                    >
                      <div
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatMessage(message.content)) }}
                      />
                    </div>

                    {/* Timestamp */}
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-right text-slate-500' : 'text-slate-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="bg-cyan-500 p-2 rounded-lg flex-shrink-0">
                      <span className="text-white font-bold">👤</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Indicateur de frappe */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-3xl">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-slate-400 text-sm">L'assistant réfléchit...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-slate-900 border-t border-slate-800 p-6">
          <div className="flex gap-3 max-w-5xl mx-auto">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question sur les données TERAS..."
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50 resize-none"
              style={{ minHeight: '56px', maxHeight: '150px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
            >
              <Send className="w-5 h-5" />
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotDemo;

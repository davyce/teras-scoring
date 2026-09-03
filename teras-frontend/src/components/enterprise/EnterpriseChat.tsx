/**
 * Chatbot IA TERAS pour l'interface Entreprise
 * VERSION CONNECTÉE API avec enterpriseApi
 * Propulsé par Claude Sonnet 4
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, Maximize2, Bot, Sparkles, Loader2 } from 'lucide-react';
import { enterpriseApi } from '../../services/enterpriseApi';
import terasLogoUrl from '../../assets/logo-teras.svg';
import DOMPurify from 'dompurify';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const EnterpriseChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Bonjour ! Je suis l\'**Assistant IA TERAS Entreprise**, propulsé par Claude Sonnet 4.\n\nJe peux vous aider à :\n\n• 📊 Analyser votre score TERAS Entreprise\n• 👥 Optimiser votre score Emploi local\n• 📈 Améliorer votre transparence fiscale\n• 💼 Conseils sur la rétention clients\n• 📄 Interpréter vos rapports\n\nComment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      // ✅ CONNEXION API
      const response = await enterpriseApi.sendChatMessage(inputMessage, {
        conversationHistory: messages,
        userType: 'enterprise',
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || 'Désolé, je n\'ai pas pu traiter votre demande.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Erreur chat:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Une erreur est survenue. Veuillez réessayer.',
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
      .replace(/\n/g, '<br/>');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full shadow-2xl hover:shadow-cyan-500/50 transition-all hover:scale-110 flex items-center justify-center z-50 group"
      >
        <Bot className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-950 rounded-full animate-pulse"></span>
        <div className="absolute bottom-full mb-2 right-0 bg-slate-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
          Assistant IA TERAS
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300`}>
      <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}>
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <img src={terasLogoUrl} alt="TERAS" className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Assistant IA TERAS</p>
              <div className="flex items-center gap-1 text-xs text-cyan-100">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>En ligne</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/20 rounded-lg transition">
              {isMinimized ? <Maximize2 className="w-4 h-4 text-white" /> : <Minimize2 className="w-4 h-4 text-white" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="h-[440px] overflow-y-auto p-4 space-y-4 bg-slate-950">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && (
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-1.5 rounded-lg flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div>
                        <div className={`rounded-2xl px-4 py-2.5 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                            : 'bg-slate-800/50 text-slate-200 border border-slate-700/50'
                        }`}>
                          <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatMessage(message.content)) }} />
                        </div>
                        <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-right text-slate-500' : 'text-slate-500'}`}>
                          {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <div className="bg-cyan-500 p-1.5 rounded-lg flex-shrink-0">
                          <span className="text-white text-xs font-bold">👤</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-1.5 rounded-lg">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-2.5">
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

            <div className="p-3 bg-slate-900 border-t border-slate-800">
              <div className="flex gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Posez votre question..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50 resize-none"
                  style={{ minHeight: '40px', maxHeight: '100px' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                <Sparkles className="w-3 h-3" />
                <span>Propulsé par Claude Sonnet 4</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EnterpriseChat;

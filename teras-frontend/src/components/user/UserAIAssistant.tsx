/**
 * UserAIAssistant - VERSION CORRIGÉE ✅
 * ✅ Accepte isOpen et onClose
 * ✅ Modal popup centre écran
 * ✅ POST /api/chat/message/ (endpoint consolidé)
 * ✅ Toggle RAG activable/désactivable
 * ✅ FIX: Extraction correcte de data.message.content
 */

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, X, Sparkles, FileText, Zap, CheckCircle } from "lucide-react";
import { authFetch } from "../../utils/authFetch";

interface Message { 
  role: 'user' | 'assistant'; 
  content: string; 
  timestamp: Date;
  metadata?: {
    sources?: any[];
    used_rag?: boolean;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const MessageBubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === 'user';
  return (
    <div className="space-y-2">
      <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-gradient-to-br from-sky-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'
        }`}>
          {isUser ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
        </div>
        <div className={`flex-1 max-w-[75%] rounded-2xl px-5 py-4 ${
          isUser 
            ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white' 
            : 'bg-slate-800/80 border border-white/10 text-slate-100'
        }`}>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
          <div className={`text-xs mt-2 ${isUser ? 'text-sky-100' : 'text-slate-500'}`}>
            {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* ✅ Badge RAG utilisé */}
      {!isUser && msg.metadata?.used_rag && (
        <div className="flex items-center gap-2 ml-14 animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400">Réponse basée sur la documentation TERAS</span>
        </div>
      )}

      {/* ✅ Sources */}
      {!isUser && msg.metadata?.sources && msg.metadata.sources.length > 0 && (
        <div className="ml-14 space-y-1 animate-in fade-in duration-200">
          <p className="text-xs text-slate-500 font-medium">📚 Sources :</p>
          {msg.metadata.sources.map((source: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
              <FileText className="w-3 h-3" />
              <span>{source.title || `Document ${idx + 1}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function UserAIAssistant({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Bonjour ! Je suis votre assistant TERAS. Comment puis-je vous aider aujourd'hui ? 😊", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  
  // ✅ État toggle RAG (OFF par défaut)
  const [useRAG, setUseRAG] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // ✅ Appel endpoint consolidé avec toggle RAG
      const response = await authFetch('/api/chat/message/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          conversation_id: conversationId,
          use_rag: useRAG,  // ✅ Envoyer état toggle
          save_conversation: true
        })
      });

      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      const data = await response.json();
      
      // 🔍 Debug - Voir ce qui est reçu
      console.log('📦 Response du backend:', data);
      console.log('💬 Message reçu:', data.message);
      
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      // ✅ FIX: Extraire correctement le content
      // Le backend renvoie data.message qui est un objet {id, role, content, timestamp, metadata}
      // Il faut extraire data.message.content
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.message?.content || data.message || data.response || "Pas de réponse",
        timestamp: new Date(),
        metadata: {
          sources: data.sources || [],
          used_rag: data.used_rag || false
        }
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Erreur chat:', err);
      const errorMsg: Message = {
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-white/10 animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header Gradient */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Assistant IA TERAS
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                </h2>
                <p className="text-purple-100 text-sm">Conseils personnalisés • Disponible 24/7</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* ✅ Toggle RAG */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <button
              onClick={() => setUseRAG(!useRAG)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                useRAG ? 'bg-green-500' : 'bg-slate-700'
              }`}>
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                useRAG ? 'translate-x-7' : 'translate-x-0'
              }`} />
            </button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className={`w-4 h-4 ${useRAG ? 'text-white' : 'text-purple-200'}`} />
                <span className={`text-sm font-medium ${useRAG ? 'text-white' : 'text-purple-100'}`}>
                  Recherche documents
                </span>
              </div>
              <p className="text-xs text-purple-200">
                {useRAG 
                  ? '✅ IA cherchera dans la documentation TERAS' 
                  : '⚡ IA répondra directement (plus rapide)'}
              </p>
            </div>

            {useRAG && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/30">
                <Sparkles className="w-3 h-3 text-green-300" />
                <span className="text-xs text-green-200 font-medium">RAG actif</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0b1220]">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
          
          {loading && (
            <div className="flex gap-4 animate-in slide-in-from-bottom-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div className="bg-slate-800/80 border border-white/10 rounded-2xl px-5 py-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-sm rounded-b-3xl">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Posez votre question..."
              disabled={loading}
              className="flex-1 bg-slate-800/50 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition disabled:opacity-50"
            />
            <button 
              onClick={sendMessage} 
              disabled={!input.trim() || loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span>Envoyer</span>
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-500">
              💡 Tip: Appuyez sur Entrée pour envoyer
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Zap className="w-3 h-3" />
              <span>
                {useRAG ? 'Mode recherche actif' : 'Mode rapide actif'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

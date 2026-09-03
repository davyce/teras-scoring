/**
 * ChatHistory - Page historique conversations avec export PDF
 * ✅ Liste toutes les conversations
 * ✅ Affiche messages de chaque conversation
 * ✅ Export PDF par conversation
 * ✅ Archiver conversations
 * ✅ Recherche/filtres
 */

import { useState, useEffect } from 'react';
import { 
  MessageSquare, Download, Archive, Search, Calendar,
  ChevronRight, FileText, Trash2, Eye, X, Bot, User,
  Filter, Clock, CheckCircle
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    sources?: any[];
    used_rag?: boolean;
  };
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  is_archived: boolean;
  last_message?: {
    role: string;
    content: string;
    timestamp: string;
  };
}

export default function ChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [exporting, setExporting] = useState<number | null>(null);

  // Charger conversations
  useEffect(() => {
    loadConversations();
  }, [showArchived]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const url = `/api/chat/conversations/${showArchived ? '?archived=true' : ''}`;
      const response = await authFetch(url);
      
      if (!response.ok) throw new Error('Erreur chargement');
      
      const data = await response.json();
      setConversations(data.results || data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger messages d'une conversation
  const loadMessages = async (convId: number) => {
    setLoadingMessages(true);
    try {
      const response = await authFetch(`/api/chat/conversations/${convId}/`);
      
      if (!response.ok) throw new Error('Erreur chargement messages');
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Erreur:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Sélectionner conversation
  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    await loadMessages(conv.id);
  };

  // Export PDF
  const exportPDF = async (convId: number) => {
    setExporting(convId);
    try {
      const response = await authFetch(`/api/chat/conversations/${convId}/export_pdf/`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Erreur export');
      
      // Télécharger le PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${convId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('✅ PDF téléchargé !');
    } catch (err) {
      console.error('Erreur export:', err);
      alert('❌ Erreur lors de l\'export PDF');
    } finally {
      setExporting(null);
    }
  };

  // Archiver conversation
  const archiveConversation = async (convId: number) => {
    try {
      const response = await authFetch(`/api/chat/conversations/${convId}/archive/`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Erreur archivage');
      
      await loadConversations();
      if (selectedConv?.id === convId) {
        setSelectedConv(null);
        setMessages([]);
      }
      
      alert('✅ Conversation archivée');
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur lors de l\'archivage');
    }
  };

  // Supprimer conversation
  const deleteConversation = async (convId: number) => {
    if (!confirm('Supprimer cette conversation ?')) return;
    
    try {
      const response = await authFetch(`/api/chat/conversations/${convId}/`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Erreur suppression');
      
      await loadConversations();
      if (selectedConv?.id === convId) {
        setSelectedConv(null);
        setMessages([]);
      }
      
      alert('✅ Conversation supprimée');
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur lors de la suppression');
    }
  };

  // Filtrer conversations
  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(search.toLowerCase()) ||
    conv.last_message?.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b1220] p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-purple-400" />
                Historique Conversations IA
              </h1>
              <p className="text-slate-400 mt-2">
                Consultez et exportez vos conversations avec l'assistant TERAS
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex gap-4">
              <div className="bg-slate-800/50 border border-white/10 rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-white">{conversations.length}</div>
                <div className="text-xs text-slate-400">Conversations</div>
              </div>
              <div className="bg-slate-800/50 border border-white/10 rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-purple-400">
                  {conversations.reduce((sum, c) => sum + c.message_count, 0)}
                </div>
                <div className="text-xs text-slate-400">Messages</div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une conversation..."
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${
                showArchived
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800/50 border border-white/10 text-slate-300'
              }`}>
              <Archive className="w-5 h-5" />
              {showArchived ? 'Actives' : 'Archivées'}
            </button>
          </div>
        </div>

        {/* Layout 2 colonnes */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Liste conversations (gauche) */}
          <div className="col-span-1 space-y-3">
            {loading ? (
              <div className="text-center py-12 text-slate-400">
                Chargement...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                Aucune conversation trouvée
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`bg-slate-800/50 border rounded-xl p-4 cursor-pointer transition hover:border-purple-500/50 ${
                    selectedConv?.id === conv.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/10'
                  }`}>
                  
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white text-sm flex-1 line-clamp-2">
                      {conv.title}
                    </h3>
                    <ChevronRight className={`w-5 h-5 text-slate-500 flex-shrink-0 ${
                      selectedConv?.id === conv.id ? 'text-purple-400' : ''
                    }`} />
                  </div>
                  
                  {conv.last_message && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {conv.last_message.content}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" />
                      <span>{conv.message_count} msgs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(conv.updated_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Détails conversation (droite) */}
          <div className="col-span-2">
            {!selectedConv ? (
              <div className="bg-slate-800/30 border border-white/10 rounded-xl p-12 text-center">
                <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  Sélectionnez une conversation pour voir les détails
                </p>
              </div>
            ) : (
              <div className="bg-slate-800/30 border border-white/10 rounded-xl overflow-hidden">
                
                {/* Header conversation */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white mb-1">
                        {selectedConv.title}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-purple-100">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(selectedConv.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {selectedConv.message_count} messages
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedConv(null);
                        setMessages([]);
                      }}
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportPDF(selectedConv.id)}
                      disabled={exporting === selectedConv.id}
                      className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
                      {exporting === selectedConv.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Export...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Télécharger PDF
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => archiveConversation(selectedConv.id)}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                      <Archive className="w-4 h-4" />
                      Archiver
                    </button>
                    
                    <button
                      onClick={() => deleteConversation(selectedConv.id)}
                      className="bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-red-300 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                  {loadingMessages ? (
                    <div className="text-center py-8 text-slate-400">
                      Chargement des messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      Aucun message
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                          )}
                          
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white'
                              : 'bg-slate-700/50 text-slate-100'
                          }`}>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </div>
                            <div className={`text-xs mt-2 ${
                              msg.role === 'user' ? 'text-sky-100' : 'text-slate-500'
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>

                          {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Badge RAG + Sources */}
                        {msg.role === 'assistant' && msg.metadata?.used_rag && (
                          <div className="ml-11">
                            <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                              <CheckCircle className="w-3 h-3" />
                              Réponse basée sur la documentation
                            </div>
                            
                            {msg.metadata.sources && msg.metadata.sources.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs text-slate-500 font-medium">Sources :</p>
                                {msg.metadata.sources.map((src: any, sidx: number) => (
                                  <div key={sidx} className="flex items-center gap-2 text-xs text-slate-400">
                                    <FileText className="w-3 h-3" />
                                    {src.title || `Document ${sidx + 1}`}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

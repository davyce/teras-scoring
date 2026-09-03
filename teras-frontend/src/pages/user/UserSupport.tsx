// src/pages/user/UserSupport.tsx
import { useState, useEffect } from 'react';
import { 
  MessageSquare, Clock, CheckCircle, AlertCircle, 
  Plus, Send, ChevronLeft, Paperclip, X, RefreshCw
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

// Types
interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  description?: string;
  category: string;
  category_display: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  is_read: boolean;
  message_count: number;
  assigned_to: { id: number; name: string } | null;
  last_message: {
    content: string;
    is_admin: boolean;
    created_at: string;
  } | null;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: number;
  content: string;
  is_admin_message: boolean;
  sender_name: string;
  attachment: string | null;
  created_at: string;
}

interface TicketDetail extends Ticket {
  attachment: string | null;
  resolved_at: string | null;
}

interface Stats {
  total: number;
  open: number;
  resolved: number;
  closed: number;
  unread: number;
}

export default function UserSupport() {
  // États
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Création ticket
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });
  const [creating, setCreating] = useState(false);
  
  // Détail ticket
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Réponse
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [filterStatus]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const response = await authFetch(`/api/scoring/user/support/tickets/${params}`);
      const data = await response.json();
      setTickets(data.tickets || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (ticketId: number) => {
    try {
      setLoadingDetail(true);
      const response = await authFetch(`/api/scoring/user/support/tickets/${ticketId}/`);
      const data = await response.json();
      setSelectedTicket(data.ticket);
      setTicketMessages(data.messages || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) return;
    
    try {
      setCreating(true);
      const response = await authFetch('/api/scoring/user/support/tickets/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setNewTicket({ subject: '', description: '', category: 'general', priority: 'medium' });
        loadTickets();
      }
    } catch (err) {
      console.error('Erreur création:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedTicket) return;
    
    try {
      setSending(true);
      const response = await authFetch(`/api/scoring/user/support/tickets/${selectedTicket.id}/reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });
      
      if (response.ok) {
        setReplyContent('');
        loadTicketDetail(selectedTicket.id);
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    
    try {
      const response = await authFetch(`/api/scoring/user/support/tickets/${selectedTicket.id}/close/`, {
        method: 'POST',
      });
      
      if (response.ok) {
        loadTicketDetail(selectedTicket.id);
        loadTickets();
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket) return;
    
    const reason = prompt('Raison de la réouverture (optionnel):');
    
    try {
      const response = await authFetch(`/api/scoring/user/support/tickets/${selectedTicket.id}/reopen/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || '' }),
      });
      
      if (response.ok) {
        loadTicketDetail(selectedTicket.id);
        loadTickets();
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // Couleurs
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      waiting_user: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return colors[status] || colors.open;
  };

  // Vue détail ticket
  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-[#0b1220] p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedTicket(null)}
            className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">{selectedTicket.ticket_number}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTicket.status)}`}>
                {selectedTicket.status_display}
              </span>
            </div>
            <p className="text-slate-400 mt-1">{selectedTicket.subject}</p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            {selectedTicket.status === 'resolved' && (
              <button
                onClick={handleReopenTicket}
                className="px-4 py-2 bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-600/30 transition-colors"
              >
                Rouvrir
              </button>
            )}
            {['open', 'in_progress', 'waiting_user'].includes(selectedTicket.status) && (
              <button
                onClick={handleCloseTicket}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Clôturer
              </button>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {/* Description initiale */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-sky-500/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <p className="font-medium text-white">Vous</p>
                <p className="text-xs text-slate-500">
                  {new Date(selectedTicket.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
              <span className="ml-auto px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded">
                {selectedTicket.category_display}
              </span>
            </div>
            <p className="text-slate-300 whitespace-pre-wrap">{selectedTicket.description}</p>
          </div>

          {/* Messages */}
          {ticketMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-xl ${
                msg.is_admin_message
                  ? 'bg-sky-900/20 border border-sky-700/30 ml-8'
                  : 'bg-slate-900/50 border border-slate-700/50 mr-8'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.is_admin_message ? 'bg-sky-500/20' : 'bg-slate-700'
                }`}>
                  <MessageSquare className={`w-4 h-4 ${msg.is_admin_message ? 'text-sky-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">
                    {msg.is_admin_message ? (
                      <span className="text-sky-400">Support TERAS</span>
                    ) : (
                      'Vous'
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(msg.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap text-sm">{msg.content}</p>
              {msg.attachment && (
                <a 
                  href={msg.attachment} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 text-sm"
                >
                  <Paperclip className="w-3 h-3" />
                  Pièce jointe
                </a>
              )}
            </div>
          ))}

          {/* Zone de réponse */}
          {selectedTicket.status !== 'closed' && (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Écrivez votre message..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                rows={4}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || sending}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </div>
          )}

          {/* Info assignation */}
          {selectedTicket.assigned_to && (
            <div className="text-center text-sm text-slate-500">
              Votre ticket est traité par <span className="text-sky-400">{selectedTicket.assigned_to.name}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vue liste tickets
  return (
    <div className="min-h-screen bg-[#0b1220] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Support</h1>
          <p className="text-slate-400 mt-1">Gérez vos demandes d'assistance</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau ticket
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total</span>
              <MessageSquare className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">En cours</span>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.open}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Résolus</span>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Non lus</span>
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.unread}</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2">
        {['', 'open', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === status
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {status === '' ? 'Tous' : status === 'open' ? 'En cours' : 'Clôturés'}
          </button>
        ))}
      </div>

      {/* Liste tickets */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-sky-400" />
            <p className="mt-3 text-slate-400">Chargement...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 mb-4">Aucun ticket</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
            >
              Créer mon premier ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => loadTicketDetail(ticket.id)}
                className={`p-4 hover:bg-slate-800/30 cursor-pointer transition-colors ${
                  !ticket.is_read ? 'bg-sky-900/10' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500">{ticket.ticket_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {ticket.status_display}
                      </span>
                      {!ticket.is_read && (
                        <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 text-xs rounded-full">
                          Nouvelle réponse
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white">{ticket.subject}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {ticket.message_count} messages
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.updated_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {ticket.last_message && (
                      <p className="mt-2 text-sm text-slate-400 truncate">
                        {ticket.last_message.is_admin ? '📨 Support: ' : '📤 Vous: '}
                        {ticket.last_message.content}
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded">
                    {ticket.category_display}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal création ticket */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Nouveau ticket</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Catégorie</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="general">Question générale</option>
                  <option value="account">Mon compte</option>
                  <option value="score">Score TERAS</option>
                  <option value="kyc">Vérification KYC</option>
                  <option value="credit">Crédit / Prêt</option>
                  <option value="technical">Problème technique</option>
                  <option value="billing">Facturation</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              
              {/* Sujet */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sujet</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Résumé de votre demande"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  maxLength={200}
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Décrivez votre problème ou question en détail..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  rows={5}
                />
              </div>
              
              {/* Priorité */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Priorité</label>
                <div className="flex gap-2">
                  {[
                    { value: 'low', label: 'Basse', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                    { value: 'medium', label: 'Moyenne', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
                    { value: 'high', label: 'Haute', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
                    { value: 'urgent', label: 'Urgente', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setNewTicket({ ...newTicket, priority: p.value })}
                      className={`flex-1 py-2 rounded-lg border transition-colors ${
                        newTicket.priority === p.value
                          ? p.color
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={!newTicket.subject.trim() || !newTicket.description.trim() || creating}
                className="flex-1 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Création...' : 'Créer le ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

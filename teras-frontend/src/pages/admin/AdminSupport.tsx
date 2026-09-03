// src/pages/admin/AdminSupport.tsx
import { useState, useEffect } from 'react';
import { 
  MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, 
  User, Filter, Send, ChevronLeft, Users, RefreshCw,
  Search, ArrowUp, ArrowDown, Paperclip, X
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

// Types
interface TicketUser {
  id: number;
  email: string;
  name: string;
}

interface LastMessage {
  content: string;
  is_admin: boolean;
  created_at: string;
}

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
  user: TicketUser;
  assigned_to: { id: number; name: string } | null;
  last_message: LastMessage | null;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: number;
  content: string;
  is_admin_message: boolean;
  sender: { id: number; name: string; email: string };
  attachment: string | null;
  is_read: boolean;
  created_at: string;
}

interface TicketDetail extends Ticket {
  attachment: string | null;
  resolved_at: string | null;
  closed_at: string | null;
}

interface Stats {
  overview: {
    total: number;
    open: number;
    unassigned: number;
    unread: number;
    new_this_week: number;
    resolved_this_week: number;
  };
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_category: Record<string, number>;
}

interface Admin {
  id: number;
  username: string;
  name: string;
  email: string;
  assigned_tickets: number;
}

export default function AdminSupport() {
  // États
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres
  const [filterStatus, setFilterStatus] = useState<string>('open');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterAssigned, setFilterAssigned] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Détail ticket
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Réponse
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  
  // Modal assignation
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    loadTickets();
    loadStats();
    loadAdmins();
  }, [filterStatus, filterCategory, filterPriority, filterAssigned, searchQuery]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterCategory) params.append('category', filterCategory);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterAssigned) params.append('assigned', filterAssigned);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await authFetch(`/api/scoring/admin/support/tickets/?${params}`);
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err) {
      setError('Erreur lors du chargement des tickets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await authFetch('/api/scoring/admin/support/stats/');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  };

  const loadAdmins = async () => {
    try {
      const response = await authFetch('/api/scoring/admin/support/admins/');
      const data = await response.json();
      setAdmins(data.admins || []);
    } catch (err) {
      console.error('Erreur admins:', err);
    }
  };

  const loadTicketDetail = async (ticketId: number) => {
    try {
      setLoadingDetail(true);
      const response = await authFetch(`/api/scoring/admin/support/tickets/${ticketId}/`);
      const data = await response.json();
      setSelectedTicket(data.ticket);
      setTicketMessages(data.messages || []);
    } catch (err) {
      console.error('Erreur détail ticket:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedTicket) return;
    
    try {
      setSending(true);
      const response = await authFetch(`/api/scoring/admin/support/tickets/${selectedTicket.id}/reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });
      
      if (response.ok) {
        setReplyContent('');
        loadTicketDetail(selectedTicket.id);
        loadTickets();
      }
    } catch (err) {
      console.error('Erreur envoi:', err);
    } finally {
      setSending(false);
    }
  };

  const handleAssign = async (adminId: number | null) => {
    if (!selectedTicket) return;
    
    try {
      const response = await authFetch(`/api/scoring/admin/support/tickets/${selectedTicket.id}/assign/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId }),
      });
      
      if (response.ok) {
        setShowAssignModal(false);
        loadTicketDetail(selectedTicket.id);
        loadTickets();
        loadStats();
      }
    } catch (err) {
      console.error('Erreur assignation:', err);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    
    try {
      const response = await authFetch(`/api/scoring/admin/support/tickets/${selectedTicket.id}/status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        loadTicketDetail(selectedTicket.id);
        loadTickets();
        loadStats();
      }
    } catch (err) {
      console.error('Erreur changement statut:', err);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!selectedTicket) return;
    
    try {
      const response = await authFetch(`/api/scoring/admin/support/tickets/${selectedTicket.id}/priority/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });
      
      if (response.ok) {
        loadTicketDetail(selectedTicket.id);
        loadTickets();
      }
    } catch (err) {
      console.error('Erreur changement priorité:', err);
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

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'text-red-400',
      high: 'text-orange-400',
      medium: 'text-yellow-400',
      low: 'text-blue-400',
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent' || priority === 'high') {
      return <ArrowUp className="w-4 h-4" />;
    }
    return <ArrowDown className="w-4 h-4" />;
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
              <h1 className="text-2xl font-bold text-white">{selectedTicket.ticket_number}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTicket.status)}`}>
                {selectedTicket.status_display}
              </span>
              <span className={`flex items-center gap-1 text-sm font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                {getPriorityIcon(selectedTicket.priority)}
                {selectedTicket.priority_display}
              </span>
            </div>
            <p className="text-slate-400 mt-1">{selectedTicket.subject}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages */}
          <div className="lg:col-span-2 space-y-4">
            {/* Description initiale */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-sky-500/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{selectedTicket.user?.name || 'Utilisateur'}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(selectedTicket.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap">{selectedTicket.description}</p>
              {selectedTicket.attachment && (
                <a 
                  href={selectedTicket.attachment} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sky-400 hover:text-sky-300"
                >
                  <Paperclip className="w-4 h-4" />
                  Pièce jointe
                </a>
              )}
            </div>

            {/* Liste des messages */}
            <div className="space-y-3">
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
                      <User className={`w-4 h-4 ${msg.is_admin_message ? 'text-sky-400' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">
                        {msg.sender?.name || 'Utilisateur'}
                        {msg.is_admin_message && <span className="ml-2 text-xs text-sky-400">(Support)</span>}
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
            </div>

            {/* Zone de réponse */}
            {selectedTicket.status !== 'closed' && (
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Écrivez votre réponse..."
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
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-4">
            {/* Infos utilisateur */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Utilisateur
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-slate-300">{selectedTicket.user?.name}</p>
                <p className="text-slate-500">{selectedTicket.user?.email}</p>
              </div>
            </div>

            {/* Assignation */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                Assigné à
              </h3>
              {selectedTicket.assigned_to ? (
                <p className="text-slate-300">{selectedTicket.assigned_to.name}</p>
              ) : (
                <p className="text-slate-500 italic">Non assigné</p>
              )}
              <button
                onClick={() => setShowAssignModal(true)}
                className="mt-3 w-full py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                {selectedTicket.assigned_to ? 'Réassigner' : 'Assigner'}
              </button>
            </div>

            {/* Changer statut */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">Statut</h3>
              <select
                value={selectedTicket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="open">Ouvert</option>
                <option value="in_progress">En cours</option>
                <option value="waiting_user">En attente utilisateur</option>
                <option value="resolved">Résolu</option>
                <option value="closed">Clôturé</option>
              </select>
            </div>

            {/* Changer priorité */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">Priorité</h3>
              <select
                value={selectedTicket.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            {/* Infos ticket */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">Informations</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Catégorie</span>
                  <span className="text-slate-300">{selectedTicket.category_display}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Créé le</span>
                  <span className="text-slate-300">
                    {new Date(selectedTicket.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Messages</span>
                  <span className="text-slate-300">{ticketMessages.length + 1}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal assignation */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Assigner le ticket</h3>
                <button onClick={() => setShowAssignModal(false)}>
                  <X className="w-5 h-5 text-slate-400 hover:text-white" />
                </button>
              </div>
              <div className="space-y-2">
                {admins.map((admin) => (
                  <button
                    key={admin.id}
                    onClick={() => handleAssign(admin.id)}
                    className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors"
                  >
                    <p className="font-medium text-white">{admin.name}</p>
                    <p className="text-sm text-slate-400">
                      {admin.email} • {admin.assigned_tickets} tickets assignés
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vue liste tickets
  return (
    <div className="min-h-screen bg-[#0b1220] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Centre de Support</h1>
          <p className="text-slate-400 mt-1">Gérer les tickets et assistance utilisateurs</p>
        </div>
        <button
          onClick={() => { loadTickets(); loadStats(); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total</span>
              <MessageSquare className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.overview.total}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Ouverts</span>
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.overview.open}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Non assignés</span>
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-orange-400">{stats.overview.unassigned}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Non lus</span>
              <MessageSquare className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.overview.unread}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Résolus (7j)</span>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.overview.resolved_this_week}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Nouveaux (7j)</span>
              <ArrowUp className="w-5 h-5 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-sky-400">{stats.overview.new_this_week}</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Recherche */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          
          {/* Statut */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Tous les statuts</option>
            <option value="open">Ouverts</option>
            <option value="in_progress">En cours</option>
            <option value="waiting_user">En attente</option>
            <option value="resolved">Résolus</option>
            <option value="closed">Clôturés</option>
          </select>
          
          {/* Priorité */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Toutes priorités</option>
            <option value="urgent">Urgente</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
          
          {/* Catégorie */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Toutes catégories</option>
            <option value="general">Question générale</option>
            <option value="account">Mon compte</option>
            <option value="score">Score TERAS</option>
            <option value="kyc">Vérification KYC</option>
            <option value="credit">Crédit / Prêt</option>
            <option value="technical">Problème technique</option>
            <option value="billing">Facturation</option>
          </select>
          
          {/* Assignation */}
          <select
            value={filterAssigned}
            onChange={(e) => setFilterAssigned(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Tous</option>
            <option value="unassigned">Non assignés</option>
            <option value="me">Mes tickets</option>
          </select>
        </div>
      </div>

      {/* Liste des tickets */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-sky-400" />
            <p className="mt-3 text-slate-400">Chargement...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">Aucun ticket trouvé</p>
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500">{ticket.ticket_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {ticket.status_display}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityIcon(ticket.priority)}
                        {ticket.priority_display}
                      </span>
                      {!ticket.is_read && (
                        <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white truncate">{ticket.subject}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ticket.user?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {ticket.message_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.updated_at).toLocaleDateString('fr-FR')}
                      </span>
                      {ticket.assigned_to && (
                        <span className="text-sky-400">→ {ticket.assigned_to.name}</span>
                      )}
                    </div>
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
    </div>
  );
}

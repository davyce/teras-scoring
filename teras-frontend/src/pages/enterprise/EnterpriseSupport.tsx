// @ts-nocheck
/**
 * EnterpriseSupport.tsx - Support Technique TERAS Entreprise
 * CONNEXION ADMIN: Tickets synchronisés avec AdminSupport
 */

import enterpriseApi from "../../services/enterpriseApi";
import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Search,
  Filter,
  Plus,
  X,
  Upload,
  FileText,
  User,
  Calendar
} from 'lucide-react';

interface SupportTicket {
  id: number;
  subject: string;
  category: 'technique' | 'facturation' | 'score' | 'documents' | 'autre';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
  attachments: TicketAttachment[];
  assigned_to?: string;
}

interface TicketMessage {
  id: number;
  sender: 'user' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
}

interface TicketAttachment {
  id: number;
  filename: string;
  file_size: number;
  uploaded_at: string;
}

const CATEGORIES = [
  { value: 'technique', label: 'Problème technique', color: 'blue' },
  { value: 'facturation', label: 'Facturation', color: 'green' },
  { value: 'score', label: 'Score TERAS', color: 'purple' },
  { value: 'documents', label: 'Documents', color: 'amber' },
  { value: 'autre', label: 'Autre', color: 'gray' },
];

const PRIORITIES = [
  { value: 'low', label: 'Basse', color: 'slate' },
  { value: 'medium', label: 'Moyenne', color: 'blue' },
  { value: 'high', label: 'Haute', color: 'orange' },
  { value: 'urgent', label: 'Urgente', color: 'red' },
];

const STATUS_CONFIG = {
  open: { label: 'Ouvert', color: 'blue', icon: AlertCircle },
  in_progress: { label: 'En cours', color: 'amber', icon: Clock },
  waiting_user: { label: 'Attente réponse', color: 'purple', icon: MessageSquare },
  resolved: { label: 'Résolu', color: 'green', icon: CheckCircle },
  closed: { label: 'Fermé', color: 'gray', icon: CheckCircle },
};

export default function EnterpriseSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'technique' as const,
    priority: 'medium' as const,
    message: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Reply
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const syncSelectedTicket = (nextTickets: SupportTicket[]) => {
    if (!nextTickets.length) {
      setSelectedTicket(null);
      return;
    }

    setSelectedTicket((current) => {
      if (!current) return nextTickets[0];
      return nextTickets.find((ticket) => ticket.id === current.id) || nextTickets[0];
    });
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await enterpriseApi.getTickets();
      const normalizedTickets = (response || []).map((ticket: any) => ({
        ...ticket,
        messages: ticket.messages || [],
        attachments: ticket.attachments || [],
      }));
      setTickets(normalizedTickets);
      syncSelectedTicket(normalizedTickets);
    } catch (error) {
      console.error('Erreur chargement tickets:', error);
      setTickets([]);
      setSelectedTicket(null);
      alert('Impossible de charger les tickets de support.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTicket.subject || !newTicket.message) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('subject', newTicket.subject);
      formData.append('category', newTicket.category);
      formData.append('priority', newTicket.priority);
      formData.append('message', newTicket.message);
      if (uploadedFiles[0]) {
        formData.append('attachment', uploadedFiles[0]);
      }
      const response = await enterpriseApi.createTicket(formData);

      alert('Ticket créé avec succès !');
      setShowNewTicketModal(false);
      setNewTicket({ subject: '', category: 'technique', priority: 'medium', message: '' });
      setUploadedFiles([]);
      const createdTicket = {
        ...response,
        messages: response.messages || [],
        attachments: response.attachments || [],
      };
      setTickets((prev) => [createdTicket, ...prev]);
      setSelectedTicket(createdTicket);
    } catch (error) {
      alert('Erreur création ticket');
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setSendingReply(true);
      const sentMessage = await enterpriseApi.replyTicket(selectedTicket.id, replyMessage);

      // Mock: Ajouter message localement
      const newMessage: TicketMessage = {
        id: `tmp-${Date.now()}`,
        sender: 'user',
        sender_name: 'Entreprise XYZ',
        message: replyMessage,
        created_at: new Date().toISOString(),
      };

      setSelectedTicket((current) => current ? {
        ...current,
        messages: [...current.messages, sentMessage || newMessage],
        status: 'open',
      } : current);
      setTickets((prev) => prev.map((ticket) => (
        ticket.id === selectedTicket.id
          ? { ...ticket, messages: [...ticket.messages, sentMessage || newMessage], status: 'open' }
          : ticket
      )));

      setReplyMessage('');
      alert('Réponse envoyée !');
    } catch (error) {
      alert('Erreur envoi réponse');
    } finally {
      setSendingReply(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toString().includes(searchQuery);

    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement des tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Support Technique</h1>
            <p className="text-slate-400">
              {tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length} ticket(s) actif(s)
            </p>
          </div>

          <button
            onClick={() => setShowNewTicketModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            Nouveau ticket
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par sujet ou #ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Liste tickets */}
          <div className="lg:col-span-1 space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Aucun ticket trouvé</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const statusConfig = STATUS_CONFIG[ticket.status];
                const StatusIcon = statusConfig.icon;
                const isSelected = selectedTicket?.id === ticket.id;

                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-500">#{ticket.id}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            ticket.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                            ticket.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            ticket.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {PRIORITIES.find(p => p.value === ticket.priority)?.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                          {ticket.subject}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      <div className={`p-2 rounded-lg ${
                        statusConfig.color === 'blue' ? 'bg-blue-500/20' :
                        statusConfig.color === 'amber' ? 'bg-amber-500/20' :
                        statusConfig.color === 'purple' ? 'bg-purple-500/20' :
                        statusConfig.color === 'green' ? 'bg-green-500/20' :
                        'bg-slate-500/20'
                      }`}>
                        <StatusIcon className={`w-4 h-4 ${
                          statusConfig.color === 'blue' ? 'text-blue-400' :
                          statusConfig.color === 'amber' ? 'text-amber-400' :
                          statusConfig.color === 'purple' ? 'text-purple-400' :
                          statusConfig.color === 'green' ? 'text-green-400' :
                          'text-slate-400'
                        }`} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={`px-2 py-0.5 rounded ${
                        ticket.category === 'technique' ? 'bg-blue-500/10 text-blue-400' :
                        ticket.category === 'facturation' ? 'bg-green-500/10 text-green-400' :
                        ticket.category === 'score' ? 'bg-purple-500/10 text-purple-400' :
                        ticket.category === 'documents' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {CATEGORIES.find(c => c.value === ticket.category)?.label}
                      </span>
                      <span>•</span>
                      <span>{ticket.messages?.length || 0} message(s)</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Détail ticket */}
          <div className="lg:col-span-2">
            {!selectedTicket ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center h-full flex items-center justify-center">
                <div>
                  <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Sélectionnez un ticket pour voir les détails</p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-280px)]">
                {/* Header ticket */}
                <div className="p-6 border-b border-slate-800">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-slate-500">Ticket #{selectedTicket.id}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          STATUS_CONFIG[selectedTicket.status].color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                          STATUS_CONFIG[selectedTicket.status].color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                          STATUS_CONFIG[selectedTicket.status].color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                          STATUS_CONFIG[selectedTicket.status].color === 'green' ? 'bg-green-500/20 text-green-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {STATUS_CONFIG[selectedTicket.status].label}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2">{selectedTicket.subject}</h2>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(selectedTicket.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                        {selectedTicket.assigned_to && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{selectedTicket.assigned_to}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {selectedTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-start gap-3">
                          {message.sender === 'admin' && (
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg flex-shrink-0">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className={`rounded-xl px-4 py-3 ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                : 'bg-slate-800 text-slate-200 border border-slate-700'
                            }`}>
                              <p className="text-xs font-medium mb-1 opacity-75">{message.sender_name}</p>
                              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(message.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>

                          {message.sender === 'user' && (
                            <div className="bg-cyan-500 p-2 rounded-lg flex-shrink-0">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply input */}
                {selectedTicket.status !== 'closed' && (
                  <div className="p-4 border-t border-slate-800">
                    <div className="flex gap-3">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Tapez votre réponse..."
                        rows={2}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                      />
                      <button
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim() || sendingReply}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {sendingReply ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal nouveau ticket */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Créer un ticket de support</h2>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Sujet *
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Décrivez brièvement votre problème"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Priorité
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    {PRIORITIES.map((pri) => (
                      <option key={pri.value} value={pri.value}>{pri.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Décrivez votre problème en détail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Pièces jointes (optionnel)
                </label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-slate-500" />
                    <p className="text-sm text-slate-400">
                      Cliquez pour ajouter des fichiers
                    </p>
                    <p className="text-xs text-slate-600">
                      PDF, images (max 10MB par fichier)
                    </p>
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-white">{file.name}</span>
                          <span className="text-xs text-slate-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium"
                >
                  Créer le ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

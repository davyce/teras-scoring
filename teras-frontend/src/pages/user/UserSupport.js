import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/user/UserSupport.tsx
import { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Plus, Send, ChevronLeft, Paperclip, X, RefreshCw } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
export default function UserSupport() {
    // États
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
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
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketMessages, setTicketMessages] = useState([]);
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
        }
        catch (err) {
            console.error('Erreur:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const loadTicketDetail = async (ticketId) => {
        try {
            setLoadingDetail(true);
            const response = await authFetch(`/api/scoring/user/support/tickets/${ticketId}/`);
            const data = await response.json();
            setSelectedTicket(data.ticket);
            setTicketMessages(data.messages || []);
        }
        catch (err) {
            console.error('Erreur:', err);
        }
        finally {
            setLoadingDetail(false);
        }
    };
    const handleCreateTicket = async () => {
        if (!newTicket.subject.trim() || !newTicket.description.trim())
            return;
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
        }
        catch (err) {
            console.error('Erreur création:', err);
        }
        finally {
            setCreating(false);
        }
    };
    const handleReply = async () => {
        if (!replyContent.trim() || !selectedTicket)
            return;
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
        }
        catch (err) {
            console.error('Erreur:', err);
        }
        finally {
            setSending(false);
        }
    };
    const handleCloseTicket = async () => {
        if (!selectedTicket)
            return;
        try {
            const response = await authFetch(`/api/scoring/user/support/tickets/${selectedTicket.id}/close/`, {
                method: 'POST',
            });
            if (response.ok) {
                loadTicketDetail(selectedTicket.id);
                loadTickets();
            }
        }
        catch (err) {
            console.error('Erreur:', err);
        }
    };
    const handleReopenTicket = async () => {
        if (!selectedTicket)
            return;
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
        }
        catch (err) {
            console.error('Erreur:', err);
        }
    };
    // Couleurs
    const getStatusColor = (status) => {
        const colors = {
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
        return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] p-6", children: [_jsxs("div", { className: "flex items-center gap-4 mb-6", children: [_jsx("button", { onClick: () => setSelectedTicket(null), className: "p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors", children: _jsx(ChevronLeft, { className: "w-5 h-5 text-slate-400" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h1", { className: "text-xl font-bold text-white", children: selectedTicket.ticket_number }), _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTicket.status)}`, children: selectedTicket.status_display })] }), _jsx("p", { className: "text-slate-400 mt-1", children: selectedTicket.subject })] }), _jsxs("div", { className: "flex gap-2", children: [selectedTicket.status === 'resolved' && (_jsx("button", { onClick: handleReopenTicket, className: "px-4 py-2 bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-600/30 transition-colors", children: "Rouvrir" })), ['open', 'in_progress', 'waiting_user'].includes(selectedTicket.status) && (_jsx("button", { onClick: handleCloseTicket, className: "px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors", children: "Cl\u00F4turer" }))] })] }), _jsxs("div", { className: "max-w-3xl mx-auto space-y-4", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "w-10 h-10 bg-sky-500/20 rounded-full flex items-center justify-center", children: _jsx(MessageSquare, { className: "w-5 h-5 text-sky-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-white", children: "Vous" }), _jsx("p", { className: "text-xs text-slate-500", children: new Date(selectedTicket.created_at).toLocaleString('fr-FR') })] }), _jsx("span", { className: "ml-auto px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded", children: selectedTicket.category_display })] }), _jsx("p", { className: "text-slate-300 whitespace-pre-wrap", children: selectedTicket.description })] }), ticketMessages.map((msg) => (_jsxs("div", { className: `p-4 rounded-xl ${msg.is_admin_message
                                ? 'bg-sky-900/20 border border-sky-700/30 ml-8'
                                : 'bg-slate-900/50 border border-slate-700/50 mr-8'}`, children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center ${msg.is_admin_message ? 'bg-sky-500/20' : 'bg-slate-700'}`, children: _jsx(MessageSquare, { className: `w-4 h-4 ${msg.is_admin_message ? 'text-sky-400' : 'text-slate-400'}` }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-white text-sm", children: msg.is_admin_message ? (_jsx("span", { className: "text-sky-400", children: "Support TERAS" })) : ('Vous') }), _jsx("p", { className: "text-xs text-slate-500", children: new Date(msg.created_at).toLocaleString('fr-FR') })] })] }), _jsx("p", { className: "text-slate-300 whitespace-pre-wrap text-sm", children: msg.content }), msg.attachment && (_jsxs("a", { href: msg.attachment, target: "_blank", rel: "noopener noreferrer", className: "mt-2 inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 text-sm", children: [_jsx(Paperclip, { className: "w-3 h-3" }), "Pi\u00E8ce jointe"] }))] }, msg.id))), selectedTicket.status !== 'closed' && (_jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsx("textarea", { value: replyContent, onChange: (e) => setReplyContent(e.target.value), placeholder: "\u00C9crivez votre message...", className: "w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none", rows: 4 }), _jsx("div", { className: "flex justify-end mt-3", children: _jsxs("button", { onClick: handleReply, disabled: !replyContent.trim() || sending, className: "flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: [_jsx(Send, { className: "w-4 h-4" }), sending ? 'Envoi...' : 'Envoyer'] }) })] })), selectedTicket.assigned_to && (_jsxs("div", { className: "text-center text-sm text-slate-500", children: ["Votre ticket est trait\u00E9 par ", _jsx("span", { className: "text-sky-400", children: selectedTicket.assigned_to.name })] }))] })] }));
    }
    // Vue liste tickets
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Support" }), _jsx("p", { className: "text-slate-400 mt-1", children: "G\u00E9rez vos demandes d'assistance" })] }), _jsxs("button", { onClick: () => setShowCreateModal(true), className: "flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors", children: [_jsx(Plus, { className: "w-5 h-5" }), "Nouveau ticket"] })] }), stats && (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-slate-400", children: "Total" }), _jsx(MessageSquare, { className: "w-5 h-5 text-slate-500" })] }), _jsx("p", { className: "text-2xl font-bold text-white", children: stats.total })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-slate-400", children: "En cours" }), _jsx(Clock, { className: "w-5 h-5 text-yellow-400" })] }), _jsx("p", { className: "text-2xl font-bold text-yellow-400", children: stats.open })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-slate-400", children: "R\u00E9solus" }), _jsx(CheckCircle, { className: "w-5 h-5 text-green-400" })] }), _jsx("p", { className: "text-2xl font-bold text-green-400", children: stats.resolved })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-slate-400", children: "Non lus" }), _jsx(AlertCircle, { className: "w-5 h-5 text-red-400" })] }), _jsx("p", { className: "text-2xl font-bold text-red-400", children: stats.unread })] })] })), _jsx("div", { className: "flex gap-2", children: ['', 'open', 'closed'].map((status) => (_jsx("button", { onClick: () => setFilterStatus(status), className: `px-4 py-2 rounded-lg transition-colors ${filterStatus === status
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`, children: status === '' ? 'Tous' : status === 'open' ? 'En cours' : 'Clôturés' }, status))) }), _jsx("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden", children: loading ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx(RefreshCw, { className: "w-8 h-8 mx-auto animate-spin text-sky-400" }), _jsx("p", { className: "mt-3 text-slate-400", children: "Chargement..." })] })) : tickets.length === 0 ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx(MessageSquare, { className: "w-16 h-16 mx-auto mb-3 text-slate-600" }), _jsx("p", { className: "text-slate-400 mb-4", children: "Aucun ticket" }), _jsx("button", { onClick: () => setShowCreateModal(true), className: "px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500", children: "Cr\u00E9er mon premier ticket" })] })) : (_jsx("div", { className: "divide-y divide-slate-700/50", children: tickets.map((ticket) => (_jsx("div", { onClick: () => loadTicketDetail(ticket.id), className: `p-4 hover:bg-slate-800/30 cursor-pointer transition-colors ${!ticket.is_read ? 'bg-sky-900/10' : ''}`, children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-xs font-mono text-slate-500", children: ticket.ticket_number }), _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`, children: ticket.status_display }), !ticket.is_read && (_jsx("span", { className: "px-2 py-0.5 bg-sky-500/20 text-sky-400 text-xs rounded-full", children: "Nouvelle r\u00E9ponse" }))] }), _jsx("h3", { className: "font-semibold text-white", children: ticket.subject }), _jsxs("div", { className: "flex items-center gap-4 mt-2 text-sm text-slate-500", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(MessageSquare, { className: "w-3 h-3" }), ticket.message_count, " messages"] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), new Date(ticket.updated_at).toLocaleDateString('fr-FR')] })] }), ticket.last_message && (_jsxs("p", { className: "mt-2 text-sm text-slate-400 truncate", children: [ticket.last_message.is_admin ? '📨 Support: ' : '📤 Vous: ', ticket.last_message.content] }))] }), _jsx("span", { className: "px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded", children: ticket.category_display })] }) }, ticket.id))) })) }), showCreateModal && (_jsx("div", { className: "fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Nouveau ticket" }), _jsx("button", { onClick: () => setShowCreateModal(false), children: _jsx(X, { className: "w-5 h-5 text-slate-400 hover:text-white" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Cat\u00E9gorie" }), _jsxs("select", { value: newTicket.category, onChange: (e) => setNewTicket({ ...newTicket, category: e.target.value }), className: "w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500", children: [_jsx("option", { value: "general", children: "Question g\u00E9n\u00E9rale" }), _jsx("option", { value: "account", children: "Mon compte" }), _jsx("option", { value: "score", children: "Score TERAS" }), _jsx("option", { value: "kyc", children: "V\u00E9rification KYC" }), _jsx("option", { value: "credit", children: "Cr\u00E9dit / Pr\u00EAt" }), _jsx("option", { value: "technical", children: "Probl\u00E8me technique" }), _jsx("option", { value: "billing", children: "Facturation" }), _jsx("option", { value: "other", children: "Autre" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Sujet" }), _jsx("input", { type: "text", value: newTicket.subject, onChange: (e) => setNewTicket({ ...newTicket, subject: e.target.value }), placeholder: "R\u00E9sum\u00E9 de votre demande", className: "w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500", maxLength: 200 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Description" }), _jsx("textarea", { value: newTicket.description, onChange: (e) => setNewTicket({ ...newTicket, description: e.target.value }), placeholder: "D\u00E9crivez votre probl\u00E8me ou question en d\u00E9tail...", className: "w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none", rows: 5 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Priorit\u00E9" }), _jsx("div", { className: "flex gap-2", children: [
                                                { value: 'low', label: 'Basse', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                                                { value: 'medium', label: 'Moyenne', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
                                                { value: 'high', label: 'Haute', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
                                                { value: 'urgent', label: 'Urgente', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
                                            ].map((p) => (_jsx("button", { onClick: () => setNewTicket({ ...newTicket, priority: p.value }), className: `flex-1 py-2 rounded-lg border transition-colors ${newTicket.priority === p.value
                                                    ? p.color
                                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`, children: p.label }, p.value))) })] })] }), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsx("button", { onClick: () => setShowCreateModal(false), className: "flex-1 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors", children: "Annuler" }), _jsx("button", { onClick: handleCreateTicket, disabled: !newTicket.subject.trim() || !newTicket.description.trim() || creating, className: "flex-1 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: creating ? 'Création...' : 'Créer le ticket' })] })] }) }))] }));
}

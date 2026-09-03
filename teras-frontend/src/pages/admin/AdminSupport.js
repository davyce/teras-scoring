import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/admin/AdminSupport.tsx
import { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, AlertCircle, User, Send, ChevronLeft, Users, RefreshCw, Search, ArrowUp, ArrowDown, Paperclip, X } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
export default function AdminSupport() {
    // États
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Filtres
    const [filterStatus, setFilterStatus] = useState('open');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterAssigned, setFilterAssigned] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    // Détail ticket
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketMessages, setTicketMessages] = useState([]);
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
            if (filterStatus)
                params.append('status', filterStatus);
            if (filterCategory)
                params.append('category', filterCategory);
            if (filterPriority)
                params.append('priority', filterPriority);
            if (filterAssigned)
                params.append('assigned', filterAssigned);
            if (searchQuery)
                params.append('search', searchQuery);
            const response = await authFetch(`/api/scoring/admin/support/tickets/?${params}`);
            const data = await response.json();
            setTickets(data.tickets || []);
        }
        catch (err) {
            setError('Erreur lors du chargement des tickets');
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const loadStats = async () => {
        try {
            const response = await authFetch('/api/scoring/admin/support/stats/');
            const data = await response.json();
            setStats(data);
        }
        catch (err) {
            console.error('Erreur stats:', err);
        }
    };
    const loadAdmins = async () => {
        try {
            const response = await authFetch('/api/scoring/admin/support/admins/');
            const data = await response.json();
            setAdmins(data.admins || []);
        }
        catch (err) {
            console.error('Erreur admins:', err);
        }
    };
    const loadTicketDetail = async (ticketId) => {
        try {
            setLoadingDetail(true);
            const response = await authFetch(`/api/scoring/admin/support/tickets/${ticketId}/`);
            const data = await response.json();
            setSelectedTicket(data.ticket);
            setTicketMessages(data.messages || []);
        }
        catch (err) {
            console.error('Erreur détail ticket:', err);
        }
        finally {
            setLoadingDetail(false);
        }
    };
    const handleReply = async () => {
        if (!replyContent.trim() || !selectedTicket)
            return;
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
        }
        catch (err) {
            console.error('Erreur envoi:', err);
        }
        finally {
            setSending(false);
        }
    };
    const handleAssign = async (adminId) => {
        if (!selectedTicket)
            return;
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
        }
        catch (err) {
            console.error('Erreur assignation:', err);
        }
    };
    const handleStatusChange = async (newStatus) => {
        if (!selectedTicket)
            return;
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
        }
        catch (err) {
            console.error('Erreur changement statut:', err);
        }
    };
    const handlePriorityChange = async (newPriority) => {
        if (!selectedTicket)
            return;
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
        }
        catch (err) {
            console.error('Erreur changement priorité:', err);
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
    const getPriorityColor = (priority) => {
        const colors = {
            urgent: 'text-red-400',
            high: 'text-orange-400',
            medium: 'text-yellow-400',
            low: 'text-blue-400',
        };
        return colors[priority] || colors.medium;
    };
    const getPriorityIcon = (priority) => {
        if (priority === 'urgent' || priority === 'high') {
            return _jsx(ArrowUp, { className: "w-4 h-4" });
        }
        return _jsx(ArrowDown, { className: "w-4 h-4" });
    };
    // Vue détail ticket
    if (selectedTicket) {
        return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] p-6", children: [_jsxs("div", { className: "flex items-center gap-4 mb-6", children: [_jsx("button", { onClick: () => setSelectedTicket(null), className: "p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors", children: _jsx(ChevronLeft, { className: "w-5 h-5 text-slate-400" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: selectedTicket.ticket_number }), _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTicket.status)}`, children: selectedTicket.status_display }), _jsxs("span", { className: `flex items-center gap-1 text-sm font-medium ${getPriorityColor(selectedTicket.priority)}`, children: [getPriorityIcon(selectedTicket.priority), selectedTicket.priority_display] })] }), _jsx("p", { className: "text-slate-400 mt-1", children: selectedTicket.subject })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-4", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "w-10 h-10 bg-sky-500/20 rounded-full flex items-center justify-center", children: _jsx(User, { className: "w-5 h-5 text-sky-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-white", children: selectedTicket.user?.name || 'Utilisateur' }), _jsx("p", { className: "text-xs text-slate-500", children: new Date(selectedTicket.created_at).toLocaleString('fr-FR') })] })] }), _jsx("p", { className: "text-slate-300 whitespace-pre-wrap", children: selectedTicket.description }), selectedTicket.attachment && (_jsxs("a", { href: selectedTicket.attachment, target: "_blank", rel: "noopener noreferrer", className: "mt-3 inline-flex items-center gap-2 text-sky-400 hover:text-sky-300", children: [_jsx(Paperclip, { className: "w-4 h-4" }), "Pi\u00E8ce jointe"] }))] }), _jsx("div", { className: "space-y-3", children: ticketMessages.map((msg) => (_jsxs("div", { className: `p-4 rounded-xl ${msg.is_admin_message
                                            ? 'bg-sky-900/20 border border-sky-700/30 ml-8'
                                            : 'bg-slate-900/50 border border-slate-700/50 mr-8'}`, children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center ${msg.is_admin_message ? 'bg-sky-500/20' : 'bg-slate-700'}`, children: _jsx(User, { className: `w-4 h-4 ${msg.is_admin_message ? 'text-sky-400' : 'text-slate-400'}` }) }), _jsxs("div", { children: [_jsxs("p", { className: "font-medium text-white text-sm", children: [msg.sender?.name || 'Utilisateur', msg.is_admin_message && _jsx("span", { className: "ml-2 text-xs text-sky-400", children: "(Support)" })] }), _jsx("p", { className: "text-xs text-slate-500", children: new Date(msg.created_at).toLocaleString('fr-FR') })] })] }), _jsx("p", { className: "text-slate-300 whitespace-pre-wrap text-sm", children: msg.content }), msg.attachment && (_jsxs("a", { href: msg.attachment, target: "_blank", rel: "noopener noreferrer", className: "mt-2 inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 text-sm", children: [_jsx(Paperclip, { className: "w-3 h-3" }), "Pi\u00E8ce jointe"] }))] }, msg.id))) }), selectedTicket.status !== 'closed' && (_jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsx("textarea", { value: replyContent, onChange: (e) => setReplyContent(e.target.value), placeholder: "\u00C9crivez votre r\u00E9ponse...", className: "w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none", rows: 4 }), _jsx("div", { className: "flex justify-end mt-3", children: _jsxs("button", { onClick: handleReply, disabled: !replyContent.trim() || sending, className: "flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: [_jsx(Send, { className: "w-4 h-4" }), sending ? 'Envoi...' : 'Envoyer'] }) })] }))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("h3", { className: "font-semibold text-white mb-3 flex items-center gap-2", children: [_jsx(User, { className: "w-4 h-4 text-slate-400" }), "Utilisateur"] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsx("p", { className: "text-slate-300", children: selectedTicket.user?.name }), _jsx("p", { className: "text-slate-500", children: selectedTicket.user?.email })] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("h3", { className: "font-semibold text-white mb-3 flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4 text-slate-400" }), "Assign\u00E9 \u00E0"] }), selectedTicket.assigned_to ? (_jsx("p", { className: "text-slate-300", children: selectedTicket.assigned_to.name })) : (_jsx("p", { className: "text-slate-500 italic", children: "Non assign\u00E9" })), _jsx("button", { onClick: () => setShowAssignModal(true), className: "mt-3 w-full py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm", children: selectedTicket.assigned_to ? 'Réassigner' : 'Assigner' })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsx("h3", { className: "font-semibold text-white mb-3", children: "Statut" }), _jsxs("select", { value: selectedTicket.status, onChange: (e) => handleStatusChange(e.target.value), className: "w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500", children: [_jsx("option", { value: "open", children: "Ouvert" }), _jsx("option", { value: "in_progress", children: "En cours" }), _jsx("option", { value: "waiting_user", children: "En attente utilisateur" }), _jsx("option", { value: "resolved", children: "R\u00E9solu" }), _jsx("option", { value: "closed", children: "Cl\u00F4tur\u00E9" })] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsx("h3", { className: "font-semibold text-white mb-3", children: "Priorit\u00E9" }), _jsxs("select", { value: selectedTicket.priority, onChange: (e) => handlePriorityChange(e.target.value), className: "w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500", children: [_jsx("option", { value: "low", children: "Basse" }), _jsx("option", { value: "medium", children: "Moyenne" }), _jsx("option", { value: "high", children: "Haute" }), _jsx("option", { value: "urgent", children: "Urgente" })] })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsx("h3", { className: "font-semibold text-white mb-3", children: "Informations" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-500", children: "Cat\u00E9gorie" }), _jsx("span", { className: "text-slate-300", children: selectedTicket.category_display })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-500", children: "Cr\u00E9\u00E9 le" }), _jsx("span", { className: "text-slate-300", children: new Date(selectedTicket.created_at).toLocaleDateString('fr-FR') })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-500", children: "Messages" }), _jsx("span", { className: "text-slate-300", children: ticketMessages.length + 1 })] })] })] })] })] }), showAssignModal && (_jsx("div", { className: "fixed inset-0 bg-black/70 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Assigner le ticket" }), _jsx("button", { onClick: () => setShowAssignModal(false), children: _jsx(X, { className: "w-5 h-5 text-slate-400 hover:text-white" }) })] }), _jsx("div", { className: "space-y-2", children: admins.map((admin) => (_jsxs("button", { onClick: () => handleAssign(admin.id), className: "w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors", children: [_jsx("p", { className: "font-medium text-white", children: admin.name }), _jsxs("p", { className: "text-sm text-slate-400", children: [admin.email, " \u2022 ", admin.assigned_tickets, " tickets assign\u00E9s"] })] }, admin.id))) })] }) }))] }));
    }
    // Vue liste tickets
    return (_jsxs("div", { className: "min-h-screen bg-[#0b1220] p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Centre de Support" }), _jsx("p", { className: "text-slate-400 mt-1", children: "G\u00E9rer les tickets et assistance utilisateurs" })] }), _jsxs("button", { onClick: () => { loadTickets(); loadStats(); }, className: "flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), "Actualiser"] })] }), stats && (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4", children: [_jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-slate-400", children: "Total" }), _jsx(MessageSquare, { className: "w-5 h-5 text-slate-500" })] }), _jsx("p", { className: "text-2xl font-bold text-white", children: stats.overview.total })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-slate-400", children: "Ouverts" }), _jsx(Clock, { className: "w-5 h-5 text-blue-400" })] }), _jsx("p", { className: "text-2xl font-bold text-blue-400", children: stats.overview.open })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-slate-400", children: "Non assign\u00E9s" }), _jsx(AlertCircle, { className: "w-5 h-5 text-orange-400" })] }), _jsx("p", { className: "text-2xl font-bold text-orange-400", children: stats.overview.unassigned })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-slate-400", children: "Non lus" }), _jsx(MessageSquare, { className: "w-5 h-5 text-red-400" })] }), _jsx("p", { className: "text-2xl font-bold text-red-400", children: stats.overview.unread })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-slate-400", children: "R\u00E9solus (7j)" }), _jsx(CheckCircle, { className: "w-5 h-5 text-green-400" })] }), _jsx("p", { className: "text-2xl font-bold text-green-400", children: stats.overview.resolved_this_week })] }), _jsxs("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-slate-400", children: "Nouveaux (7j)" }), _jsx(ArrowUp, { className: "w-5 h-5 text-sky-400" })] }), _jsx("p", { className: "text-2xl font-bold text-sky-400", children: stats.overview.new_this_week })] })] })), _jsx("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl p-4", children: _jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [_jsxs("div", { className: "relative flex-1 min-w-[200px]", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Rechercher...", className: "w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500" })] }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500", children: [_jsx("option", { value: "", children: "Tous les statuts" }), _jsx("option", { value: "open", children: "Ouverts" }), _jsx("option", { value: "in_progress", children: "En cours" }), _jsx("option", { value: "waiting_user", children: "En attente" }), _jsx("option", { value: "resolved", children: "R\u00E9solus" }), _jsx("option", { value: "closed", children: "Cl\u00F4tur\u00E9s" })] }), _jsxs("select", { value: filterPriority, onChange: (e) => setFilterPriority(e.target.value), className: "px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500", children: [_jsx("option", { value: "", children: "Toutes priorit\u00E9s" }), _jsx("option", { value: "urgent", children: "Urgente" }), _jsx("option", { value: "high", children: "Haute" }), _jsx("option", { value: "medium", children: "Moyenne" }), _jsx("option", { value: "low", children: "Basse" })] }), _jsxs("select", { value: filterCategory, onChange: (e) => setFilterCategory(e.target.value), className: "px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500", children: [_jsx("option", { value: "", children: "Toutes cat\u00E9gories" }), _jsx("option", { value: "general", children: "Question g\u00E9n\u00E9rale" }), _jsx("option", { value: "account", children: "Mon compte" }), _jsx("option", { value: "score", children: "Score TERAS" }), _jsx("option", { value: "kyc", children: "V\u00E9rification KYC" }), _jsx("option", { value: "credit", children: "Cr\u00E9dit / Pr\u00EAt" }), _jsx("option", { value: "technical", children: "Probl\u00E8me technique" }), _jsx("option", { value: "billing", children: "Facturation" })] }), _jsxs("select", { value: filterAssigned, onChange: (e) => setFilterAssigned(e.target.value), className: "px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500", children: [_jsx("option", { value: "", children: "Tous" }), _jsx("option", { value: "unassigned", children: "Non assign\u00E9s" }), _jsx("option", { value: "me", children: "Mes tickets" })] })] }) }), _jsx("div", { className: "bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden", children: loading ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx(RefreshCw, { className: "w-8 h-8 mx-auto animate-spin text-sky-400" }), _jsx("p", { className: "mt-3 text-slate-400", children: "Chargement..." })] })) : tickets.length === 0 ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx(MessageSquare, { className: "w-16 h-16 mx-auto mb-3 text-slate-600" }), _jsx("p", { className: "text-slate-400", children: "Aucun ticket trouv\u00E9" })] })) : (_jsx("div", { className: "divide-y divide-slate-700/50", children: tickets.map((ticket) => (_jsx("div", { onClick: () => loadTicketDetail(ticket.id), className: `p-4 hover:bg-slate-800/30 cursor-pointer transition-colors ${!ticket.is_read ? 'bg-sky-900/10' : ''}`, children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-xs font-mono text-slate-500", children: ticket.ticket_number }), _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`, children: ticket.status_display }), _jsxs("span", { className: `flex items-center gap-1 text-xs font-medium ${getPriorityColor(ticket.priority)}`, children: [getPriorityIcon(ticket.priority), ticket.priority_display] }), !ticket.is_read && (_jsx("span", { className: "w-2 h-2 rounded-full bg-sky-400" }))] }), _jsx("h3", { className: "font-semibold text-white truncate", children: ticket.subject }), _jsxs("div", { className: "flex items-center gap-4 mt-2 text-sm text-slate-500", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(User, { className: "w-3 h-3" }), ticket.user?.name] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(MessageSquare, { className: "w-3 h-3" }), ticket.message_count] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), new Date(ticket.updated_at).toLocaleDateString('fr-FR')] }), ticket.assigned_to && (_jsxs("span", { className: "text-sky-400", children: ["\u2192 ", ticket.assigned_to.name] }))] })] }), _jsx("span", { className: "px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded", children: ticket.category_display })] }) }, ticket.id))) })) })] }));
}

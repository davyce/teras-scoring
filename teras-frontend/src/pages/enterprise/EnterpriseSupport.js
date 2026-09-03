import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
/**
 * EnterpriseSupport.tsx - Support Technique TERAS Entreprise
 * CONNEXION ADMIN: Tickets synchronisés avec AdminSupport
 */
import enterpriseApi from "../../services/enterpriseApi";
import { useState, useEffect } from 'react';
import { MessageSquare, Send, AlertCircle, CheckCircle, Clock, Loader2, Search, Plus, X, Upload, FileText, User, Calendar } from 'lucide-react';
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
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    // New ticket form
    const [newTicket, setNewTicket] = useState({
        subject: '',
        category: 'technique',
        priority: 'medium',
        message: '',
    });
    const [uploadedFiles, setUploadedFiles] = useState([]);
    // Reply
    const [replyMessage, setReplyMessage] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    useEffect(() => {
        loadTickets();
    }, []);
    const syncSelectedTicket = (nextTickets) => {
        if (!nextTickets.length) {
            setSelectedTicket(null);
            return;
        }
        setSelectedTicket((current) => {
            if (!current)
                return nextTickets[0];
            return nextTickets.find((ticket) => ticket.id === current.id) || nextTickets[0];
        });
    };
    const loadTickets = async () => {
        try {
            setLoading(true);
            const response = await enterpriseApi.getTickets();
            const normalizedTickets = (response || []).map((ticket) => ({
                ...ticket,
                messages: ticket.messages || [],
                attachments: ticket.attachments || [],
            }));
            setTickets(normalizedTickets);
            syncSelectedTicket(normalizedTickets);
        }
        catch (error) {
            console.error('Erreur chargement tickets:', error);
            setTickets([]);
            setSelectedTicket(null);
            alert('Impossible de charger les tickets de support.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreateTicket = async (e) => {
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
        }
        catch (error) {
            alert('Erreur création ticket');
        }
    };
    const handleSendReply = async () => {
        if (!selectedTicket || !replyMessage.trim())
            return;
        try {
            setSendingReply(true);
            const sentMessage = await enterpriseApi.replyTicket(selectedTicket.id, replyMessage);
            // Mock: Ajouter message localement
            const newMessage = {
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
            setTickets((prev) => prev.map((ticket) => (ticket.id === selectedTicket.id
                ? { ...ticket, messages: [...ticket.messages, sentMessage || newMessage], status: 'open' }
                : ticket)));
            setReplyMessage('');
            alert('Réponse envoyée !');
        }
        catch (error) {
            alert('Erreur envoi réponse');
        }
        finally {
            setSendingReply(false);
        }
    };
    const handleFileUpload = (e) => {
        if (e.target.files) {
            setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]);
        }
    };
    const removeFile = (index) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    };
    const filteredTickets = tickets.filter((ticket) => {
        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
        const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.id.toString().includes(searchQuery);
        return matchesStatus && matchesSearch;
    });
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-slate-950 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(Loader2, { className: "w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Chargement des tickets..." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-slate-950 p-6", children: [_jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white mb-2", children: "Support Technique" }), _jsxs("p", { className: "text-slate-400", children: [tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length, " ticket(s) actif(s)"] })] }), _jsxs("button", { onClick: () => setShowNewTicketModal(true), className: "flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium", children: [_jsx(Plus, { className: "w-5 h-5" }), "Nouveau ticket"] })] }), _jsx("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6", children: _jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Rechercher par sujet ou #ID...", className: "w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500" })] }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500", children: [_jsx("option", { value: "all", children: "Tous les statuts" }), Object.entries(STATUS_CONFIG).map(([value, config]) => (_jsx("option", { value: value, children: config.label }, value)))] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-1 space-y-3", children: filteredTickets.length === 0 ? (_jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-12 text-center", children: [_jsx(MessageSquare, { className: "w-16 h-16 text-slate-600 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Aucun ticket trouv\u00E9" })] })) : (filteredTickets.map((ticket) => {
                                    const statusConfig = STATUS_CONFIG[ticket.status];
                                    const StatusIcon = statusConfig.icon;
                                    const isSelected = selectedTicket?.id === ticket.id;
                                    return (_jsxs("button", { onClick: () => setSelectedTicket(ticket), className: `w-full text-left p-4 rounded-xl border transition-all ${isSelected
                                            ? 'bg-slate-800 border-cyan-500'
                                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`, children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsxs("span", { className: "text-xs text-slate-500", children: ["#", ticket.id] }), _jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium ${ticket.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                                                            ticket.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                                                                ticket.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                                                                                    'bg-slate-500/20 text-slate-400'}`, children: PRIORITIES.find(p => p.value === ticket.priority)?.label })] }), _jsx("h3", { className: "font-semibold text-white text-sm mb-1 line-clamp-2", children: ticket.subject }), _jsx("p", { className: "text-xs text-slate-500", children: new Date(ticket.created_at).toLocaleDateString('fr-FR') })] }), _jsx("div", { className: `p-2 rounded-lg ${statusConfig.color === 'blue' ? 'bg-blue-500/20' :
                                                            statusConfig.color === 'amber' ? 'bg-amber-500/20' :
                                                                statusConfig.color === 'purple' ? 'bg-purple-500/20' :
                                                                    statusConfig.color === 'green' ? 'bg-green-500/20' :
                                                                        'bg-slate-500/20'}`, children: _jsx(StatusIcon, { className: `w-4 h-4 ${statusConfig.color === 'blue' ? 'text-blue-400' :
                                                                statusConfig.color === 'amber' ? 'text-amber-400' :
                                                                    statusConfig.color === 'purple' ? 'text-purple-400' :
                                                                        statusConfig.color === 'green' ? 'text-green-400' :
                                                                            'text-slate-400'}` }) })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500", children: [_jsx("span", { className: `px-2 py-0.5 rounded ${ticket.category === 'technique' ? 'bg-blue-500/10 text-blue-400' :
                                                            ticket.category === 'facturation' ? 'bg-green-500/10 text-green-400' :
                                                                ticket.category === 'score' ? 'bg-purple-500/10 text-purple-400' :
                                                                    ticket.category === 'documents' ? 'bg-amber-500/10 text-amber-400' :
                                                                        'bg-slate-500/10 text-slate-400'}`, children: CATEGORIES.find(c => c.value === ticket.category)?.label }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [ticket.messages?.length || 0, " message(s)"] })] })] }, ticket.id));
                                })) }), _jsx("div", { className: "lg:col-span-2", children: !selectedTicket ? (_jsx("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-12 text-center h-full flex items-center justify-center", children: _jsxs("div", { children: [_jsx(MessageSquare, { className: "w-16 h-16 text-slate-600 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "S\u00E9lectionnez un ticket pour voir les d\u00E9tails" })] }) })) : (_jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-280px)]", children: [_jsx("div", { className: "p-6 border-b border-slate-800", children: _jsx("div", { className: "flex items-start justify-between gap-4 mb-4", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsxs("span", { className: "text-sm text-slate-500", children: ["Ticket #", selectedTicket.id] }), _jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium ${STATUS_CONFIG[selectedTicket.status].color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                                                                        STATUS_CONFIG[selectedTicket.status].color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                                                            STATUS_CONFIG[selectedTicket.status].color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                                                                                STATUS_CONFIG[selectedTicket.status].color === 'green' ? 'bg-green-500/20 text-green-400' :
                                                                                    'bg-slate-500/20 text-slate-400'}`, children: STATUS_CONFIG[selectedTicket.status].label })] }), _jsx("h2", { className: "text-xl font-bold text-white mb-2", children: selectedTicket.subject }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-slate-400", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "w-4 h-4" }), _jsx("span", { children: new Date(selectedTicket.created_at).toLocaleDateString('fr-FR') })] }), selectedTicket.assigned_to && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(User, { className: "w-4 h-4" }), _jsx("span", { children: selectedTicket.assigned_to })] }))] })] }) }) }), _jsx("div", { className: "flex-1 overflow-y-auto p-6 space-y-4", children: selectedTicket.messages.map((message) => (_jsx("div", { className: `flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsx("div", { className: `max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [message.sender === 'admin' && (_jsx("div", { className: "bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg flex-shrink-0", children: _jsx(User, { className: "w-4 h-4 text-white" }) })), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: `rounded-xl px-4 py-3 ${message.sender === 'user'
                                                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                                                            : 'bg-slate-800 text-slate-200 border border-slate-700'}`, children: [_jsx("p", { className: "text-xs font-medium mb-1 opacity-75", children: message.sender_name }), _jsx("p", { className: "text-sm whitespace-pre-wrap", children: message.message })] }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: new Date(message.created_at).toLocaleString('fr-FR') })] }), message.sender === 'user' && (_jsx("div", { className: "bg-cyan-500 p-2 rounded-lg flex-shrink-0", children: _jsx(User, { className: "w-4 h-4 text-white" }) }))] }) }) }, message.id))) }), selectedTicket.status !== 'closed' && (_jsx("div", { className: "p-4 border-t border-slate-800", children: _jsxs("div", { className: "flex gap-3", children: [_jsx("textarea", { value: replyMessage, onChange: (e) => setReplyMessage(e.target.value), placeholder: "Tapez votre r\u00E9ponse...", rows: 2, className: "flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none" }), _jsx("button", { onClick: handleSendReply, disabled: !replyMessage.trim() || sendingReply, className: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2", children: sendingReply ? (_jsx(Loader2, { className: "w-5 h-5 animate-spin" })) : (_jsx(Send, { className: "w-5 h-5" })) })] }) }))] })) })] })] }), showNewTicketModal && (_jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "p-6 border-b border-slate-800 flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Cr\u00E9er un ticket de support" }), _jsx("button", { onClick: () => setShowNewTicketModal(false), className: "text-slate-400 hover:text-white transition-colors", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("form", { onSubmit: handleCreateTicket, className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Sujet *" }), _jsx("input", { type: "text", value: newTicket.subject, onChange: (e) => setNewTicket({ ...newTicket, subject: e.target.value }), required: true, className: "w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500", placeholder: "D\u00E9crivez bri\u00E8vement votre probl\u00E8me" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Cat\u00E9gorie" }), _jsx("select", { value: newTicket.category, onChange: (e) => setNewTicket({ ...newTicket, category: e.target.value }), className: "w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500", children: CATEGORIES.map((cat) => (_jsx("option", { value: cat.value, children: cat.label }, cat.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Priorit\u00E9" }), _jsx("select", { value: newTicket.priority, onChange: (e) => setNewTicket({ ...newTicket, priority: e.target.value }), className: "w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500", children: PRIORITIES.map((pri) => (_jsx("option", { value: pri.value, children: pri.label }, pri.value))) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Description *" }), _jsx("textarea", { value: newTicket.message, onChange: (e) => setNewTicket({ ...newTicket, message: e.target.value }), required: true, rows: 5, className: "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none", placeholder: "D\u00E9crivez votre probl\u00E8me en d\u00E9tail..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Pi\u00E8ces jointes (optionnel)" }), _jsxs("div", { className: "border-2 border-dashed border-slate-700 rounded-lg p-4 text-center", children: [_jsx("input", { type: "file", onChange: handleFileUpload, multiple: true, className: "hidden", id: "file-upload" }), _jsxs("label", { htmlFor: "file-upload", className: "cursor-pointer flex flex-col items-center gap-2", children: [_jsx(Upload, { className: "w-8 h-8 text-slate-500" }), _jsx("p", { className: "text-sm text-slate-400", children: "Cliquez pour ajouter des fichiers" }), _jsx("p", { className: "text-xs text-slate-600", children: "PDF, images (max 10MB par fichier)" })] })] }), uploadedFiles.length > 0 && (_jsx("div", { className: "mt-3 space-y-2", children: uploadedFiles.map((file, index) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-slate-800 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FileText, { className: "w-4 h-4 text-cyan-400" }), _jsx("span", { className: "text-sm text-white", children: file.name }), _jsxs("span", { className: "text-xs text-slate-500", children: ["(", (file.size / 1024).toFixed(1), " KB)"] })] }), _jsx("button", { type: "button", onClick: () => removeFile(index), className: "text-red-400 hover:text-red-300", children: _jsx(X, { className: "w-4 h-4" }) })] }, index))) }))] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { type: "submit", className: "flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium", children: "Cr\u00E9er le ticket" }), _jsx("button", { type: "button", onClick: () => setShowNewTicketModal(false), className: "px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-all", children: "Annuler" })] })] })] }) }))] }));
}

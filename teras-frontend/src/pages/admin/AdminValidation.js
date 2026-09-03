import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { authFetch } from '../../utils/authFetch';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, FileText, User, Filter } from 'lucide-react';
export default function AdminValidation() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [showModal, setShowModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    useEffect(() => {
        loadRequests();
    }, []);
    const loadRequests = async () => {
        try {
            setLoading(true);
            const res = await authFetch('/api/scoring/admin/kyc/requests/');
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : (data.requests ?? []));
            setLoading(false);
        }
        catch (error) {
            console.error('Erreur:', error);
            setLoading(false);
        }
    };
    const handleApprove = async (id) => {
        if (!confirm('Approuver cette demande ?'))
            return;
        try {
            const res = await authFetch(`/api/scoring/admin/kyc/requests/${id}/approve/`, { method: 'POST' });
            if (res.ok)
                loadRequests();
        }
        catch (e) {
            console.error(e);
        }
    };
    const handleReject = async (id) => {
        const reason = prompt('Raison du rejet :');
        if (!reason)
            return;
        try {
            const res = await authFetch(`/api/scoring/admin/kyc/requests/${id}/reject/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });
            if (res.ok)
                loadRequests();
        }
        catch (e) {
            console.error(e);
        }
    };
    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
            approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
            rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        };
        return colors[status];
    };
    const filteredRequests = requests.filter((request) => {
        if (filterStatus === 'all')
            return true;
        return request.status === filterStatus;
    });
    const stats = {
        pending: requests.filter((r) => r.status === 'pending').length,
        approved: requests.filter((r) => r.status === 'approved').length,
        rejected: requests.filter((r) => r.status === 'rejected').length,
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Chargement des demandes..." })] }) }));
    }
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Validation Documents" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-1", children: "G\u00E9rer les demandes de validation KYC" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "En attente" }), _jsx(Clock, { className: "w-5 h-5 text-yellow-600 dark:text-yellow-400" })] }), _jsx("p", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: stats.pending })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "Approuv\u00E9s" }), _jsx(CheckCircle, { className: "w-5 h-5 text-green-600 dark:text-green-400" })] }), _jsx("p", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: stats.approved })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "Rejet\u00E9s" }), _jsx(XCircle, { className: "w-5 h-5 text-red-600 dark:text-red-400" })] }), _jsx("p", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: stats.rejected })] })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { className: "w-5 h-5 text-gray-400" }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white", children: [_jsx("option", { value: "all", children: "Tous les statuts" }), _jsx("option", { value: "pending", children: "En attente" }), _jsx("option", { value: "approved", children: "Approuv\u00E9s" }), _jsx("option", { value: "rejected", children: "Rejet\u00E9s" })] })] }) }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700", children: [_jsx("div", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: filteredRequests.map((request) => (_jsx("div", { className: "p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("span", { className: "text-xs font-medium text-gray-500 dark:text-gray-400", children: request.id }), _jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`, children: request.status === 'pending' ? 'En attente' :
                                                            request.status === 'approved' ? 'Approuvé' : 'Rejeté' })] }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: request.documentType }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(User, { className: "w-4 h-4" }), request.userName] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-4 h-4" }), new Date(request.submittedAt).toLocaleString('fr-FR')] })] })] }), request.status === 'pending' && (_jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => {
                                                    setSelectedRequest(request);
                                                    setShowModal(true);
                                                }, className: "px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2", children: [_jsx(Eye, { className: "w-4 h-4" }), "Voir"] }), _jsxs("button", { onClick: () => handleApprove(request.id), className: "px-3 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), "Approuver"] }), _jsxs("button", { onClick: () => handleReject(request.id), className: "px-3 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center gap-2", children: [_jsx(XCircle, { className: "w-4 h-4" }), "Rejeter"] })] }))] }) }, request.id))) }), filteredRequests.length === 0 && (_jsxs("div", { className: "p-12 text-center", children: [_jsx(FileText, { className: "w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Aucune demande trouv\u00E9e" })] }))] }), showModal && selectedRequest && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: _jsx("h3", { className: "text-xl font-bold text-gray-900 dark:text-white", children: "D\u00E9tails de la demande" }) }), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Type de document" }), _jsx("p", { className: "text-lg font-medium text-gray-900 dark:text-white", children: selectedRequest.documentType })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Utilisateur" }), _jsx("p", { className: "text-lg font-medium text-gray-900 dark:text-white", children: selectedRequest.userName })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Date de soumission" }), _jsx("p", { className: "text-lg font-medium text-gray-900 dark:text-white", children: new Date(selectedRequest.submittedAt).toLocaleString('fr-FR') })] })] }), _jsx("div", { className: "mt-6 flex gap-3", children: _jsx("button", { onClick: () => setShowModal(false), className: "flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700", children: "Fermer" }) })] })] }) }))] }));
}

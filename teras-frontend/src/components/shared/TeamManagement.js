import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/shared/TeamManagement.tsx
// Gestion d'équipe avec rôles et permissions — Banque / Entreprise / Gouvernement
import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, CheckCircle, AlertCircle, Loader2, X, Shield, Save, ChevronDown, ChevronUp, Mail, Phone, RefreshCw, } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
// ─── Config permissions ────────────────────────────────────────────────────────
const PERMISSION_GROUPS = {
    'Clients & Dossiers': [
        { key: 'can_view_clients', label: 'Voir les clients', description: 'Accéder à la liste et aux fiches clients', group: 'Clients & Dossiers' },
        { key: 'can_create_clients', label: 'Créer des clients', description: 'Ajouter de nouveaux clients', group: 'Clients & Dossiers' },
        { key: 'can_edit_clients', label: 'Modifier les clients', description: 'Mettre à jour les informations clients', group: 'Clients & Dossiers' },
        { key: 'can_delete_clients', label: 'Supprimer des clients', description: 'Supprimer des fiches clients', group: 'Clients & Dossiers' },
    ],
    'Crédits & Financement': [
        { key: 'can_approve_loans', label: 'Approuver les crédits', description: 'Valider les demandes de crédit', group: 'Crédits & Financement' },
        { key: 'can_reject_loans', label: 'Rejeter les crédits', description: 'Refuser des demandes de crédit', group: 'Crédits & Financement' },
    ],
    'Analytics & Rapports': [
        { key: 'can_view_analytics', label: 'Voir les statistiques', description: 'Accéder aux tableaux de bord et KPIs', group: 'Analytics & Rapports' },
        { key: 'can_view_reports', label: 'Voir les rapports', description: 'Consulter les rapports générés', group: 'Analytics & Rapports' },
        { key: 'can_generate_reports', label: 'Générer des rapports IA', description: 'Lancer la génération de rapports IA', group: 'Analytics & Rapports' },
        { key: 'can_export_data', label: 'Exporter les données', description: 'Télécharger des exports CSV/PDF', group: 'Analytics & Rapports' },
    ],
    'Documents': [
        { key: 'can_view_documents', label: 'Voir les documents', description: 'Accéder aux documents uploadés', group: 'Documents' },
        { key: 'can_upload_documents', label: 'Uploader des documents', description: 'Importer des documents dans le système', group: 'Documents' },
    ],
    'Administration': [
        { key: 'can_manage_team', label: 'Gérer l\'équipe', description: 'Inviter et gérer les membres du personnel', group: 'Administration' },
    ],
};
// Couleurs par statut
const STATUS_COLORS = {
    active: 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/40',
    inactive: 'bg-slate-800 text-slate-400',
    pending: 'bg-amber-900/30 text-amber-400 border border-amber-700/40',
    suspended: 'bg-rose-900/30 text-rose-400 border border-rose-700/40',
};
const STATUS_LABELS = {
    active: 'Actif', inactive: 'Inactif', pending: 'En attente', suspended: 'Suspendu',
};
// ─── Modal : Inviter un membre ────────────────────────────────────────────────
function InviteModal({ interface: iface, roles, onClose, onSuccess }) {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState(roles[0]?.value || '');
    const [customPerms, setCustomPerms] = useState({});
    const [showCustomPerms, setShowCustomPerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleInvite = async () => {
        if (!email) {
            setError('Email requis.');
            return;
        }
        if (!role) {
            setError('Rôle requis.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await authFetch('/api/scoring/staff/invite/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email, first_name: firstName, last_name: lastName, phone,
                    role, interface: iface,
                    permissions: customPerms,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                onSuccess();
                onClose();
            }
            else
                setError(data.error || 'Erreur invitation.');
        }
        catch {
            setError('Erreur réseau.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto", onClick: e => e.target === e.currentTarget && onClose(), children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md my-4", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-slate-800", children: [_jsxs("h3", { className: "text-white font-bold flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4 text-sky-400" }), " Inviter un collaborateur"] }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "p-5 space-y-4", children: [error && (_jsxs("div", { className: "flex items-center gap-2 px-3 py-2 bg-rose-900/20 border border-rose-700/40 rounded-xl text-rose-300 text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), error] })), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-sm mb-1.5 block", children: "Pr\u00E9nom" }), _jsx("input", { value: firstName, onChange: e => setFirstName(e.target.value), placeholder: "Marie", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-sm mb-1.5 block", children: "Nom" }), _jsx("input", { value: lastName, onChange: e => setLastName(e.target.value), placeholder: "Ngouabi", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "text-slate-300 text-sm mb-1.5 block", children: ["Email * ", _jsx("span", { className: "text-slate-500 font-normal", children: "(doit avoir un compte TERAS ou recevra une invitation)" })] }), _jsx("input", { value: email, onChange: e => setEmail(e.target.value), placeholder: "collaborateur@institution.cd", type: "email", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-sm mb-1.5 block", children: "T\u00E9l\u00E9phone" }), _jsx("input", { value: phone, onChange: e => setPhone(e.target.value), placeholder: "+242 06 XXX XXXX", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-sm mb-1.5 block", children: "R\u00F4le *" }), _jsx("select", { value: role, onChange: e => setRole(e.target.value), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500", children: roles.map(r => (_jsxs("option", { value: r.value, children: [r.label, " \u2014 ", r.description] }, r.value))) })] }), _jsxs("div", { children: [_jsxs("button", { onClick: () => setShowCustomPerms(!showCustomPerms), className: "flex items-center gap-2 text-sm text-slate-400 hover:text-white transition", children: [showCustomPerms ? _jsx(ChevronUp, { className: "w-4 h-4" }) : _jsx(ChevronDown, { className: "w-4 h-4" }), "Personnaliser les permissions (optionnel)"] }), showCustomPerms && (_jsx("div", { className: "mt-3 space-y-3 max-h-48 overflow-y-auto bg-slate-800/40 rounded-xl p-3", children: Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (_jsxs("div", { children: [_jsx("p", { className: "text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5", children: group }), _jsx("div", { className: "space-y-1.5", children: perms.map(perm => (_jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: customPerms[perm.key] !== undefined ? !!customPerms[perm.key] : false, onChange: e => setCustomPerms(p => ({ ...p, [perm.key]: e.target.checked })), className: "w-3.5 h-3.5 accent-sky-500" }), _jsx("span", { className: "text-slate-300 text-xs", children: perm.label })] }, perm.key))) })] }, group))) }))] }), _jsxs("div", { className: "flex gap-3 pt-1", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition", children: "Annuler" }), _jsx("button", { onClick: handleInvite, disabled: loading, className: "flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2", children: loading ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " Invitation..."] })
                                        : _jsxs(_Fragment, { children: [_jsx(Users, { className: "w-4 h-4" }), " Inviter"] }) })] })] })] }) }));
}
// ─── Modal : Modifier permissions ────────────────────────────────────────────
function EditPermissionsModal({ member, roles, onClose, onSuccess }) {
    const [role, setRole] = useState(member.role);
    const [perms, setPerms] = useState({ ...member.permissions });
    const [status, setStatus] = useState(member.status);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const handleSave = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await authFetch(`/api/scoring/staff/${member.id}/permissions/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, permissions: perms, status }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('✅ Permissions mises à jour.');
                setTimeout(() => { onSuccess(); onClose(); }, 1200);
            }
            else
                setError(data.error || 'Erreur.');
        }
        catch {
            setError('Erreur réseau.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto", onClick: e => e.target === e.currentTarget && onClose(), children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg my-4", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-slate-800", children: [_jsxs("h3", { className: "text-white font-bold flex items-center gap-2", children: [_jsx(Shield, { className: "w-4 h-4 text-violet-400" }), " Modifier les acc\u00E8s \u2014 ", member.full_name] }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "p-5 space-y-4 max-h-[70vh] overflow-y-auto", children: [error && _jsxs("div", { className: "flex items-center gap-2 px-3 py-2 bg-rose-900/20 border border-rose-700/40 rounded-xl text-rose-300 text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), error] }), success && _jsxs("div", { className: "flex items-center gap-2 px-3 py-2 bg-emerald-900/20 border border-emerald-700/40 rounded-xl text-emerald-300 text-sm", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), success] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-sm mb-1.5 block", children: "R\u00F4le" }), _jsx("select", { value: role, onChange: e => setRole(e.target.value), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500", children: roles.map(r => _jsx("option", { value: r.value, children: r.label }, r.value)) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-sm mb-1.5 block", children: "Statut" }), _jsxs("select", { value: status, onChange: e => setStatus(e.target.value), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500", children: [_jsx("option", { value: "active", children: "Actif" }), _jsx("option", { value: "inactive", children: "Inactif" }), _jsx("option", { value: "suspended", children: "Suspendu" })] })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm font-medium mb-3", children: "Permissions individuelles" }), _jsxs("div", { className: "space-y-4", children: [Object.entries(PERMISSION_GROUPS).map(([group, groupPerms]) => (_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-3", children: [_jsx("p", { className: "text-slate-400 text-xs font-bold uppercase tracking-wider mb-2", children: group }), _jsx("div", { className: "space-y-2", children: groupPerms.map(perm => (_jsxs("label", { className: "flex items-start gap-2.5 cursor-pointer group", children: [_jsx("input", { type: "checkbox", checked: !!perms[perm.key], onChange: e => setPerms(p => ({ ...p, [perm.key]: e.target.checked })), className: "mt-0.5 w-4 h-4 accent-sky-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-white text-xs font-medium group-hover:text-sky-300 transition", children: perm.label }), _jsx("p", { className: "text-slate-500 text-xs", children: perm.description })] })] }, perm.key))) })] }, group))), 'max_loan_amount' in perms && (_jsxs("div", { className: "bg-slate-800/40 rounded-xl p-3", children: [_jsx("p", { className: "text-slate-400 text-xs font-bold uppercase tracking-wider mb-2", children: "Limites" }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-300 text-xs mb-1 block", children: "Montant maximum cr\u00E9dit autoris\u00E9 (FCFA)" }), _jsx("input", { type: "number", value: Number(perms.max_loan_amount) || 0, onChange: e => setPerms(p => ({ ...p, max_loan_amount: parseInt(e.target.value) || 0 })), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500" }), _jsx("p", { className: "text-slate-500 text-xs mt-1", children: "0 = pas de limite" })] })] }))] })] })] }), _jsxs("div", { className: "px-5 py-4 border-t border-slate-800 flex gap-3", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition", children: "Annuler" }), _jsx("button", { onClick: handleSave, disabled: loading, className: "flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2", children: loading ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " Sauvegarde..."] })
                                : _jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4" }), " Enregistrer"] }) })] })] }) }));
}
export default function TeamManagement({ interface: iface, title }) {
    const [staff, setStaff] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const fetchStaff = useCallback(async () => {
        try {
            const res = await authFetch(`/api/scoring/staff/list/?interface=${iface}`);
            const data = await res.json();
            setStaff(data.staff || []);
            setRoles(data.roles || []);
        }
        catch {
            setError('Erreur chargement équipe.');
        }
        finally {
            setLoading(false);
        }
    }, [iface]);
    useEffect(() => { fetchStaff(); }, [fetchStaff]);
    const handleRemove = async (id, name) => {
        if (!confirm(`Retirer ${name} de l'équipe ?`))
            return;
        try {
            await authFetch(`/api/scoring/staff/${id}/remove/`, { method: 'DELETE' });
            setSuccessMsg(`${name} retiré de l'équipe.`);
            fetchStaff();
        }
        catch {
            setError('Erreur suppression.');
        }
        setTimeout(() => setSuccessMsg(''), 4000);
    };
    const INTERFACE_LABELS = {
        bank: { title: 'Équipe Bancaire', color: 'text-emerald-400' },
        enterprise: { title: 'Équipe Entreprise', color: 'text-violet-400' },
        government: { title: 'Équipe Gouvernement', color: 'text-amber-400' },
    };
    const cfg = INTERFACE_LABELS[iface] || { title: 'Équipe', color: 'text-sky-400' };
    return (_jsxs("div", { className: "space-y-6", children: [showInvite && (_jsx(InviteModal, { interface: iface, roles: roles, onClose: () => setShowInvite(false), onSuccess: () => { fetchStaff(); setSuccessMsg('Invitation envoyée.'); setTimeout(() => setSuccessMsg(''), 4000); } })), editingMember && (_jsx(EditPermissionsModal, { member: editingMember, roles: roles, onClose: () => setEditingMember(null), onSuccess: fetchStaff })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: `text-2xl font-bold text-white`, children: title || cfg.title }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "G\u00E9rez les acc\u00E8s et permissions de votre \u00E9quipe \u2014 modifiables \u00E0 tout moment" })] }), _jsxs("button", { onClick: () => setShowInvite(true), className: "flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-semibold transition", children: [_jsx(Plus, { className: "w-4 h-4" }), " Inviter un membre"] })] }), successMsg && (_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-700/40 rounded-xl", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400 shrink-0" }), _jsx("p", { className: "text-emerald-300 text-sm", children: successMsg }), _jsx("button", { onClick: () => setSuccessMsg(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-emerald-500" }) })] })), error && (_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-rose-400 shrink-0" }), _jsx("p", { className: "text-rose-300 text-sm", children: error }), _jsx("button", { onClick: () => setError(''), className: "ml-auto", children: _jsx(X, { className: "w-4 h-4 text-rose-500" }) })] })), roles.length > 0 && (_jsxs("div", { className: "bg-slate-900/40 border border-slate-800 rounded-xl p-4", children: [_jsx("p", { className: "text-slate-400 text-xs font-medium uppercase tracking-wider mb-3", children: "R\u00F4les disponibles" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: roles.map(r => (_jsxs("div", { className: "flex items-start gap-2 text-xs", children: [_jsx(Shield, { className: "w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("span", { className: "text-white font-medium", children: r.label }), _jsxs("span", { className: "text-slate-500 ml-1", children: ["\u2014 ", r.description] })] })] }, r.value))) })] })), loading ? (_jsxs("div", { className: "flex items-center justify-center py-10", children: [_jsx(Loader2, { className: "w-5 h-5 text-sky-400 animate-spin mr-2" }), _jsx("span", { className: "text-slate-400", children: "Chargement..." })] })) : staff.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl", children: [_jsx(Users, { className: "w-12 h-12 text-slate-700 mx-auto mb-3" }), _jsx("p", { className: "text-slate-500 font-medium", children: "Aucun membre dans l'\u00E9quipe" }), _jsx("p", { className: "text-slate-600 text-sm mt-1 mb-4", children: "Invitez des collaborateurs pour d\u00E9l\u00E9guer les acc\u00E8s \u00E0 votre interface TERAS" }), _jsx("button", { onClick: () => setShowInvite(true), className: "px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-400 rounded-xl text-sm transition", children: "+ Inviter mon premier collaborateur" })] })) : (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between text-slate-400 text-sm px-1", children: [_jsxs("span", { children: [staff.length, " membre", staff.length > 1 ? 's' : ''] }), _jsx("button", { onClick: fetchStaff, className: "hover:text-white transition", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] }), staff.map(member => (_jsxs("div", { className: `border rounded-2xl p-4 transition-all ${member.status === 'suspended' ? 'border-rose-800/40 bg-rose-900/5'
                            : member.status === 'pending' ? 'border-amber-800/40 bg-amber-900/5'
                                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`, children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm ${member.status === 'active' ? 'bg-gradient-to-br from-sky-600 to-blue-700'
                                            : 'bg-slate-700'}`, children: (member.first_name || member.email).charAt(0).toUpperCase() }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("p", { className: "text-white font-semibold text-sm", children: member.full_name }), _jsx("span", { className: `px-2 py-0.5 rounded-lg text-xs ${STATUS_COLORS[member.status] || STATUS_COLORS.inactive}`, children: STATUS_LABELS[member.status] || member.status }), _jsx("span", { className: "px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-lg border border-slate-700", children: member.role_label })] }), _jsxs("p", { className: "text-slate-400 text-xs mt-0.5 flex items-center gap-2", children: [_jsx(Mail, { className: "w-3 h-3" }), " ", member.email, member.phone && _jsxs(_Fragment, { children: [_jsx(Phone, { className: "w-3 h-3 ml-2" }), " ", member.phone] })] }), member.joined_at && (_jsxs("p", { className: "text-slate-600 text-xs mt-0.5", children: ["Rejoint le ", new Date(member.joined_at).toLocaleDateString('fr-FR')] }))] }), _jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [_jsx("button", { onClick: () => setEditingMember(member), title: "Modifier les permissions", className: "p-1.5 text-slate-500 hover:text-violet-400 hover:bg-violet-900/30 rounded-lg transition", children: _jsx(Shield, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleRemove(member.id, member.full_name), className: "p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }), member.is_active && member.permissions && (_jsxs("div", { className: "mt-3 flex flex-wrap gap-1.5", children: [Object.entries(member.permissions)
                                        .filter(([k, v]) => v === true && k.startsWith('can_'))
                                        .slice(0, 5)
                                        .map(([k]) => {
                                        const label = Object.values(PERMISSION_GROUPS).flat().find(p => p.key === k)?.label || k;
                                        return (_jsxs("span", { className: "flex items-center gap-1 px-2 py-0.5 bg-emerald-900/30 border border-emerald-700/30 text-emerald-400 text-xs rounded-lg", children: [_jsx(CheckCircle, { className: "w-2.5 h-2.5" }), " ", label] }, k));
                                    }), Object.values(member.permissions).filter(v => v === true).length > 5 && (_jsxs("span", { className: "px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-lg", children: ["+", Object.values(member.permissions).filter(v => v === true).length - 5, " autres"] })), Number(member.permissions.max_loan_amount) > 0 && (_jsxs("span", { className: "flex items-center gap-1 px-2 py-0.5 bg-sky-900/30 border border-sky-700/30 text-sky-400 text-xs rounded-lg", children: ["\uD83D\uDCB0 Max: ", (Number(member.permissions.max_loan_amount) / 1000).toFixed(0), "k FCFA"] }))] }))] }, member.id)))] }))] }));
}

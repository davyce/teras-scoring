import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Briefcase, Building2, List, Map, MapPin, MoreVertical, Search, Shield, User as UserIcon, UserPlus, Users, } from 'lucide-react';
import AdminUsersMap from '../../components/admin/AdminUsersMap';
import { adminApi } from '../../services/adminApi';
export default function AdminUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [mapUsers, setMapUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterRegion, setFilterRegion] = useState('all');
    const [filterRisk, setFilterRisk] = useState('all');
    const [filterStatus, setFilterStatus] = useState('active');
    const [viewMode, setViewMode] = useState('list');
    useEffect(() => {
        loadUsers();
    }, [filterType, filterRegion, filterStatus]);
    const loadUsers = async () => {
        try {
            setLoading(true);
            const [usersResponse, mapResponse] = await Promise.all([
                adminApi.getUsers({
                    type: filterType !== 'all' ? filterType : undefined,
                    region: filterRegion !== 'all' ? filterRegion : undefined,
                    status: filterStatus !== 'all' ? filterStatus : undefined,
                }),
                adminApi.getUsersMap({
                    type: filterType !== 'all' ? filterType : undefined,
                    region: filterRegion !== 'all' ? filterRegion : undefined,
                    status: filterStatus !== 'all' ? filterStatus : undefined,
                }),
            ]);
            setUsers(usersResponse.data?.users || []);
            setMapUsers(mapResponse.data?.users || []);
        }
        catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
            setUsers([]);
            setMapUsers([]);
        }
        finally {
            setLoading(false);
        }
    };
    const matchesSearchTerm = (user) => {
        const term = searchTerm.trim().toLowerCase();
        if (!term)
            return true;
        return [
            user.username,
            user.email,
            user.first_name,
            user.last_name,
            user.full_name,
            user.region,
            user.city,
            user.address,
        ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(term));
    };
    const matchesRiskLevel = (riskLevel) => {
        if (filterRisk === 'all')
            return true;
        return riskLevel === filterRisk;
    };
    const filteredUsers = users.filter((user) => matchesSearchTerm(user) && matchesRiskLevel(user.risk_level));
    const filteredMapUsers = mapUsers.filter((user) => matchesSearchTerm(user) && matchesRiskLevel(user.risk_level));
    const visibleCount = viewMode === 'map' ? filteredMapUsers.length : filteredUsers.length;
    const uniqueRegions = [...new Set([...users, ...mapUsers].map((u) => u.region).filter(Boolean))];
    const getTypeBadge = (type) => {
        const styles = {
            admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
            individual: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
            enterprise: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
            bank: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
            government: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
        };
        const labels = {
            admin: 'Admin',
            individual: 'Individu',
            enterprise: 'Entreprise',
            bank: 'Banque',
            government: 'Gouvernement',
        };
        return (_jsx("span", { className: `px-3 py-1 rounded-full text-xs font-medium ${styles[type] || styles.individual}`, children: labels[type] || type }));
    };
    const getRiskBadge = (risk) => {
        if (!risk)
            return null;
        const styles = {
            low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
            medium: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
            high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        };
        const labels = { low: 'Faible', medium: 'Moyen', high: 'Élevé' };
        return (_jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${styles[risk]}`, children: labels[risk] }));
    };
    if (loading) {
        return (_jsx("div", { className: "flex h-screen items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Chargement des utilisateurs..." })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Gestion des Utilisateurs \uD83C\uDDE8\uD83C\uDDEC" }), _jsxs("p", { className: "mt-1 text-gray-600 dark:text-gray-400", children: [visibleCount, " utilisateur", visibleCount > 1 ? 's' : '', " affich\u00E9", visibleCount > 1 ? 's' : ''] })] }), _jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center", children: [_jsxs("div", { className: "inline-flex rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800", children: [_jsxs("button", { type: "button", onClick: () => setViewMode('list'), className: `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${viewMode === 'list'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`, children: [_jsx(List, { className: "h-4 w-4" }), "Liste"] }), _jsxs("button", { type: "button", onClick: () => setViewMode('map'), className: `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${viewMode === 'map'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`, children: [_jsx(Map, { className: "h-4 w-4" }), "Carte"] })] }), _jsxs("button", { className: "flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600", children: [_jsx(UserPlus, { className: "h-5 w-5" }), "Nouvel Utilisateur"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5", children: [_jsx("div", { className: "rounded-xl border border-gray-200 border-l-4 border-blue-500 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Users, { className: "h-6 w-6 text-blue-600 dark:text-blue-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Total" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: users.length })] })] }) }), _jsx("div", { className: "rounded-xl border border-gray-200 border-l-4 border-sky-500 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(MapPin, { className: "h-6 w-6 text-sky-600 dark:text-sky-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "G\u00E9olocalis\u00E9s" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: mapUsers.length })] })] }) }), _jsx("div", { className: "rounded-xl border border-gray-200 border-l-4 border-green-500 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Shield, { className: "h-6 w-6 text-green-600 dark:text-green-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Actifs" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: users.filter((user) => user.is_active).length })] })] }) }), _jsx("div", { className: "rounded-xl border border-gray-200 border-l-4 border-purple-500 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(UserIcon, { className: "h-6 w-6 text-purple-600 dark:text-purple-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Individuels" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: users.filter((user) => user.user_type === 'individual').length })] })] }) }), _jsx("div", { className: "rounded-xl border border-gray-200 border-l-4 border-orange-500 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Building2, { className: "h-6 w-6 text-orange-600 dark:text-orange-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Entreprises" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: users.filter((user) => user.user_type === 'enterprise').length })] })] }) })] }), _jsx("div", { className: "rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6", children: [_jsxs("div", { className: "relative xl:col-span-2", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher par nom, email, ville, adresse...", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value), className: "w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400" })] }), _jsxs("select", { value: filterType, onChange: (event) => setFilterType(event.target.value), className: "rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400", children: [_jsx("option", { value: "all", children: "Tous les types" }), _jsx("option", { value: "individual", children: "Individuel" }), _jsx("option", { value: "enterprise", children: "Entreprise" }), _jsx("option", { value: "government", children: "Gouvernement" }), _jsx("option", { value: "bank", children: "Banque" }), _jsx("option", { value: "admin", children: "Admin" })] }), _jsxs("select", { value: filterRegion, onChange: (event) => setFilterRegion(event.target.value), className: "rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400", children: [_jsx("option", { value: "all", children: "Toutes r\u00E9gions" }), uniqueRegions.map((region) => (_jsx("option", { value: region, children: region }, region)))] }), _jsxs("select", { value: filterRisk, onChange: (event) => setFilterRisk(event.target.value), className: "rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400", children: [_jsx("option", { value: "all", children: "Tous risques" }), _jsx("option", { value: "low", children: "Faible" }), _jsx("option", { value: "medium", children: "Moyen" }), _jsx("option", { value: "high", children: "\u00C9lev\u00E9" })] }), _jsxs("select", { value: filterStatus, onChange: (event) => setFilterStatus(event.target.value), className: "rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400", children: [_jsx("option", { value: "active", children: "Actifs" }), _jsx("option", { value: "suspended", children: "Suspendus" }), _jsx("option", { value: "all", children: "Tous les statuts" })] })] }) }), viewMode === 'map' ? (_jsx(AdminUsersMap, { users: filteredMapUsers })) : (_jsxs("div", { className: "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400", children: "Utilisateur" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400", children: "R\u00E9gion / Localit\u00E9" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400", children: "Score TERAS" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400", children: "Risque" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400", children: "Statut" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: filteredUsers.map((user) => (_jsxs("tr", { className: "cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30", onClick: () => navigate(`/admin/users/${user.id}`), children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600", children: _jsx("span", { className: "text-sm font-semibold text-white", children: user.username.charAt(0).toUpperCase() }) }), _jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "truncate text-sm font-medium text-gray-900 dark:text-white", children: [user.first_name, " ", user.last_name] }), _jsx("p", { className: "truncate text-sm text-gray-500 dark:text-gray-400", children: user.email })] })] }) }), _jsx("td", { className: "whitespace-nowrap px-6 py-4", children: getTypeBadge(user.user_type) }), _jsx("td", { className: "whitespace-nowrap px-6 py-4", children: _jsxs("div", { className: "space-y-1", children: [user.region && (_jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300", children: [_jsx(MapPin, { className: "h-3 w-3" }), user.region] })), user.sector && (_jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400", children: [_jsx(Briefcase, { className: "h-3 w-3" }), user.sector] })), !user.sector && user.city && (_jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: user.city }))] }) }), _jsx("td", { className: "whitespace-nowrap px-6 py-4", children: user.score ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700", children: _jsx("div", { className: "h-2 rounded-full bg-blue-600 dark:bg-blue-500", style: { width: `${(user.score / 1000) * 100}%` } }) }), _jsx("span", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: user.score })] })) : (_jsx("span", { className: "text-sm text-gray-400 dark:text-gray-500", children: "N/A" })) }), _jsx("td", { className: "whitespace-nowrap px-6 py-4", children: getRiskBadge(user.risk_level) }), _jsx("td", { className: "whitespace-nowrap px-6 py-4", children: user.is_active ? (_jsx("span", { className: "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400", children: "Actif" })) : (_jsx("span", { className: "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400", children: "Suspendu" })) }), _jsx("td", { className: "whitespace-nowrap px-6 py-4 text-right", children: _jsx("button", { onClick: (event) => {
                                                        event.stopPropagation();
                                                        navigate(`/admin/users/${user.id}`);
                                                    }, className: "rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700", children: _jsx(MoreVertical, { className: "h-5 w-5 text-gray-500 dark:text-gray-400" }) }) })] }, user.id))) })] }) }), filteredUsers.length === 0 && (_jsxs("div", { className: "py-12 text-center", children: [_jsx(AlertCircle, { className: "mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Aucun utilisateur trouv\u00E9" })] }))] }))] }));
}

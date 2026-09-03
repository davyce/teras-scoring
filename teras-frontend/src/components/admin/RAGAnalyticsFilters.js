import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// teras-frontend/src/components/admin/RAGAnalyticsFilters.tsx
import { useState, useEffect } from 'react';
import { Filter, X, Calendar, User, Clock, FileText, ChevronDown } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import './RAGAnalyticsFilters.css';
export default function RAGAnalyticsFilters({ onFilterChange, onReset }) {
    const [isOpen, setIsOpen] = useState(false);
    const [filterOptions, setFilterOptions] = useState(null);
    const [filters, setFilters] = useState({
        days: 365
    });
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);
    useEffect(() => {
        loadFilterOptions();
    }, []);
    useEffect(() => {
        // Compter filtres actifs
        const count = Object.keys(filters).filter(key => {
            const value = filters[key];
            return value !== undefined && value !== '' && key !== 'days';
        }).length;
        setActiveFiltersCount(count);
    }, [filters]);
    const loadFilterOptions = async () => {
        try {
            const res = await authFetch('/api/ai/analytics/filter-options/');
            const data = await res.json();
            setFilterOptions(data);
        }
        catch (error) {
            console.error('Error loading filter options:', error);
        }
    };
    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
    };
    const applyFilters = () => {
        onFilterChange(filters);
        setIsOpen(false);
    };
    const resetFilters = () => {
        const defaultFilters = { days: 365 };
        setFilters(defaultFilters);
        onReset();
        setIsOpen(false);
    };
    return (_jsxs("div", { className: "analytics-filters", children: [_jsxs("button", { className: `filter-toggle ${activeFiltersCount > 0 ? 'has-filters' : ''}`, onClick: () => setIsOpen(!isOpen), children: [_jsx(Filter, { size: 18 }), "Filtres", activeFiltersCount > 0 && (_jsx("span", { className: "filter-badge", children: activeFiltersCount })), _jsx(ChevronDown, { size: 16, className: isOpen ? 'rotated' : '' })] }), isOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "filter-overlay", onClick: () => setIsOpen(false) }), _jsxs("div", { className: "filter-panel", children: [_jsxs("div", { className: "filter-header", children: [_jsxs("h3", { children: [_jsx(Filter, { size: 20 }), "Filtres avanc\u00E9s"] }), _jsx("button", { className: "close-btn", onClick: () => setIsOpen(false), children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "filter-content", children: [_jsxs("div", { className: "filter-group", children: [_jsxs("label", { children: [_jsx(Calendar, { size: 16 }), "P\u00E9riode"] }), _jsx("div", { className: "filter-row", children: _jsxs("select", { value: filters.days || 365, onChange: (e) => handleFilterChange('days', Number(e.target.value)), children: [_jsx("option", { value: 365, children: "12 derniers mois" }), _jsx("option", { value: 180, children: "6 derniers mois" }), _jsx("option", { value: 90, children: "90 derniers jours" }), _jsx("option", { value: 7, children: "7 derniers jours" }), _jsx("option", { value: 30, children: "30 derniers jours" }), _jsx("option", { value: 0, children: "Plage personnalis\u00E9e" })] }) }), filters.days === 0 && (_jsxs("div", { className: "filter-row", children: [_jsx("input", { type: "date", placeholder: "Date d\u00E9but", value: filters.start_date || '', onChange: (e) => handleFilterChange('start_date', e.target.value) }), _jsx("input", { type: "date", placeholder: "Date fin", value: filters.end_date || '', onChange: (e) => handleFilterChange('end_date', e.target.value) })] }))] }), _jsxs("div", { className: "filter-group", children: [_jsxs("label", { children: [_jsx(User, { size: 16 }), "Type d'utilisateur"] }), _jsxs("select", { value: filters.user_type || '', onChange: (e) => handleFilterChange('user_type', e.target.value || undefined), children: [_jsx("option", { value: "", children: "Tous les types" }), filterOptions?.user_types.map(type => (_jsx("option", { value: type, children: type.charAt(0).toUpperCase() + type.slice(1) }, type)))] })] }), _jsxs("div", { className: "filter-group", children: [_jsxs("label", { children: [_jsx(User, { size: 16 }), "Utilisateur sp\u00E9cifique"] }), _jsxs("select", { value: filters.user_id || '', onChange: (e) => handleFilterChange('user_id', e.target.value ? Number(e.target.value) : undefined), children: [_jsx("option", { value: "", children: "Tous les utilisateurs" }), filterOptions?.active_users.map(user => (_jsxs("option", { value: user.user__id, children: [user.user__username, " (", user.query_count, " requ\u00EAtes)"] }, user.user__id)))] })] }), _jsxs("div", { className: "filter-group", children: [_jsxs("label", { children: [_jsx(Clock, { size: 16 }), "Temps de r\u00E9ponse"] }), _jsxs("div", { className: "preset-buttons", children: [filterOptions?.response_time_presets.map((preset, i) => (_jsx("button", { className: `preset-btn ${filters.response_time_min === preset.min &&
                                                            filters.response_time_max === preset.max ? 'active' : ''}`, onClick: () => {
                                                            handleFilterChange('response_time_min', preset.min);
                                                            handleFilterChange('response_time_max', preset.max);
                                                        }, children: preset.label }, i))), _jsx("button", { className: "preset-btn clear", onClick: () => {
                                                            handleFilterChange('response_time_min', undefined);
                                                            handleFilterChange('response_time_max', undefined);
                                                        }, children: "R\u00E9initialiser" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsxs("label", { children: [_jsx(FileText, { size: 16 }), "Documents utilis\u00E9s"] }), _jsxs("div", { className: "preset-buttons", children: [filterOptions?.docs_used_presets.map((preset, i) => (_jsx("button", { className: `preset-btn ${filters.docs_used_min === preset.min &&
                                                            filters.docs_used_max === preset.max ? 'active' : ''}`, onClick: () => {
                                                            handleFilterChange('docs_used_min', preset.min);
                                                            handleFilterChange('docs_used_max', preset.max);
                                                        }, children: preset.label }, i))), _jsx("button", { className: "preset-btn clear", onClick: () => {
                                                            handleFilterChange('docs_used_min', undefined);
                                                            handleFilterChange('docs_used_max', undefined);
                                                        }, children: "R\u00E9initialiser" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsxs("label", { children: [_jsx(FileText, { size: 16 }), "Type de document"] }), _jsxs("select", { value: filters.doc_type || '', onChange: (e) => handleFilterChange('doc_type', e.target.value || undefined), children: [_jsx("option", { value: "", children: "Tous les types" }), filterOptions?.doc_types.map(type => (_jsx("option", { value: type, children: type.charAt(0).toUpperCase() + type.slice(1) }, type)))] })] })] }), _jsxs("div", { className: "filter-footer", children: [_jsx("button", { className: "btn-reset", onClick: resetFilters, children: "R\u00E9initialiser tout" }), _jsx("button", { className: "btn-apply", onClick: applyFilters, children: "Appliquer les filtres" })] })] })] }))] }));
}

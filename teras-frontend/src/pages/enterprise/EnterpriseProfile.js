import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * EnterpriseProfile.tsx — Profil Entreprise
 * 100% API réelle · zéro mock · authFetch statique
 */
import { useState, useEffect } from 'react';
import { Building2, Mail, Phone, MapPin, Globe, Briefcase, Edit3, Save, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import LocationPickerMap from '../../components/shared/LocationPickerMap';
const LEGAL_FORMS = ['SARL', 'SA', 'SNC', 'SASU', 'EI', 'SCS', 'Autre'];
const SECTORS = [
    'Commerce & Distribution', 'Agriculture', 'Transport & Logistique',
    'BTP & Immobilier', 'Services & Conseil', 'Industrie & Manufacture',
    'Santé', 'Éducation', 'Technologie', 'Autre',
];
const BANDS = {
    A: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    B: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    C: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    D: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    E: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};
const getBand = (s) => s >= 900 ? 'A' : s >= 750 ? 'B' : s >= 600 ? 'C' : s >= 400 ? 'D' : 'E';
const formatLocationDate = (value) => {
    if (!value)
        return 'Position non encore enregistrée';
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return 'Position enregistrée';
    return `Dernière mise à jour : ${date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })}`;
};
const EnterpriseProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({});
    useEffect(() => { fetchProfile(); }, []);
    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch('/api/scoring/enterprise/profile/');
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            const data = await res.json();
            setProfile(data);
            setForm(data);
        }
        catch (e) {
            setError(e.message || 'Impossible de charger le profil.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await authFetch('/api/scoring/enterprise/profile/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok)
                throw new Error(`Erreur ${res.status}`);
            const updated = await res.json();
            setProfile(updated);
            setForm(updated);
            setEditing(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        catch (e) {
            setError(e.message || 'Échec de la sauvegarde.');
        }
        finally {
            setSaving(false);
        }
    };
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    /* ── Loading ── */
    if (loading)
        return (_jsx("div", { className: "min-h-screen bg-slate-950 flex items-center justify-center", children: _jsx(Loader2, { className: "w-10 h-10 text-cyan-500 animate-spin" }) }));
    /* ── Error ── */
    if (error && !profile)
        return (_jsx("div", { className: "min-h-screen bg-slate-950 flex items-center justify-center p-6", children: _jsxs("div", { className: "bg-slate-900 border border-rose-500/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-rose-400 mx-auto" }), _jsx("p", { className: "text-white font-semibold", children: "Impossible de charger le profil" }), _jsx("p", { className: "text-sm text-slate-400", children: error }), _jsx("button", { onClick: fetchProfile, className: "px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all", children: "R\u00E9essayer" })] }) }));
    if (!profile)
        return null;
    const band = getBand(profile.teras_score);
    const pct = (profile.teras_score / 1000) * 100;
    const R = 40;
    const circ = 2 * Math.PI * R;
    return (_jsx("div", { className: "min-h-screen bg-slate-950 p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1", children: "TERAS Entreprise" }), _jsx("h1", { className: "text-3xl font-black text-white", children: "Profil entreprise" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [saved && (_jsxs("span", { className: "flex items-center gap-2 text-emerald-400 text-sm", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), " Sauvegard\u00E9"] })), error && (_jsx("span", { className: "text-rose-400 text-xs", children: error })), editing ? (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => { setEditing(false); setForm(profile); setError(null); }, className: "flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-all", children: [_jsx(X, { className: "w-4 h-4" }), " Annuler"] }), _jsx("button", { onClick: handleSave, disabled: saving, className: "flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50", children: saving
                                                ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), " Sauvegarde..."] })
                                                : _jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4" }), " Sauvegarder"] }) })] })) : (_jsxs("button", { onClick: () => setEditing(true), className: "flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all", children: [_jsx(Edit3, { className: "w-4 h-4" }), " Modifier"] }))] })] }), _jsx("div", { className: "bg-slate-900/60 border border-slate-800 rounded-2xl p-6", children: _jsxs("div", { className: "flex items-start gap-6 flex-wrap", children: [_jsx("div", { className: "w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0", children: _jsx(Building2, { className: "w-10 h-10 text-white" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-3 flex-wrap mb-1", children: [_jsx("h2", { className: "text-2xl font-black text-white", children: profile.company_name || '—' }), _jsxs("span", { className: `px-2 py-0.5 rounded-lg border text-xs font-bold ${profile.kyc_status === 'approved'
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                    : profile.kyc_status === 'pending'
                                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`, children: ["KYC ", profile.kyc_status === 'approved' ? '✓ Vérifié'
                                                        : profile.kyc_status === 'pending' ? '⏳ En attente'
                                                            : '✗ Refusé'] })] }), _jsxs("p", { className: "text-slate-400 text-sm", children: [profile.legal_form || '—', " \u00B7 ", profile.sector || '—'] }), _jsxs("p", { className: "text-slate-500 text-xs mt-0.5", children: [profile.city || '—', ", ", profile.country || '—'] })] }), _jsxs("div", { className: "text-center shrink-0", children: [_jsxs("div", { className: "relative w-24 h-24", children: [_jsxs("svg", { className: "w-24 h-24 -rotate-90", viewBox: "0 0 96 96", children: [_jsx("circle", { cx: "48", cy: "48", r: R, fill: "none", stroke: "#1e293b", strokeWidth: "8" }), _jsx("circle", { cx: "48", cy: "48", r: R, fill: "none", stroke: "#06b6d4", strokeWidth: "8", strokeDasharray: circ, strokeDashoffset: circ * (1 - pct / 100), strokeLinecap: "round" })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [_jsx("span", { className: "text-2xl font-black text-white", children: profile.teras_score }), _jsx("span", { className: `text-xs font-bold px-1.5 py-0.5 rounded border ${BANDS[band]}`, children: band })] })] }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Score TERAS" })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4", children: [_jsxs("h3", { className: "text-sm font-bold text-white flex items-center gap-2", children: [_jsx(Building2, { className: "w-4 h-4 text-cyan-400" }), " Informations l\u00E9gales"] }), _jsx(Row, { label: "Raison sociale", editing: editing, children: editing
                                        ? _jsx(Input, { value: form.company_name || '', onChange: v => set('company_name', v) })
                                        : _jsx(Val, { children: profile.company_name }) }), _jsx(Row, { label: "Forme juridique", editing: editing, children: editing
                                        ? _jsx(Select, { value: form.legal_form || '', onChange: v => set('legal_form', v), options: LEGAL_FORMS })
                                        : _jsx(Val, { children: profile.legal_form }) }), _jsx(Row, { label: "N\u00B0 Fiscal / NIF", editing: editing, children: editing
                                        ? _jsx(Input, { value: form.tax_id || '', onChange: v => set('tax_id', v) })
                                        : _jsx(Val, { children: profile.tax_id }) }), _jsx(Row, { label: "RCCM", editing: editing, children: editing
                                        ? _jsx(Input, { value: form.rccm || '', onChange: v => set('rccm', v) })
                                        : _jsx(Val, { children: profile.rccm }) }), _jsx(Row, { label: "Effectif", editing: editing, children: editing
                                        ? _jsx(Input, { type: "number", value: String(form.employees_count ?? ''), onChange: v => set('employees_count', Number(v)) })
                                        : _jsxs(Val, { children: [profile.employees_count, " employ\u00E9(s)"] }) }), _jsx(Row, { label: "Secteur d'activit\u00E9", editing: editing, children: editing
                                        ? _jsx(Select, { value: form.sector || '', onChange: v => set('sector', v), options: SECTORS })
                                        : _jsx(Val, { children: profile.sector }) })] }), _jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4", children: [_jsxs("h3", { className: "text-sm font-bold text-white flex items-center gap-2", children: [_jsx(Phone, { className: "w-4 h-4 text-cyan-400" }), " Coordonn\u00E9es"] }), _jsx(Row, { label: "Email", editing: editing, icon: _jsx(Mail, { className: "w-3 h-3" }), children: editing
                                        ? _jsx(Input, { type: "email", value: form.email || '', onChange: v => set('email', v) })
                                        : _jsx(Val, { children: profile.email }) }), _jsx(Row, { label: "T\u00E9l\u00E9phone", editing: editing, icon: _jsx(Phone, { className: "w-3 h-3" }), children: editing
                                        ? _jsx(Input, { value: form.phone || '', onChange: v => set('phone', v) })
                                        : _jsx(Val, { children: profile.phone }) }), _jsx(Row, { label: "Adresse", editing: editing, icon: _jsx(MapPin, { className: "w-3 h-3" }), children: editing
                                        ? _jsx(Input, { value: form.address || '', onChange: v => set('address', v) })
                                        : _jsx(Val, { children: profile.address }) }), _jsx(Row, { label: "Ville", editing: editing, icon: _jsx(MapPin, { className: "w-3 h-3" }), children: editing
                                        ? _jsx(Input, { value: form.city || '', onChange: v => set('city', v) })
                                        : _jsx(Val, { children: profile.city }) }), _jsx(Row, { label: "Pays", editing: editing, icon: _jsx(Globe, { className: "w-3 h-3" }), children: editing
                                        ? _jsx(Input, { value: form.country || '', onChange: v => set('country', v) })
                                        : _jsx(Val, { children: profile.country }) }), _jsx(Row, { label: "Site web", editing: editing, icon: _jsx(Globe, { className: "w-3 h-3" }), children: editing
                                        ? _jsx(Input, { value: form.website || '', onChange: v => set('website', v) })
                                        : _jsx(Val, { children: profile.website }) }), _jsxs("div", { className: "space-y-4 rounded-2xl border border-slate-700/50 bg-slate-950/40 p-4", children: [_jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-white", children: "Adresse et position GPS" }), _jsx("p", { className: "text-xs text-slate-400", children: "Localisez votre entreprise pour remplir automatiquement la ville et l'adresse." })] }), _jsx("span", { className: "rounded-full border border-slate-700/50 bg-slate-900/60 px-3 py-1 text-xs text-slate-300", children: formatLocationDate(form.location_updated_at ?? profile.location_updated_at) })] }), _jsx(LocationPickerMap, { editing: editing, value: {
                                                latitude: form.latitude ?? profile.latitude ?? null,
                                                longitude: form.longitude ?? profile.longitude ?? null,
                                            }, locationSource: form.location_source || profile.location_source, resolvedAddress: form.address || profile.address, resolvedCity: form.city || profile.city, onChange: ({ latitude, longitude, location_source, resolved_address, resolved_city }) => setForm((current) => ({
                                                ...current,
                                                latitude,
                                                longitude,
                                                location_source,
                                                location_updated_at: new Date().toISOString(),
                                                address: resolved_address || current.address || profile.address,
                                                city: resolved_city || current.city || profile.city,
                                            })) })] })] })] }), _jsxs("div", { className: "bg-slate-900/60 border border-slate-800 rounded-2xl p-5", children: [_jsxs("h3", { className: "text-sm font-bold text-white mb-3 flex items-center gap-2", children: [_jsx(Briefcase, { className: "w-4 h-4 text-cyan-400" }), " Description de l'activit\u00E9"] }), editing
                            ? _jsx("textarea", { value: form.description || '', onChange: e => set('description', e.target.value), rows: 4, placeholder: "D\u00E9crivez l'activit\u00E9 de votre entreprise...", className: "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-500 transition-all" })
                            : _jsx("p", { className: "text-sm text-slate-300 leading-relaxed", children: profile.description || _jsx("span", { className: "text-slate-500 italic", children: "Aucune description renseign\u00E9e." }) })] })] }) }));
};
/* ── Sous-composants légers ── */
const Row = ({ label, editing, icon, children }) => (_jsxs("div", { children: [_jsxs("label", { className: "flex items-center gap-1 text-xs text-slate-500 mb-1", children: [icon, label] }), children] }));
const Val = ({ children }) => (_jsx("p", { className: "text-sm text-white", children: children || _jsx("span", { className: "text-slate-500 italic", children: "\u2014" }) }));
const Input = ({ value, onChange, type = 'text', placeholder }) => (_jsx("input", { type: type, value: value, onChange: e => onChange(e.target.value), placeholder: placeholder, className: "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all" }));
const Select = ({ value, onChange, options }) => (_jsxs("select", { value: value, onChange: e => onChange(e.target.value), className: "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-all", children: [_jsx("option", { value: "", children: "S\u00E9lectionner..." }), options.map(o => _jsx("option", { value: o, children: o }, o))] }));
export default EnterpriseProfile;

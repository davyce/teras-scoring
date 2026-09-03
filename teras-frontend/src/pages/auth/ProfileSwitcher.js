import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
//src/pages/ProfileSwitcher.tsx
import { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
export default function ProfileSwitcher({}) {
    const [active, setActive] = useState(null);
    const [profile, setProfile] = useState('basic');
    const [region, setRegion] = useState('CEMAC');
    const [country, setCountry] = useState('CG');
    const [regions, setRegions] = useState([]);
    const [countries, setCountries] = useState([]);
    const [msg, setMsg] = useState('');
    useEffect(() => {
        authFetch('/config/').then(d => {
            setActive(d);
            setProfile(d.active_profile);
            if (d.region)
                setRegion(d.region);
            if (d.country)
                setCountry(d.country);
        });
        authFetch('/config/regions/').then(d => setRegions(d.available_regions || []));
    }, []);
    useEffect(() => {
        authFetch(`/config/countries/?region=${region}`).then(d => setCountries(d.available_countries || []));
    }, [region]);
    async function save() {
        setMsg('');
        try {
            const body = { profile };
            if (profile === 'regional' || profile === 'country')
                body.region = region;
            if (profile === 'country')
                body.country = country;
            const res = await authFetch('/config/profile/', { method: 'PATCH', body: JSON.stringify(body) });
            setMsg('Profil actif mis à jour ✅');
            setActive((a) => ({ ...a, ...res }));
        }
        catch (e) {
            setMsg(e.message || 'Erreur');
        }
    }
    if (!active)
        return _jsx("div", { className: "p-6 text-sm", style: { color: '#9CB5DD' }, children: "Chargement\u2026" });
    return (_jsxs("div", { className: "p-6 space-y-4", children: [_jsx("h2", { style: { color: '#EAF2FF' }, children: "Profil actif TERAS" }), _jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm", style: { color: '#9CB5DD' }, children: "Profil" }), _jsxs("select", { className: "w-full px-3 py-2 rounded border", style: { background: '#0F172A', color: '#EAF2FF', borderColor: '#1B2740' }, value: profile, onChange: (e) => setProfile(e.target.value), children: [_jsx("option", { value: "basic", children: "basic" }), _jsx("option", { value: "enterprise", children: "enterprise" }), _jsx("option", { value: "regional", children: "regional" }), _jsx("option", { value: "country", children: "country" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm", style: { color: '#9CB5DD' }, children: "R\u00E9gion" }), _jsx("select", { className: "w-full px-3 py-2 rounded border", style: { background: '#0F172A', color: '#EAF2FF', borderColor: '#1B2740' }, value: region, onChange: (e) => setRegion(e.target.value), disabled: !(profile === 'regional' || profile === 'country'), children: regions.map(r => _jsx("option", { value: r, children: r }, r)) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm", style: { color: '#9CB5DD' }, children: "Pays" }), _jsx("select", { className: "w-full px-3 py-2 rounded border", style: { background: '#0F172A', color: '#EAF2FF', borderColor: '#1B2740' }, value: country, onChange: (e) => setCountry(e.target.value), disabled: profile !== 'country', children: countries.map(c => _jsx("option", { value: c, children: c }, c)) })] })] }), _jsxs("div", { className: "flex gap-3 items-center", children: [_jsx("button", { onClick: save, className: "px-4 py-2 rounded", style: { background: '#9BD2FF', color: '#0B1220' }, children: "Enregistrer" }), msg && _jsx("span", { className: "text-sm", style: { color: '#9CB5DD' }, children: msg })] }), _jsxs("div", { children: [_jsx("h3", { className: "mb-2", style: { color: '#EAF2FF' }, children: "Actuel" }), _jsx("pre", { className: "text-xs p-3 rounded border overflow-auto", style: { color: '#EAF2FF', background: '#0F172A', borderColor: '#223556' }, children: JSON.stringify(active, null, 2) })] })] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
//src/pages/RegionsCountries.tsx
import { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
export default function RegionsCountries({}) {
    const [regions, setRegions] = useState(null);
    const [region, setRegion] = useState('CEMAC');
    const [countries, setCountries] = useState(null);
    useEffect(() => { authFetch('/config/regions/').then(setRegions); }, []);
    useEffect(() => { authFetch(`/config/countries/?region=${region}`).then(setCountries); }, [region]);
    return (_jsxs("div", { className: "p-6 space-y-4", children: [_jsx("h2", { style: { color: '#EAF2FF' }, children: "R\u00E9gions & Pays" }), _jsxs("div", { children: [_jsx("label", { className: "text-sm", style: { color: '#9CB5DD' }, children: "R\u00E9gion" }), _jsx("select", { className: "ml-2 px-3 py-2 rounded border", style: { background: '#0F172A', color: '#EAF2FF', borderColor: '#1B2740' }, value: region, onChange: e => setRegion(e.target.value), children: (regions?.available_regions || ['CEMAC']).map((r) => _jsx("option", { value: r, children: r }, r)) })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "mb-2", style: { color: '#EAF2FF' }, children: "D\u00E9finitions r\u00E9gions" }), _jsx("pre", { className: "text-xs p-3 rounded border overflow-auto", style: { color: '#EAF2FF', background: '#0F172A', borderColor: '#223556' }, children: JSON.stringify(regions, null, 2) })] }), _jsxs("div", { children: [_jsxs("h3", { className: "mb-2", style: { color: '#EAF2FF' }, children: ["Pays (", region, ")"] }), _jsx("pre", { className: "text-xs p-3 rounded border overflow-auto", style: { color: '#EAF2FF', background: '#0F172A', borderColor: '#223556' }, children: JSON.stringify(countries, null, 2) })] })] })] }));
}

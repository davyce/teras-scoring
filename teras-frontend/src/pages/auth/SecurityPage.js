import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { Hero } from '../components/Hero';
import { Shield, Lock, Eye, FileCheck } from 'lucide-react';
export function SecurityPage({ onNavigate }) {
    const features = [
        {
            icon: Shield,
            title: 'Chiffrement de bout en bout',
            desc: 'Toutes vos données sont chiffrées avec AES-256 et TLS 1.3'
        },
        {
            icon: Lock,
            title: 'Permissions granulaires',
            desc: 'Contrôle d\'accès basé sur les rôles (RBAC) et authentification multi-facteurs'
        },
        {
            icon: Eye,
            title: 'Audit et traçabilité',
            desc: 'Logs complets de toutes les actions et accès aux données'
        },
        {
            icon: FileCheck,
            title: 'Conformité locale',
            desc: 'Respect des réglementations locales et hébergement des données dans votre région'
        }
    ];
    return (_jsxs(Hero, { title: "S\u00E9curit\u00E9 & conformit\u00E9", subtitle: "Vos donn\u00E9es sont prot\u00E9g\u00E9es avec les plus hauts standards de s\u00E9curit\u00E9. Chiffrement, permissions, audit et conformit\u00E9 locale.", showScoreCard: false, children: [_jsx("div", { className: "mt-8 grid grid-cols-2 gap-6 max-w-[900px]", children: features.map((feature, i) => {
                    const Icon = feature.icon;
                    return (_jsxs("div", { className: "p-8 rounded-xl border", style: { backgroundColor: '#0F172A', borderColor: '#223556' }, children: [_jsx("div", { className: "w-14 h-14 rounded-xl flex items-center justify-center mb-4", style: { backgroundColor: 'rgba(155, 210, 255, 0.1)' }, children: _jsx(Icon, { className: "w-7 h-7", style: { color: '#9BD2FF' } }) }), _jsx("h3", { className: "mb-2", style: { color: '#EAF2FF' }, children: feature.title }), _jsx("p", { className: "text-[14px] leading-relaxed", style: { color: '#9CB5DD' }, children: feature.desc })] }, i));
                }) }), _jsx("div", { className: "mt-8 p-6 rounded-xl border max-w-[900px]", style: { backgroundColor: 'rgba(155, 210, 255, 0.05)', borderColor: '#9BD2FF' }, children: _jsxs("p", { className: "text-[14px]", style: { color: '#C8D5EE' }, children: [_jsx("strong", { style: { color: '#EAF2FF' }, children: "Note importante :" }), " TERAS n'est pas con\u00E7u pour la collecte de donn\u00E9es personnelles identifiables (PII) sensibles. Nous respectons votre vie priv\u00E9e et suivons les meilleures pratiques en mati\u00E8re de protection des donn\u00E9es."] }) })] }));
}

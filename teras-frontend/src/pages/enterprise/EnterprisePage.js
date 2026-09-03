import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';
export function EnterprisePage({ onNavigate }) {
    return (_jsx(Hero, { title: "TERAS Entreprise", subtitle: "T \u2013 Transparence \u2022 E \u2013 Emploi \u2022 R \u2013 R\u00E9tention \u2022 A \u2013 Activit\u00E9 \u2022 S \u2013 Stabilit\u00E9. Solution compl\u00E8te pour \u00E9valuer la sant\u00E9 financi\u00E8re de votre entreprise.", buttons: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "primary", onClick: () => onNavigate?.('contact'), children: "Demander une d\u00E9mo" }), _jsx(Button, { variant: "secondary", onClick: () => onNavigate?.('pricing'), children: "Voir les tarifs" })] }), showScoreCard: true }));
}

import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Hero } from '../components/Hero';
import { Button } from '../components/Button';
export function BasicPage({ onNavigate }) {
    return (_jsx(Hero, { title: "TERAS Basic", subtitle: "Score personnel : Transactions \u2022 \u00C9pargne \u2022 Revenus \u2022 Actifs \u2022 Social. Obtenez votre score de cr\u00E9dit personnel en quelques minutes.", buttons: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "primary", onClick: () => onNavigate?.('register'), children: "Commencer gratuitement" }), _jsx(Button, { variant: "secondary", onClick: () => onNavigate?.('how-it-works'), children: "En savoir plus" })] }), showScoreCard: true }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/_legacy/Profiles.tsx
import { authFetch } from "../utils/authFetch";
export default function Profiles() {
    async function setProfile(p) { await authFetch("/api/config/", { method: "PUT", body: JSON.stringify({ profile: p }) }); alert(`Profil ${p} actif`); }
    return (_jsxs("div", { className: "space-x-2", children: [_jsx("button", { onClick: () => setProfile("basic"), className: "border p-2", children: "Basic" }), _jsx("button", { onClick: () => setProfile("enterprise"), className: "border p-2", children: "Entreprise" }), _jsx("button", { onClick: () => setProfile("regional"), className: "border p-2", children: "R\u00E9gional" })] }));
}

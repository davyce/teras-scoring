import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/AppLayout.tsx
import { Outlet, NavLink } from "react-router-dom";
export default function AppLayout() {
    return (_jsxs("div", { className: "min-h-screen grid grid-cols-[240px_1fr]", children: [_jsx("aside", { className: "border-r p-4", children: _jsxs("nav", { className: "space-y-2", children: [_jsx(NavLink, { to: "/", className: "block", children: "Dashboard" }), _jsx(NavLink, { to: "/compute", className: "block", children: "Compute Score" }), _jsx(NavLink, { to: "/config", className: "block", children: "Config Manager" }), _jsx(NavLink, { to: "/profiles", className: "block", children: "Profils TERAS" })] }) }), _jsx("main", { className: "p-6", children: _jsx(Outlet, {}) })] }));
}

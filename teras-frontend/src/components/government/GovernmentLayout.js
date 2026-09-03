import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/government/GovernmentLayout.tsx
import { Outlet } from 'react-router-dom';
import GovernmentSidebar from './GovernmentSidebar';
export default function GovernmentLayout() {
    return (_jsxs("div", { className: "flex min-h-screen bg-slate-950", children: [_jsx(GovernmentSidebar, {}), _jsx("main", { className: "flex-1 ml-72 min-h-screen overflow-x-hidden", children: _jsx(Outlet, {}) })] }));
}

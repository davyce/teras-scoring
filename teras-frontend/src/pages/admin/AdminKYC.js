import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
//src/pages/admin/AdminKYC.tsx
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BadgeCheck, Ban, CheckCircle2, Eye, RefreshCw, Search, ShieldCheck } from "lucide-react";
import adminApi from "../../services/adminApi";
function statusLabel(status) {
    if (status === "pending")
        return "En attente";
    if (status === "approved")
        return "Validé";
    return "Rejeté";
}
function statusClasses(status) {
    if (status === "pending")
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (status === "approved")
        return "bg-green-100 text-green-800 border-green-200";
    return "bg-red-100 text-red-800 border-red-200";
}
function isPdf(url) {
    return url.toLowerCase().includes(".pdf");
}
function isImage(url) {
    const u = url.toLowerCase();
    return u.includes(".png") || u.includes(".jpg") || u.includes(".jpeg") || u.includes(".webp");
}
export default function AdminKYC() {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [selected, setSelected] = useState(null);
    const [statusFilter, setStatusFilter] = useState("pending");
    const [search, setSearch] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [actionBusy, setActionBusy] = useState(false);
    const [notice, setNotice] = useState(null);
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return requests.filter((r) => {
            const okStatus = statusFilter === "all" ? true : r.status === statusFilter;
            if (!okStatus)
                return false;
            if (!q)
                return true;
            const hay = [
                r.id,
                r.user?.username,
                r.user?.email,
                r.user?.first_name,
                r.user?.last_name,
                r.document_type,
                r.status,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return hay.includes(q);
        });
    }, [requests, statusFilter, search]);
    const docUrl = useMemo(() => {
        if (!selected)
            return "";
        return selected.document_url || selected.document || "";
    }, [selected]);
    const load = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getKYCRequests({
                status: statusFilter === "all" ? undefined : statusFilter,
            });
            const list = res.data?.requests || [];
            setRequests(list);
            setSelected((prev) => {
                if (prev) {
                    const same = list.find((x) => x.id === prev.id);
                    return same || list[0] || null;
                }
                return list[0] || null;
            });
        }
        catch (error) {
            setNotice({
                type: "error",
                text: error?.message || "Impossible de charger les demandes KYC.",
            });
        }
        finally {
            setLoading(false);
        }
    };
    const reloadSelected = async (kycId) => {
        const res = await adminApi.getKYCRequestDetail(kycId);
        if (res.data?.request)
            setSelected(res.data.request);
    };
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);
    const approve = async () => {
        if (!selected)
            return;
        setActionBusy(true);
        try {
            const res = await adminApi.approveKYCRequest(selected.id);
            if (!res.data) {
                setNotice({ type: "error", text: res.error || "Erreur validation KYC." });
                return;
            }
            setNotice({ type: "success", text: "Demande KYC validée." });
            await load();
        }
        catch (error) {
            setNotice({
                type: "error",
                text: error?.message || "Erreur validation KYC.",
            });
        }
        finally {
            setActionBusy(false);
        }
    };
    const reject = async () => {
        if (!selected)
            return;
        if (!rejectReason.trim()) {
            setNotice({ type: "error", text: "Raison obligatoire avant rejet." });
            return;
        }
        setActionBusy(true);
        try {
            const res = await adminApi.rejectKYCRequest(selected.id, rejectReason.trim());
            if (!res.data) {
                setNotice({ type: "error", text: res.error || "Erreur rejet KYC." });
                return;
            }
            setRejectReason("");
            setNotice({ type: "success", text: "Demande KYC rejetée et historisée." });
            await load();
        }
        catch (error) {
            setNotice({
                type: "error",
                text: error?.message || "Erreur rejet KYC.",
            });
        }
        finally {
            setActionBusy(false);
        }
    };
    const openDoc = () => {
        if (!docUrl)
            return;
        window.open(docUrl, "_blank");
    };
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-start justify-between gap-4 flex-wrap", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(ShieldCheck, { className: "w-7 h-7 text-teal-600 dark:text-teal-400" }), "KYC \u2014 Admin"] }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-1", children: "Validation / rejet + pr\u00E9visualisation documents." })] }), _jsxs("button", { onClick: load, className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), "Actualiser"] })] }), notice && (_jsxs("div", { className: `flex items-start gap-3 rounded-xl border px-4 py-3 ${notice.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"}`, children: [notice.type === "success" ? (_jsx(CheckCircle2, { className: "w-5 h-5 mt-0.5 flex-shrink-0" })) : (_jsx(AlertCircle, { className: "w-5 h-5 mt-0.5 flex-shrink-0" })), _jsx("p", { className: "text-sm font-medium", children: notice.text })] })), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4", children: _jsxs("div", { className: "flex flex-col md:flex-row md:items-center gap-3", children: [_jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white", children: [_jsx("option", { value: "all", children: "Tous" }), _jsx("option", { value: "pending", children: "En attente" }), _jsx("option", { value: "approved", children: "Valid\u00E9es" }), _jsx("option", { value: "rejected", children: "Rejet\u00E9es" })] }), _jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Rechercher (user, email, type doc, id...)", className: "w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white" })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden", children: [_jsx("div", { className: "px-4 py-3 border-b border-gray-200 dark:border-gray-700", children: _jsxs("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: ["Demandes (", filtered.length, ")"] }) }), loading ? (_jsx("div", { className: "p-6 text-center text-gray-500 dark:text-gray-400", children: "Chargement..." })) : filtered.length === 0 ? (_jsx("div", { className: "p-6 text-center text-gray-500 dark:text-gray-400", children: "Aucune demande." })) : (_jsx("div", { className: "divide-y divide-gray-200 dark:divide-gray-700 max-h-[70vh] overflow-y-auto", children: filtered.map((r) => (_jsx("button", { onClick: async () => {
                                        setSelected(r);
                                        setRejectReason("");
                                        await reloadSelected(r.id);
                                    }, className: `w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition ${selected?.id === r.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`, children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${statusClasses(r.status)}`, children: statusLabel(r.status) }), _jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: ["#", r.id] })] }), _jsxs("div", { className: "mt-2", children: [_jsxs("p", { className: "text-sm font-semibold text-gray-900 dark:text-white truncate", children: [r.user?.first_name || "", " ", r.user?.last_name || "", " ", _jsxs("span", { className: "text-gray-500 dark:text-gray-400 font-normal", children: ["@", r.user?.username] })] }), _jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 truncate", children: r.document_type || "Document" })] })] }), _jsx(Eye, { className: "w-4 h-4 text-gray-400 mt-1" })] }) }, r.id))) }))] }), _jsx("div", { className: "lg:col-span-2 space-y-6", children: !selected ? (_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400", children: "S\u00E9lectionne une demande KYC." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6", children: _jsxs("div", { className: "flex items-start justify-between gap-4 flex-wrap", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${statusClasses(selected.status)}`, children: statusLabel(selected.status) }), _jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: ["Demande #", selected.id] })] }), _jsxs("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mt-2", children: [selected.user?.first_name || "", " ", selected.user?.last_name || "", " ", _jsxs("span", { className: "text-gray-500 dark:text-gray-400 font-normal", children: ["@", selected.user?.username] })] }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: [selected.user?.email || "—", " \u2022 ", selected.document_type || "Document"] })] }), _jsxs("button", { onClick: openDoc, disabled: !docUrl, className: `inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition ${docUrl
                                                    ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 cursor-not-allowed opacity-70"}`, children: [_jsx(Eye, { className: "w-4 h-4" }), "Ouvrir doc"] })] }) }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden", children: [_jsx("div", { className: "px-4 py-3 border-b border-gray-200 dark:border-gray-700", children: _jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: "Pr\u00E9visualisation" }) }), _jsx("div", { className: "p-4", children: !docUrl ? (_jsxs("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: ["Pas de lien document (document_url/document).", _jsx("br", {}), "Ajoute un champ `document_url` c\u00F4t\u00E9 backend si besoin."] })) : isPdf(docUrl) ? (_jsx("iframe", { title: "KYC Document Preview", src: docUrl, className: "w-full h-[520px] rounded-lg border border-gray-200 dark:border-gray-700" })) : isImage(docUrl) ? (_jsx("img", { src: docUrl, alt: "KYC Document", className: "max-h-[520px] w-full object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white" })) : (_jsx("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Format non pr\u00E9visualisable. Clique \u201COuvrir doc\u201D." })) })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6", children: [_jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(BadgeCheck, { className: "w-4 h-4 text-green-600" }), "Validation"] }), _jsxs("button", { disabled: actionBusy || selected.status === "approved", onClick: approve, className: `mt-4 w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg text-white transition ${actionBusy || selected.status === "approved"
                                                        ? "bg-green-400 cursor-not-allowed"
                                                        : "bg-green-600 hover:bg-green-700"}`, children: [_jsx(BadgeCheck, { className: "w-4 h-4" }), "Valider"] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6", children: [_jsxs("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(Ban, { className: "w-4 h-4 text-red-600" }), "Rejet"] }), _jsx("textarea", { value: rejectReason, onChange: (e) => setRejectReason(e.target.value), rows: 4, placeholder: "Raison du rejet (obligatoire)", className: "mt-3 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white" }), _jsxs("button", { disabled: actionBusy || selected.status === "rejected", onClick: reject, className: `mt-3 w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg text-white transition ${actionBusy || selected.status === "rejected"
                                                        ? "bg-red-400 cursor-not-allowed"
                                                        : "bg-red-600 hover:bg-red-700"}`, children: [_jsx(Ban, { className: "w-4 h-4" }), "Rejeter"] })] })] })] })) })] })] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
//src/pages/user/KYC.tsx
import { useEffect, useMemo, useState } from "react";
import { authFetch, authGet } from "../../utils/authFetch";
function formatDate(iso) {
    if (!iso)
        return "";
    try {
        return new Date(iso).toLocaleString();
    }
    catch {
        return iso;
    }
}
function statusLabel(status) {
    if (status === "pending")
        return "En attente";
    if (status === "approved")
        return "Approuvé";
    return "Rejeté";
}
function statusBadgeClasses(status) {
    if (status === "approved")
        return "bg-green-100 text-green-800 border-green-200";
    if (status === "rejected")
        return "bg-red-100 text-red-800 border-red-200";
    return "bg-amber-100 text-amber-800 border-amber-200";
}
function docLabel(doc) {
    switch (doc) {
        case "id_card":
            return "Carte d'identité";
        case "passport":
            return "Passeport";
        case "driver_license":
            return "Permis de conduire";
        default:
            return "Autre";
    }
}
export default function KYC() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [statusData, setStatusData] = useState(null);
    const [history, setHistory] = useState([]);
    const [documentType, setDocumentType] = useState("id_card");
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState(null);
    const isPending = statusData?.status === "pending";
    const isApproved = statusData?.status === "approved";
    const canSubmit = useMemo(() => {
        // On bloque si pending ou déjà approuvé
        if (isPending || isApproved)
            return false;
        return !!file;
    }, [file, isPending, isApproved]);
    async function refreshAll() {
        setLoading(true);
        setMessage(null);
        try {
            const st = await authGet("/api/scoring/user/kyc/status/");
            setStatusData(st.kyc);
            const li = await authGet("/api/scoring/user/kyc/requests/");
            setHistory(li.requests || []);
        }
        catch (e) {
            setMessage({ type: "error", text: e?.message || "Erreur lors du chargement KYC" });
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        refreshAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    async function onSubmit(e) {
        e.preventDefault();
        setMessage(null);
        if (!file) {
            setMessage({ type: "error", text: "Veuillez sélectionner un fichier." });
            return;
        }
        if (isPending) {
            setMessage({ type: "info", text: "Vous avez déjà une demande KYC en attente." });
            return;
        }
        if (isApproved) {
            setMessage({ type: "info", text: "Votre KYC est déjà approuvé." });
            return;
        }
        setSubmitting(true);
        try {
            const form = new FormData();
            form.append("document_type", documentType);
            form.append("document_file", file);
            const res = await authFetch("/api/scoring/user/kyc/submit/", {
                method: "POST",
                body: form,
            });
            // authFetch retourne Response
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const errMsg = data?.error ||
                    data?.detail ||
                    `Erreur (${res.status}) pendant la soumission KYC`;
                throw new Error(errMsg);
            }
            setMessage({ type: "success", text: "Demande KYC soumise avec succès." });
            setFile(null);
            await refreshAll();
        }
        catch (e) {
            setMessage({ type: "error", text: e?.message || "Erreur pendant la soumission KYC" });
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsx("div", { className: "min-h-screen bg-white text-slate-800", children: _jsxs("div", { className: "mx-auto w-full max-w-4xl px-4 py-8", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "V\u00E9rification KYC" }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: "T\u00E9l\u00E9chargez une pi\u00E8ce d\u2019identit\u00E9 pour activer les fonctionnalit\u00E9s avanc\u00E9es." })] }), message && (_jsx("div", { className: [
                        "mb-6 rounded-lg border p-4 text-sm",
                        message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "",
                        message.type === "error" ? "border-red-200 bg-red-50 text-red-800" : "",
                        message.type === "info" ? "border-blue-200 bg-blue-50 text-blue-800" : "",
                    ].join(" "), children: message.text })), _jsxs("div", { className: "mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-slate-500", children: "Statut actuel" }), loading ? (_jsx("div", { className: "mt-1 h-6 w-44 animate-pulse rounded bg-slate-100" })) : statusData ? (_jsxs("div", { className: "mt-1 flex items-center gap-2", children: [_jsx("span", { className: `inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClasses(statusData.status)}`, children: statusLabel(statusData.status) }), _jsxs("span", { className: "text-xs text-slate-500", children: [docLabel(statusData.document_type), " \u2022 soumis le ", formatDate(statusData.submitted_at)] })] })) : (_jsx("div", { className: "mt-1 text-sm text-slate-600", children: "Aucune demande soumise" }))] }), !loading && statusData?.status === "rejected" && statusData.rejection_reason ? (_jsxs("div", { className: "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800", children: ["Motif : ", statusData.rejection_reason] })) : null] }), !loading && statusData?.status === "pending" && (_jsx("div", { className: "mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800", children: "Votre document est en cours de v\u00E9rification. Vous serez notifi\u00E9 d\u00E8s qu\u2019un admin valide votre demande." })), !loading && statusData?.status === "approved" && (_jsx("div", { className: "mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800", children: "\u2705 Votre KYC est approuv\u00E9. Vous \u00EAtes maintenant v\u00E9rifi\u00E9." }))] }), _jsxs("div", { className: "mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Soumettre un document" }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Formats recommand\u00E9s : PDF, JPG, PNG. Assurez-vous que le document est lisible." }), _jsxs("form", { onSubmit: onSubmit, className: "mt-4 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", children: "Type de document" }), _jsxs("select", { value: documentType, onChange: (e) => setDocumentType(e.target.value), className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-300 focus:outline-none", disabled: loading || submitting || isPending || isApproved, children: [_jsx("option", { value: "id_card", children: "Carte d'identit\u00E9" }), _jsx("option", { value: "passport", children: "Passeport" }), _jsx("option", { value: "driver_license", children: "Permis de conduire" }), _jsx("option", { value: "other", children: "Autre" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", children: "Fichier" }), _jsx("input", { type: "file", onChange: (e) => setFile(e.target.files?.[0] || null), className: "block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800", disabled: loading || submitting || isPending || isApproved, accept: ".pdf,.png,.jpg,.jpeg,.webp" }), file && (_jsxs("div", { className: "mt-2 text-xs text-slate-500", children: ["S\u00E9lectionn\u00E9 : ", _jsx("span", { className: "font-medium text-slate-700", children: file.name }), " (", Math.round(file.size / 1024), " KB)"] }))] })] }), _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [_jsx("div", { className: "text-xs text-slate-500", children: isPending
                                                ? "Vous ne pouvez pas soumettre un nouveau document tant que la demande est en attente."
                                                : isApproved
                                                    ? "Votre KYC est approuvé. Aucune nouvelle soumission n’est nécessaire."
                                                    : "Vous pouvez soumettre un nouveau document si votre demande a été rejetée." }), _jsx("button", { type: "submit", disabled: !canSubmit || submitting || loading, className: [
                                                "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white",
                                                canSubmit && !submitting && !loading ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300 cursor-not-allowed",
                                            ].join(" "), children: submitting ? "Envoi..." : "Soumettre" })] })] })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Historique des demandes" }), _jsx("button", { onClick: refreshAll, className: "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50", disabled: loading, children: "Rafra\u00EEchir" })] }), loading ? (_jsxs("div", { className: "mt-4 space-y-2", children: [_jsx("div", { className: "h-10 animate-pulse rounded bg-slate-100" }), _jsx("div", { className: "h-10 animate-pulse rounded bg-slate-100" }), _jsx("div", { className: "h-10 animate-pulse rounded bg-slate-100" })] })) : history.length === 0 ? (_jsx("div", { className: "mt-4 text-sm text-slate-500", children: "Aucune demande KYC pour le moment." })) : (_jsx("div", { className: "mt-4 overflow-hidden rounded-lg border border-slate-200", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { className: "bg-slate-50 text-slate-600", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2", children: "ID" }), _jsx("th", { className: "px-4 py-2", children: "Document" }), _jsx("th", { className: "px-4 py-2", children: "Statut" }), _jsx("th", { className: "px-4 py-2", children: "Soumis" }), _jsx("th", { className: "px-4 py-2", children: "Trait\u00E9" })] }) }), _jsx("tbody", { children: history.map((k) => (_jsxs("tr", { className: "border-t border-slate-200", children: [_jsx("td", { className: "px-4 py-2 font-medium", children: k.id }), _jsx("td", { className: "px-4 py-2", children: docLabel(k.document_type) }), _jsxs("td", { className: "px-4 py-2", children: [_jsx("span", { className: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(k.status)}`, children: statusLabel(k.status) }), k.status === "rejected" && k.rejection_reason ? (_jsxs("div", { className: "mt-1 text-xs text-red-700", children: ["Motif: ", k.rejection_reason] })) : null] }), _jsx("td", { className: "px-4 py-2 text-slate-600", children: formatDate(k.submitted_at) }), _jsx("td", { className: "px-4 py-2 text-slate-600", children: k.reviewed_at ? formatDate(k.reviewed_at) : "-" })] }, k.id))) })] }) })), _jsx("div", { className: "mt-4 text-xs text-slate-500", children: "Astuce : si votre demande est rejet\u00E9e, soumettez un document plus lisible (photo nette, toutes les infos visibles)." })] })] }) }));
}

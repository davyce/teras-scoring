//src/pages/admin/AdminKYC.tsx

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BadgeCheck, Ban, CheckCircle2, Eye, RefreshCw, Search, ShieldCheck } from "lucide-react";
import adminApi, { KYCRequest, KYCStatus } from "../../services/adminApi";

type Notice = { type: "success" | "error"; text: string };

function statusLabel(status: KYCStatus) {
  if (status === "pending") return "En attente";
  if (status === "approved") return "Validé";
  return "Rejeté";
}

function statusClasses(status: KYCStatus) {
  if (status === "pending") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (status === "approved") return "bg-green-100 text-green-800 border-green-200";
  return "bg-red-100 text-red-800 border-red-200";
}

function isPdf(url: string) {
  return url.toLowerCase().includes(".pdf");
}
function isImage(url: string) {
  const u = url.toLowerCase();
  return u.includes(".png") || u.includes(".jpg") || u.includes(".jpeg") || u.includes(".webp");
}

export default function AdminKYC() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [selected, setSelected] = useState<KYCRequest | null>(null);

  const [statusFilter, setStatusFilter] = useState<KYCStatus | "all">("pending");
  const [search, setSearch] = useState("");

  const [rejectReason, setRejectReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const okStatus = statusFilter === "all" ? true : r.status === statusFilter;
      if (!okStatus) return false;
      if (!q) return true;

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
    if (!selected) return "";
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
    } catch (error: any) {
      setNotice({
        type: "error",
        text: error?.message || "Impossible de charger les demandes KYC.",
      });
    } finally {
      setLoading(false);
    }
  };

  const reloadSelected = async (kycId: number) => {
    const res = await adminApi.getKYCRequestDetail(kycId);
    if (res.data?.request) setSelected(res.data.request);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const approve = async () => {
    if (!selected) return;
    setActionBusy(true);
    try {
      const res = await adminApi.approveKYCRequest(selected.id);
      if (!res.data) {
        setNotice({ type: "error", text: res.error || "Erreur validation KYC." });
        return;
      }
      setNotice({ type: "success", text: "Demande KYC validée." });
      await load();
    } catch (error: any) {
      setNotice({
        type: "error",
        text: error?.message || "Erreur validation KYC.",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const reject = async () => {
    if (!selected) return;
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
    } catch (error: any) {
      setNotice({
        type: "error",
        text: error?.message || "Erreur rejet KYC.",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const openDoc = () => {
    if (!docUrl) return;
    window.open(docUrl, "_blank");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            KYC — Admin
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Validation / rejet + prévisualisation documents.
          </p>
        </div>

        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {notice && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
            notice.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{notice.text}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
          >
            <option value="all">Tous</option>
            <option value="pending">En attente</option>
            <option value="approved">Validées</option>
            <option value="rejected">Rejetées</option>
          </select>

          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (user, email, type doc, id...)"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Demandes ({filtered.length})
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">Aucune demande.</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[70vh] overflow-y-auto">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={async () => {
                    setSelected(r);
                    setRejectReason("");
                    await reloadSelected(r.id);
                  }}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition ${
                    selected?.id === r.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${statusClasses(
                            r.status
                          )}`}
                        >
                          {statusLabel(r.status)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">#{r.id}</span>
                      </div>

                      <div className="mt-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {r.user?.first_name || ""} {r.user?.last_name || ""}{" "}
                          <span className="text-gray-500 dark:text-gray-400 font-normal">
                            @{r.user?.username}
                          </span>
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {r.document_type || "Document"}
                        </p>
                      </div>
                    </div>

                    <Eye className="w-4 h-4 text-gray-400 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Détail */}
        <div className="lg:col-span-2 space-y-6">
          {!selected ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400">
              Sélectionne une demande KYC.
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${statusClasses(
                          selected.status
                        )}`}
                      >
                        {statusLabel(selected.status)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Demande #{selected.id}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                      {selected.user?.first_name || ""} {selected.user?.last_name || ""}{" "}
                      <span className="text-gray-500 dark:text-gray-400 font-normal">
                        @{selected.user?.username}
                      </span>
                    </h2>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selected.user?.email || "—"} • {selected.document_type || "Document"}
                    </p>
                  </div>

                  <button
                    onClick={openDoc}
                    disabled={!docUrl}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                      docUrl
                        ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 cursor-not-allowed opacity-70"
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Ouvrir doc
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Prévisualisation</p>
                </div>

                <div className="p-4">
                  {!docUrl ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Pas de lien document (document_url/document).<br />
                      Ajoute un champ `document_url` côté backend si besoin.
                    </div>
                  ) : isPdf(docUrl) ? (
                    <iframe
                      title="KYC Document Preview"
                      src={docUrl}
                      className="w-full h-[520px] rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  ) : isImage(docUrl) ? (
                    <img
                      src={docUrl}
                      alt="KYC Document"
                      className="max-h-[520px] w-full object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
                    />
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Format non prévisualisable. Clique “Ouvrir doc”.
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-green-600" />
                    Validation
                  </h3>

                  <button
                    disabled={actionBusy || selected.status === "approved"}
                    onClick={approve}
                    className={`mt-4 w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg text-white transition ${
                      actionBusy || selected.status === "approved"
                        ? "bg-green-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    <BadgeCheck className="w-4 h-4" />
                    Valider
                  </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Ban className="w-4 h-4 text-red-600" />
                    Rejet
                  </h3>

                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    placeholder="Raison du rejet (obligatoire)"
                    className="mt-3 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                  />

                  <button
                    disabled={actionBusy || selected.status === "rejected"}
                    onClick={reject}
                    className={`mt-3 w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg text-white transition ${
                      actionBusy || selected.status === "rejected"
                        ? "bg-red-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    Rejeter
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

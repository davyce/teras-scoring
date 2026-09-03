//src/pages/user/KYC.tsx
import React, { useEffect, useMemo, useState } from "react";
import { authFetch, authGet } from "../../utils/authFetch";

type KycStatus = "pending" | "approved" | "rejected";

type KycItem = {
  id: number;
  status: KycStatus;
  document_type: "id_card" | "passport" | "driver_license" | "other";
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason?: string | null;
};

type StatusResponse = {
  kyc: KycItem | null;
};

type ListResponse = {
  count: number;
  requests: KycItem[];
};

function formatDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusLabel(status: KycStatus) {
  if (status === "pending") return "En attente";
  if (status === "approved") return "Approuvé";
  return "Rejeté";
}

function statusBadgeClasses(status: KycStatus) {
  if (status === "approved") return "bg-green-100 text-green-800 border-green-200";
  if (status === "rejected") return "bg-red-100 text-red-800 border-red-200";
  return "bg-amber-100 text-amber-800 border-amber-200";
}

function docLabel(doc: KycItem["document_type"]) {
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

  const [statusData, setStatusData] = useState<KycItem | null>(null);
  const [history, setHistory] = useState<KycItem[]>([]);

  const [documentType, setDocumentType] = useState<KycItem["document_type"]>("id_card");
  const [file, setFile] = useState<File | null>(null);

  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const isPending = statusData?.status === "pending";
  const isApproved = statusData?.status === "approved";

  const canSubmit = useMemo(() => {
    // On bloque si pending ou déjà approuvé
    if (isPending || isApproved) return false;
    return !!file;
  }, [file, isPending, isApproved]);

  async function refreshAll() {
    setLoading(true);
    setMessage(null);
    try {
      const st = await authGet<StatusResponse>("/api/scoring/user/kyc/status/");
      setStatusData(st.kyc);

      const li = await authGet<ListResponse>("/api/scoring/user/kyc/requests/");
      setHistory(li.requests || []);
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Erreur lors du chargement KYC" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
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
        const errMsg =
          data?.error ||
          data?.detail ||
          `Erreur (${res.status}) pendant la soumission KYC`;
        throw new Error(errMsg);
      }

      setMessage({ type: "success", text: "Demande KYC soumise avec succès." });
      setFile(null);
      await refreshAll();
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Erreur pendant la soumission KYC" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Vérification KYC</h1>
          <p className="mt-1 text-sm text-slate-500">
            Téléchargez une pièce d’identité pour activer les fonctionnalités avancées.
          </p>
        </div>

        {message && (
          <div
            className={[
              "mb-6 rounded-lg border p-4 text-sm",
              message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "",
              message.type === "error" ? "border-red-200 bg-red-50 text-red-800" : "",
              message.type === "info" ? "border-blue-200 bg-blue-50 text-blue-800" : "",
            ].join(" ")}
          >
            {message.text}
          </div>
        )}

        {/* Statut */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-slate-500">Statut actuel</div>
              {loading ? (
                <div className="mt-1 h-6 w-44 animate-pulse rounded bg-slate-100" />
              ) : statusData ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClasses(statusData.status)}`}>
                    {statusLabel(statusData.status)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {docLabel(statusData.document_type)} • soumis le {formatDate(statusData.submitted_at)}
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-sm text-slate-600">Aucune demande soumise</div>
              )}
            </div>

            {!loading && statusData?.status === "rejected" && statusData.rejection_reason ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                Motif : {statusData.rejection_reason}
              </div>
            ) : null}
          </div>

          {!loading && statusData?.status === "pending" && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Votre document est en cours de vérification. Vous serez notifié dès qu’un admin valide votre demande.
            </div>
          )}

          {!loading && statusData?.status === "approved" && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              ✅ Votre KYC est approuvé. Vous êtes maintenant vérifié.
            </div>
          )}
        </div>

        {/* Formulaire upload */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Soumettre un document</h2>
          <p className="mt-1 text-sm text-slate-500">
            Formats recommandés : PDF, JPG, PNG. Assurez-vous que le document est lisible.
          </p>

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Type de document</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-300 focus:outline-none"
                  disabled={loading || submitting || isPending || isApproved}
                >
                  <option value="id_card">Carte d'identité</option>
                  <option value="passport">Passeport</option>
                  <option value="driver_license">Permis de conduire</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Fichier</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                  disabled={loading || submitting || isPending || isApproved}
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                />
                {file && (
                  <div className="mt-2 text-xs text-slate-500">
                    Sélectionné : <span className="font-medium text-slate-700">{file.name}</span> ({Math.round(file.size / 1024)} KB)
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                {isPending
                  ? "Vous ne pouvez pas soumettre un nouveau document tant que la demande est en attente."
                  : isApproved
                  ? "Votre KYC est approuvé. Aucune nouvelle soumission n’est nécessaire."
                  : "Vous pouvez soumettre un nouveau document si votre demande a été rejetée."}
              </div>

              <button
                type="submit"
                disabled={!canSubmit || submitting || loading}
                className={[
                  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white",
                  canSubmit && !submitting && !loading ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300 cursor-not-allowed",
                ].join(" ")}
              >
                {submitting ? "Envoi..." : "Soumettre"}
              </button>
            </div>
          </form>
        </div>

        {/* Historique */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Historique des demandes</h2>
            <button
              onClick={refreshAll}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
              disabled={loading}
            >
              Rafraîchir
            </button>
          </div>

          {loading ? (
            <div className="mt-4 space-y-2">
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
            </div>
          ) : history.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500">Aucune demande KYC pour le moment.</div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Document</th>
                    <th className="px-4 py-2">Statut</th>
                    <th className="px-4 py-2">Soumis</th>
                    <th className="px-4 py-2">Traité</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((k) => (
                    <tr key={k.id} className="border-t border-slate-200">
                      <td className="px-4 py-2 font-medium">{k.id}</td>
                      <td className="px-4 py-2">{docLabel(k.document_type)}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(k.status)}`}>
                          {statusLabel(k.status)}
                        </span>
                        {k.status === "rejected" && k.rejection_reason ? (
                          <div className="mt-1 text-xs text-red-700">Motif: {k.rejection_reason}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{formatDate(k.submitted_at)}</td>
                      <td className="px-4 py-2 text-slate-600">{k.reviewed_at ? formatDate(k.reviewed_at) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-500">
            Astuce : si votre demande est rejetée, soumettez un document plus lisible (photo nette, toutes les infos visibles).
          </div>
        </div>
      </div>
    </div>
  );
}

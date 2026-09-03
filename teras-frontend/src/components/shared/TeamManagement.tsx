// src/components/shared/TeamManagement.tsx
// Gestion d'équipe avec rôles et permissions — Banque / Entreprise / Gouvernement

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Trash2, CheckCircle, AlertCircle, Loader2, X,
  Shield, Edit2, Save, ChevronDown, ChevronUp, Mail, Phone,
  Eye, EyeOff, RefreshCw, Star, Lock, Unlock,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Permission {
  key: string;
  label: string;
  description: string;
  group: string;
}

interface StaffMember {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: string;
  role_label: string;
  status: string;
  interface: string;
  is_active: boolean;
  permissions: Record<string, boolean | number | string[]>;
  joined_at: string | null;
  last_active_at: string | null;
  created_at: string;
}

interface Role {
  value: string;
  label: string;
  description: string;
}

// ─── Config permissions ────────────────────────────────────────────────────────

const PERMISSION_GROUPS: Record<string, Permission[]> = {
  'Clients & Dossiers': [
    { key: 'can_view_clients',    label: 'Voir les clients',           description: 'Accéder à la liste et aux fiches clients',   group: 'Clients & Dossiers' },
    { key: 'can_create_clients',  label: 'Créer des clients',          description: 'Ajouter de nouveaux clients',                group: 'Clients & Dossiers' },
    { key: 'can_edit_clients',    label: 'Modifier les clients',       description: 'Mettre à jour les informations clients',     group: 'Clients & Dossiers' },
    { key: 'can_delete_clients',  label: 'Supprimer des clients',      description: 'Supprimer des fiches clients',               group: 'Clients & Dossiers' },
  ],
  'Crédits & Financement': [
    { key: 'can_approve_loans',   label: 'Approuver les crédits',      description: 'Valider les demandes de crédit',             group: 'Crédits & Financement' },
    { key: 'can_reject_loans',    label: 'Rejeter les crédits',        description: 'Refuser des demandes de crédit',             group: 'Crédits & Financement' },
  ],
  'Analytics & Rapports': [
    { key: 'can_view_analytics',  label: 'Voir les statistiques',      description: 'Accéder aux tableaux de bord et KPIs',       group: 'Analytics & Rapports' },
    { key: 'can_view_reports',    label: 'Voir les rapports',          description: 'Consulter les rapports générés',             group: 'Analytics & Rapports' },
    { key: 'can_generate_reports',label: 'Générer des rapports IA',    description: 'Lancer la génération de rapports IA',        group: 'Analytics & Rapports' },
    { key: 'can_export_data',     label: 'Exporter les données',       description: 'Télécharger des exports CSV/PDF',            group: 'Analytics & Rapports' },
  ],
  'Documents': [
    { key: 'can_view_documents',  label: 'Voir les documents',         description: 'Accéder aux documents uploadés',            group: 'Documents' },
    { key: 'can_upload_documents',label: 'Uploader des documents',     description: 'Importer des documents dans le système',    group: 'Documents' },
  ],
  'Administration': [
    { key: 'can_manage_team',     label: 'Gérer l\'équipe',           description: 'Inviter et gérer les membres du personnel',  group: 'Administration' },
  ],
};

// Couleurs par statut
const STATUS_COLORS: Record<string, string> = {
  active:    'bg-emerald-900/30 text-emerald-400 border border-emerald-700/40',
  inactive:  'bg-slate-800 text-slate-400',
  pending:   'bg-amber-900/30 text-amber-400 border border-amber-700/40',
  suspended: 'bg-rose-900/30 text-rose-400 border border-rose-700/40',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif', inactive: 'Inactif', pending: 'En attente', suspended: 'Suspendu',
};

// ─── Modal : Inviter un membre ────────────────────────────────────────────────

function InviteModal({
  interface: iface, roles, onClose, onSuccess
}: {
  interface: string; roles: Role[]; onClose: () => void; onSuccess: () => void;
}) {
  const [email, setEmail]         = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [role, setRole]           = useState(roles[0]?.value || '');
  const [customPerms, setCustomPerms] = useState<Record<string, boolean>>({});
  const [showCustomPerms, setShowCustomPerms] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleInvite = async () => {
    if (!email) { setError('Email requis.'); return; }
    if (!role)  { setError('Rôle requis.'); return; }
    setLoading(true); setError('');
    try {
      const res = await authFetch('/api/scoring/staff/invite/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, first_name: firstName, last_name: lastName, phone,
          role, interface: iface,
          permissions: customPerms,
        }),
      });
      const data = await res.json();
      if (res.ok) { onSuccess(); onClose(); }
      else setError(data.error || 'Erreur invitation.');
    } catch { setError('Erreur réseau.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400"/> Inviter un collaborateur
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-900/20 border border-rose-700/40 rounded-xl text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0"/>{error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 text-sm mb-1.5 block">Prénom</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Marie" className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600"/>
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1.5 block">Nom</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Ngouabi" className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600"/>
            </div>
          </div>

          <div>
            <label className="text-slate-300 text-sm mb-1.5 block">Email * <span className="text-slate-500 font-normal">(doit avoir un compte TERAS ou recevra une invitation)</span></label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="collaborateur@institution.cd" type="email"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600"/>
          </div>

          <div>
            <label className="text-slate-300 text-sm mb-1.5 block">Téléphone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+242 06 XXX XXXX"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600"/>
          </div>

          <div>
            <label className="text-slate-300 text-sm mb-1.5 block">Rôle *</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500">
              {roles.map(r => (
                <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
              ))}
            </select>
          </div>

          {/* Permissions personnalisées */}
          <div>
            <button onClick={() => setShowCustomPerms(!showCustomPerms)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
              {showCustomPerms ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
              Personnaliser les permissions (optionnel)
            </button>
            {showCustomPerms && (
              <div className="mt-3 space-y-3 max-h-48 overflow-y-auto bg-slate-800/40 rounded-xl p-3">
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                  <div key={group}>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5">{group}</p>
                    <div className="space-y-1.5">
                      {perms.map(perm => (
                        <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox"
                            checked={customPerms[perm.key] !== undefined ? !!customPerms[perm.key] : false}
                            onChange={e => setCustomPerms(p => ({ ...p, [perm.key]: e.target.checked }))}
                            className="w-3.5 h-3.5 accent-sky-500"/>
                          <span className="text-slate-300 text-xs">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition">
              Annuler
            </button>
            <button onClick={handleInvite} disabled={loading}
              className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Invitation...</>
                : <><Users className="w-4 h-4"/> Inviter</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal : Modifier permissions ────────────────────────────────────────────

function EditPermissionsModal({
  member, roles, onClose, onSuccess
}: {
  member: StaffMember; roles: Role[]; onClose: () => void; onSuccess: () => void;
}) {
  const [role, setRole]   = useState(member.role);
  const [perms, setPerms] = useState<Record<string, boolean | number>>({ ...member.permissions as any });
  const [status, setStatus] = useState(member.status);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      const res = await authFetch(`/api/scoring/staff/${member.id}/permissions/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, permissions: perms, status }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess('✅ Permissions mises à jour.'); setTimeout(() => { onSuccess(); onClose(); }, 1200); }
      else setError(data.error || 'Erreur.');
    } catch { setError('Erreur réseau.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400"/> Modifier les accès — {member.full_name}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <div className="flex items-center gap-2 px-3 py-2 bg-rose-900/20 border border-rose-700/40 rounded-xl text-rose-300 text-sm"><AlertCircle className="w-4 h-4"/>{error}</div>}
          {success && <div className="flex items-center gap-2 px-3 py-2 bg-emerald-900/20 border border-emerald-700/40 rounded-xl text-emerald-300 text-sm"><CheckCircle className="w-4 h-4"/>{success}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 text-sm mb-1.5 block">Rôle</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500">
                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1.5 block">Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500">
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
          </div>

          {/* Toutes les permissions */}
          <div>
            <p className="text-slate-400 text-sm font-medium mb-3">Permissions individuelles</p>
            <div className="space-y-4">
              {Object.entries(PERMISSION_GROUPS).map(([group, groupPerms]) => (
                <div key={group} className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{group}</p>
                  <div className="space-y-2">
                    {groupPerms.map(perm => (
                      <label key={perm.key} className="flex items-start gap-2.5 cursor-pointer group">
                        <input type="checkbox"
                          checked={!!perms[perm.key]}
                          onChange={e => setPerms(p => ({ ...p, [perm.key]: e.target.checked }))}
                          className="mt-0.5 w-4 h-4 accent-sky-500"/>
                        <div>
                          <p className="text-white text-xs font-medium group-hover:text-sky-300 transition">{perm.label}</p>
                          <p className="text-slate-500 text-xs">{perm.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Limite montant crédit si applicable */}
              {'max_loan_amount' in perms && (
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Limites</p>
                  <div>
                    <label className="text-slate-300 text-xs mb-1 block">Montant maximum crédit autorisé (FCFA)</label>
                    <input type="number" value={Number(perms.max_loan_amount) || 0}
                      onChange={e => setPerms(p => ({ ...p, max_loan_amount: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"/>
                    <p className="text-slate-500 text-xs mt-1">0 = pas de limite</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition">Annuler</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Sauvegarde...</>
              : <><Save className="w-4 h-4"/> Enregistrer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface TeamManagementProps {
  interface: 'bank' | 'enterprise' | 'government';
  title?: string;
}

export default function TeamManagement({ interface: iface, title }: TeamManagementProps) {
  const [staff, setStaff]           = useState<StaffMember[]>([]);
  const [roles, setRoles]           = useState<Role[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [error, setError]           = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchStaff = useCallback(async () => {
    try {
      const res  = await authFetch(`/api/scoring/staff/list/?interface=${iface}`);
      const data = await res.json();
      setStaff(data.staff || []);
      setRoles(data.roles || []);
    } catch { setError('Erreur chargement équipe.'); }
    finally { setLoading(false); }
  }, [iface]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleRemove = async (id: number, name: string) => {
    if (!confirm(`Retirer ${name} de l'équipe ?`)) return;
    try {
      await authFetch(`/api/scoring/staff/${id}/remove/`, { method: 'DELETE' });
      setSuccessMsg(`${name} retiré de l'équipe.`);
      fetchStaff();
    } catch { setError('Erreur suppression.'); }
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const INTERFACE_LABELS: Record<string, { title: string; color: string }> = {
    bank:       { title: 'Équipe Bancaire',        color: 'text-emerald-400' },
    enterprise: { title: 'Équipe Entreprise',       color: 'text-violet-400'  },
    government: { title: 'Équipe Gouvernement',     color: 'text-amber-400'   },
  };

  const cfg = INTERFACE_LABELS[iface] || { title: 'Équipe', color: 'text-sky-400' };

  return (
    <div className="space-y-6">
      {showInvite && (
        <InviteModal interface={iface} roles={roles}
          onClose={() => setShowInvite(false)} onSuccess={() => { fetchStaff(); setSuccessMsg('Invitation envoyée.'); setTimeout(() => setSuccessMsg(''), 4000); }}/>
      )}
      {editingMember && (
        <EditPermissionsModal member={editingMember} roles={roles}
          onClose={() => setEditingMember(null)} onSuccess={fetchStaff}/>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold text-white`}>{title || cfg.title}</h2>
          <p className="text-slate-400 text-sm mt-1">
            Gérez les accès et permissions de votre équipe — modifiables à tout moment
          </p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-semibold transition">
          <Plus className="w-4 h-4"/> Inviter un membre
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-700/40 rounded-xl">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0"/>
          <p className="text-emerald-300 text-sm">{successMsg}</p>
          <button onClick={() => setSuccessMsg('')} className="ml-auto"><X className="w-4 h-4 text-emerald-500"/></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-900/20 border border-rose-700/40 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0"/>
          <p className="text-rose-300 text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4 text-rose-500"/></button>
        </div>
      )}

      {/* Explication rôles */}
      {roles.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Rôles disponibles</p>
          <div className="grid grid-cols-2 gap-2">
            {roles.map(r => (
              <div key={r.value} className="flex items-start gap-2 text-xs">
                <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5"/>
                <div>
                  <span className="text-white font-medium">{r.label}</span>
                  <span className="text-slate-500 ml-1">— {r.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste staff */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 text-sky-400 animate-spin mr-2"/>
          <span className="text-slate-400">Chargement...</span>
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Users className="w-12 h-12 text-slate-700 mx-auto mb-3"/>
          <p className="text-slate-500 font-medium">Aucun membre dans l'équipe</p>
          <p className="text-slate-600 text-sm mt-1 mb-4">
            Invitez des collaborateurs pour déléguer les accès à votre interface TERAS
          </p>
          <button onClick={() => setShowInvite(true)}
            className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-400 rounded-xl text-sm transition">
            + Inviter mon premier collaborateur
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-sm px-1">
            <span>{staff.length} membre{staff.length > 1 ? 's' : ''}</span>
            <button onClick={fetchStaff} className="hover:text-white transition"><RefreshCw className="w-4 h-4"/></button>
          </div>

          {staff.map(member => (
            <div key={member.id}
              className={`border rounded-2xl p-4 transition-all ${
                member.status === 'suspended' ? 'border-rose-800/40 bg-rose-900/5'
                : member.status === 'pending' ? 'border-amber-800/40 bg-amber-900/5'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}>

              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm ${
                  member.status === 'active' ? 'bg-gradient-to-br from-sky-600 to-blue-700'
                  : 'bg-slate-700'
                }`}>
                  {(member.first_name || member.email).charAt(0).toUpperCase()}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold text-sm">{member.full_name}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-xs ${STATUS_COLORS[member.status] || STATUS_COLORS.inactive}`}>
                      {STATUS_LABELS[member.status] || member.status}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-lg border border-slate-700">
                      {member.role_label}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
                    <Mail className="w-3 h-3"/> {member.email}
                    {member.phone && <><Phone className="w-3 h-3 ml-2"/> {member.phone}</>}
                  </p>
                  {member.joined_at && (
                    <p className="text-slate-600 text-xs mt-0.5">
                      Rejoint le {new Date(member.joined_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setEditingMember(member)}
                    title="Modifier les permissions"
                    className="p-1.5 text-slate-500 hover:text-violet-400 hover:bg-violet-900/30 rounded-lg transition">
                    <Shield className="w-4 h-4"/>
                  </button>
                  <button onClick={() => handleRemove(member.id, member.full_name)}
                    className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              {/* Permissions résumées */}
              {member.is_active && member.permissions && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Object.entries(member.permissions)
                    .filter(([k, v]) => v === true && k.startsWith('can_'))
                    .slice(0, 5)
                    .map(([k]) => {
                      const label = Object.values(PERMISSION_GROUPS).flat().find(p => p.key === k)?.label || k;
                      return (
                        <span key={k} className="flex items-center gap-1 px-2 py-0.5 bg-emerald-900/30 border border-emerald-700/30 text-emerald-400 text-xs rounded-lg">
                          <CheckCircle className="w-2.5 h-2.5"/> {label}
                        </span>
                      );
                    })}
                  {Object.values(member.permissions).filter(v => v === true).length > 5 && (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-lg">
                      +{Object.values(member.permissions).filter(v => v === true).length - 5} autres
                    </span>
                  )}
                  {Number(member.permissions.max_loan_amount) > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-sky-900/30 border border-sky-700/30 text-sky-400 text-xs rounded-lg">
                      💰 Max: {(Number(member.permissions.max_loan_amount) / 1000).toFixed(0)}k FCFA
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

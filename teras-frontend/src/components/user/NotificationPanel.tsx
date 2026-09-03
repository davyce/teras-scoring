// src/components/user/NotificationPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/authFetch';
import {
  Bell, X, CheckCircle, AlertCircle, Package,
  Clock, Info, MailOpen, ArrowRight, RefreshCw,
} from 'lucide-react';

const TYPE_CFG: Record<string, { color: string; bg: string; Icon: React.ElementType; dot: string }> = {
  info:     { color: 'text-blue-400',    bg: 'bg-blue-500/10',    Icon: Info,        dot: 'bg-blue-400'    },
  offer:    { color: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: Package,     dot: 'bg-emerald-400' },
  reminder: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   Icon: Clock,       dot: 'bg-amber-400'   },
  alert:    { color: 'text-red-400',     bg: 'bg-red-500/10',     Icon: AlertCircle, dot: 'bg-red-400'     },
};

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 1)    return 'À l\'instant';
  if (diff < 60)   return `Il y a ${diff}min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: Props) {
  const navigate   = useNavigate();
  const panelRef   = useRef<HTMLDivElement>(null);
  const [msgs, setMsgs]       = useState<any[]>([]);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(false);

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Charger à l'ouverture
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    authFetch('/api/scoring/user/bank-messages/')
      .then(r => r.json())
      .then(d => { setMsgs(d.messages || []); setUnread(d.unread_count || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const markRead = async (id: number) => {
    await authFetch(`/api/scoring/user/bank-messages/${id}/read/`, { method: 'POST' });
    setMsgs(p => p.map(m => m.id === id ? { ...m, is_read: true } : m));
    setUnread(p => Math.max(0, p - 1));
  };

  const markAll = async () => {
    await authFetch('/api/scoring/user/bank-messages/read-all/', { method: 'POST' });
    setMsgs(p => p.map(m => ({ ...m, is_read: true })));
    setUnread(0);
  };

  if (!isOpen) return null;

  return (
    <div ref={panelRef}
      className="absolute top-full right-0 mt-2 w-96 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-sky-400" />
          <h3 className="text-white font-semibold text-sm">Notifications</h3>
          {unread > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAll}
              className="text-slate-400 hover:text-sky-400 text-xs flex items-center gap-1 transition-colors">
              <MailOpen className="w-3 h-3" /> Tout lire
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Bell className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm">Aucune notification</p>
            <p className="text-slate-600 text-xs mt-1">Vos messages bancaires apparaîtront ici</p>
          </div>
        ) : (
          msgs.map(msg => {
            const cfg = TYPE_CFG[msg.type] || TYPE_CFG.info;
            return (
              <div key={msg.id}
                onClick={() => { markRead(msg.id); navigate('/mes-messages'); onClose(); }}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors border-b border-slate-800/40 last:border-0 ${!msg.is_read ? 'bg-slate-800/30' : ''}`}>
                {/* Icône type */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                  <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium leading-snug ${!msg.is_read ? 'text-white' : 'text-slate-300'}`}>
                      {msg.subject}
                    </p>
                    {!msg.is_read && (
                      <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${cfg.dot}`} />
                    )}
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">{msg.body?.slice(0, 60)}…</p>
                  <p className="text-slate-600 text-xs mt-1">{timeAgo(msg.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80">
        <button
          onClick={() => { navigate('/mes-messages'); onClose(); }}
          className="w-full flex items-center justify-center gap-2 text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors">
          Voir tous les messages <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Hook pour le badge non-lu (utilisé dans la Navbar) ────────────────────────
export function useUnreadCount() {
  const [count, setCount] = useState(0);

  const refresh = () => {
    authFetch('/api/scoring/user/bank-messages/')
      .then(r => r.json())
      .then(d => setCount(d.unread_count || 0))
      .catch(() => {});
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000); // poll toutes 30s
    return () => clearInterval(interval);
  }, []);

  return { count, refresh };
}

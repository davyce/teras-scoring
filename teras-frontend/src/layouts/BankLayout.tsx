// src/layouts/BankLayout.tsx

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, CreditCard, FileText,
  TrendingUp, BarChart3, MessageSquare, Settings, LogOut,
  Menu, X, Clock, CheckCircle, XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import terasLogoUrl from '../assets/logo-teras.svg';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',       path: '/bank/dashboard'              },
  { icon: MessageSquare,   label: 'Assistant IA',    path: '/bank/chat', badge: 'IA'      },
  { icon: Users,           label: 'Clients',          path: '/bank/clients'                },
  { icon: Building2,       label: 'Entreprises',      path: '/bank/enterprises'            },
  { icon: CreditCard,      label: 'Produits',         path: '/bank/products'               },
  { icon: Clock,           label: 'En attente',       path: '/bank/applications/pending'   },
  { icon: CheckCircle,     label: 'Approuvées',       path: '/bank/applications/approved'  },
  { icon: XCircle,         label: 'Rejetées',         path: '/bank/applications/rejected'  },
  { icon: TrendingUp,      label: 'Portefeuille',     path: '/bank/portfolio'              },
  { icon: BarChart3,       label: 'Analytics',        path: '/bank/analytics'              },
  { icon: FileText,        label: 'Documents',        path: '/bank/documents'              },
  { icon: Settings,        label: 'Paramètres',       path: '/bank/settings'               },
];

export default function BankLayout() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-[#0b1220] flex">

      {/* ── Sidebar ── */}
      <aside
        className={`fixed left-0 top-0 h-full bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 transition-all duration-300 z-40 flex flex-col ${
          open ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div
              className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '0 0 18px rgba(56,189,248,0.45)' }}
            >
              {terasLogoUrl ? (
                <img src={terasLogoUrl} alt="TERAS" className="w-7 h-7" />
              ) : (
                <span className="text-sky-400 font-bold text-base">T</span>
              )}
            </div>
            {open && (
              <div>
                <p className="text-white font-bold text-sm leading-tight">TERAS</p>
                <p className="text-sky-400 text-xs">Interface Banque</p>
              </div>
            )}
          </div>
          {open && (
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toggle quand fermé */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="mx-auto mt-3 p-2 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {MENU_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={!open ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {open && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-500/30">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Utilisateur + Déconnexion */}
        <div className="p-3 border-t border-slate-800/50 space-y-2 flex-shrink-0">
          {open && user && (
            <div className="px-3 py-2 bg-slate-800/50 rounded-xl">
              <p className="text-white text-xs font-medium truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-slate-500 text-xs truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            title={!open ? 'Déconnexion' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border border-red-500/30 hover:border-red-500/50"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {open && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className={`flex-1 transition-all duration-300 min-h-screen ${open ? 'ml-64' : 'ml-20'}`}>
        <Outlet />
      </main>
    </div>
  );
}
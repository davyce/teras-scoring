// src/components/government/GovernmentLayout.tsx
import { Outlet } from 'react-router-dom';
import GovernmentSidebar from './GovernmentSidebar';

export default function GovernmentLayout() {
  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar fixe à gauche */}
      <GovernmentSidebar />

      {/* Contenu principal */}
      <main className="flex-1 ml-72 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
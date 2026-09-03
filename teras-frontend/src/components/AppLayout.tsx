// src/components/AppLayout.tsx
import { Outlet, NavLink } from "react-router-dom";
export default function AppLayout(){
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r p-4">
        <nav className="space-y-2">
          <NavLink to="/" className="block">Dashboard</NavLink>
          <NavLink to="/compute" className="block">Compute Score</NavLink>
          <NavLink to="/config" className="block">Config Manager</NavLink>
          <NavLink to="/profiles" className="block">Profils TERAS</NavLink>
        </nav>
      </aside>
      <main className="p-6"><Outlet/></main>
    </div>
  );
}

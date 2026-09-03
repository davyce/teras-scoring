// @ts-nocheck
//teras-frontend/src/pages/Splash.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TerasLogo from "../components/TerasLogo";

export default function Splash() {
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => nav("/home", { replace: true }), 1800);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] text-slate-100">
      <div className="flex flex-col items-center gap-4">
        <TerasLogo size={88} animate="float+pulse" className="drop-shadow-lg" />
        <div className="text-2xl tracking-wide">TERAS</div>
        <div className="text-slate-400 text-sm">Chargement…</div>
      </div>
    </div>
  );
}

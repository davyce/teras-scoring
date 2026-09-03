// src/pages/_legacy/Profiles.tsx
import { authFetch } from "../utils/authFetch";
export default function Profiles(){
  async function setProfile(p:string){ await authFetch("/api/config/",{method:"PUT",body:JSON.stringify({profile:p})}); alert(`Profil ${p} actif`); }
  return (
    <div className="space-x-2">
      <button onClick={()=>setProfile("basic")} className="border p-2">Basic</button>
      <button onClick={()=>setProfile("enterprise")} className="border p-2">Entreprise</button>
      <button onClick={()=>setProfile("regional")} className="border p-2">Régional</button>
    </div>
  );
}

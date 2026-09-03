// @ts-nocheck
//src/pages/ProfileSwitcher.tsx

import { useEffect, useState } from 'react'
import { authFetch } from '../utils/authFetch'

interface Props { onNavigate?: (page: string) => void }

export default function ProfileSwitcher({}: Props) {
  const [active, setActive] = useState<any>(null)
  const [profile, setProfile] = useState('basic')
  const [region, setRegion] = useState('CEMAC')
  const [country, setCountry] = useState('CG')
  const [regions, setRegions] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    authFetch('/config/').then(d => {
      setActive(d)
      setProfile(d.active_profile)
      if (d.region) setRegion(d.region)
      if (d.country) setCountry(d.country)
    })
    authFetch('/config/regions/').then(d => setRegions(d.available_regions || []))
  }, [])

  useEffect(() => {
    authFetch(`/config/countries/?region=${region}`).then(d => setCountries(d.available_countries || []))
  }, [region])

  async function save() {
    setMsg('')
    try {
      const body: any = { profile }
      if (profile === 'regional' || profile === 'country') body.region = region
      if (profile === 'country') body.country = country
      const res = await authFetch('/config/profile/', { method: 'PATCH', body: JSON.stringify(body) })
      setMsg('Profil actif mis à jour ✅')
      setActive((a: any) => ({ ...a, ...res }))
    } catch (e: any) {
      setMsg(e.message || 'Erreur')
    }
  }

  if (!active) return <div className="p-6 text-sm" style={{ color: '#9CB5DD' }}>Chargement…</div>

  return (
    <div className="p-6 space-y-4">
      <h2 style={{ color: '#EAF2FF' }}>Profil actif TERAS</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm" style={{ color:'#9CB5DD' }}>Profil</label>
          <select className="w-full px-3 py-2 rounded border" style={{ background:'#0F172A', color:'#EAF2FF', borderColor:'#1B2740' }}
            value={profile} onChange={(e)=>setProfile(e.target.value)}>
            <option value="basic">basic</option>
            <option value="enterprise">enterprise</option>
            <option value="regional">regional</option>
            <option value="country">country</option>
          </select>
        </div>
        <div>
          <label className="text-sm" style={{ color:'#9CB5DD' }}>Région</label>
          <select className="w-full px-3 py-2 rounded border" style={{ background:'#0F172A', color:'#EAF2FF', borderColor:'#1B2740' }}
            value={region} onChange={(e)=>setRegion(e.target.value)} disabled={!(profile==='regional' || profile==='country')}>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm" style={{ color:'#9CB5DD' }}>Pays</label>
          <select className="w-full px-3 py-2 rounded border" style={{ background:'#0F172A', color:'#EAF2FF', borderColor:'#1B2740' }}
            value={country} onChange={(e)=>setCountry(e.target.value)} disabled={profile!=='country'}>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 items-center">
        <button onClick={save} className="px-4 py-2 rounded" style={{ background:'#9BD2FF', color:'#0B1220' }}>Enregistrer</button>
        {msg && <span className="text-sm" style={{ color: '#9CB5DD' }}>{msg}</span>}
      </div>
      <div>
        <h3 className="mb-2" style={{ color:'#EAF2FF' }}>Actuel</h3>
        <pre className="text-xs p-3 rounded border overflow-auto" style={{ color:'#EAF2FF', background:'#0F172A', borderColor:'#223556' }}>
          {JSON.stringify(active, null, 2)}
        </pre>
      </div>
    </div>
  )
}

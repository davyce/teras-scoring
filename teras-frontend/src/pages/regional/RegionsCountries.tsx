// @ts-nocheck
//src/pages/RegionsCountries.tsx

import { useEffect, useState } from 'react'
import { authFetch } from '../utils/authFetch'

interface Props { onNavigate?: (page: string) => void }

export default function RegionsCountries({}: Props) {
  const [regions, setRegions] = useState<any>(null)
  const [region, setRegion] = useState('CEMAC')
  const [countries, setCountries] = useState<any>(null)

  useEffect(() => { authFetch('/config/regions/').then(setRegions) }, [])
  useEffect(() => { authFetch(`/config/countries/?region=${region}`).then(setCountries) }, [region])

  return (
    <div className="p-6 space-y-4">
      <h2 style={{ color:'#EAF2FF' }}>Régions & Pays</h2>
      <div>
        <label className="text-sm" style={{ color:'#9CB5DD' }}>Région</label>
        <select className="ml-2 px-3 py-2 rounded border" style={{ background:'#0F172A', color:'#EAF2FF', borderColor:'#1B2740' }}
          value={region} onChange={e=>setRegion(e.target.value)}>
          {(regions?.available_regions || ['CEMAC']).map((r: string) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="mb-2" style={{ color:'#EAF2FF' }}>Définitions régions</h3>
          <pre className="text-xs p-3 rounded border overflow-auto" style={{ color:'#EAF2FF', background:'#0F172A', borderColor:'#223556' }}>
            {JSON.stringify(regions, null, 2)}
          </pre>
        </div>
        <div>
          <h3 className="mb-2" style={{ color:'#EAF2FF' }}>Pays ({region})</h3>
          <pre className="text-xs p-3 rounded border overflow-auto" style={{ color:'#EAF2FF', background:'#0F172A', borderColor:'#223556' }}>
            {JSON.stringify(countries, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

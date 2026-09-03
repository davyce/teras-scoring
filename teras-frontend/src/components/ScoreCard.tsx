//teras-frontend/src/components/ScoreCard.tsx

export function ScoreCard() {
  return (
    <div
      className="p-6 rounded-2xl border"
      style={{
        backgroundColor: '#0F172A',
        borderColor: '#223556',
        boxShadow: '0 0 40px rgba(155,210,255,0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: '#9CB5DD' }}>Votre score TERAS</p>
        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#9BD2FF20', color: '#9BD2FF', border: '1px solid #9BD2FF30' }}>
          Actualisé
        </span>
      </div>
      <div className="flex items-end gap-4">
        <div>
          <div className="text-[48px]" style={{ color: '#EAF2FF', fontWeight: 800 }}>765</div>
          <div className="text-xs" style={{ color: '#9CB5DD' }}>Excellent</div>
        </div>
        <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: '#121A2C' }}>
          <div className="h-3 rounded-full" style={{ width: '76.5%', background: 'linear-gradient(90deg, #4ADE80, #9BD2FF)' }} />
        </div>
      </div>
      <div className="mt-4 text-xs grid grid-cols-5 gap-2" style={{ color: '#9CB5DD' }}>
        <span>T</span><span>E</span><span>R</span><span>A</span><span>S</span>
      </div>
    </div>
  )
}

import React, { useMemo } from 'react'

export default function AdminPanel() {
  const stats = useMemo(() => ({
    totalRides: 1245,
    activeDrivers: 87,
    passengers: 3421
  }), [])

  const topDrivers = useMemo(() => [
    { id:1, name: 'Carlos', rides: 142 },
    { id:2, name: 'Luisa', rides: 131 },
    { id:3, name: 'Pedro', rides: 119 }
  ], [])

  return (
    <div className="card">
      <h3>Panel Administrador - Resumen</h3>
      <div style={{display:'flex',gap:12,marginTop:12}}>
        <div style={{flex:1,background:'#fff',padding:12,borderRadius:8,border:'1px solid #f1f5f9'}}>
          <div style={{fontSize:12,color:'#6b7280'}}>Total viajes</div>
          <div style={{fontWeight:900,fontSize:22}}>{stats.totalRides}</div>
        </div>
        <div style={{flex:1,background:'#fff',padding:12,borderRadius:8,border:'1px solid #f1f5f9'}}>
          <div style={{fontSize:12,color:'#6b7280'}}>Conductores activos</div>
          <div style={{fontWeight:900,fontSize:22}}>{stats.activeDrivers}</div>
        </div>
        <div style={{flex:1,background:'#fff',padding:12,borderRadius:8,border:'1px solid #f1f5f9'}}>
          <div style={{fontSize:12,color:'#6b7280'}}>Pasajeros</div>
          <div style={{fontWeight:900,fontSize:22}}>{stats.passengers}</div>
        </div>
      </div>

      <div style={{marginTop:12}}>
        <h4>Conductores top</h4>
        <div style={{display:'flex',gap:12,alignItems:'end',marginTop:8}}>
          {/* Simple SVG bar chart */}
          <svg width="300" height="140" viewBox="0 0 300 140" preserveAspectRatio="none" style={{background:'#fff',borderRadius:8,padding:8}}>
            {topDrivers.map((d,i)=>{
              const max = Math.max(...topDrivers.map(t=>t.rides),1)
              const w = 60
              const h = (d.rides / max) * 90
              const x = 20 + i*(w+10)
              const y = 120 - h
              return (
                <g key={d.id}>
                  <rect x={x} y={y} width={w} height={h} rx={8} fill="#4f46e5" opacity={0.95} />
                  <text x={x + w/2} y={y - 6} fontSize="11" fontWeight="700" fill="#111" textAnchor="middle">{d.rides}</text>
                  <text x={x + w/2} y={132} fontSize="11" fill="#6b7280" textAnchor="middle">{d.name}</text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

    </div>
  )
}

import React, { useMemo } from 'react'

export default function DriverCalendar() {
  // Mocked stats for demo: days with number of passengers
  const data = useMemo(() => {
    const arr = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      arr.push({ date: d.toISOString().slice(0,10), rides: Math.floor(Math.random()*8) })
    }
    return arr
  }, [])

  return (
    <div className="card">
      <h4>Calendario conductor (últimos 7 días)</h4>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,marginTop:8}}>
        {data.map(d=> (
          <div key={d.date} style={{padding:8,background:'#fff',borderRadius:8,textAlign:'center',border:'1px solid #f1f5f9'}}>
            <div style={{fontSize:12,color:'#6b7280'}}>{d.date.slice(5)}</div>
            <div style={{fontWeight:800,fontSize:18}}>{d.rides}</div>
            <div style={{fontSize:12,color:'#9ca3af'}}>viajes</div>
          </div>
        ))}
      </div>
    </div>
  )
}

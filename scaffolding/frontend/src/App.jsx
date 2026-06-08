import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Slider from './components/Slider'
import About from './components/About'
import Testimonials from './components/Testimonials'
import Footer from './components/Footer'
import Login from './components/Login'
import Register from './components/Register'
import Reclamaciones from './components/Reclamaciones'
import Mapa from './components/Mapa'
import DriverCalendar from './components/DriverCalendar'
import AdminPanel from './components/AdminPanel'
import Privacy from './components/Privacy'
import Terms from './components/Terms'
import FloatingSupport from './components/FloatingSupport'



function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [rides, setRides] = useState([])
  useEffect(()=>{
    let mounted = true;
    let timer = null;
    async function load(){
      const token = localStorage.getItem('token')
      try{
        if (!user) return;
        let url = '';
        if (user.role === 'passenger') url = `/api/rides?passenger_id=${user.id}`;
        else if (user.role === 'driver') url = `/api/rides?status=pending`;
        if (!url) return;
        const r = await fetch(url, {headers: { Authorization: token? `Bearer ${token}` : '' }});
        const j = await r.json(); if (!mounted) return; setRides(j.rides||[]);
      }catch(e){console.error(e)}
    }
    // initial load
    load();
    // polling
    timer = setInterval(load, 5000);
    return ()=>{ mounted = false; if (timer) clearInterval(timer); }
  },[])

  if (!user) return <div className="auth-card">No autenticado. Por favor inicia sesión.</div>


  if (user.role === 'passenger') {
    return (
      <div className="dashboard auth-card">
        <div className="card">
          <h2>Panel Pasajero</h2>
          <div className="ride-form">

            <input id="origin" placeholder="Dirección de origen" />
            <input id="dest" placeholder="Dirección destino" />
            <input id="price" placeholder="Precio (opcional)" />
            <button className="btn" onClick={async ()=>{
              const origin = document.getElementById('origin').value;
              const dest = document.getElementById('dest').value;
              const price = document.getElementById('price').value;
              const token = localStorage.getItem('token');
              const resp = await fetch('/api/rides', {method:'POST',headers:{'Content-Type':'application/json', Authorization: token? `Bearer ${token}` : ''},body:JSON.stringify({origin_address:origin,dest_address:dest,price:price})});
              const j = await resp.json();
              if (j.ok) alert('Solicitud creada'); else alert('Error');
            }}>Pedir conductor</button>
          </div>
        </div>
        <div className="card" style={{marginTop:16}}>
          <h3>Mis solicitudes</h3>
          <div className="ride-list">
            {rides.map(r=> (
              <div key={r.id} className="ride-item">
                <div><strong>{r.status}</strong> <span className="small-muted">{r.requested_at}</span></div>
                <div>{r.origin_address} → {r.dest_address}</div>
                <div className="small-muted">Precio: {r.price || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (user.role === 'driver') {
    return (
      <div className="dashboard auth-card">
        <div className="card">
          <h2>Panel Conductor</h2>
          <div className="ride-list">
            {rides.map(r=> (
              <div key={r.id} className="ride-item">
                <div><strong>{r.status}</strong> <span className="small-muted">{r.requested_at}</span></div>
                <div>{r.origin_address} → {r.dest_address}</div>
                <div style={{marginTop:8}}>
                  <button className="btn" onClick={async ()=>{
                    const token = localStorage.getItem('token');
                    await fetch(`/api/rides/${r.id}/accept`,{method:'POST',headers:{'Content-Type':'application/json', Authorization: token? `Bearer ${token}` : ''}});
                    alert('Aceptado');
                  }}>Aceptar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <Mapa />
          <div style={{marginTop:12}}>
            <DriverCalendar />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard auth-card">
      <h2>Panel Administrador</h2>
      <div style={{display:'flex',gap:12,flexDirection:'column'}}>
        <AdminPanel />
      </div>
    </div>
  )
}

function getRoute() {
  const h = (window.location.hash || '#/').replace('#', '')
  return h || '/'
}

export default function App() {
  const [route, setRoute] = useState(getRoute())
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch(e){ return null }
  })

  useEffect(() => {
    function onHash() {
      setRoute(getRoute())
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="app-root">
      <Navbar />

      <main className="main-content">
        {route === '/login' && <Login />}
        {route === '/register' && <Register />}

        {(route === '/' || route === '') && (
          <>
            <section className="hero">
              <Slider />
            </section>

            {/* Action button placed before 'Nosotros' as requested */}
            {(user && user.role) && (
              <div style={{width:'100%',display:'flex',justifyContent:'center',margin:'18px 0'}}>
                <a href="#/dashboard" className="btn slider-action">{String((user.role||'').toLowerCase()) === 'passenger' ? 'Pedir' : 'Panel'}</a>
              </div>
            )}

            <section className="content-sections">
              <About />
              <Testimonials />
            </section>
          </>
        )}

        {route === '/dashboard' && <Dashboard />}
        {(route === '/reclamaciones' || route === '/libro-reclamaciones') && <Reclamaciones />}
        {route === '/politica' && <Privacy />}
        {route === '/terminos' && <Terms />}
      </main>




      <Footer />
    <FloatingSupport />
    </div>
  )
}

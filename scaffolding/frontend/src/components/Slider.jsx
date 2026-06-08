import React, { useEffect, useState } from 'react'

const slides = [
  {
    id: 1,
    title: 'Viaja con confianza',
    subtitle: 'Los mejores conductores a tu alcance',
    color: '#4f46e5',
    backgroundImage: '/images/Slider_1.mp4',
    ctaLabel: 'Ver viajes'
  },
  {
    id: 2,
    title: 'Rápido y seguro',
    subtitle: 'Llegadas puntuales y tarifas claras',
    color: '#06b6d4',
    backgroundImage: '/images/slider_2.mp4',
    ctaLabel: 'Cotizar ahora'
  },
  {
    id: 3,
    title: 'Tu ciudad, tu ruta',
    subtitle: 'Explora y solicita viajes en segundos',
    color: '#10b981',
    backgroundImage: '/images/logo.png',
    ctaLabel: 'Solicitar ruta'
  }
]

export default function Slider() {
  const [index, setIndex] = useState(0)
  const [user, setUser] = useState(() => {
    try { return (typeof window !== 'undefined') ? JSON.parse(localStorage.getItem('user') || 'null') : null } catch(e){ return null }
  })

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'user' || e.key === 'token') {
        try { setUser(JSON.parse(localStorage.getItem('user') || 'null')) } catch(e){ setUser(null) }
      }
    }
    window.addEventListener('storage', onStorage)
    // also update on hashchange as navigation may set user
    window.addEventListener('hashchange', () => { try { setUser(JSON.parse(localStorage.getItem('user') || 'null')) } catch(e){ setUser(null) } })
    return () => { window.removeEventListener('storage', onStorage) }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000)
    return () => clearInterval(t)
  }, [])

  // removed manual controls to keep hero clean on request

  return (
    <div className="slider">
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`slide ${i === index ? 'active' : ''}`}
          style={{
            backgroundColor: s.color,
            backgroundImage: s.backgroundImage && !s.backgroundImage.endsWith('.mp4') ? `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.18)), url(${s.backgroundImage})` : undefined
          }}
        >
          {s.backgroundImage && s.backgroundImage.endsWith('.mp4') && (
            <video className="slide-video" src={s.backgroundImage} autoPlay muted loop playsInline style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0}} />
          )}
          <div className="slide-overlay" />
          <div className="slide-content">
            <h3>{s.title}</h3>
            <p>{s.subtitle}</p>
            {/* CTAs removed as requested */}
          </div>
        </div>
      ))}

      {/* controls removed */}

    </div>
  )
}

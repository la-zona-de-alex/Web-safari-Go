import React, { useState, useEffect } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onResize() { if (window.innerWidth > 600) setOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    // lock body scroll when menu open
    try {
      if (open) document.body.classList.add('no-scroll')
      else document.body.classList.remove('no-scroll')
    } catch (e) {}
  }, [open])

  return (
    <header className={`navbar ${open ? 'menu-open' : ''}`}>

      <div className="nav-left">
        <div className="logo">
          <img src="/images/logo.gif" alt="Safari Go" className="logo-img" />
          <span className="logo-text">Safari Go</span>
        </div>
      </div>

      <button className="nav-toggle" aria-label="Menú" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        <svg width="26" height="20" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect className="h1" x="0" y="2" width="26" height="2" rx="1" fill="currentColor" />
          <rect className="h2" x="0" y="9" width="26" height="2" rx="1" fill="currentColor" />
          <rect className="h3" x="0" y="16" width="26" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>

      <div className="nav-right">
        {typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('user') ? (
          (() => {
            const u = JSON.parse(window.localStorage.getItem('user'))
            return (
              <>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{fontWeight:800}}>Bienvenido {u && (u.name || u.first_name || u.email)}</div>
                  <button className="nav-btn nav-btn-ghost" onClick={() => { localStorage.removeItem('user'); localStorage.removeItem('token'); window.location.hash = '#/'; window.location.reload(); }}>
                    Cerrar sesión
                  </button>
                </div>
              </>
            )
          })()
        ) : (
          <>
            <a href="#/login" className="nav-btn nav-btn-ghost">Iniciar sesión</a>
            <a href="#/register" className="nav-btn nav-btn-primary">Registrarse</a>
          </>
        )}
      </div>

      <div className={`mobile-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <div className={`mobile-menu ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="modal-notice">
          <div className="modal-head">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="modal-icon" aria-hidden="true">
              <path d="M12 2a5 5 0 00-5 5v1H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 11h8M10 15h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <h3 className="modal-title">Accede o regístrate</h3>
              <p className="modal-desc">Inicia sesión para continuar o regístrate si aún no tienes cuenta.</p>
            </div>
          </div>

          <div className="modal-actions">
            <a href="#/login" onClick={() => setOpen(false)} className="nav-btn nav-btn-ghost">Iniciar sesión</a>
            <a href="#/register" onClick={() => setOpen(false)} className="nav-btn nav-btn-primary">Registrarse</a>
          </div>
        </div>
      </div>
    </header>
  )
}

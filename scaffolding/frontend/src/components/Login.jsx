// Componente Login: formulario de acceso de usuario
import React, { useEffect, useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // animación de entrada
    const el = document.querySelector('.auth-card')
    if (el) el.classList.add('auth-enter')
  }, [])

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
  
  function googleSignIn() {
    const width = 600, height = 700;
    const left = (screen.width/2)-(width/2);
    const top = (screen.height/2)-(height/2);
    const popup = window.open(API_BASE + '/api/auth/google', 'GoogleSignIn', `width=${width},height=${height},left=${left},top=${top}`);
    // listener will handle the postMessage from popup
    const cleanup = () => { try { window.removeEventListener('message', onMessage) } catch(e){} };
    function onMessage(e) {
      const origin = import.meta.env.VITE_FRONTEND_ORIGIN || 'http://localhost:5175';
      if (String(e.origin).indexOf(origin) !== 0) return;
      const data = e.data || {};
      if (data && data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        cleanup();
        try { if (popup) popup.close(); } catch(e){}
        window.location.hash = '#/';
      }
    }
    window.addEventListener('message', onMessage);
    // fallback: if popup closed without message, cleanup
    const checkPopup = setInterval(()=>{ if (popup && popup.closed) { clearInterval(checkPopup); cleanup() } }, 500);
  }

  function submit(e) {

    e.preventDefault()
    // fake validation for demo
    if (!email || !password) return setMsg('Completa todos los campos')
    setMsg(`Intentando iniciar sesión con ${email}`)
  }

  async function doLogin(e) {
    e.preventDefault()
    if (!email || !password) return setMsg('Completa todos los campos')
    setMsg('Iniciando...')
    setLoading(true)
    const el = document.querySelector('.auth-card')
    if (el) el.classList.add('auth-submitting')
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:4000') + '/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'login failed')
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setMsg('Login OK')
      // redirect to home so user sees main menu; welcome will show name
      window.location.hash = '#/'
    } catch (e) {
      setMsg(e.message)
      setLoading(false)
      const el2 = document.querySelector('.auth-card')
      if (el2) el2.classList.remove('auth-submitting')
    }
  }

  return (
    <div className="auth-card">
      <h2>Iniciar sesión</h2>
      <form onSubmit={doLogin}>
        <label>Email</label>
        <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        <label>Contraseña</label>
        <input required value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        <button type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
      </form>
      <div style={{marginTop:12,display:'flex',gap:8,alignItems:'center'}}>
        <button className="nav-btn nav-btn-primary" onClick={googleSignIn} style={{display:'flex',alignItems:'center',gap:8}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.6 12.227c0-.69-.062-1.354-.176-1.998H12v3.786h5.4c-.233 1.26-1.03 2.33-2.197 3.05v2.53h3.55c2.07-1.905 3.27-4.72 3.27-8.368z" fill="#4285F4"/><path d="M12 22c2.97 0 5.466-.98 7.288-2.66l-3.55-2.53c-.98.66-2.24 1.05-3.738 1.05-2.874 0-5.31-1.94-6.18-4.56H2.15v2.86C3.97 19.9 7.73 22 12 22z" fill="#34A853"/><path d="M5.82 13.8A7.992 7.992 0 0 1 5.5 12c0-.66.1-1.3.28-1.9V7.24H2.15A11.98 11.98 0 0 0 .5 12c0 1.98.5 3.86 1.65 5.52l3.67-3.72z" fill="#FBBC05"/><path d="M12 6.5c1.62 0 3.08.56 4.23 1.66l3.17-3.17C17.45 2.86 15.01 2 12 2 7.73 2 3.97 4.1 2.15 7.24l3.67 2.86C6.69 8.44 9.126 6.5 12 6.5z" fill="#EA4335"/></svg>
          Ingresar con Google
        </button>
      </div>
      {msg && <div className="auth-msg">{msg}</div>}
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'

export default function FloatingSupport(){
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('support_chat') || '[]') } catch(e){ return [] }
  })
  const [input, setInput] = useState('')
  const listRef = useRef(null)

  useEffect(()=>{ localStorage.setItem('support_chat', JSON.stringify(messages)) }, [messages])

  useEffect(()=>{ if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [open, messages])

  function send(msg){
    if (!msg || !msg.trim()) return
    const m = { id: Date.now(), role: 'user', text: msg.trim(), created_at: new Date().toISOString() }
    setMessages(prev => [...prev, m])
    setInput('')
    // simple canned agent reply
    setTimeout(()=>{
      const reply = { id: Date.now()+2, role: 'agent', text: 'Gracias por contactarnos. Nuestro equipo responderá pronto.', created_at: new Date().toISOString() }
      setMessages(prev => [...prev, reply])
    }, 800)
  }

  const [showSvg, setShowSvg] = useState(true)

  return (
    <>
      <button className="floating-support" title="Soporte" onClick={()=>setOpen(v=>!v)}>
        {showSvg ? (
          <img src="/images/support.svg" alt="Soporte" style={{width:32,height:32,objectFit:'cover',borderRadius:8}} onError={() => setShowSvg(false)} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 8v8a2 2 0 0 1-2 2h-1v-5a2 2 0 0 0-2-2H9V8a2 2 0 0 1 2-2h8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 6h6l2 2h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div className={`chat-modal ${open ? 'open' : ''}`} role="dialog" aria-hidden={!open}>
        <div className="chat-window card">
          <div className="chat-header">Soporte</div>
          <div className="chat-body" ref={listRef}>
            {messages.length === 0 && (
              <div style={{color:'var(--muted)'}}>Escribe tu consulta y presiona enviar.</div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`chat-msg ${m.role === 'user' ? 'user' : 'agent'}`}>
                <div style={{fontSize:13,marginBottom:6,color:'rgba(0,0,0,0.6)'}}>{m.role === 'user' ? 'Tú' : 'Soporte'}</div>
                <div style={{whiteSpace:'pre-wrap'}}>{m.text}</div>
              </div>
            ))}
          </div>
          <form className="chat-input" onSubmit={(e)=>{ e.preventDefault(); send(input) }}>
            <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Escribe un mensaje" />
            <button type="submit">Enviar</button>
          </form>
        </div>
      </div>
    </>
  )
}

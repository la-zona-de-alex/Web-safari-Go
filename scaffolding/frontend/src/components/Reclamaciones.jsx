import React, { useState } from 'react'

export default function Reclamaciones() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    asunto: '',
    descripcion: '',
  })
  const [message, setMessage] = useState(null)

  return (
      <div className="auth-card auth-enter">
      <h2>Libro de Reclamaciones</h2>
      <p className="auth-msg">Completa el formulario para registrar tu reclamación.</p>

      <form

        onSubmit={(e) => {
          e.preventDefault()
          // No hay backend específico en el repo actual: guardamos en memoria.
          setMessage({ type: 'ok', text: 'Reclamación registrada. (Demo sin backend)' })
          setForm({ nombre: '', email: '', asunto: '', descripcion: '' })
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={form.nombre}
            onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
            placeholder="Nombre"
            required
          />
          <input
            value={form.email}
            type="email"
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            placeholder="Email"
            required
          />
          <input
            value={form.asunto}
            onChange={(e) => setForm((s) => ({ ...s, asunto: e.target.value }))}
            placeholder="Asunto"
            required
          />
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm((s) => ({ ...s, descripcion: e.target.value }))}
            placeholder="Descripción"
            required
            rows={5}
            style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', resize: 'vertical' }}
          />

          <button type="submit" className="btn">
            Enviar reclamación
          </button>
        </div>
      </form>

      {message && (
        <div className={message.type === 'ok' ? 'auth-msg' : 'auth-msg'} style={{ marginTop: 12 }}>
          {message.text}
        </div>
      )}
    </div>
  )
}


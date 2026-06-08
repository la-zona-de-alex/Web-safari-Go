import React, { useMemo, useState, useRef, useEffect } from 'react'

const comments = [
  { id: 1, name: 'Ana', text: 'Excelente servicio, conductor muy amable.', avatar: '/images/logo.png' },
  { id: 2, name: 'Luis', text: 'Llegaron rápido y el viaje fue cómodo.', avatar: '/images/logo.png' },
  { id: 3, name: 'María', text: 'Buena experiencia y precios justos.', avatar: '/images/logo.png' },
  { id: 4, name: 'Jorge', text: 'Muy buena atención y precio justo.', avatar: '/images/logo.png' },
  { id: 5, name: 'Lucía', text: 'Recomiendo Safari Go a mis amigos.', avatar: '/images/logo.png' }
]

export default function Testimonials() {
  const [slides, setSlides] = useState([])
  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window === 'undefined') return 3
    const w = window.innerWidth
    if (w <= 520) return 1
    if (w <= 900) return 2
    return 3
  })
  const [index, setIndex] = useState(0)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const trackRef = useRef(null)
  const autoplayRef = useRef(null)
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // fetch comments from backend on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('http://localhost:4000/api/comments');
        const data = await res.json();
        const arr = (data && data.comments && Array.isArray(data.comments)) ? data.comments : comments;
        setSlides(arr);
        try { localStorage.setItem('safari_comments', JSON.stringify(arr)) } catch (e) {}
      } catch (e) {
        const saved = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('safari_comments') || 'null') : null
        setSlides(Array.isArray(saved) ? saved : comments)
      }
    }
    load();
  }, [])

  useEffect(() => {
    function onResize() {
      const w = window.innerWidth
      if (w <= 520 && visibleCount !== 1) setVisibleCount(1)
      else if (w > 520 && w <= 900 && visibleCount !== 2) setVisibleCount(2)
      else if (w > 900 && visibleCount !== 3) setVisibleCount(3)
    }
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [visibleCount])

  function getMaxIndex() {
    return Math.max(0, slides.length - visibleCount)
  }

  function prev() {
    setIndex((i) => {
      const ni = i - 1
      const max = getMaxIndex()
      if (ni < 0) return max
      return ni
    })
  }

  function next() {
    setIndex((i) => {
      const ni = i + 1
      const max = getMaxIndex()
      if (ni > max) return 0
      return ni
    })
  }

  useEffect(() => {
    // autoplay
    autoplayRef.current = setInterval(() => {
      setIndex(i => {
        const ni = i + 1
        const max = getMaxIndex()
        if (ni > max) return 0
        return ni
      })
    }, 3500)
    return () => clearInterval(autoplayRef.current)
  }, [slides.length, visibleCount])

  // pause on hover
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    function onEnter() { clearInterval(autoplayRef.current) }
    function onLeave() {
      const localMax = getMaxIndex()
      autoplayRef.current = setInterval(() => {
        setIndex(i => {
          const ni = i + 1
          if (ni > localMax) return 0
          return ni
        })
      }, 3500)
    }
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [slides.length, visibleCount])

  // compute translate percent based on index and visibleCount
  const cardPercent = 100 / visibleCount
  let translate = -(index * cardPercent)
  // clamp so last visible aligns correctly
  const maxIndex = getMaxIndex()
  if (index > maxIndex) translate = -(maxIndex * cardPercent)

  return (
    <section className="testimonials" id="testimonials">
      <div className="testimonials-header">
        <h2>Comentarios</h2>
        <div className="testimonials-controls">
          <button className="testimonials-btn" onClick={prev} aria-label="Anterior">◀</button>
          <button className="testimonials-btn" onClick={next} aria-label="Siguiente">▶</button>
        </div>
      </div>

      <div className={`test-slider visible-${visibleCount}`} aria-live="polite">
        <div ref={trackRef} className="test-track" style={{ transform: `translateX(${translate}%)` }}>
          {slides.map((c) => (
            <div key={c.id} className={`test-card`}>
              <img className="test-avatar" src={c.avatar} alt={`Avatar de ${c.name}`} />
              <div className="test-body">
                <strong className="test-name">{c.name}</strong>
                <p className="test-text">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {user ? (
        <div className="test-form card" style={{marginTop:12}}>
          <h3>Deja tu comentario</h3>
          <form onSubmit={async (e)=>{
            e.preventDefault();
            const author = (user && (user.name || user.email)) || name || 'Anónimo'
            if (!text.trim()) return alert('Comentario requerido');
            try {
              const res = await fetch('http://localhost:4000/api/comments', {
                method: 'POST',
                headers: Object.assign({'Content-Type':'application/json'}, token ? { Authorization: `Bearer ${token}` } : {}),
                body: JSON.stringify({ name: author, text: text.trim(), avatar: '/images/logo.png' })
              })
              const data = await res.json();
              if (data && data.comment) {
                const next = [...slides, data.comment];
                setSlides(next);
                try{ localStorage.setItem('safari_comments', JSON.stringify(next)) }catch(e){}
                setText('');
              } else {
                alert('Error al enviar comentario');
              }
            } catch (err) {
              console.error(err);
              alert('Error al enviar comentario');
            }
          }}>
            <div style={{marginBottom:8,color:'var(--muted)'}}>Comentando como <strong>{(user && (user.name || user.email)) || 'Usuario'}</strong></div>
            <textarea placeholder="Tu comentario" value={text} onChange={(e)=>setText(e.target.value)} rows={3} />
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <button className="btn" type="submit">Enviar</button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}


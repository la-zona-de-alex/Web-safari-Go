import React from 'react'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-row">
        <div className="footer-left">
          <img src="/images/logo.gif" alt="Safari Go" className="footer-logo" />
          <span className="footer-logo-text">Safari Go</span>
        </div>

        <div className="footer-right">
          <div className="footer-links">
            <a href="#/politica" className="footer-link">
              Política de Privacidad
            </a>
            <a href="#/terminos" className="footer-link">
              Términos de Uso
            </a>
          </div>

          <div className="footer-legal">
            <a className="footer-link" href="#/libro-reclamaciones">
              Libro de reclamaciones
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div>© {new Date().getFullYear()} Safari Go. Todos los derechos reservados</div>
        <div>Contacto: support@safarigo.example</div>
      </div>
    </footer>
  )
}


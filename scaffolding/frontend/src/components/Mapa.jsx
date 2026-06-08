import React, { useEffect, useRef } from 'react'
import L from 'leaflet'

export default function Mapa() {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) return

    const map = L.map(mapRef.current, {
      center: [40.4168, -3.7038],
      zoom: 12,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const marker = L.marker([40.4168, -3.7038]).addTo(map)
    marker.bindPopup('Ubicación del mapa').openPopup()

    return () => {
      map.remove()
    }
  }, [])

  return (
    <div className="map-card">
      <h3>Mapa</h3>
      <div className="map" ref={mapRef} />
    </div>
  )
}


import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSanSalvadorWeather } from '../services/weatherService';

function describeWeather(code) {
  if (code === 0) return 'Despejado';
  if ([1, 2, 3].includes(code)) return 'Parcialmente nublado';
  if ([45, 48].includes(code)) return 'Niebla';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Llovizna';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Lluvia';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Nieve';
  if ([95, 96, 99].includes(code)) return 'Tormenta';
  return 'Condiciones variables';
}

function weatherIcon(code) {
  if ([95, 96, 99].includes(code)) return 'bi-cloud-lightning-rain';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'bi-cloud-rain';
  if ([45, 48].includes(code)) return 'bi-cloud-fog';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'bi-cloud-snow';
  if ([1, 2, 3].includes(code)) return 'bi-cloud-sun';
  return 'bi-sun';
}

export default function WeatherSidebar({ open, onClose }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    setLoading(true);
    setError('');
    getSanSalvadorWeather()
      .then(data => {
        if (!cancelled) setWeather(data.current);
      })
      .catch(requestError => {
        if (!cancelled) setError(requestError.message || 'No se pudo consultar el clima.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="weather-drawer-layer">
      <button
        type="button"
        className="weather-drawer-backdrop"
        aria-label="Cerrar panel del clima"
        onClick={onClose}
      />
      <aside className="weather-drawer" role="dialog" aria-modal="true" aria-labelledby="weather-drawer-title">
        <div className="weather-drawer-header">
          <div>
            <span className="weather-drawer-eyebrow">EL SALVADOR</span>
            <h2 id="weather-drawer-title">Clima actual</h2>
          </div>
          <button type="button" className="weather-drawer-close" onClick={onClose} aria-label="Cerrar">
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>

        <div className="weather-drawer-location">
          <i className="bi bi-geo-alt-fill" aria-hidden="true"></i>
          <span>San Salvador</span>
        </div>

        {loading && (
          <div className="weather-drawer-state" role="status">
            <span className="spinner-border spinner-border-sm text-danger" aria-hidden="true"></span>
            <span>Consultando el clima…</span>
          </div>
        )}

        {error && <div className="weather-drawer-error" role="alert">{error}</div>}

        {!loading && weather && (
          <div className="weather-drawer-current">
            <i className={`bi ${weatherIcon(weather.weather_code)}`} aria-hidden="true"></i>
            <div className="weather-drawer-temperature">{Math.round(weather.temperature_2m)}<span>°C</span></div>
            <div className="weather-drawer-description">{describeWeather(weather.weather_code)}</div>
            <div className="weather-drawer-humidity">
              <i className="bi bi-droplet-fill" aria-hidden="true"></i>
              Humedad <strong>{weather.relative_humidity_2m}%</strong>
            </div>
          </div>
        )}

        <section className={`weather-map-section${mapExpanded ? ' is-expanded' : ''}`} aria-labelledby="weather-map-title">
          <div className="weather-map-heading">
            <div>
              <h3 id="weather-map-title">Torre Futura</h3>
              <p>San Salvador, El Salvador</p>
            </div>
            <button
              type="button"
              className="weather-map-expand"
              onClick={() => setMapExpanded(expanded => !expanded)}
              aria-expanded={mapExpanded}
              aria-label={mapExpanded ? 'Reducir mapa' : 'Expandir mapa'}
            >
              <i className={`bi ${mapExpanded ? 'bi-arrows-angle-contract' : 'bi-arrows-angle-expand'}`} aria-hidden="true"></i>
              <span>{mapExpanded ? 'Reducir' : 'Expandir'}</span>
            </button>
          </div>
          <div className="weather-map-frame">
            <iframe
              title="Mapa de El Salvador con ubicación en Torre Futura, San Salvador"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-89.2550%2C13.7020%2C-89.2400%2C13.7125&layer=mapnik&marker=13.7070%2C-89.2475"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            className="weather-map-open-link"
            href="https://www.openstreetmap.org/?mlat=13.7070&mlon=-89.2475#map=16/13.7070/-89.2475"
            target="_blank"
            rel="noreferrer"
          >
            <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>Ver mapa completo
            <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i>
          </a>
        </section>

        <p className="weather-drawer-credit">Clima: Open-Meteo · Mapa: OpenStreetMap</p>
        <Link className="weather-drawer-link" to="/clima" onClick={onClose}>
          Ver pronóstico completo <i className="bi bi-arrow-up-right" aria-hidden="true"></i>
        </Link>
      </aside>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
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

export default function WeatherPage() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapExpanded, setMapExpanded] = useState(false);

  const refreshWeather = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setWeather(await getSanSalvadorWeather());
    } catch (requestError) {
      setError(requestError.message || 'Ocurrió un error al consultar el clima.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWeather();
  }, [refreshWeather]);

  const current = weather?.current;
  const updatedAt = current?.time
    ? new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(current.time))
    : '';

  return (
    <div className="kfc-app-container">
      <Header title="Clima meteorológico" showCart={false} />
      <main className="kfc-main-content">
        <section className="container py-4" aria-labelledby="weather-title">
          <div className="row justify-content-center">
            <div className="col-12 col-xl-9">
              <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                <div>
                  <span className="text-danger fw-bold text-uppercase small">Pronóstico actual</span>
                  <h1 id="weather-title" className="kfc-script-font display-5 mb-1">Clima en San Salvador</h1>
                  <p className="text-muted mb-0">Condiciones meteorológicas actuales.</p>
                </div>
                <button className="btn btn-outline-danger" type="button" onClick={refreshWeather} disabled={loading}>
                  <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>Actualizar
                </button>
              </div>

              {error && <div className="alert alert-warning" role="alert">{error}</div>}

              {loading && (
                <div className="kfc-content-card text-center py-5" role="status">
                  <div className="spinner-border text-danger" aria-hidden="true"></div>
                  <p className="text-muted mt-3 mb-0">Consultando el clima…</p>
                </div>
              )}

              {!loading && current && (
                <div className="kfc-content-card p-4 p-md-5">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 border-bottom pb-4">
                    <div>
                      <h2 className="h3 mb-1">San Salvador, El Salvador</h2>
                      {updatedAt && <p className="text-muted mb-0">Actualizado: {updatedAt}</p>}
                    </div>
                    <i className={`bi ${weatherIcon(current.weather_code)} text-danger`} style={{ fontSize: '3rem' }} aria-hidden="true"></i>
                  </div>

                  <div className="row align-items-center g-4 py-4">
                    <div className="col-12 col-md-6 text-center text-md-start">
                      <div className="display-1 fw-semibold">{Math.round(current.temperature_2m)}°C</div>
                      <div className="fs-4">{describeWeather(current.weather_code)}</div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="bg-light rounded-3 p-4 h-100">
                        <i className="bi bi-droplet text-primary me-2" aria-hidden="true"></i>
                        <span className="text-muted">Humedad relativa</span>
                        <div className="fs-2 fw-semibold">{current.relative_humidity_2m}%</div>
                      </div>
                    </div>
                  </div>

                  <section className={`weather-map-section${mapExpanded ? ' is-expanded' : ''} weather-map-page`} aria-labelledby="weather-map-title">
                    <div className="weather-map-heading">
                      <div>
                        <span className="weather-drawer-eyebrow">PUNTO DE REFERENCIA</span>
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

                  <p className="small text-muted border-top pt-3 mt-4 mb-0">
                    Datos meteorológicos proporcionados por <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>. Mapa de <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">OpenStreetMap</a>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WeatherSidebar from './WeatherSidebar';
import './weather-sidebar.css';

export default function Header({ title = null, showCart = true, dashboardStyle = false }) {
  const { logout, cart, user, ROLES } = useAuth();
  const [weatherOpen, setWeatherOpen] = useState(false);

  const totalItems = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const isAdmin = user?.rol === ROLES.ADMIN;
  const homePath = isAdmin ? '/admin' : '/cajero';

  return (
    <>
      <header className={`kfc-header-bar${isAdmin ? ' kfc-header-admin' : ''}${dashboardStyle ? ' kfc-header-dashboard' : ''}`}>
        <div className="kfc-header-inner">
          <Link to={homePath} className="kfc-header-logo-badge" aria-label="Ir al inicio">
            <img src="/logo1.png" alt="KFC Logo" />
          </Link>

          {title && (
            <span className="text-white fw-bold d-none d-md-inline-block fs-5">
              {title}
            </span>
          )}

          <div className="kfc-header-actions">
            {!isAdmin && (
              <Link to="/corte-caja" className="kfc-header-link">
                <i className="bi bi-receipt-cutoff me-1 d-none d-sm-inline"></i> Corte de caja
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/cierres-caja" className="kfc-header-link">
                <i className="bi bi-calendar2-check me-1 d-none d-sm-inline"></i> Cierres
              </Link>
            )}

            <button
              type="button"
              className="kfc-header-link weather-trigger"
              aria-label="Abrir panel del clima"
              aria-expanded={weatherOpen}
              onClick={() => setWeatherOpen(true)}
            >
              <i className="bi bi-cloud-sun me-1" aria-hidden="true"></i>
              <span className="d-none d-sm-inline">Clima</span>
            </button>

            {showCart && (
              <Link to="/orden" className="kfc-header-link position-relative">
                <i className="bi bi-bag-check me-1 d-none d-sm-inline"></i> Ver Orden
                {totalItems > 0 && (
                  <span className="badge bg-dark rounded-pill ms-2">{totalItems}</span>
                )}
              </Link>
            )}

            {user && (
              <div className="d-none d-lg-flex flex-column text-end text-white pe-2" style={{ lineHeight: 1.2 }}>
                <span className="fw-bold small">{user.nombre}</span>
                <span className="small text-white-50 text-uppercase" style={{ fontSize: '0.72rem' }}>{user.rol}</span>
              </div>
            )}

            <button onClick={logout} className="kfc-header-link" title="Cerrar Sesión" type="button">
              <i className="bi bi-box-arrow-right fs-5"></i>
            </button>
          </div>
        </div>
      </header>
      <WeatherSidebar open={weatherOpen} onClose={() => setWeatherOpen(false)} />
    </>
  );
}

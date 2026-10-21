import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header({ title = null, showCart = true, backToMenu = false }) {
  const { logout, cart, user, ROLES } = useAuth();
  const navigate = useNavigate();

  const totalItems = Object.values(cart).reduce((sum, q) => sum + q, 0);

  return (
    <header className="kfc-header-bar">
      <div className="kfc-header-inner">
        <Link to={user?.rol === ROLES.ADMIN ? '/admin' : '/cajero'} className="kfc-header-logo-badge">
          <img src="/logo1.png" alt="KFC Logo" />
        </Link>

        {title && (
          <span className="text-white fw-bold d-none d-md-inline-block fs-5">
            {title}
          </span>
        )}

        <div className="kfc-header-actions">
          {backToMenu ? (
            <button onClick={() => navigate(-1)} className="kfc-header-link">
              <i className="bi bi-arrow-left me-1"></i> Volver al menú
            </button>
          ) : (
            <Link to="/cajero" className="kfc-header-link">
              <i className="bi bi-grid me-1 d-none d-sm-inline"></i> Menú
            </Link>
          )}

          {showCart && (
            <Link to="/orden" className="kfc-header-link position-relative">
              <i className="bi bi-bag-check me-1 d-none d-sm-inline"></i> Ver Orden
              {totalItems > 0 && (
                <span className="badge bg-dark rounded-pill ms-2">
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          {user && (
            <div className="d-none d-lg-flex flex-column text-end text-white pe-2" style={{ lineHeight: 1.2 }}>
              <span className="fw-bold small">{user.nombre}</span>
              <span className="small text-white-50 text-uppercase" style={{ fontSize: '0.72rem' }}>{user.rol}</span>
            </div>
          )}

          <button onClick={logout} className="kfc-header-link" title="Cerrar Sesión">
            <i className="bi bi-box-arrow-right fs-5"></i>
          </button>
        </div>
      </div>
    </header>
  );
}

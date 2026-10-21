import { useAuth } from '../context/AuthContext';

export default function Navbar({ brandTitle = 'Panel' }) {
  const { user, logout, ROLES } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'KF';
    return name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="navbar navbar-expand-lg kfc-navbar sticky-top">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">
          <span className="brand-icon">KFC</span>
          {brandTitle}
        </a>

        <div className="d-flex align-items-center gap-3 ms-auto">
          <div className="d-flex align-items-center gap-2">
            <div className="user-avatar">
              <span>{getInitials(user?.nombre)}</span>
            </div>
            <div className="user-info-block d-none d-md-block">
              <div className="user-name">{user?.nombre}</div>
              <div className="user-role">
                {user?.rol === ROLES.ADMIN ? 'Administrador' : 'Cajero'}
              </div>
            </div>
          </div>

          <button onClick={logout} className="btn-logout" title="Cerrar sesión">
            <i className="bi bi-box-arrow-right"></i>
            <span className="d-none d-md-inline">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

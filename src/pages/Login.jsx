import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../services/storageService';

export default function Login() {
  const { user, login, ROLES } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      navigate(user.rol === ROLES.ADMIN ? '/admin' : '/cajero', { replace: true });
    }
  }, [navigate, user, ROLES]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!isValidEmail(normalizedEmail)) {
      Swal.fire({
        title: 'Revisa el correo',
        text: 'Ingresa una dirección de correo electrónico válida.',
        icon: 'warning',
        confirmButtonColor: '#E4002B'
      });
      return;
    }
    if (!password || password.length > 72) {
      Swal.fire({
        title: 'Revisa la contraseña',
        text: 'Ingresa una contraseña de hasta 72 caracteres.',
        icon: 'warning',
        confirmButtonColor: '#E4002B'
      });
      return;
    }

    const result = login(normalizedEmail, password);
    if (!result.success) {
      Swal.fire({
        title: 'No se pudo iniciar sesión',
        text: result.message,
        icon: 'error',
        confirmButtonColor: '#E4002B'
      });
      return;
    }

    navigate(result.rol === ROLES.ADMIN ? '/admin' : '/cajero', { replace: true });
  };

  return (
    <main className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <section className="card shadow border-0 w-100" style={{ maxWidth: '440px' }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <img src="/logo1.png" alt="KFC" style={{ maxWidth: '120px', maxHeight: '100px', objectFit: 'contain' }} />
            <h1 className="h3 mt-3 mb-1">Sistema de Gestión</h1>
            <p className="text-muted mb-0">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="login-email" className="form-label fw-semibold">Correo electrónico</label>
              <input
                id="login-email"
                className="form-control"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                maxLength={254}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="login-password" className="form-label fw-semibold">Contraseña</label>
              <input
                id="login-password"
                className="form-control"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                maxLength={72}
                required
              />
            </div>
            <button type="submit" className="btn btn-danger w-100 fw-bold">
              Iniciar sesión
            </button>
          </form>

          <div className="alert alert-light border small mt-4 mb-0" role="note">
            <strong>Cuentas de demostración</strong>
            <div>Admin: admin@kfc.sv / 123</div>
            <div>Cajero: cajero@kfc.sv / 456</div>
          </div>
        </div>
      </section>
    </main>
  );
}

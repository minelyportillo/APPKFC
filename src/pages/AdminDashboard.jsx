import { useState } from 'react';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, isValidEmail, isValidPersonName } from '../services/storageService';
import MonthlySalesChart from '../components/MonthlySalesChart';

const EMPTY_USER_FORM = { nombre: '', email: '', password: '', rol: 'cajero', telefono: '' };

export default function AdminDashboard() {
  const { user, products, orders, getUsers, registerUser, deleteUser, calculateMetrics, updateProductStock } = useAuth();

  const [activeTab, setActiveTab] = useState('menu');
  const [currentCategory, setCurrentCategory] = useState('Combos');

  const [usersList, setUsersList] = useState(() => getUsers());
  const [newUser, setNewUser] = useState(EMPTY_USER_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const metrics = calculateMetrics();

  const refreshUsers = () => setUsersList(getUsers());

  const validateUserForm = (data) => {
    const errors = {};
    if (!isValidPersonName(data.nombre)) {
      errors.nombre = 'Ingresa un nombre válido (2 a 60 letras).';
    }
    if (!isValidEmail(data.email)) {
      errors.email = 'Ingresa un correo electrónico válido.';
    }
    if (data.password.length < 8 || data.password.length > 72) {
      errors.password = 'La contraseña debe tener entre 8 y 72 caracteres.';
    }
    if (data.telefono.trim() && !/^[0-9+\-\s()]{8,15}$/.test(data.telefono.trim())) {
      errors.telefono = 'Usa solo números (8 a 15 dígitos), por ejemplo 7777-0000.';
    }
    if (!['admin', 'cajero'].includes(data.rol)) {
      errors.rol = 'Selecciona un rol válido.';
    }
    return errors;
  };

  const handleUserFieldChange = (event) => {
    const { name, value } = event.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCreateUser = (event) => {
    event.preventDefault();
    const errors = validateUserForm(newUser);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const result = registerUser({
      nombre: newUser.nombre,
      email: newUser.email,
      password: newUser.password,
      rol: newUser.rol,
      telefono: newUser.telefono.trim()
    });

    if (result.success) {
      setNewUser(EMPTY_USER_FORM);
      setShowPassword(false);
      refreshUsers();
    }

    Swal.fire({
      title: result.success ? 'Usuario creado' : 'No se pudo crear el usuario',
      text: result.success ? `La cuenta de ${newUser.nombre.trim()} ya puede iniciar sesión.` : result.message,
      icon: result.success ? 'success' : 'error',
      confirmButtonColor: '#E4002B'
    });
  };

  const handleDeleteUser = async (target) => {
    const confirmation = await Swal.fire({
      title: `¿Eliminar a ${target.nombre}?`,
      text: 'Esta acción no se puede deshacer. La persona ya no podrá iniciar sesión.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#E4002B'
    });
    if (!confirmation.isConfirmed) return;

    const result = deleteUser(target.id);
    if (result.success) refreshUsers();

    Swal.fire({
      title: result.success ? 'Usuario eliminado' : 'No se pudo eliminar',
      text: result.message,
      icon: result.success ? 'success' : 'error',
      confirmButtonColor: '#E4002B'
    });
  };

  const categories = [
    { id: 'Combos', name: 'Combos' },
    { id: 'Boxes', name: 'Boxes' },
    { id: 'Pollo', name: 'Pollo' },
    { id: 'Complementos', name: 'Complementos' },
    { id: 'Bebidas', name: 'Bebidas' }
  ];

  const filteredProducts = products.filter(
    p => p.categoria.toLowerCase() === currentCategory.toLowerCase()
  );

  const handleStockUpdate = (event, productId) => {
    event.preventDefault();
    const stock = Number(new FormData(event.currentTarget).get('stock'));
    const result = updateProductStock(productId, stock);

    Swal.fire({
      title: result.success ? 'Inventario actualizado' : 'No se pudo actualizar',
      text: result.message,
      icon: result.success ? 'success' : 'error',
      confirmButtonColor: '#E4002B'
    });
  };

  // small SVG placeholder (data URL) used when product images fail to load
  const placeholderImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40"><rect width="100%" height="100%" fill="%23f3f3f3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%23888">no image</text></svg>';

  return (
    <div className="kfc-app-container">
      <Header title="Panel de Administración" showCart={false} dashboardStyle />

      <main className="kfc-main-content kfc-dashboard-main">
        {/* Métricas Principales */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="stat-number">{usersList.length}</div>
                  <div className="stat-label">Usuarios Registrados</div>
                </div>
                <div className="stat-icon"><i className="bi bi-people"></i></div>
              </div>
              <div className="small text-muted mt-2">
                <span className="fw-bold text-danger">
                  {usersList.filter(u => u.rol === 'admin').length} Admins
                </span> | <span className="fw-bold text-primary">
                  {usersList.filter(u => u.rol === 'cajero').length} Cajeros
                </span>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="stat-number text-success">{formatCurrency(metrics.ventasGlobalesTotal)}</div>
                  <div className="stat-label">Ventas Globales</div>
                </div>
                <div className="stat-icon"><i className="bi bi-cash-coin"></i></div>
              </div>
              <div className="small text-muted mt-2">
                Hoy: <span className="fw-bold text-dark">{formatCurrency(metrics.ventasDelDiaTotal)}</span>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="stat-number">{orders.length}</div>
                  <div className="stat-label">Pedidos Totales</div>
                </div>
                <div className="stat-icon"><i className="bi bi-receipt"></i></div>
              </div>
              <div className="small text-muted mt-2">
                <span className="badge bg-warning text-dark">{metrics.pedidosPendientesCount} pendientes</span>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card" style={{ borderColor: metrics.productosCriticosCount > 0 ? '#E4002B' : undefined }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className={`stat-number ${metrics.productosCriticosCount > 0 ? 'text-danger' : 'text-success'}`}>
                    {metrics.productosCriticosCount}
                  </div>
                  <div className="stat-label">Alertas de Stock Crítico</div>
                </div>
                <div className={`stat-icon ${metrics.productosCriticosCount > 0 ? 'bg-danger-subtle text-danger' : 'text-success'}`}>
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
              </div>
              <div className="small text-muted mt-2">
                Productos con menos de 5 unidades
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'menu' && (
          <div className="d-flex flex-column flex-grow-1">
            <div className="text-center my-2">
              <h1 className="kfc-script-font display-5 mb-1">Módulos Administrativos</h1>
              <p className="text-muted">Supervisión operativa de inventario, auditoría de ventas y personal</p>
            </div>

            <div className="row g-4 my-auto justify-content-center">
              <div className="col-12 col-sm-6 col-lg-3">
                <div
                  className="admin-action-btn-card"
                  onClick={() => setActiveTab('inventario')}
                >
                  <div className="admin-card-tag">Inventario disponible</div>
                  <div className="d-flex align-items-center justify-content-center flex-grow-1 py-3">
                    <img
                      src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&q=80"
                      alt="Inventario"
                      style={{ maxHeight: '110px', objectFit: 'contain' }}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholderImg; }}
                    />
                  </div>
                  <span className="small text-muted fw-bold mt-2">
                    {metrics.productosCriticosCount > 0 ? (
                      <span className="text-danger"><i className="bi bi-bell-fill me-1"></i>{metrics.productosCriticosCount} productos críticos</span>
                    ) : (
                      'Stock en niveles óptimos'
                    )}
                  </span>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div
                  className="admin-action-btn-card"
                  onClick={() => setActiveTab('reportes')}
                >
                  <div className="admin-card-tag">Reporte de ventas</div>
                  <div className="d-flex align-items-center justify-content-center flex-grow-1 py-3">
                    <i className="bi bi-briefcase-fill text-dark" style={{ fontSize: '4.5rem' }}></i>
                    <i className="bi bi-graph-up-arrow text-danger ms-2" style={{ fontSize: '2.8rem' }}></i>
                  </div>
                  <span className="small text-muted fw-bold mt-2">
                    Total: {formatCurrency(metrics.ventasGlobalesTotal)}
                  </span>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div
                  className="admin-action-btn-card"
                  onClick={() => setActiveTab('pedidos')}
                >
                  <div className="admin-card-tag">Consulta de pedidos</div>
                  <div className="d-flex align-items-center justify-content-center flex-grow-1 py-3">
                    <i className="bi bi-scooter text-dark" style={{ fontSize: '4.5rem' }}></i>
                  </div>
                  <span className="small text-muted fw-bold mt-2">{orders.length} pedidos auditados</span>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div
                  className="admin-action-btn-card"
                  onClick={() => window.location.assign('/admin/cierres-caja')}
                >
                  <div className="admin-card-tag">Cierres de caja</div>
                  <div className="d-flex align-items-center justify-content-center flex-grow-1 py-3">
                    <i className="bi bi-calendar2-check text-danger" style={{ fontSize: '4.5rem' }}></i>
                  </div>
                  <span className="small text-muted fw-bold mt-2">Audita cierres por mes</span>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div
                  className="admin-action-btn-card"
                  onClick={() => setActiveTab('usuarios')}
                >
                  <div className="admin-card-tag" style={{ background: '#333' }}>Gestión de Usuarios</div>
                  <div className="d-flex align-items-center justify-content-center flex-grow-1 py-3">
                    <i className="bi bi-people-fill text-secondary" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <span className="small text-muted fw-bold mt-2">{usersList.length} cuentas activas</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Inventario con Alerta de Stock Crítico */}
        {activeTab === 'inventario' && (
          <div className="kfc-content-card d-flex flex-column flex-grow-1">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
              <div>
                <h2 className="kfc-script-font fs-2 m-0 text-capitalize">
                  Inventario {currentCategory}
                </h2>
                <span className="small text-muted">Control de existencias y alertas de reposición</span>
              </div>
              <button
                onClick={() => setActiveTab('menu')}
                className="btn btn-outline-danger btn-sm px-3"
              >
                <i className="bi bi-arrow-left me-1"></i> Volver al panel
              </button>
            </div>

            <div className="d-flex gap-2 overflow-auto pb-2 mb-4">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCurrentCategory(c.id)}
                  className={`btn btn-sm text-nowrap rounded-pill px-3 py-1 ${currentCategory === c.id ? 'btn-danger fw-bold' : 'btn-light border'}`}>
                  {c.name}
                </button>
              ))}
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock Actual</th>
                    <th>Modificar Stock</th>
                    <th>Condición</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(prod => {
                    const esCritico = prod.stock < 5;
                    const agotado = prod.stock <= 0;

                    return (
                      <tr key={prod.id} className={agotado ? 'table-danger' : (esCritico ? 'table-warning' : '')}>
                        <td><code>{prod.id}</code></td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img src={prod.img} alt={prod.nombre} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = prod.imgFallback || placeholderImg; }} />
                            <div>
                              <div className="fw-semibold">{prod.nombre}</div>
                              <small className="text-muted">{prod.descripcion}</small>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge bg-light text-dark border">{prod.categoria}</span></td>
                        <td className="fw-bold">{formatCurrency(prod.precio)}</td>
                        <td className="fw-bold">{prod.stock} u.</td>
                        <td>
                          <form
                            className="d-flex align-items-center gap-2"
                            onSubmit={(event) => handleStockUpdate(event, prod.id)}
                          >
                            <input
                              aria-label={`Nueva cantidad de ${prod.nombre}`}
                              className="form-control form-control-sm"
                              name="stock"
                              type="number"
                              min="0"
                              step="1"
                              defaultValue={prod.stock}
                              required
                              style={{ width: '90px' }}
                            />
                            <button className="btn btn-danger btn-sm text-nowrap" type="submit">
                              Guardar
                            </button>
                          </form>
                        </td>
                        <td>
                          {agotado ? (
                            <span className="badge bg-danger">Agotado</span>
                          ) : esCritico ? (
                            <span className="badge bg-warning text-dark">
                              <i className="bi bi-exclamation-triangle-fill me-1"></i>Stock Crítico
                            </span>
                          ) : (
                            <span className="badge bg-success">Óptimo</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sección de Reporte de Ventas */}
        {activeTab === 'reportes' && (
          <div className="kfc-content-card d-flex flex-column flex-grow-1">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h2 className="kfc-script-font fs-2 m-0">Reporte Financiero y Ventas</h2>
              <button onClick={() => setActiveTab('menu')} className="btn btn-outline-danger btn-sm px-3">
                <i className="bi bi-arrow-left me-1"></i> Volver
              </button>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="text-muted small">Ventas Totales (Histórico)</div>
                  <div className="fs-3 fw-bold text-success">{formatCurrency(metrics.ventasGlobalesTotal)}</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="text-muted small">Ventas de Hoy</div>
                  <div className="fs-3 fw-bold text-dark">{formatCurrency(metrics.ventasDelDiaTotal)}</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="text-muted small">Órdenes Pagadas / Entregadas</div>
                  <div className="fs-3 fw-bold text-primary">
                    {orders.filter(o => o.estado !== 'cancelado').length}
                  </div>
                </div>
              </div>
            </div>

            <MonthlySalesChart />

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Orden</th>
                    <th>Fecha y Hora</th>
                    <th>Cliente</th>
                    <th>Atendido Por</th>
                    <th>Pago</th>
                    <th className="text-end">Monto Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(ord => (
                    <tr key={ord.id}>
                      <td><code>{ord.id}</code></td>
                      <td>{formatDate(ord.fecha)}</td>
                      <td className="fw-semibold">{ord.cliente}</td>
                      <td><small>{ord.cajeroNombre || ord.cajeroId}</small></td>
                      <td><span className="badge bg-light text-dark border">{ord.tipoPago}</span></td>
                      <td className="text-end fw-bold text-danger">{formatCurrency(ord.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sección de Consulta y Auditoría de Pedidos */}
        {activeTab === 'pedidos' && (
          <div className="kfc-content-card d-flex flex-column flex-grow-1">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h2 className="kfc-script-font fs-2 m-0">Auditoría de Pedidos</h2>
              <button onClick={() => setActiveTab('menu')} className="btn btn-outline-danger btn-sm px-3">
                <i className="bi bi-arrow-left me-1"></i> Volver
              </button>
            </div>

            <div className="row g-3 overflow-auto">
              {orders.map(ord => {
                const badgeClasses = {
                  'pendiente': 'bg-warning text-dark',
                  'en_preparacion': 'bg-info text-dark',
                  'listo': 'bg-primary text-white',
                  'entregado': 'bg-success text-white',
                  'cancelado': 'bg-danger text-white'
                };

                return (
                  <div key={ord.id} className="col-12 col-md-6 col-lg-4">
                    <div className="card h-100 shadow-sm border rounded-3">
                      <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
                        <span className="fw-bold text-danger">{ord.id}</span>
                        <span className={`badge ${badgeClasses[ord.estado] || 'bg-secondary'}`}>
                          {ord.estado.toUpperCase()}
                        </span>
                      </div>
                      <div className="card-body p-3">
                        <div className="small text-muted mb-2">
                          Cliente: <strong>{ord.cliente}</strong> • {formatDate(ord.fecha)}
                        </div>
                        <ul className="list-unstyled small mb-3">
                          {ord.items.map((it, idx) => (
                            <li key={idx} className="d-flex justify-content-between py-1 border-bottom border-light">
                              <span>{it.quantity}x {it.nombre}</span>
                              <span className="fw-semibold">{formatCurrency(it.subtotal)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="d-flex justify-content-between fw-bold pt-1">
                          <span>Total:</span>
                          <span className="text-danger fs-5">{formatCurrency(ord.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sección de Gestión de Usuarios */}
        {activeTab === 'usuarios' && (
          <div className="kfc-content-card d-flex flex-column flex-grow-1">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h2 className="kfc-script-font fs-2 m-0">Gestión de Usuarios</h2>
              <button onClick={() => setActiveTab('menu')} className="btn btn-outline-danger btn-sm px-3">
                <i className="bi bi-arrow-left me-1"></i> Volver
              </button>
            </div>

            <form className="user-form-card mb-4" onSubmit={handleCreateUser} noValidate>
              <h3 className="fs-5 fw-bold mb-3">
                <i className="bi bi-person-plus-fill text-danger me-2"></i>Agregar nuevo usuario
              </h3>
              <div className="row g-3">
                <div className="col-12 col-md-6 col-xl-3">
                  <label htmlFor="nuevo-nombre" className="form-label small fw-semibold">Nombre completo</label>
                  <input
                    id="nuevo-nombre"
                    name="nombre"
                    type="text"
                    maxLength={60}
                    autoComplete="off"
                    className={`form-control ${formErrors.nombre ? 'is-invalid' : ''}`}
                    value={newUser.nombre}
                    onChange={handleUserFieldChange}
                    placeholder="Ej. María López"
                  />
                  <div className="invalid-feedback">{formErrors.nombre}</div>
                </div>

                <div className="col-12 col-md-6 col-xl-3">
                  <label htmlFor="nuevo-email" className="form-label small fw-semibold">Correo electrónico</label>
                  <input
                    id="nuevo-email"
                    name="email"
                    type="email"
                    maxLength={254}
                    autoComplete="off"
                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                    value={newUser.email}
                    onChange={handleUserFieldChange}
                    placeholder="usuario@kfc.sv"
                  />
                  <div className="invalid-feedback">{formErrors.email}</div>
                </div>

                <div className="col-12 col-md-6 col-xl-2">
                  <label htmlFor="nuevo-password" className="form-label small fw-semibold">Contraseña</label>
                  <div className="input-group has-validation">
                    <input
                      id="nuevo-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      maxLength={72}
                      autoComplete="new-password"
                      className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                      value={newUser.password}
                      onChange={handleUserFieldChange}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                    <div className="invalid-feedback">{formErrors.password}</div>
                  </div>
                </div>

                <div className="col-6 col-md-3 col-xl-2">
                  <label htmlFor="nuevo-rol" className="form-label small fw-semibold">Rol</label>
                  <select
                    id="nuevo-rol"
                    name="rol"
                    className={`form-select ${formErrors.rol ? 'is-invalid' : ''}`}
                    value={newUser.rol}
                    onChange={handleUserFieldChange}
                  >
                    <option value="cajero">Cajero</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="invalid-feedback">{formErrors.rol}</div>
                </div>

                <div className="col-6 col-md-3 col-xl-2">
                  <label htmlFor="nuevo-telefono" className="form-label small fw-semibold">Teléfono <span className="text-muted fw-normal">(opcional)</span></label>
                  <input
                    id="nuevo-telefono"
                    name="telefono"
                    type="tel"
                    maxLength={15}
                    autoComplete="off"
                    className={`form-control ${formErrors.telefono ? 'is-invalid' : ''}`}
                    value={newUser.telefono}
                    onChange={handleUserFieldChange}
                    placeholder="7777-0000"
                  />
                  <div className="invalid-feedback">{formErrors.telefono}</div>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-3">
                <button type="submit" className="btn btn-danger px-4">
                  <i className="bi bi-person-plus me-2"></i>Crear usuario
                </button>
              </div>
            </form>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Registrado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td><code>{u.id}</code></td>
                      <td className="fw-semibold">
                        {u.nombre}
                        {u.id === user?.id && <span className="badge bg-dark ms-2">Tú</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>{u.telefono || '—'}</td>
                      <td>
                        <span className={`badge ${u.rol === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                          {u.rol.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-success">Activo</span>
                      </td>
                      <td><small className="text-muted">{formatDate(u.creadoEn, false)}</small></td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === user?.id}
                          title={u.id === user?.id ? 'No puedes eliminar tu propia cuenta' : `Eliminar a ${u.nombre}`}
                          aria-label={`Eliminar a ${u.nombre}`}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

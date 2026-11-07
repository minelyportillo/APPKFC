import { useState } from 'react';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import {
  formatCurrency,
  formatDate,
  isValidPersonName,
  isValidCardNumber,
  isValidCardExpiry,
  isValidCardCvv,
  isValidCashAmount,
  calculateChange,
  toCents
} from '../services/storageService';

const EMPTY_CARD_FORM = { name: '', number: '', month: '', year: '', cvv: '' };

const placeholderImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="100%" height="100%" fill="%23f3f3f3"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="20" fill="%23a1a1aa">KFC</text></svg>';

export default function CajeroDashboard() {
  const {
    products,
    cart,
    updateQuantity,
    orders,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    calculateMetrics,
    clearCart,
    user
  } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [pickerCategory, setPickerCategory] = useState('Combos');
  const [cashReceived, setCashReceived] = useState('');
  const [cardForm, setCardForm] = useState(EMPTY_CARD_FORM);
  const [procesando, setProcesando] = useState(false);

  const categories = [
    { id: 'Combos', name: 'Combos', img: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=400&q=80', imgFallback: '/img/categorias/combos.svg' },
    { id: 'Boxes', name: 'Boxes', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80', imgFallback: '/img/categorias/boxes.svg' },
    { id: 'Pollo', name: 'Pollo', img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', imgFallback: '/img/categorias/pollo.svg' },
    { id: 'Complementos', name: 'Complementos', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&q=80', imgFallback: '/img/categorias/complementos.svg' },
    { id: 'Bebidas', name: 'Bebidas', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80', imgFallback: '/img/categorias/bebidas.svg' }
  ];

  const categoryProducts = selectedCategory
    ? products.filter(p => p.categoria.toLowerCase() === selectedCategory.toLowerCase())
    : [];

  const pickerProducts = products.filter(p => p.categoria.toLowerCase() === pickerCategory.toLowerCase());
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const metrics = calculateMetrics();

  // Filtro de pedidos
  const pedidosFiltrados = orders.filter(o => {
    if (filtroEstado === 'todos') return true;
    if (filtroEstado === 'pendientes') return o.estado === 'pendiente';
    if (filtroEstado === 'en_preparacion') return o.estado === 'en_preparacion';
    if (filtroEstado === 'completados') return o.estado === 'listo' || o.estado === 'entregado';
    if (filtroEstado === 'cancelados') return o.estado === 'cancelado';
    return o.estado === filtroEstado;
  });

  const cartTotal = Object.entries(cart).reduce((sum, [pId, qty]) => {
    const prod = products.find(p => p.id === pId);
    return sum + (prod ? prod.precio * qty : 0);
  }, 0);

  const resetPaymentForm = () => {
    setCashReceived('');
    setCardForm(EMPTY_CARD_FORM);
  };

  const closeOrderModal = () => {
    if (procesando) return;
    setShowOrderModal(false);
    resetPaymentForm();
  };

  const cartTotalCents = toCents(cartTotal);
  const receivedCents = toCents(cashReceived);
  const cashHasValue = cashReceived.trim() !== '';
  const cashIsEnough = cashHasValue && isValidCashAmount(cashReceived, cartTotal);
  const changeAmount = cashHasValue ? calculateChange(cashReceived, cartTotal) : 0;

  const warn = (title, text) => Swal.fire({ title, text, icon: 'warning', confirmButtonColor: '#E4002B' });

  const handleCrearPedidoRapido = async (e) => {
    e.preventDefault();
    if (procesando) return;

    const normalizedName = clienteNombre.trim();
    if (!isValidPersonName(normalizedName)) {
      warn('Revisa el nombre', 'Ingresa un nombre válido de 2 a 60 caracteres.');
      return;
    }
    if (Object.keys(cart).length === 0) {
      warn('Pedido vacío', 'Agrega al menos un producto antes de confirmar el pedido.');
      return;
    }

    let paymentDetails = null;

    if (metodoPago === 'Efectivo') {
      if (!isValidCashAmount(cashReceived, cartTotal)) {
        warn('Revisa el efectivo', `Ingresa el monto recibido (máximo 2 decimales). Debe ser igual o mayor a ${formatCurrency(cartTotal)}.`);
        return;
      }
      paymentDetails = { montoRecibido: cashReceived.trim() };
    } else {
      const cardholderName = cardForm.name.trim();
      const cardNumber = cardForm.number.replace(/\D/g, '');
      if (!isValidPersonName(cardholderName)) {
        warn('Revisa el nombre de la tarjeta', 'Ingresa un nombre válido de 2 a 60 caracteres.');
        return;
      }
      if (!isValidCardNumber(cardNumber)) {
        warn('Número de prueba no válido', 'Ingresa un número de prueba válido. No uses una tarjeta real.');
        return;
      }
      if (!isValidCardExpiry(cardForm.month, cardForm.year)) {
        warn('Revisa el vencimiento', 'El mes y año deben ser válidos y no estar vencidos.');
        return;
      }
      if (!isValidCardCvv(cardForm.cvv)) {
        warn('Revisa el código de seguridad', 'El código debe tener 3 o 4 dígitos. No ingreses datos reales.');
        return;
      }

      // Simulación del cobro: no se contacta ningún banco ni se guardan los datos.
      setProcesando(true);
      Swal.fire({
        title: 'Procesando pago…',
        text: 'Simulación de cobro con tarjeta',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });
      await new Promise(resolve => setTimeout(resolve, 1200));
      setCardForm(EMPTY_CARD_FORM);
    }

    const res = createOrder(metodoPago, normalizedName, paymentDetails);
    setProcesando(false);

    if (res.success) {
      setShowOrderModal(false);
      setClienteNombre('');
      setSelectedCategory(null);
      resetPaymentForm();

      const detalle = metodoPago === 'Efectivo'
        ? (res.pedido.cambio > 0
          ? `Recibido: ${formatCurrency(res.pedido.montoRecibido)}. Cambio a devolver: ${formatCurrency(res.pedido.cambio)}.`
          : 'Pago exacto, no hay cambio que devolver.')
        : `Pago aprobado (simulación) por ${formatCurrency(res.pedido.total)}.`;

      Swal.fire({
        title: 'Pedido registrado',
        text: `El pedido ${res.pedido.id} se creó correctamente. ${detalle}`,
        icon: 'success',
        confirmButtonColor: '#E4002B'
      });
    } else {
      Swal.fire({
        title: 'No se pudo crear el pedido',
        text: res.message,
        icon: 'error',
        confirmButtonColor: '#E4002B'
      });
    }
  };

  const handleCambiarEstado = (orderId, newStatus) => {
    const res = updateOrderStatus(orderId, newStatus);
    if (res.success) {
      Swal.fire({
        title: 'Pedido actualizado',
        text: res.message,
        icon: 'success',
        confirmButtonColor: '#E4002B'
      });
    } else {
      Swal.fire({
        title: 'No se pudo actualizar',
        text: res.message,
        icon: 'error',
        confirmButtonColor: '#E4002B'
      });
    }
  };

  const handleCancelarPedido = async (orderId) => {
    const confirmation = await Swal.fire({
      title: `¿Cancelar el pedido ${orderId}?`,
      text: 'El inventario reservado se devolverá al menú.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar pedido',
      cancelButtonText: 'Mantener pedido',
      confirmButtonColor: '#E4002B'
    });
    if (!confirmation.isConfirmed) return;

    const res = cancelOrder(orderId);
    if (res.success) {
      Swal.fire({
        title: 'Pedido cancelado',
        text: res.message,
        icon: 'success',
        confirmButtonColor: '#E4002B'
      });
    } else {
      Swal.fire({
        title: 'No se pudo cancelar',
        text: res.message,
        icon: 'error',
        confirmButtonColor: '#E4002B'
      });
    }
  };

  return (
    <div className="kfc-app-container">
      <Header title="Panel de Cajero" showCart={true} dashboardStyle />

      <main className="kfc-main-content kfc-dashboard-main">
        {/* Banner de Bienvenida y Acción Rápida */}
        <div className="welcome-banner mb-4">
          <div className="row align-items-center">
            <div className="col">
              <h2 className="mb-1"><i className="bi bi-cash-register me-2"></i>¡Hola, {user?.nombre || 'Cajero'}!</h2>
              <p className="mb-0">Estación de caja y toma de pedidos en tiempo real con control automático de inventario.</p>
            </div>
            <div className="col-auto mt-3 mt-md-0">
              <button
                className="btn btn-light text-danger fw-bold px-4 py-2 rounded-pill shadow-sm"
                onClick={() => setShowOrderModal(true)}
              >
                <i className="bi bi-cart-plus-fill me-2"></i>Crear Pedido Rápido
              </button>
            </div>
          </div>
        </div>

        {/* Métricas Dinámicas */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="stat-number">{metrics.pedidosHoyCount}</div>
                  <div className="stat-label">Pedidos Hoy</div>
                </div>
                <div className="stat-icon"><i className="bi bi-bag-check"></i></div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="stat-number">{formatCurrency(metrics.ventasDelDiaTotal)}</div>
                  <div className="stat-label">Ventas del Día</div>
                </div>
                <div className="stat-icon"><i className="bi bi-cash-coin"></i></div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="stat-number">{metrics.pedidosPendientesCount}</div>
                  <div className="stat-label">Pedidos Pendientes</div>
                </div>
                <div className="stat-icon"><i className="bi bi-hourglass-split"></i></div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="stat-number" style={{ fontSize: '1.05rem' }}>{formatDate(user?.loginTimestamp)}</div>
                  <div className="stat-label">Sesión Iniciada</div>
                </div>
                <div className="stat-icon"><i className="bi bi-clock-history"></i></div>
              </div>
            </div>
          </div>
        </div>

        {/* Catálogo de Productos para Armado de Pedidos */}
        <div className="kfc-content-card mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <div>
              <h3 className="kfc-script-font fs-2 m-0">Menú Digital KFC</h3>
              <small className="text-muted">Añade productos para registrar ventas de mostrador</small>
            </div>

            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="btn btn-outline-danger btn-sm"
              >
                <i className="bi bi-grid me-1"></i> Ver Todas las Categorías
              </button>
            )}
          </div>

          {!selectedCategory ? (
            <div className="row g-3">
              {categories.map(cat => (
                <div key={cat.id} className="col-6 col-md-4 col-lg-2">
                  <div
                    className="kfc-category-card"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <div className="kfc-category-banner">{cat.name}</div>
                    <div className="p-2 text-center bg-white">
                      <img
                        src={cat.img}
                        alt={cat.name}
                        className="kfc-category-img"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = cat.imgFallback || placeholderImg; }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="d-flex gap-2 overflow-auto pb-2 mb-3">
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`btn btn-sm rounded-pill px-3 ${selectedCategory === c.id ? 'btn-danger fw-bold' : 'btn-light border'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="row g-3">
                {categoryProducts.map(prod => {
                  const qty = cart[prod.id] || 0;
                  const sinStock = prod.stock <= 0;

                  return (
                    <div key={prod.id} className="col-6 col-md-4 col-lg-3">
                      <div className={`kfc-product-card justify-content-between ${sinStock ? 'opacity-50' : ''}`}>
                        <div>
                          <img
                            src={prod.img}
                            alt={prod.nombre}
                            className="kfc-product-img"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = prod.imgFallback || placeholderImg; }}
                          />
                          <div className="fw-bold small text-truncate" title={prod.nombre}>{prod.nombre}</div>
                          <div className="d-flex justify-content-between align-items-center my-1">
                            <span className="text-danger fw-bold fs-6">{formatCurrency(prod.precio)}</span>
                            <span className={`badge ${prod.stock < 5 ? 'bg-danger' : 'bg-secondary'}`}>
                              Stock: {prod.stock}
                            </span>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                          <span className="small text-muted">Cant:</span>
                          <div className="qty-counter">
                            <button
                              type="button"
                              className="qty-btn"
                              disabled={sinStock}
                              onClick={() => updateQuantity(prod.id, -1)}
                            >
                              -
                            </button>
                            <span className="qty-display">{qty}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              disabled={sinStock || qty >= prod.stock}
                              onClick={() => updateQuantity(prod.id, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Historial de Pedidos y Filtros CRUD */}
        <div className="kfc-content-card">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
            <div>
              <h4 className="fw-bold mb-0"><i className="bi bi-receipt me-2"></i>Historial de Pedidos</h4>
              <small className="text-muted">Control de preparación, entrega y cancelaciones</small>
            </div>

            <div className="overflow-auto" style={{ maxWidth: '100%' }}>
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm btn-outline-danger ${filtroEstado === 'todos' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('todos')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-outline-danger ${filtroEstado === 'pendientes' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('pendientes')}
              >
                Pendientes
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-outline-danger ${filtroEstado === 'en_preparacion' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('en_preparacion')}
              >
                En Proceso
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-outline-danger ${filtroEstado === 'completados' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('completados')}
              >
                Completados
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-outline-danger ${filtroEstado === 'cancelados' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('cancelados')}
              >
                Cancelados
              </button>
            </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Hora</th>
                  <th>Detalle</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      No hay pedidos con el filtro "{filtroEstado}".
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map(o => {
                    const badgeClasses = {
                      'pendiente': 'bg-warning text-dark',
                      'en_preparacion': 'bg-info text-dark',
                      'listo': 'bg-primary text-white',
                      'entregado': 'bg-success text-white',
                      'cancelado': 'bg-danger text-white'
                    };

                    return (
                      <tr key={o.id}>
                        <td><code>{o.id}</code></td>
                        <td className="fw-semibold">{o.cliente}</td>
                        <td><small className="text-muted">{formatDate(o.fecha)}</small></td>
                        <td>
                          <small>
                            {o.items.map(it => `${it.quantity}x ${it.nombre}`).join(', ')}
                          </small>
                        </td>
                        <td><span className="badge bg-light text-dark border">{o.tipoPago}</span></td>
                        <td className="fw-bold text-danger">{formatCurrency(o.total)}</td>
                        <td>
                          <span className={`badge ${badgeClasses[o.estado] || 'bg-secondary'}`}>
                            {o.estado.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="text-center">
                          {o.estado === 'pendiente' && (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                title="Enviar a Preparación"
                                onClick={() => handleCambiarEstado(o.id, 'en_preparacion')}
                              >
                                <i className="bi bi-fire"></i> Cocinar
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                title="Cancelar Pedido"
                                onClick={() => handleCancelarPedido(o.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          )}

                          {o.estado === 'en_preparacion' && (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-success"
                                title="Listo para entrega"
                                onClick={() => handleCambiarEstado(o.id, 'listo')}
                              >
                                <i className="bi bi-check2-circle"></i> Listo
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                title="Cancelar Pedido"
                                onClick={() => handleCancelarPedido(o.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          )}

                          {o.estado === 'listo' && (
                            <button
                              className="btn btn-sm btn-success"
                              title="Marcar como entregado"
                              onClick={() => handleCambiarEstado(o.id, 'entregado')}
                            >
                              <i className="bi bi-box2-fill me-1"></i> Entregar
                            </button>
                          )}

                          {(o.estado === 'entregado' || o.estado === 'cancelado') && (
                            <span className="text-muted small">Finalizado</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Pedido Rápido: selección de productos, cobro en efectivo o tarjeta */}
        {showOrderModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', overflowY: 'auto' }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-cart-plus me-2"></i>Registrar Pedido de Cliente
                  </h5>
                  <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={closeOrderModal}></button>
                </div>

                <form onSubmit={handleCrearPedidoRapido}>
                  <div className="modal-body p-4">
                    <div className="row g-4">
                      {/* Columna izquierda: elegir productos */}
                      <div className="col-12 col-lg-6">
                        <h6 className="fw-bold mb-2"><i className="bi bi-grid me-1"></i>1. Elige los productos</h6>
                        <div className="d-flex gap-2 overflow-auto pb-2 mb-2">
                          {categories.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setPickerCategory(c.id)}
                              className={`btn btn-sm text-nowrap rounded-pill px-3 ${pickerCategory === c.id ? 'btn-danger fw-bold' : 'btn-light border'}`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>

                        <div className="border rounded-3" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                          {pickerProducts.map(prod => {
                            const qty = cart[prod.id] || 0;
                            const sinStock = prod.stock <= 0;
                            return (
                              <div key={prod.id} className={`d-flex align-items-center gap-2 p-2 border-bottom ${sinStock ? 'opacity-50' : ''}`}>
                                <img
                                  src={prod.img}
                                  alt={prod.nombre}
                                  style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = prod.imgFallback || placeholderImg; }}
                                />
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                  <div className="fw-semibold small text-truncate" title={prod.nombre}>{prod.nombre}</div>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="text-danger fw-bold small">{formatCurrency(prod.precio)}</span>
                                    <span className={`badge ${prod.stock < 5 ? 'bg-danger' : 'bg-secondary'}`}>Stock: {prod.stock}</span>
                                  </div>
                                </div>
                                <div className="qty-counter">
                                  <button
                                    type="button"
                                    className="qty-btn"
                                    aria-label={`Quitar ${prod.nombre}`}
                                    disabled={qty <= 0}
                                    onClick={() => updateQuantity(prod.id, -1)}
                                  >
                                    -
                                  </button>
                                  <span className="qty-display">{qty}</span>
                                  <button
                                    type="button"
                                    className="qty-btn"
                                    aria-label={`Agregar ${prod.nombre}`}
                                    disabled={sinStock || qty >= prod.stock}
                                    onClick={() => updateQuantity(prod.id, 1)}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Columna derecha: datos del cliente, resumen y cobro */}
                      <div className="col-12 col-lg-6">
                        <h6 className="fw-bold mb-2"><i className="bi bi-receipt me-1"></i>2. Pedido y cobro</h6>
                        <div className="mb-3">
                          <label className="form-label fw-bold small mb-1" htmlFor="pedido-cliente">Nombre del Cliente :</label>
                          <input
                            id="pedido-cliente"
                            type="text"
                            className="form-control"
                            placeholder="Ej. Juan Pérez"
                            value={clienteNombre}
                            onChange={(e) => setClienteNombre(e.target.value)}
                            required
                            minLength={2}
                            maxLength={60}
                            pattern="[\p{L}\p{M}]+([ '-][\p{L}\p{M}]+)*"
                            title="Usa de 2 a 60 caracteres: letras, espacios, apóstrofes o guiones."
                          />
                        </div>

                        <div className="table-responsive mb-3" style={{ maxHeight: '170px', overflowY: 'auto' }}>
                          <table className="table table-sm table-bordered mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Producto</th>
                                <th>Cant.</th>
                                <th className="text-end">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(cart).length === 0 ? (
                                <tr>
                                  <td colSpan="3" className="text-center py-3 text-muted">
                                    Aún no hay productos. Usa los botones [+] de la lista.
                                  </td>
                                </tr>
                              ) : (
                                Object.entries(cart).map(([pId, qty]) => {
                                  const p = products.find(prod => prod.id === pId);
                                  if (!p) return null;
                                  return (
                                    <tr key={pId}>
                                      <td>{p.nombre}</td>
                                      <td>{qty}</td>
                                      <td className="fw-bold text-end">{formatCurrency(p.precio * qty)}</td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center mb-3">
                          <span className="fs-6 fw-bold">Total a Cobrar ({totalItems} ítems):</span>
                          <span className="fs-3 fw-bold text-danger" data-testid="total-cobrar">{formatCurrency(cartTotal)}</span>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-bold small mb-1" htmlFor="pedido-metodo">Método de Pago :</label>
                          <select
                            id="pedido-metodo"
                            className="form-select"
                            value={metodoPago}
                            onChange={(e) => { setMetodoPago(e.target.value); resetPaymentForm(); }}
                            required
                          >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                          </select>
                        </div>

                        {metodoPago === 'Efectivo' ? (
                          <div className="border rounded-3 p-3">
                            <label className="form-label fw-bold small mb-1" htmlFor="pedido-efectivo">Monto recibido del cliente (USD) :</label>
                            <div className="input-group mb-2">
                              <span className="input-group-text">$</span>
                              <input
                                id="pedido-efectivo"
                                type="number"
                                className={`form-control ${cashHasValue && !cashIsEnough ? 'is-invalid' : ''}`}
                                placeholder="0.00"
                                inputMode="decimal"
                                min="0.01"
                                max="999999.99"
                                step="0.01"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                required
                              />
                            </div>
                            <div className="d-flex flex-wrap gap-2 mb-2">
                              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={cartTotalCents <= 0} onClick={() => setCashReceived((cartTotalCents / 100).toFixed(2))}>
                                Exacto
                              </button>
                              {[5, 10, 20, 50].map(bill => (
                                <button key={bill} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setCashReceived(String(bill))}>
                                  ${bill}
                                </button>
                              ))}
                            </div>
                            {!cashHasValue && cartTotalCents > 0 && (
                              <div className="small text-muted">Escribe con cuánto paga el cliente para calcular el cambio.</div>
                            )}
                            {cashHasValue && cashIsEnough && (
                              <div className={`fw-bold ${changeAmount > 0 ? 'text-success' : 'text-secondary'}`} role="status">
                                {changeAmount > 0
                                  ? `Cambio a devolver: ${formatCurrency(changeAmount)}`
                                  : 'Pago exacto: no hay cambio que devolver.'}
                              </div>
                            )}
                            {cashHasValue && !cashIsEnough && (
                              <div className="fw-bold text-danger" role="alert">
                                {receivedCents > 0 && receivedCents < cartTotalCents
                                  ? `Falta ${formatCurrency((cartTotalCents - receivedCents) / 100)} para cubrir el total.`
                                  : 'Ingresa un monto válido (máximo 2 decimales).'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="border rounded-3 p-3">
                            <div className="p-2 border border-dashed rounded-2 text-center mb-3 bg-light">
                              <span className="small fw-semibold text-danger d-block">Simulación académica: no uses datos reales</span>
                              <span className="small text-muted">Los datos solo se validan en esta pantalla; no se envían ni se guardan.</span>
                            </div>
                            <div className="mb-2">
                              <label className="form-label small fw-bold mb-1" htmlFor="tarjeta-nombre">Nombre en la tarjeta</label>
                              <input
                                id="tarjeta-nombre"
                                type="text"
                                className="form-control"
                                placeholder="Ej. Juan Pérez"
                                value={cardForm.name}
                                onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                                required
                                minLength={2}
                                maxLength={60}
                                pattern="[\p{L}\p{M}]+([ '-][\p{L}\p{M}]+)*"
                                autoComplete="off"
                                title="Usa de 2 a 60 caracteres: letras, espacios, apóstrofes o guiones."
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small fw-bold mb-1" htmlFor="tarjeta-numero">Número de tarjeta</label>
                              <input
                                id="tarjeta-numero"
                                type="text"
                                className="form-control"
                                placeholder="0000 0000 0000 0000"
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={23}
                                value={cardForm.number}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, '').slice(0, 19);
                                  setCardForm({ ...cardForm, number: digits.replace(/(.{4})/g, '$1 ').trim() });
                                }}
                                required
                                pattern="[0-9 ]{13,23}"
                                title="Ingresa un número de tarjeta válido de 13 a 19 dígitos."
                              />
                            </div>
                            <div className="row g-2">
                              <div className="col-4">
                                <label className="form-label small fw-bold mb-1" htmlFor="tarjeta-mes">Mes</label>
                                <input
                                  id="tarjeta-mes"
                                  type="text"
                                  className="form-control"
                                  placeholder="MM"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  maxLength={2}
                                  value={cardForm.month}
                                  onChange={(e) => setCardForm({ ...cardForm, month: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                                  required
                                  pattern="(0[1-9]|1[0-2])"
                                  title="Ingresa un mes entre 01 y 12."
                                />
                              </div>
                              <div className="col-4">
                                <label className="form-label small fw-bold mb-1" htmlFor="tarjeta-anio">Año</label>
                                <input
                                  id="tarjeta-anio"
                                  type="text"
                                  className="form-control"
                                  placeholder="AA"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  maxLength={2}
                                  value={cardForm.year}
                                  onChange={(e) => setCardForm({ ...cardForm, year: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                                  required
                                  pattern="\d{2}"
                                  title="Ingresa el año de vencimiento con dos dígitos."
                                />
                              </div>
                              <div className="col-4">
                                <label className="form-label small fw-bold mb-1" htmlFor="tarjeta-cvv">CVV</label>
                                <input
                                  id="tarjeta-cvv"
                                  type="password"
                                  className="form-control"
                                  placeholder="123"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  maxLength={4}
                                  value={cardForm.cvv}
                                  onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                  required
                                  minLength={3}
                                  pattern="\d{3,4}"
                                  title="Ingresa un código de seguridad de 3 o 4 dígitos."
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeOrderModal} disabled={procesando}>
                      Cerrar
                    </button>
                    <button type="submit" className="btn btn-kfc" style={{ width: 'auto', padding: '0.6rem 2rem' }} disabled={procesando}>
                      {metodoPago === 'Tarjeta' ? `Cobrar ${formatCurrency(cartTotal)}` : 'Confirmar y Cobrar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

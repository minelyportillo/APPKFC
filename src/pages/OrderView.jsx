import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import {
  formatCurrency,
  isValidCardExpiry,
  isValidCardNumber,
  isValidPersonName
} from '../services/storageService';

export default function OrderView() {
  const { cart, products, updateQuantity, createOrder } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('summary');
  const [clienteNombre, setClienteNombre] = useState('');
  const [orderCreada, setOrderCreada] = useState(null);

  const [cardForm, setCardForm] = useState({
    name: '',
    number: '',
    month: '',
    year: '',
    cvv: ''
  });

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const prod = products.find(p => p.id === id);
    return prod ? { ...prod, quantity: qty, subtotal: prod.precio * qty } : null;
  }).filter(Boolean);

  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleFinishCash = () => {
    const normalizedName = clienteNombre.trim();
    if (normalizedName && !isValidPersonName(normalizedName)) {
      Swal.fire({
        title: 'Revisa el nombre del cliente',
        text: 'Ingresa un nombre válido de 2 a 60 caracteres.',
        icon: 'warning',
        confirmButtonColor: '#E4002B'
      });
      return;
    }

    const res = createOrder('Efectivo', normalizedName || 'Cliente Mostrador');
    if (res.success) {
      setOrderCreada(res.pedido);
      setStep('success');
    } else {
      Swal.fire({
        title: 'No se pudo crear el pedido',
        text: res.message,
        icon: 'error',
        confirmButtonColor: '#E4002B'
      });
    }
  };

  const handleFinishCard = (e) => {
    e.preventDefault();
    const cardholderName = cardForm.name.trim();
    const cardNumber = cardForm.number.replace(/\D/g, '');

    if (!isValidPersonName(cardholderName)) {
      Swal.fire({
        title: 'Revisa el nombre',
        text: 'Ingresa un nombre válido de 2 a 60 caracteres.',
        icon: 'warning',
        confirmButtonColor: '#E4002B'
      });
      return;
    }
    if (!isValidCardNumber(cardNumber)) {
      Swal.fire({
        title: 'Número de prueba no válido',
        text: 'Ingresa un número de prueba válido. No uses una tarjeta real.',
        icon: 'warning',
        confirmButtonColor: '#E4002B'
      });
      return;
    }
    if (!isValidCardExpiry(cardForm.month, cardForm.year)) {
      Swal.fire({
        title: 'Revisa el vencimiento',
        text: 'El mes y año deben ser válidos y no estar vencidos.',
        icon: 'warning',
        confirmButtonColor: '#E4002B'
      });
      return;
    }
    if (!/^\d{3,4}$/.test(cardForm.cvv)) {
      Swal.fire({
        title: 'Revisa el código de prueba',
        text: 'El código debe tener 3 o 4 dígitos. No ingreses datos reales.',
        icon: 'warning',
        confirmButtonColor: '#E4002B'
      });
      return;
    }

    const orderName = clienteNombre.trim() || 'Cliente Tarjeta';
    setCardForm({ name: '', number: '', month: '', year: '', cvv: '' });
    const res = createOrder('Tarjeta', orderName);
    if (res.success) {
      setOrderCreada(res.pedido);
      setStep('success');
    } else {
      Swal.fire({
        title: 'No se pudo crear el pedido',
        text: res.message,
        icon: 'error',
        confirmButtonColor: '#E4002B'
      });
    }
  };

  return (
    <div className="kfc-app-container">
      <Header backToMenu={true} showCart={false} title="Gestión de Orden" />

      <main className="kfc-main-content justify-content-center align-items-center">
        {step === 'summary' && (
          <div className="kfc-content-card w-100" style={{ maxWidth: '820px' }}>
            <h1 className="kfc-script-font fs-1 text-center mb-3">Orden del Cliente</h1>

            {cartItems.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-cart-x text-muted mb-3" style={{ fontSize: '4.5rem' }}></i>
                <h4>Tu orden está vacía</h4>
                <p className="text-muted">Agrega productos desde el menú para procesar un pedido.</p>
                <button onClick={() => navigate('/cajero')} className="btn-kfc-red mt-3" style={{ maxWidth: '220px' }}>
                  Ir al Menú
                </button>
              </div>
            ) : (
              <div className="row g-4">
                <div className="col-12 col-md-7">
                  <div className="mb-3">
                    <label className="form-label small fw-bold mb-1">Nombre del Cliente (Opcional):</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Carlos Mendoza"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      maxLength={60}
                      pattern="[\p{L}\p{M}]+([ '-][\p{L}\p{M}]+)*"
                      title="Usa de 2 a 60 caracteres: letras, espacios, apóstrofes o guiones."
                    />
                  </div>

                  <h6 className="fw-bold mb-3 border-bottom pb-2">Artículos Seleccionados</h6>
                  <div className="overflow-auto pe-2" style={{ maxHeight: '320px' }}>
                    {cartItems.map(item => (
                      <div key={item.id} className="card mb-2 p-2 border shadow-sm rounded-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-3">
                            <img src={item.img} alt={item.nombre} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />
                            <div>
                              <div className="fw-bold text-truncate" style={{ maxWidth: '180px' }}>{item.nombre}</div>
                              <div className="text-danger fw-bold">{formatCurrency(item.precio)} c/u</div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-3">
                            <div className="qty-counter">
                              <button type="button" className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                              <span className="qty-display">{item.quantity}</span>
                              <button
                                type="button"
                                className="qty-btn"
                                disabled={item.quantity >= item.stock}
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                +
                              </button>
                            </div>
                            <div className="fw-bold text-end" style={{ width: '65px' }}>
                              {formatCurrency(item.subtotal)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-12 col-md-5">
                  <div className="p-3 bg-light rounded-3 border h-100 d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="fw-bold mb-3 border-bottom pb-2">Resumen Financiero</h6>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Subtotal (sin IVA):</span>
                        <span className="fw-bold">{formatCurrency(total / 1.13)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-3">
                        <span className="text-muted">IVA (13% incluido):</span>
                        <span className="text-muted">{formatCurrency(total - (total / 1.13))}</span>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <span className="fw-bold fs-5">Total a Cancelar :</span>
                        <span className="text-danger fw-bold fs-3">{formatCurrency(total)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 fw-bold small">Forma de pago:</div>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          onClick={handleFinishCash}
                          className="btn-kfc-red flex-grow-1"
                        >
                          <i className="bi bi-cash me-1"></i> Efectivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep('card')}
                          className="btn-kfc-red flex-grow-1"
                        >
                          <i className="bi bi-credit-card me-1"></i> Tarjeta
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'card' && (
          <div className="kfc-content-card w-100" style={{ maxWidth: '520px' }}>
            <h2 className="kfc-script-font fs-1 text-center mb-3">Pago con tarjeta</h2>

            <div className="p-2 border border-dashed rounded-2 text-center mb-3 bg-light">
              <span className="small fw-semibold text-danger d-block mb-1">Simulación académica: no uses datos reales</span>
              <span className="small text-muted d-block mb-1">Los datos de prueba solo se validan en esta pantalla; no se envían ni se guardan.</span>
              <div className="d-flex justify-content-center gap-3 fs-4">
                <i className="bi bi-credit-card-2-front text-primary"></i>
                <i className="bi bi-shield-check text-success"></i>
              </div>
            </div>

            <form onSubmit={handleFinishCard}>
              <div className="mb-3">
                <label className="form-label small fw-bold mb-1">Nombre en la tarjeta</label>
                <input
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

              <div className="mb-3">
                <label className="form-label small fw-bold mb-1">Número de tarjeta</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={23}
                  value={cardForm.number}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 19);
                    const formattedNumber = digits.replace(/(.{4})/g, '$1 ').trim();
                    setCardForm({ ...cardForm, number: formattedNumber });
                  }}
                  required
                  pattern="[0-9 ]{13,23}"
                  title="Ingresa un número de tarjeta válido de 13 a 19 dígitos."
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold mb-1">Mes de Exp.</label>
                  <input
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
                <div className="col-6">
                  <label className="form-label small fw-bold mb-1">Año de Exp.</label>
                  <input
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
              </div>

              <div className="mb-4">
                <label className="form-label small fw-bold mb-1">Código de Seguridad (CVV)</label>
                <input
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

              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCardForm({ name: '', number: '', month: '', year: '', cvv: '' });
                    setStep('summary');
                  }}
                  className="btn btn-outline-secondary flex-grow-1"
                >
                  Regresar
                </button>
                <button type="submit" className="btn-kfc-dark flex-grow-1">
                  Pagar {formatCurrency(total)}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="kfc-content-card text-center p-5 w-100" style={{ maxWidth: '560px' }}>
            <h1 className="kfc-script-font display-4 text-danger mb-2">¡Orden en Camino!</h1>
            <p className="fw-bold fs-5 text-dark mb-3">
              Pedido registrado: <code className="text-danger">{orderCreada?.id}</code>
            </p>

            <div className="bg-light p-4 rounded-4 d-inline-block shadow-sm mb-4 border">
              <i className="bi bi-scooter text-danger" style={{ fontSize: '5rem' }}></i>
            </div>

            <div className="card p-3 mb-4 text-start bg-light border-0">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Cliente:</span>
                <strong>{orderCreada?.cliente}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Pago:</span>
                <span className="badge bg-secondary">{orderCreada?.tipoPago}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Monto Pagado:</span>
                <strong className="text-danger">{formatCurrency(orderCreada?.total)}</strong>
              </div>
            </div>

            <p className="text-muted mb-4 small">El inventario fue descontado automáticamente y el ticket fue enviado a la cocina.</p>

            <button
              onClick={() => navigate('/cajero')}
              className="btn-kfc-red mx-auto"
              style={{ maxWidth: '240px' }}
            >
              <i className="bi bi-plus-circle me-1"></i> Nuevo Pedido
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

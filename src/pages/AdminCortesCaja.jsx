import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../services/storageService';

const FONDO_CAJA = 160;

function monthLabel(value) {
  return new Date(`${value}-01T12:00:00`).toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric'
  });
}

export default function AdminCortesCaja() {
  const { cashCuts } = useAuth();
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const cortesDelMes = useMemo(() => cashCuts
    .filter(cut => cut.at?.slice(0, 7) === month)
    .sort((a, b) => b.at.localeCompare(a.at)), [cashCuts, month]);

  const totals = cortesDelMes.reduce((summary, cut) => ({
    efectivo: summary.efectivo + Number(cut.efectivo || 0),
    tarjeta: summary.tarjeta + Number(cut.tarjeta || 0),
    total: summary.total + Number(cut.total || 0),
    remesa: summary.remesa + Number(cut.remesa || 0)
  }), { efectivo: 0, tarjeta: 0, total: 0, remesa: 0 });

  return (
    <div className="kfc-app-container">
      <Header title="Cierres de Caja" showCart={false} backToMenu dashboardStyle />
      <main className="kfc-main-content">
        <div className="corte-header mb-4">
          <div>
            <span className="text-uppercase small fw-bold text-danger">Auditoría administrativa</span>
            <h1 className="kfc-script-font display-5 mb-1">Cierres de caja</h1>
            <p className="mb-0 text-muted text-capitalize">
              Consulta los cortes realizados durante el mes seleccionado.
            </p>
          </div>
          <i className="bi bi-calendar2-check corte-header-icon" aria-hidden="true"></i>
        </div>

        <div className="kfc-content-card mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
            <div>
              <label className="form-label fw-bold mb-1" htmlFor="mes-cortes">Mes de consulta</label>
              <input
                id="mes-cortes"
                type="month"
                className="form-control"
                value={month}
                onChange={event => setMonth(event.target.value)}
              />
            </div>
            <div className="text-muted">
              <i className="bi bi-check2-circle text-danger me-2"></i>
              {cortesDelMes.length} {cortesDelMes.length === 1 ? 'corte registrado' : 'cortes registrados'}
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3"><div className="corte-stat-card"><span>Ventas en efectivo</span><strong>{formatCurrency(totals.efectivo)}</strong><small>del mes seleccionado</small></div></div>
          <div className="col-12 col-sm-6 col-lg-3"><div className="corte-stat-card"><span>Ventas con tarjeta</span><strong>{formatCurrency(totals.tarjeta)}</strong><small>del mes seleccionado</small></div></div>
          <div className="col-12 col-sm-6 col-lg-3"><div className="corte-stat-card corte-stat-card-total"><span>Total cerrado</span><strong>{formatCurrency(totals.total)}</strong><small>ventas auditadas</small></div></div>
          <div className="col-12 col-sm-6 col-lg-3"><div className="corte-stat-card"><span>Remesas entregadas</span><strong>{formatCurrency(totals.remesa)}</strong><small>solo efectivo</small></div></div>
        </div>

        <div className="kfc-content-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="h4 fw-bold mb-1">Detalle de {monthLabel(month)}</h2>
              <p className="text-muted mb-0">El fondo de caja de {formatCurrency(FONDO_CAJA)} no forma parte de la remesa.</p>
            </div>
          </div>
          {cortesDelMes.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-inbox display-5 d-block mb-2"></i>
              No hay cierres registrados en este mes.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr><th>Fecha y hora</th><th>Cajero</th><th>Pedidos</th><th>Efectivo</th><th>Tarjeta</th><th>Total</th><th>Remesa</th></tr>
                </thead>
                <tbody>
                  {cortesDelMes.map(cut => (
                    <tr key={cut.id}>
                      <td>{new Date(cut.at).toLocaleString('es-MX')}</td>
                      <td className="fw-semibold">{cut.cajeroNombre || 'Cajero de turno'}</td>
                      <td>{cut.pedidos ?? 0}</td>
                      <td>{formatCurrency(cut.efectivo)}</td>
                      <td>{formatCurrency(cut.tarjeta)}</td>
                      <td className="fw-bold">{formatCurrency(cut.total)}</td>
                      <td className="fw-bold text-danger">{formatCurrency(cut.remesa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <button type="button" className="btn btn-link text-dark align-self-start mt-3" onClick={() => navigate('/admin')}>
          <i className="bi bi-arrow-left me-2"></i>Volver al panel administrativo
        </button>
      </main>
    </div>
  );
}

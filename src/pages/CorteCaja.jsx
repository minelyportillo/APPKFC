import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { ESTADOS_PEDIDO, formatCurrency } from '../services/storageService';

const FONDO_CAJA = 160;

function isToday(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const today = new Date();
  return date.toLocaleDateString('en-CA') === today.toLocaleDateString('en-CA');
}

export default function CorteCaja() {
  const { orders, user, cashCuts, makeCashCut, revertCashCut } = useAuth();
  const navigate = useNavigate();

  const corte = useMemo(() => {
    const ultimoCorte = cashCuts.length > 0 ? cashCuts[cashCuts.length - 1] : null;
    const ventas = orders.filter(order => {
      if (order.estado === ESTADOS_PEDIDO.CANCELADO || !order.fecha) return false;
      return ultimoCorte ? order.fecha > ultimoCorte.at : isToday(order.fecha);
    });
    const efectivo = ventas
      .filter(order => order.tipoPago === 'Efectivo')
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const tarjeta = ventas
      .filter(order => order.tipoPago === 'Tarjeta' || order.tipoPago === 'Digital')
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      ventas,
      efectivo,
      tarjeta,
      total: efectivo + tarjeta,
      efectivoEsperado: FONDO_CAJA + efectivo,
      remesa: efectivo
    };
  }, [cashCuts, orders]);

  const fecha = useMemo(() => new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), []);

  const generarPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const right = pageWidth - margin;
    const red = [228, 0, 43];

    doc.setFillColor(...red);
    doc.rect(0, 0, pageWidth, 34, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('KFC', margin, 15);
    doc.setFontSize(12);
    doc.text('CORTE DE CAJA', right, 15, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Reporte formal de cierre de turno', right, 24, { align: 'right' });

    doc.setTextColor(35, 35, 35);
    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, margin, 48);
    doc.text(`Cajero: ${user?.nombre || 'Cajero de turno'}`, margin, 55);
    doc.text(`Pedidos procesados: ${corte.ventas.length}`, right, 55, { align: 'right' });

    let y = 72;
    doc.setFillColor(248, 242, 235);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DE VENTAS', margin + 5, y + 8);
    y += 24;
    doc.setFont('helvetica', 'normal');
    const rows = [
      ['Ventas cobradas en efectivo', formatCurrency(corte.efectivo)],
      ['Ventas cobradas con tarjeta', formatCurrency(corte.tarjeta)],
      ['VENTAS TOTALES DEL DÍA', formatCurrency(corte.total)]
    ];
    rows.forEach(([label, value], index) => {
      if (index === rows.length - 1) doc.setFont('helvetica', 'bold');
      doc.text(label, margin + 5, y);
      doc.text(value, right - 5, y, { align: 'right' });
      doc.setDrawColor(220, 220, 220);
      doc.line(margin + 5, y + 4, right - 5, y + 4);
      y += 14;
    });

    y += 10;
    doc.setFillColor(248, 242, 235);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('CONTROL DE EFECTIVO', margin + 5, y + 8);
    y += 24;
    doc.setFont('helvetica', 'normal');
    [
      ['Fondo inicial de caja', formatCurrency(FONDO_CAJA)],
      ['Efectivo de ventas', formatCurrency(corte.efectivo)],
      ['Efectivo esperado en caja', formatCurrency(corte.efectivoEsperado)]
    ].forEach(([label, value]) => {
      doc.text(label, margin + 5, y);
      doc.text(value, right - 5, y, { align: 'right' });
      y += 14;
    });

    y += 5;
    doc.setFillColor(...red);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('REMESA DE CIERRE (EFECTIVO A ENTREGAR)', margin + 7, y + 8);
    doc.text(formatCurrency(corte.remesa), right - 7, y + 15, { align: 'right' });
    doc.setTextColor(35, 35, 35);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('La remesa excluye el fondo inicial, que permanece en caja para el siguiente turno.', margin, y + 32);

    y += 58;
    doc.setDrawColor(100, 100, 100);
    doc.line(margin, y, margin + 62, y);
    doc.line(right - 62, y, right, y);
    doc.text('Firma del cajero', margin, y + 6);
    doc.text('Firma de supervisión', right, y + 6, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text('Documento generado por Sistema KFC · Los pedidos cancelados no forman parte del corte.', margin, 285);
    doc.save(`corte_caja_${new Date().toLocaleDateString('en-CA')}.pdf`);
  };

  const confirmarCorte = async () => {
    const confirmacion = await Swal.fire({
      title: '¿Aceptar corte de caja?',
      text: 'Las ventas actuales quedarán cerradas y el resumen comenzará desde cero. El fondo de $160 permanecerá en caja.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, hacer corte',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#E4002B'
    });
    if (!confirmacion.isConfirmed) return;
    makeCashCut();
    Swal.fire({
      title: 'Corte realizado',
      text: 'Las nuevas ventas se acumularán en el siguiente corte.',
      icon: 'success',
      confirmButtonColor: '#E4002B'
    });
  };

  const confirmarReversion = async () => {
    if (cashCuts.length === 0) return;
    const confirmacion = await Swal.fire({
      title: '¿Revertir el último corte?',
      text: 'Las ventas anteriores al último corte volverán a mostrarse en el resumen.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, revertir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#525252'
    });
    if (!confirmacion.isConfirmed) return;
    revertCashCut();
    Swal.fire({
      title: 'Corte revertido',
      text: 'El resumen anterior fue restaurado.',
      icon: 'success',
      confirmButtonColor: '#E4002B'
    });
  };

  return (
    <div className="kfc-app-container">
      <Header title="Corte de Caja" showCart={false} backToMenu dashboardStyle />
      <main className="kfc-main-content">
        <div className="corte-header mb-4">
          <div>
            <span className="text-uppercase small fw-bold text-danger">Cierre diario</span>
            <h1 className="kfc-script-font display-5 mb-1">Corte de caja</h1>
            <p className="mb-0 text-muted text-capitalize">
              {cashCuts.length > 0 ? 'Ventas desde el último corte' : fecha}
            </p>
          </div>
          <i className="bi bi-receipt-cutoff corte-header-icon" aria-hidden="true"></i>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="corte-stat-card">
              <span>Ventas en efectivo</span>
              <strong>{formatCurrency(corte.efectivo)}</strong>
              <small>{corte.ventas.filter(o => o.tipoPago === 'Efectivo').length} pedidos</small>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="corte-stat-card">
              <span>Ventas con tarjeta</span>
              <strong>{formatCurrency(corte.tarjeta)}</strong>
              <small>{corte.ventas.filter(o => o.tipoPago === 'Tarjeta' || o.tipoPago === 'Digital').length} pedidos</small>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="corte-stat-card corte-stat-card-total">
              <span>Total vendido</span>
              <strong>{formatCurrency(corte.total)}</strong>
              <small>{corte.ventas.length} pedidos válidos</small>
            </div>
          </div>
        </div>

        <div className="kfc-content-card corte-report-card">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
            <div>
              <h2 className="h4 fw-bold mb-1">Resumen del cierre</h2>
            <p className="text-muted mb-0">
              {cashCuts.length > 0 ? 'Valores acumulados desde el último corte.' : 'Valores calculados con las ventas válidas del día.'}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2 justify-content-end">
            <button type="button" className="btn btn-danger rounded-pill px-4" onClick={generarPdf}>
              <i className="bi bi-file-earmark-pdf me-2"></i>Descargar PDF
            </button>
            <button type="button" className="btn btn-dark rounded-pill px-4" onClick={confirmarCorte}>
              <i className="bi bi-check2-circle me-2"></i>Hacer corte
            </button>
            {cashCuts.length > 0 && (
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={confirmarReversion}>
                <i className="bi bi-arrow-counterclockwise me-2"></i>Revertir corte
              </button>
            )}
          </div>
          </div>
          <div className="corte-summary-list">
            <div><span>Fondo inicial en efectivo</span><strong>{formatCurrency(FONDO_CAJA)}</strong></div>
            <div><span>Efectivo cobrado por ventas</span><strong>{formatCurrency(corte.efectivo)}</strong></div>
            <div><span>Efectivo esperado en caja</span><strong>{formatCurrency(corte.efectivoEsperado)}</strong></div>
            <div className="corte-remesa"><span>Remesa de cierre</span><strong>{formatCurrency(corte.remesa)}</strong></div>
          </div>
          <div className="alert alert-light border mt-4 mb-0">
            <i className="bi bi-info-circle me-2 text-danger"></i>
            La remesa corresponde únicamente al efectivo cobrado por ventas. El fondo de {formatCurrency(FONDO_CAJA)} permanece en caja.
          </div>
        </div>

        <button type="button" className="btn btn-link text-dark align-self-start mt-3" onClick={() => navigate('/cajero')}>
          <i className="bi bi-arrow-left me-2"></i>Volver al panel del cajero
        </button>
      </main>
    </div>
  );
}

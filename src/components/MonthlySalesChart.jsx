import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chart, registerables } from 'chart.js';
import Swal from 'sweetalert2';

Chart.register(...registerables);

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function pad(value) {
  return String(value).padStart(2, '0');
}

export default function MonthlySalesChart() {
  const { orders, user } = useAuth();
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const now = new Date();
  const [monthPicker, setMonthPicker] = useState(() => {
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    return `${yyyy}-${mm}`;
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [labels, setLabels] = useState([]);
  const [totals, setTotals] = useState([]);

  useEffect(() => {
    const [year, month] = monthPicker.split('-').map(Number);
    const monthStart = `${year}-${pad(month)}-01`;
    const monthLastDay = getDaysInMonth(year, month);
    const monthEnd = `${year}-${pad(month)}-${pad(monthLastDay)}`;

    setStartDate(prev => {
      if (!prev || prev < monthStart || prev > monthEnd) return monthStart;
      return prev;
    });

    setEndDate(prev => {
      if (!prev || prev < monthStart || prev > monthEnd) return monthEnd;
      return prev;
    });
  }, [monthPicker]);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return;
    }

    const rangeDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const nextLabels = [];
    const nextTotals = new Array(rangeDays).fill(0);

    for (let index = 0; index < rangeDays; index += 1) {
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      nextLabels.push(current.toLocaleDateString('es-SV', {
        day: '2-digit',
        month: 'short'
      }));
    }

    if (Array.isArray(orders)) {
      orders.forEach(order => {
        if (!order || !order.fecha || order.estado === 'cancelado') return;

        const orderDate = new Date(order.fecha);
        if (Number.isNaN(orderDate.getTime())) return;

        if (orderDate >= start && orderDate <= end) {
          const diffDays = Math.floor((orderDate - start) / (1000 * 60 * 60 * 24));
          const amount = Number(order.total) || 0;
          nextTotals[diffDays] += amount;
        }
      });
    }

    setLabels(nextLabels);
    setTotals(nextTotals);
  }, [orders, startDate, endDate]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Ventas por día (USD)',
          data: totals,
          backgroundColor: 'rgba(40, 167, 69, 0.7)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y || 0;
                return ` ${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(value)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Fecha' }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Ventas' },
            ticks: {
              callback: (value) =>
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0
                }).format(value)
            }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [labels, totals]);

  const totalRange = totals.reduce((sum, amount) => sum + Number(amount || 0), 0);

  const handleExportCsv = () => {
    const [year, month] = monthPicker.split('-').map(Number);
    const detail = getDailyDetail();
    // Dos decimales y coma decimal, como espera Excel en español
    const toExcelNumber = (value) => (Number(value) || 0).toFixed(2).replace('.', ',');
    const totalPedidos = detail.reduce((sum, day) => sum + day.pedidos, 0);
    const csvRows = [
      ['Fecha', 'Pedidos', 'Ventas (USD)'],
      ...detail.map(day => [day.fecha, day.pedidos, toExcelNumber(day.total)]),
      ['Total', totalPedidos, toExcelNumber(totalRange)]
    ];

    // "sep=;" fuerza a Excel a separar en columnas y el BOM (\uFEFF) conserva las tildes
    const csvContent = 'sep=;\r\n' + csvRows.map(row => row.join(';')).join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ventas_${year}_${String(month).padStart(2, '0')}_${startDate}_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    Swal.fire({
      title: 'CSV listo',
      text: `Se exportó el rango del ${startDate} al ${endDate}.`,
      icon: 'success',
      confirmButtonColor: '#E4002B'
    });
  };

  const formatMoney = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);

  // Desglose diario (ventas y cantidad de pedidos) del rango seleccionado
  const getDailyDetail = () => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const detail = Array.from({ length: days }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return {
        fecha: day.toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        pedidos: 0,
        total: 0
      };
    });

    (Array.isArray(orders) ? orders : []).forEach(order => {
      if (!order?.fecha || order.estado === 'cancelado') return;
      const orderDate = new Date(order.fecha);
      if (Number.isNaN(orderDate.getTime()) || orderDate < start || orderDate > end) return;
      const index = Math.floor((orderDate - start) / (1000 * 60 * 60 * 24));
      if (detail[index]) {
        detail[index].pedidos += 1;
        detail[index].total += Number(order.total) || 0;
      }
    });

    return detail;
  };

  // Devuelve la gráfica como imagen PNG sobre fondo blanco (el canvas original es transparente)
  const getChartImage = () => {
    const source = chartRef.current?.canvas;
    if (!source) return null;
    const flat = document.createElement('canvas');
    flat.width = source.width;
    flat.height = source.height;
    const context = flat.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, flat.width, flat.height);
    context.drawImage(source, 0, 0);
    return { dataUrl: flat.toDataURL('image/png'), width: flat.width, height: flat.height };
  };

  const handleExportPdf = async () => {
    const chartImage = getChartImage();
    if (!chartImage || labels.length === 0) {
      Swal.fire({
        title: 'Rango no válido',
        text: 'Selecciona un rango de fechas válido antes de exportar el reporte.',
        icon: 'warning',
        confirmButtonColor: '#E4002B'
      });
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;

      const detail = getDailyDetail();
      const daysWithSales = detail.filter(day => day.total > 0);
      const totalOrders = detail.reduce((sum, day) => sum + day.pedidos, 0);
      const bestDay = daysWithSales.reduce((best, day) => (!best || day.total > best.total ? day : best), null);

      // Encabezado
      doc.setFillColor(228, 0, 43);
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('KFC - Reporte de ventas', margin, 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Ventas diarias por rango de fechas', margin, 21);

      // Datos generales
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      let y = 38;
      const infoLines = [
        ['Rango seleccionado:', `${startDate} al ${endDate}`],
        ['Generado el:', new Date().toLocaleString('es-SV')],
        ['Generado por:', user?.nombre || 'Administrador'],
        ['Pedidos considerados:', String(totalOrders)],
        ['Mejor día de ventas:', bestDay ? `${bestDay.fecha} (${formatMoney(bestDay.total)})` : 'Sin ventas en el rango']
      ];
      infoLines.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 46, y);
        y += 6;
      });

      // Total destacado
      y += 2;
      doc.setFillColor(243, 249, 244);
      doc.setDrawColor(40, 167, 69);
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text('Total del rango', margin + 4, y + 9);
      doc.setFontSize(15);
      doc.setTextColor(30, 130, 60);
      doc.text(formatMoney(totalRange), pageWidth - margin - 4, y + 9.5, { align: 'right' });
      y += 22;

      // Gráfica
      const chartWidth = contentWidth;
      const chartHeight = Math.min(85, (chartImage.height / chartImage.width) * chartWidth);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Gráfica de ventas por día', margin, y);
      y += 3;
      doc.addImage(chartImage.dataUrl, 'PNG', margin, y, chartWidth, chartHeight);
      doc.setDrawColor(220, 220, 220);
      doc.rect(margin, y, chartWidth, chartHeight);
      y += chartHeight + 10;

      // Tabla de detalle (solo días con ventas)
      const drawTableHeader = () => {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y - 5, contentWidth, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.text('Fecha', margin + 3, y);
        doc.text('Pedidos', margin + 80, y, { align: 'right' });
        doc.text('Ventas (USD)', pageWidth - margin - 3, y, { align: 'right' });
        y += 8;
      };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Detalle por día', margin, y);
      y += 8;

      if (daysWithSales.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text('No se registraron ventas en el rango seleccionado.', margin, y);
      } else {
        drawTableHeader();
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        daysWithSales.forEach((day, index) => {
          if (y > pageHeight - 28) {
            doc.addPage();
            y = 20;
            drawTableHeader();
            doc.setFont('helvetica', 'normal');
          }
          if (index % 2 === 1) {
            doc.setFillColor(251, 251, 251);
            doc.rect(margin, y - 5, contentWidth, 7, 'F');
          }
          doc.setFontSize(10);
          doc.text(day.fecha, margin + 3, y);
          doc.text(String(day.pedidos), margin + 80, y, { align: 'right' });
          doc.text(formatMoney(day.total), pageWidth - margin - 3, y, { align: 'right' });
          y += 7;
        });

        doc.setDrawColor(40, 40, 40);
        doc.line(margin, y - 4, pageWidth - margin, y - 4);
        doc.setFont('helvetica', 'bold');
        doc.text('Total', margin + 3, y + 2);
        doc.text(String(totalOrders), margin + 80, y + 2, { align: 'right' });
        doc.text(formatMoney(totalRange), pageWidth - margin - 3, y + 2, { align: 'right' });
      }

      // Pie de página con numeración
      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(`Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
        doc.text('Reporte generado por el sistema de pedidos KFC', margin, pageHeight - 8);
      }

      doc.save(`reporte_ventas_${startDate}_${endDate}.pdf`);

      Swal.fire({
        title: 'PDF listo',
        text: `Se descargó el reporte del ${startDate} al ${endDate} con su gráfica.`,
        icon: 'success',
        confirmButtonColor: '#E4002B'
      });
    } catch (error) {
      console.error('No se pudo generar el PDF.', error);
      Swal.fire({
        title: 'No se pudo generar el PDF',
        text: 'Ocurrió un error al crear el documento. Intenta nuevamente.',
        icon: 'error',
        confirmButtonColor: '#E4002B'
      });
    }
  };

  return (
    <div className="mb-4 sales-chart-box">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 className="m-0">Ventas mensuales por rango</h3>
          <small className="text-muted">Consulta las ventas del mes por fechas específicas</small>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap sales-chart-actions">
          <input
            type="month"
            value={monthPicker}
            onChange={(e) => setMonthPicker(e.target.value)}
            className="form-control"
            style={{ width: '180px' }}
          />
          <input
            type="date"
            value={startDate}
            min={monthPicker ? `${monthPicker}-01` : ''}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="form-control"
            style={{ width: '170px' }}
          />
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            max={monthPicker ? `${monthPicker}-${String(getDaysInMonth(Number(monthPicker.split('-')[0]), Number(monthPicker.split('-')[1]))).padStart(2, '0')}` : ''}
            onChange={(e) => setEndDate(e.target.value)}
            className="form-control"
            style={{ width: '170px' }}
          />
          <button className="btn btn-outline-danger btn-sm" onClick={() => {
            Swal.fire({
              title: 'Exportar CSV',
              text: `¿Deseas descargar el reporte del ${startDate} al ${endDate}?`,
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'Sí, exportar',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#E4002B'
            }).then((result) => {
              if (result.isConfirmed) handleExportCsv();
            });
          }}>
            <i className="bi bi-download me-1"></i> CSV
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => {
            Swal.fire({
              title: 'Exportar PDF',
              text: `¿Deseas descargar el reporte en PDF (con gráfica) del ${startDate} al ${endDate}?`,
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'Sí, exportar',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#E4002B'
            }).then((result) => {
              if (result.isConfirmed) handleExportPdf();
            });
          }}>
            <i className="bi bi-file-earmark-pdf me-1"></i> PDF
          </button>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <div className="p-3 bg-light rounded-3 border">
            <div className="text-muted small">Rango Seleccionado</div>
            <div className="fs-6 fw-bold text-dark">{startDate || '—'} al {endDate || '—'}</div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="p-3 bg-light rounded-3 border">
            <div className="text-muted small">Total del Rango</div>
            <div className="fs-3 fw-bold text-success">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRange)}</div>
          </div>
        </div>
      </div>

      <div style={{ height: '360px' }} className="rounded border bg-white p-2 sales-chart-canvas-wrapper">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}


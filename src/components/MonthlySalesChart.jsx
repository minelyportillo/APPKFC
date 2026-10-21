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
  const { orders } = useAuth();
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
    const csvRows = [
      ['Fecha', 'Ventas (USD)'],
      ...labels.map((label, index) => [label, totals[index] ?? 0])
    ];

    const csvContent = csvRows
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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


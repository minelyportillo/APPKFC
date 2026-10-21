import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chart, registerables } from 'chart.js';
import Swal from 'sweetalert2';

Chart.register(...registerables);

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export default function MonthlySalesChart() {
  const { orders } = useAuth();
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const now = new Date();
  const [monthPicker, setMonthPicker] = useState(() => {
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  });

  const [labels, setLabels] = useState([]);
  const [totals, setTotals] = useState([]);

  useEffect(() => {
    const [year, month] = monthPicker.split('-').map(Number);
    const days = getDaysInMonth(year, month);
    const dayLabels = Array.from({ length: days }, (_, i) => String(i + 1));
    const dayTotals = new Array(days).fill(0);

    if (Array.isArray(orders)) {
      orders.forEach(order => {
        if (!order || !order.fecha || order.estado === 'cancelado') return;

        const fechaStr = typeof order.fecha === 'string' ? order.fecha.slice(0, 10) : null;
        if (!fechaStr) return;

        const [orderYear, orderMonth, orderDay] = fechaStr.split('-').map(Number);
        if (orderYear === year && orderMonth === month) {
          const index = orderDay - 1;
          const amount = Number(order.total) || 0;
          dayTotals[index] += amount;
        }
      });
    }

    setLabels(dayLabels);
    setTotals(dayTotals);
  }, [orders, monthPicker]);

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
          label: 'Ventas diarias (USD)',
          data: totals,
          backgroundColor: 'rgba(40, 167, 69, 0.65)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1
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
            title: { display: true, text: 'Día del mes' }
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

  const handleExportCsv = () => {
    const [year, month] = monthPicker.split('-').map(Number);
    const csvRows = [
      ['Dia', 'Ventas (USD)'],
      ...labels.map((label, index) => [label, totals[index] ?? 0])
    ];

    const csvContent = csvRows
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ventas_${year}_${String(month).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    Swal.fire({
      title: 'CSV listo',
      text: `Se exportó el reporte del mes ${monthPicker}.`,
      icon: 'success',
      confirmButtonColor: '#E4002B'
    });
  };

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 className="m-0">Ventas mensuales por día</h3>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <label className="small text-muted mb-0">Mes:</label>
          <input
            type="month"
            value={monthPicker}
            onChange={(e) => setMonthPicker(e.target.value)}
            className="form-control"
            style={{ width: '180px' }}
          />
          <button className="btn btn-outline-danger btn-sm" onClick={() => {
            Swal.fire({
              title: 'Exportar CSV',
              text: `¿Deseas descargar el reporte de ${monthPicker}?`,
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

      <div style={{ height: '360px' }} className="rounded border bg-white p-2">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

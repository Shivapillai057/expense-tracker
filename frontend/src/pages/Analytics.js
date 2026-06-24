import React, { useState, useEffect, useCallback } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, LineElement, PointElement, Filler,
} from 'chart.js';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getSummary, CATEGORY_COLORS, CATEGORY_ICONS, formatCurrency } from '../utils/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#9898b8', font: { family: 'Inter' } } },
  },
  scales: {
    x: { ticks: { color: '#9898b8' }, grid: { color: '#2a2a3d' } },
    y: { ticks: { color: '#9898b8' }, grid: { color: '#2a2a3d' } },
  },
};

export default function Analytics() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSummary({ month, year });
      setSummary(res.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  // Doughnut chart data
  const doughnutData = {
    labels: summary?.categoryBreakdown?.map((c) => c._id) || [],
    datasets: [{
      data: summary?.categoryBreakdown?.map((c) => c.total) || [],
      backgroundColor: CATEGORY_COLORS,
      borderColor: '#1c1c26',
      borderWidth: 2,
    }],
  };

  // Monthly trend data
  const trendMonths = [...new Set(summary?.monthlyTrend?.map((t) => `${months[t._id.month - 1]} ${t._id.year}`))];
  const incomeData = trendMonths.map((m) => {
    const [mn, yr] = m.split(' ');
    const item = summary?.monthlyTrend?.find(
      (t) => months[t._id.month - 1] === mn && String(t._id.year) === yr && t._id.type === 'income'
    );
    return item?.total || 0;
  });
  const expenseData = trendMonths.map((m) => {
    const [mn, yr] = m.split(' ');
    const item = summary?.monthlyTrend?.find(
      (t) => months[t._id.month - 1] === mn && String(t._id.year) === yr && t._id.type === 'expense'
    );
    return item?.total || 0;
  });

  const lineData = {
    labels: trendMonths,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const barData = {
    labels: summary?.categoryBreakdown?.slice(0, 8).map((c) => c._id) || [],
    datasets: [{
      label: 'Amount',
      data: summary?.categoryBreakdown?.slice(0, 8).map((c) => c.total) || [],
      backgroundColor: CATEGORY_COLORS,
      borderRadius: 6,
    }],
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Spending insights and trends</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="filter-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="filter-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Income</div>
          <div className="stat-value income">{formatCurrency(summary?.income || 0, user?.currency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expenses</div>
          <div className="stat-value expense">{formatCurrency(summary?.expenses || 0, user?.currency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Balance</div>
          <div className="stat-value" style={{ color: (summary?.balance || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {formatCurrency(summary?.balance || 0, user?.currency)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Categories</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {summary?.categoryBreakdown?.length || 0}
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>6-Month Trend</h3>
        <div style={{ height: 220 }}>
          <Line data={lineData} options={{ ...CHART_OPTIONS, scales: { ...CHART_OPTIONS.scales } }} />
        </div>
      </div>

      <div className="grid-2">
        {/* Doughnut */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Spending Distribution</h3>
          {(summary?.categoryBreakdown?.length || 0) === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🍩</div><h3>No data</h3></div>
          ) : (
            <div style={{ height: 220 }}>
              <Doughnut data={doughnutData} options={{ ...CHART_OPTIONS, scales: undefined }} />
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>By Category</h3>
          {(summary?.categoryBreakdown?.length || 0) === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📊</div><h3>No data</h3></div>
          ) : (
            <div style={{ height: 220 }}>
              <Bar data={barData} options={{ ...CHART_OPTIONS, plugins: { ...CHART_OPTIONS.plugins, legend: { display: false } } }} />
            </div>
          )}
        </div>
      </div>

      {/* Category table */}
      {(summary?.categoryBreakdown?.length || 0) > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Category Breakdown</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '8px 0', textAlign: 'left', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 500 }}>Transactions</th>
                <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 500 }}>Total</th>
                <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 500 }}>% of Spending</th>
              </tr>
            </thead>
            <tbody>
              {summary.categoryBreakdown.map((cat) => (
                <tr key={cat._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 0' }}>
                    {CATEGORY_ICONS[cat._id]} {cat._id}
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {cat.count}
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(cat.total, user?.currency)}
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {summary.expenses > 0 ? ((cat.total / summary.expenses) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

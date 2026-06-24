import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getBudgets, createBudget, deleteBudget, CATEGORIES, CATEGORY_ICONS, formatCurrency } from '../utils/api';

export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Food & Dining', limit: '' });
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBudgets({ month, year });
      setBudgets(res.data);
    } catch {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { loadBudgets(); }, [loadBudgets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBudget({ ...form, limit: parseFloat(form.limit), month, year });
      toast.success('Budget saved!');
      setShowForm(false);
      setForm({ category: 'Food & Dining', limit: '' });
      loadBudgets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this budget?')) return;
    try {
      await deleteBudget(id);
      toast.success('Budget removed');
      loadBudgets();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Set spending limits per category</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Set Budget'}
        </button>
      </div>

      {/* Month Selector */}
      <div className="card card-sm" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Period:</span>
        <select className="filter-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="filter-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Add Budget Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>New Budget for {months[month - 1]} {year}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.expense.map((c) => (
                    <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Monthly Limit ({user?.currency})</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="1"
                  value={form.limit}
                  onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary">Save Budget</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Cards */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <h3>No budgets set</h3>
            <p>Set budgets for each category to track your spending</p>
          </div>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: 16 }}>
          {budgets.map((budget) => {
            const pct = Math.min(budget.percentage, 100);
            const isOver = budget.percentage > 100;
            const isWarning = budget.percentage > 80 && !isOver;
            const color = isOver ? 'var(--red)' : isWarning ? 'var(--yellow)' : 'var(--green)';

            return (
              <div key={budget._id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{CATEGORY_ICONS[budget.category]}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{budget.category}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {budget.percentage}% used
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(budget._id)}>×</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Spent: <strong style={{ color }}>{formatCurrency(budget.spent, user?.currency)}</strong>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Limit: <strong>{formatCurrency(budget.limit, user?.currency)}</strong>
                  </span>
                </div>

                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                </div>

                {isOver && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>
                    ⚠️ Over budget by {formatCurrency(budget.spent - budget.limit, user?.currency)}
                  </div>
                )}
                {!isOver && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatCurrency(budget.remaining, user?.currency)} remaining
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

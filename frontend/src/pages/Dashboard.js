import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getSummary, getExpenses, createExpense, deleteExpense, CATEGORY_ICONS, formatCurrency, formatDate } from '../utils/api';
import ExpenseModal from '../components/ExpenseModal';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0, categoryBreakdown: [] });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const loadData = useCallback(async () => {
    try {
      const [summaryRes, expensesRes] = await Promise.all([
        getSummary({ month: currentMonth, year: currentYear }),
        getExpenses({ limit: 5, sort: '-date' }),
      ]);
      setSummary(summaryRes.data);
      setRecentExpenses(expensesRes.data.expenses);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddExpense = async (data) => {
    try {
      await createExpense(data);
      toast.success('Transaction added!');
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await deleteExpense(id);
      toast.success('Deleted');
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{monthName} {currentYear} Overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Transaction
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value income">{formatCurrency(summary.income, user?.currency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value expense">{formatCurrency(summary.expenses, user?.currency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Balance</div>
          <div className={`stat-value balance`} style={{ color: summary.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {formatCurrency(summary.balance, user?.currency)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Savings Rate</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {summary.income > 0 ? Math.round((summary.balance / summary.income) * 100) : 0}%
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Transactions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent Transactions</h2>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/transactions')}>
              View All
            </button>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No transactions yet</h3>
              <p>Add your first transaction to get started</p>
            </div>
          ) : (
            <div className="transaction-list">
              {recentExpenses.map((exp) => (
                <div key={exp._id} className="transaction-item">
                  <div className="transaction-icon">{CATEGORY_ICONS[exp.category] || '📌'}</div>
                  <div className="transaction-info">
                    <div className="transaction-title">{exp.title}</div>
                    <div className="transaction-meta">{exp.category} · {formatDate(exp.date)}</div>
                  </div>
                  <div className={`transaction-amount ${exp.type}`}>
                    {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.amount, user?.currency)}
                  </div>
                  <div className="transaction-actions">
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(exp._id)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spending by Category */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Spending by Category</h2>
          {summary.categoryBreakdown.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>No spending data</h3>
              <p>Add expenses to see category breakdown</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {summary.categoryBreakdown.slice(0, 6).map((cat, i) => {
                const pct = summary.expenses > 0 ? (cat.total / summary.expenses) * 100 : 0;
                const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
                return (
                  <div key={cat._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span>{CATEGORY_ICONS[cat._id]} {cat._id}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(cat.total, user?.currency)}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ExpenseModal onClose={() => setShowModal(false)} onSave={handleAddExpense} />
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

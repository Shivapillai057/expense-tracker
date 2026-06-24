import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getExpenses, createExpense, updateExpense, deleteExpense, CATEGORY_ICONS, CATEGORIES, formatCurrency, formatDate } from '../utils/api';
import ExpenseModal from '../components/ExpenseModal';

export default function Transactions() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [filters, setFilters] = useState({ type: '', category: '', page: 1 });

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExpenses({ ...filters, limit: 15 });
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const handleSave = async (data) => {
    try {
      if (editExpense) {
        await updateExpense(editExpense._id, data);
        toast.success('Updated!');
      } else {
        await createExpense(data);
        toast.success('Added!');
      }
      setShowModal(false);
      setEditExpense(null);
      loadExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving');
    }
  };

  const handleEdit = (exp) => {
    setEditExpense(exp);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await deleteExpense(id);
      toast.success('Deleted');
      loadExpenses();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const allCategories = [...CATEGORIES.expense, ...CATEGORIES.income];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} total records</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditExpense(null); setShowModal(true); }}>
          + Add New
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div className="filters">
          <select
            className="filter-select"
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            className="filter-select"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}
          >
            <option value="">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            type="date"
            className="filter-select"
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value, page: 1 }))}
            style={{ cursor: 'pointer' }}
          />
          <input
            type="date"
            className="filter-select"
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value, page: 1 }))}
            style={{ cursor: 'pointer' }}
          />

          {(filters.type || filters.category || filters.startDate) && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setFilters({ type: '', category: '', page: 1 })}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No transactions found</h3>
            <p>Try adjusting your filters or add a new transaction</p>
          </div>
        ) : (
          <div className="transaction-list">
            {expenses.map((exp) => (
              <div key={exp._id} className="transaction-item">
                <div className="transaction-icon">{CATEGORY_ICONS[exp.category] || '📌'}</div>
                <div className="transaction-info">
                  <div className="transaction-title">{exp.title}</div>
                  <div className="transaction-meta">
                    <span className={`badge badge-${exp.type}`}>{exp.type}</span>
                    {' '}{exp.category} · {formatDate(exp.date)}
                    {exp.notes && <span> · {exp.notes}</span>}
                  </div>
                </div>
                <div className={`transaction-amount ${exp.type}`}>
                  {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.amount, user?.currency)}
                </div>
                <div className="transaction-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(exp)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(exp._id)}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > 15 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={filters.page === 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            >
              Previous
            </button>
            <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>
              Page {filters.page}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={expenses.length < 15}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <ExpenseModal
          onClose={() => { setShowModal(false); setEditExpense(null); }}
          onSave={handleSave}
          expense={editExpense}
        />
      )}
    </div>
  );
}

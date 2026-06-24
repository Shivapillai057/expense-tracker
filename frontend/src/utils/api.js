import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Expenses
export const getExpenses = (params) => axios.get(`${API_URL}/expenses`, { params });
export const getSummary = (params) => axios.get(`${API_URL}/expenses/summary`, { params });
export const createExpense = (data) => axios.post(`${API_URL}/expenses`, data);
export const updateExpense = (id, data) => axios.put(`${API_URL}/expenses/${id}`, data);
export const deleteExpense = (id) => axios.delete(`${API_URL}/expenses/${id}`);

// Budgets
export const getBudgets = (params) => axios.get(`${API_URL}/budgets`, { params });
export const createBudget = (data) => axios.post(`${API_URL}/budgets`, data);
export const deleteBudget = (id) => axios.delete(`${API_URL}/budgets/${id}`);

export const CATEGORIES = {
  expense: [
    'Food & Dining',
    'Shopping',
    'Transportation',
    'Housing',
    'Entertainment',
    'Healthcare',
    'Education',
    'Travel',
    'Utilities',
    'Personal Care',
    'Other',
  ],
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
};

export const CATEGORY_ICONS = {
  'Food & Dining': '🍽️',
  Shopping: '🛍️',
  Transportation: '🚗',
  Housing: '🏠',
  Entertainment: '🎬',
  Healthcare: '💊',
  Education: '📚',
  Travel: '✈️',
  Utilities: '💡',
  'Personal Care': '💆',
  Salary: '💼',
  Freelance: '💻',
  Investment: '📈',
  Gift: '🎁',
  Other: '📌',
};

export const CATEGORY_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#a855f7', '#22c55e', '#3b82f6', '#eab308', '#64748b',
];

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

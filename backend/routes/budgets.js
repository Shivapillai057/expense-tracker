const express = require('express');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/budgets - Get budgets for a month
router.get('/', async (req, res) => {
  try {
    const currentDate = new Date();
    const month = req.query.month ? Number(req.query.month) : currentDate.getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : currentDate.getFullYear();

    const budgets = await Budget.find({ user: req.user._id, month, year });

    // Get spending for each budget category
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const spending = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const spendingMap = {};
    spending.forEach((s) => (spendingMap[s._id] = s.spent));

    const budgetsWithSpending = budgets.map((b) => ({
      ...b.toObject(),
      spent: spendingMap[b.category] || 0,
      remaining: b.limit - (spendingMap[b.category] || 0),
      percentage: Math.round(((spendingMap[b.category] || 0) / b.limit) * 100),
    }));

    res.json(budgetsWithSpending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/budgets - Create or update budget
router.post('/', async (req, res) => {
  try {
    const { category, limit, month, year } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month, year },
      { limit },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(budget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

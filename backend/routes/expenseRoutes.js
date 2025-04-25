// routes/expenses.js
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const authenticate = require('../middleware/auth');

// POST /expenses - Add a new expense
router.post('/createExpense/', authenticate, async (req, res) => {
  const { title, amount, category, date } = req.body;

  const expense = new Expense({
    title,
    amount,
    category,
    date,
    user: req.user.id
  });

  await expense.save();
  res.status(201).json(expense);
});

// GET /expenses - Get all expenses for the logged-in user
router.get('/getAllExpense/', authenticate, async (req, res) => {
  const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
  res.json(expenses);
});

// PUT /expenses/:id - Update an expense
router.put('/updateExpense/:id', authenticate, async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user.id });

  if (!expense) return res.status(404).json({ message: 'Expense not found' });

  const {amount, date } = req.body;
  if (amount) expense.amount = amount;
  if (date) expense.date = date;

  await expense.save();
  res.json(expense);
});



// DELETE /expenses/:id - Delete an expense
router.delete('/deleteExpense/:id', authenticate, async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!expense) return res.status(404).json({ message: 'Expense not found' });

  res.json({ message: 'Expense deleted' });
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');

const Expense = require('../models/Expense');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// All expense routes require authentication
router.use(protect);

const isValidExpenseId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/expenses — create expense for logged-in user
router.post('/', async (request, response) => {
  try {
    const expense = await Expense.create({
      ...request.body,
      userId: request.userId,
    });
    response.status(201).json(expense);
  } catch (error) {
    response.status(400).json({
      message: 'Failed to create expense.',
      error: error.message,
    });
  }
});

// GET /api/expenses — only return logged-in user's expenses
router.get('/', async (request, response) => {
  try {
    const expenses = await Expense.find({ userId: request.userId }).sort({
      date: -1,
      createdAt: -1,
    });
    response.json(expenses);
  } catch (error) {
    response.status(500).json({
      message: 'Failed to fetch expenses.',
      error: error.message,
    });
  }
});

// PUT /api/expenses/:id — update only if it belongs to the user
router.put('/:id', async (request, response) => {
  const { id } = request.params;

  if (!isValidExpenseId(id)) {
    return response.status(400).json({ message: 'Invalid expense ID.' });
  }

  try {
    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, userId: request.userId },
      request.body,
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return response.status(404).json({ message: 'Expense not found.' });
    }

    response.json(updatedExpense);
  } catch (error) {
    response.status(400).json({
      message: 'Failed to update expense.',
      error: error.message,
    });
  }
});

// DELETE /api/expenses/:id — delete only if it belongs to the user
router.delete('/:id', async (request, response) => {
  const { id } = request.params;

  if (!isValidExpenseId(id)) {
    return response.status(400).json({ message: 'Invalid expense ID.' });
  }

  try {
    const deletedExpense = await Expense.findOneAndDelete({
      _id: id,
      userId: request.userId,
    });

    if (!deletedExpense) {
      return response.status(404).json({ message: 'Expense not found.' });
    }

    response.json({
      message: 'Expense deleted successfully.',
      expense: deletedExpense,
    });
  } catch (error) {
    response.status(500).json({
      message: 'Failed to delete expense.',
      error: error.message,
    });
  }
});

module.exports = router;
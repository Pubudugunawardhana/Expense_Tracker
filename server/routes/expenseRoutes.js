const express = require('express');
const mongoose = require('mongoose');

const Expense = require('../models/Expense');

const router = express.Router();

const isValidExpenseId = (id) => mongoose.Types.ObjectId.isValid(id);

router.post('/', async (request, response) => {
  try {
    const expense = await Expense.create(request.body);
    response.status(201).json(expense);
  } catch (error) {
    response.status(400).json({
      message: 'Failed to create expense.',
      error: error.message,
    });
  }
});

router.get('/', async (_request, response) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    response.json(expenses);
  } catch (error) {
    response.status(500).json({
      message: 'Failed to fetch expenses.',
      error: error.message,
    });
  }
});

router.put('/:id', async (request, response) => {
  const { id } = request.params;

  if (!isValidExpenseId(id)) {
    return response.status(400).json({
      message: 'Invalid expense ID.',
    });
  }

  try {
    const updatedExpense = await Expense.findByIdAndUpdate(id, request.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedExpense) {
      return response.status(404).json({
        message: 'Expense not found.',
      });
    }

    response.json(updatedExpense);
  } catch (error) {
    response.status(400).json({
      message: 'Failed to update expense.',
      error: error.message,
    });
  }
});

router.delete('/:id', async (request, response) => {
  const { id } = request.params;

  if (!isValidExpenseId(id)) {
    return response.status(400).json({
      message: 'Invalid expense ID.',
    });
  }

  try {
    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return response.status(404).json({
        message: 'Expense not found.',
      });
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
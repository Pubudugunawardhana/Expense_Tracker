const express = require('express');
const Budget = require('../models/Budget');

const router = express.Router();

// GET current budget
router.get('/', async (_request, response) => {
  try {
    let budget = await Budget.findOne();

    // If no budget exists, create a default one
    if (!budget) {
      budget = await Budget.create({
        monthlyBudget: 0,
        categoryBudgets: {},
      });
    }

    response.json({
      monthlyBudget: budget.monthlyBudget,
      categoryBudgets: Object.fromEntries(budget.categoryBudgets),
    });
  } catch (error) {
    response.status(500).json({
      message: 'Failed to fetch budget.',
      error: error.message,
    });
  }
});

// POST/UPDATE budget
router.post('/', async (request, response) => {
  try {
    const { monthlyBudget, categoryBudgets } = request.body;

    let budget = await Budget.findOne();

    if (!budget) {
      budget = await Budget.create({
        monthlyBudget: monthlyBudget || 0,
        categoryBudgets: categoryBudgets || {},
      });
    } else {
      if (monthlyBudget !== undefined) {
        budget.monthlyBudget = monthlyBudget;
      }
      if (categoryBudgets) {
        budget.categoryBudgets = new Map(Object.entries(categoryBudgets));
      }
      await budget.save();
    }

    response.json({
      monthlyBudget: budget.monthlyBudget,
      categoryBudgets: Object.fromEntries(budget.categoryBudgets),
    });
  } catch (error) {
    response.status(400).json({
      message: 'Failed to update budget.',
      error: error.message,
    });
  }
});

module.exports = router;

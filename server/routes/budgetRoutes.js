const express = require('express');
const Budget = require('../models/Budget');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// All budget routes require authentication
router.use(protect);

// GET /api/budget — get logged-in user's budget
router.get('/', async (request, response) => {
  try {
    let budget = await Budget.findOne({ userId: request.userId });

    // Create a default budget for this user if none exists
    if (!budget) {
      budget = await Budget.create({
        userId: request.userId,
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

// POST /api/budget — save/update logged-in user's budget
router.post('/', async (request, response) => {
  try {
    const { monthlyBudget, categoryBudgets } = request.body;

    let budget = await Budget.findOne({ userId: request.userId });

    if (!budget) {
      budget = await Budget.create({
        userId: request.userId,
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

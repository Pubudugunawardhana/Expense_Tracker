import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AddExpensePage from './pages/AddExpensePage';
import BudgetsPage from './pages/BudgetsPage';
import FeedbackPage from './pages/FeedbackPage';
import HomePage from './pages/HomePage';
import SummaryPage from './pages/SummaryPage';
import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  updateExpense,
} from './api/expenses';
import EXPENSE_CATEGORIES, { DEFAULT_CATEGORY } from './data/expenseCategories';
import {
  createCategoryBudgetSummary,
  normalizeBudgetValue,
  normalizeCategoryBudgets,
} from './utils/categoryBudgets';
import { normalizeExpenseDate } from './utils/expenseAnalytics';
import './App.css';

const THEME_STORAGE_KEY = 'expense-tracker-theme';
const BUDGET_STORAGE_KEY = 'expense-tracker-budget';
const CATEGORY_BUDGETS_STORAGE_KEY = 'expense-tracker-category-budgets';

const normalizeExpense = (expense) => {
  const numericAmount = Number(expense.amount);

  return {
    id: expense.id || expense._id,
    title: expense.title,
    amount: Number.isFinite(numericAmount) ? numericAmount : 0,
    category: expense.category || DEFAULT_CATEGORY,
    date: normalizeExpenseDate(expense.date),
  };
};

const getInitialBudget = () => {
  try {
    const savedBudget = localStorage.getItem(BUDGET_STORAGE_KEY);
    const parsedBudget = Number(savedBudget);

    return Number.isFinite(parsedBudget) && parsedBudget >= 0 ? parsedBudget : 0;
  } catch (error) {
    console.error('Failed to load budget from localStorage.', error);
    return 0;
  }
};

const getInitialCategoryBudgets = () => {
  try {
    const savedCategoryBudgets = localStorage.getItem(CATEGORY_BUDGETS_STORAGE_KEY);

    if (!savedCategoryBudgets) {
      return {};
    }

    return normalizeCategoryBudgets(
      JSON.parse(savedCategoryBudgets),
      EXPENSE_CATEGORIES
    );
  } catch (error) {
    console.error('Failed to load category budgets from localStorage.', error);
    return {};
  }
};

function App() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [expenseError, setExpenseError] = useState('');
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [budget, setBudget] = useState(getInitialBudget);
  const [categoryBudgets, setCategoryBudgets] = useState(getInitialCategoryBudgets);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'dark'
        ? 'dark'
        : 'light';
    } catch (error) {
      console.error('Failed to load theme preference from localStorage.', error);
      return 'light';
    }
  });

  useEffect(() => {
    const loadExpenses = async () => {
      setIsLoadingExpenses(true);
      setExpenseError('');

      try {
        const apiExpenses = await fetchExpenses();
        setExpenses(Array.isArray(apiExpenses) ? apiExpenses.map(normalizeExpense) : []);
      } catch (error) {
        console.error('Failed to fetch expenses from the API.', error);
        setExpenseError(error.message || 'Failed to fetch expenses.');
      } finally {
        setIsLoadingExpenses(false);
      }
    };

    loadExpenses();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(BUDGET_STORAGE_KEY, budget.toString());
    } catch (error) {
      console.error('Failed to save budget to localStorage.', error);
    }
  }, [budget]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CATEGORY_BUDGETS_STORAGE_KEY,
        JSON.stringify(categoryBudgets)
      );
    } catch (error) {
      console.error('Failed to save category budgets to localStorage.', error);
    }
  }, [categoryBudgets]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Failed to save theme preference to localStorage.', error);
    }
  }, [theme]);

  const handleSaveExpense = async (expenseToSave) => {
    const normalizedExpense = normalizeExpense(expenseToSave);
    const expensePayload = {
      title: normalizedExpense.title,
      amount: normalizedExpense.amount,
      category: normalizedExpense.category,
      date: normalizedExpense.date,
    };

    setIsSavingExpense(true);
    setExpenseError('');

    try {
      const savedExpense = editingExpense
        ? await updateExpense(normalizedExpense.id, expensePayload)
        : await createExpense(expensePayload);
      const nextExpense = normalizeExpense(savedExpense);

      setExpenses((currentExpenses) => {
        const existingExpense = currentExpenses.some(
          (expense) => expense.id === nextExpense.id
        );

        if (existingExpense) {
          return currentExpenses.map((expense) =>
            expense.id === nextExpense.id ? nextExpense : expense
          );
        }

        return [nextExpense, ...currentExpenses];
      });

      setEditingExpense(null);
      navigate('/');
    } catch (error) {
      console.error('Failed to save expense through the API.', error);
      setExpenseError(error.message || 'Failed to save expense.');
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    setDeletingExpenseId(expenseId);
    setExpenseError('');

    try {
      await deleteExpense(expenseId);

      setExpenses((currentExpenses) =>
        currentExpenses.filter((expense) => expense.id !== expenseId)
      );

      setEditingExpense((currentExpense) =>
        currentExpense && currentExpense.id === expenseId ? null : currentExpense
      );
    } catch (error) {
      console.error('Failed to delete expense through the API.', error);
      setExpenseError(error.message || 'Failed to delete expense.');
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const handleEditExpense = (expenseId) => {
    const selectedExpense = expenses.find((expense) => expense.id === expenseId);

    if (!selectedExpense) {
      return;
    }

    setEditingExpense(selectedExpense);
    navigate('/add');
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    navigate('/');
  };

  const handleResetEditing = () => {
    setEditingExpense(null);
  };

  const handleToggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === 'light' ? 'dark' : 'light'
    );
  };

  const handleBudgetChange = (nextBudget) => {
    setBudget(Number.isFinite(nextBudget) && nextBudget >= 0 ? nextBudget : 0);
  };

  const handleCategoryBudgetChange = (category, nextBudget) => {
    setCategoryBudgets((currentBudgets) => ({
      ...currentBudgets,
      [category]: normalizeBudgetValue(nextBudget),
    }));
  };

  const totalExpenseAmount = expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );
  const totalsByCategory = expenses.reduce((totals, expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    return totals;
  }, {});
  const categorySummary = Object.entries(totalsByCategory).sort(
    (firstCategory, secondCategory) => secondCategory[1] - firstCategory[1]
  );
  const categoryBudgetSummary = createCategoryBudgetSummary({
    categories: EXPENSE_CATEGORIES,
    categoryBudgets,
    spendingByCategory: totalsByCategory,
  });

  return (
    <main className={`app-shell theme-${theme}`}>
      <section className="expense-card">
        <div className="app-header">
          <div className="app-header-top">
            <div>
              <p className="eyebrow">Personal Finance</p>
              <h1>Expense Tracker</h1>
            </div>

            <button
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-pressed={theme === 'dark'}
              className="theme-toggle"
              type="button"
              onClick={handleToggleTheme}
            >
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>

          <p className="app-description">
            Track daily spending, manage budget targets, compare trends over time,
            review category budgets, and share quick feedback in one place.
          </p>
        </div>

        <Navbar onNavigate={handleResetEditing} />

        <div className="page-content">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  budget={budget}
                  deletingExpenseId={deletingExpenseId}
                  editingExpenseId={editingExpense?.id ?? null}
                  expenseError={expenseError}
                  expenses={expenses}
                  isLoadingExpenses={isLoadingExpenses}
                  onBudgetChange={handleBudgetChange}
                  onDeleteExpense={handleDeleteExpense}
                  onEditExpense={handleEditExpense}
                  totalExpenseAmount={totalExpenseAmount}
                />
              }
            />
            <Route
              path="/add"
              element={
                <AddExpensePage
                  editingExpense={editingExpense}
                  expenseError={expenseError}
                  isSavingExpense={isSavingExpense}
                  onCancelEdit={handleCancelEdit}
                  onSaveExpense={handleSaveExpense}
                />
              }
            />
            <Route
              path="/budgets"
              element={
                <BudgetsPage
                  categoryBudgetSummary={categoryBudgetSummary}
                  onCategoryBudgetChange={handleCategoryBudgetChange}
                />
              }
            />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route
              path="/summary"
              element={
                <SummaryPage
                  categorySummary={categorySummary}
                  expenses={expenses}
                  totalExpenseAmount={totalExpenseAmount}
                />
              }
            />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </div>
      </section>
    </main>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AddExpensePage from './pages/AddExpensePage';
import HomePage from './pages/HomePage';
import SummaryPage from './pages/SummaryPage';
import { DEFAULT_CATEGORY } from './data/expenseCategories';
import { normalizeExpenseDate } from './utils/expenseAnalytics';
import './App.css';

const STORAGE_KEY = 'expense-tracker-expenses';
const THEME_STORAGE_KEY = 'expense-tracker-theme';

const normalizeExpense = (expense) => {
  const numericAmount = Number(expense.amount);

  return {
    id: expense.id,
    title: expense.title,
    amount: Number.isFinite(numericAmount) ? numericAmount : 0,
    category: expense.category || DEFAULT_CATEGORY,
    date: normalizeExpenseDate(expense.date),
  };
};

function App() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
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
    try {
      const savedExpenses = localStorage.getItem(STORAGE_KEY);

      if (savedExpenses) {
        const parsedExpenses = JSON.parse(savedExpenses);

        if (Array.isArray(parsedExpenses)) {
          setExpenses(parsedExpenses.map(normalizeExpense));
        }
      }
    } catch (error) {
      console.error('Failed to load expenses from localStorage.', error);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses, hasLoaded]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Failed to save theme preference to localStorage.', error);
    }
  }, [theme]);

  const handleSaveExpense = (expenseToSave) => {
    const normalizedExpense = normalizeExpense(expenseToSave);

    setExpenses((currentExpenses) => {
      const existingExpense = currentExpenses.some(
        (expense) => expense.id === normalizedExpense.id
      );

      if (existingExpense) {
        return currentExpenses.map((expense) =>
          expense.id === normalizedExpense.id ? normalizedExpense : expense
        );
      }

      return [normalizedExpense, ...currentExpenses];
    });

    setEditingExpense(null);
    navigate('/');
  };

  const handleDeleteExpense = (expenseId) => {
    setExpenses((currentExpenses) =>
      currentExpenses.filter((expense) => expense.id !== expenseId)
    );

    setEditingExpense((currentExpense) =>
      currentExpense && currentExpense.id === expenseId ? null : currentExpense
    );
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
            Track daily spending, compare trends over time, and keep your totals in view.
          </p>
        </div>

        <Navbar onNavigate={handleResetEditing} />

        <div className="page-content">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  editingExpenseId={editingExpense?.id ?? null}
                  expenses={expenses}
                  onDeleteExpense={handleDeleteExpense}
                  onEditExpense={handleEditExpense}
                />
              }
            />
            <Route
              path="/add"
              element={
                <AddExpensePage
                  editingExpense={editingExpense}
                  onCancelEdit={handleCancelEdit}
                  onSaveExpense={handleSaveExpense}
                />
              }
            />
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

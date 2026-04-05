import { useEffect, useState } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import { DEFAULT_CATEGORY } from './data/expenseCategories';
import './App.css';

const STORAGE_KEY = 'expense-tracker-expenses';

const normalizeExpense = (expense) => {
  const numericAmount = Number(expense.amount);

  return {
    id: expense.id,
    title: expense.title,
    amount: Number.isFinite(numericAmount) ? numericAmount : 0,
    category: expense.category || DEFAULT_CATEGORY,
  };
};

function App() {
  const [expenses, setExpenses] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

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

  const handleSaveExpense = (expenseToSave) => {
    setExpenses((currentExpenses) => {
      const existingExpense = currentExpenses.some(
        (expense) => expense.id === expenseToSave.id
      );

      if (existingExpense) {
        return currentExpenses.map((expense) =>
          expense.id === expenseToSave.id ? expenseToSave : expense
        );
      }

      return [expenseToSave, ...currentExpenses];
    });

    setEditingExpense(null);
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
    setEditingExpense(selectedExpense ?? null);
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
    <main className="app-shell">
      <section className="expense-card">
        <div className="app-header">
          <p className="eyebrow">Personal Finance</p>
          <h1>Expense Tracker</h1>
          <p className="app-description">
            Track daily spending, keep your list organized, and see your total
            at a glance.
          </p>
        </div>

        <div className="summary-panel">
          <span>Total Expenses</span>
          <strong>${totalExpenseAmount.toFixed(2)}</strong>
        </div>

        {categorySummary.length > 0 ? (
          <section className="category-summary">
            <div className="list-header">
              <h2>Totals by Category</h2>
              <span>{categorySummary.length} categories</span>
            </div>

            <div className="category-total-grid">
              {categorySummary.map(([category, total]) => (
                <article className="category-total-card" key={category}>
                  <p>{category}</p>
                  <strong>${total.toFixed(2)}</strong>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <ExpenseForm
          editingExpense={editingExpense}
          onCancelEdit={() => setEditingExpense(null)}
          onSaveExpense={handleSaveExpense}
        />
        <ExpenseList
          editingExpenseId={editingExpense?.id ?? null}
          expenses={expenses}
          onDeleteExpense={handleDeleteExpense}
          onEditExpense={handleEditExpense}
        />
      </section>
    </main>
  );
}

export default App;

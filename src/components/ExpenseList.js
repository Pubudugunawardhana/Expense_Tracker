import ExpenseItem from './ExpenseItem';

function ExpenseList({
  deletingExpenseId,
  editingExpenseId,
  error,
  expenses,
  isLoading,
  onDeleteExpense,
  onEditExpense,
}) {
  if (isLoading) {
    return (
      <div className="empty-state">
        <h2>Loading expenses</h2>
        <p>Fetching your latest spending from the backend.</p>
      </div>
    );
  }

  if (error && expenses.length === 0) {
    return (
      <div className="empty-state">
        <h2>Unable to load expenses</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="empty-state">
        <h2>No expenses yet</h2>
        <p>Add your first expense to start tracking your spending.</p>
      </div>
    );
  }

  return (
    <section className="expense-list-section">
      <div className="list-header">
        <h2>All Expenses</h2>
        <span>{expenses.length} items</span>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <ul className="expense-list">
        {expenses.map((expense) => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            isDeleting={expense.id === deletingExpenseId}
            isEditing={expense.id === editingExpenseId}
            onDeleteExpense={onDeleteExpense}
            onEditExpense={onEditExpense}
          />
        ))}
      </ul>
    </section>
  );
}

export default ExpenseList;

import ExpenseItem from './ExpenseItem';

function ExpenseList({
  editingExpenseId,
  expenses,
  onDeleteExpense,
  onEditExpense,
}) {
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

      <ul className="expense-list">
        {expenses.map((expense) => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
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

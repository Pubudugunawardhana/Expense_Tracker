import BudgetPanel from '../components/BudgetPanel';
import ExpenseList from '../components/ExpenseList';

function HomePage({
  budget,
  editingExpenseId,
  expenses,
  onBudgetChange,
  onDeleteExpense,
  onEditExpense,
  totalExpenseAmount,
}) {
  return (
    <section className="page-panel">
      <div className="page-intro">
        <h2>Home</h2>
        <p>
          Review your latest spending, see your total at a glance, adjust your
          budget target, and edit any expense when plans change.
        </p>
      </div>

      <div className="summary-panel">
        <div className="summary-panel-copy">
          <span>Total Spending</span>
          <strong>${totalExpenseAmount.toFixed(2)}</strong>
        </div>
        <span>{expenses.length} expenses tracked</span>
      </div>

      <BudgetPanel
        budget={budget}
        onBudgetChange={onBudgetChange}
        totalExpenseAmount={totalExpenseAmount}
      />

      <ExpenseList
        editingExpenseId={editingExpenseId}
        expenses={expenses}
        onDeleteExpense={onDeleteExpense}
        onEditExpense={onEditExpense}
      />
    </section>
  );
}

export default HomePage;

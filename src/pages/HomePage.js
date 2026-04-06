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
          Review your latest spending, adjust your budget target, and edit any
          expense when plans change.
        </p>
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

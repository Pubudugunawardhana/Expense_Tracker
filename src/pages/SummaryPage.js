import CategoryBudgetSection from '../components/CategoryBudgetSection';
import ExpenseCharts from '../components/ExpenseCharts';

function SummaryPage({
  categoryBudgetSummary,
  categorySummary,
  expenses,
  onCategoryBudgetChange,
  totalExpenseAmount,
}) {
  return (
    <section className="page-panel">
      <div className="page-intro">
        <h2>Summary</h2>
        <p>
          See your total spending, category breakdown, chart trends, and how
          each category is tracking against its own budget.
        </p>
      </div>

      <div className="summary-panel">
        <span>Total Expenses</span>
        <strong>${totalExpenseAmount.toFixed(2)}</strong>
      </div>

      <CategoryBudgetSection
        categoryBudgetSummary={categoryBudgetSummary}
        onCategoryBudgetChange={onCategoryBudgetChange}
      />

      {categorySummary.length > 0 ? (
        <>
          <section className="category-summary">
            <div className="list-header">
              <h2>Category Breakdown</h2>
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

          <ExpenseCharts expenses={expenses} />
        </>
      ) : (
        <div className="empty-state">
          <h2>No expense summary yet</h2>
          <p>
            Add some expenses to unlock category breakdowns and analytics charts.
          </p>
        </div>
      )}
    </section>
  );
}

export default SummaryPage;

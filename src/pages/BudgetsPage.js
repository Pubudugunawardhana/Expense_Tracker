import CategoryBudgetSection from '../components/CategoryBudgetSection';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);

function BudgetsPage({ categoryBudgetSummary, onCategoryBudgetChange }) {
  const configuredBudgets = categoryBudgetSummary.filter(
    (item) => item.budget > 0
  ).length;
  const overBudgetCategories = categoryBudgetSummary.filter(
    (item) => item.remaining < 0
  ).length;
  const totalCategoryBudget = categoryBudgetSummary.reduce(
    (total, item) => total + item.budget,
    0
  );
  const totalCategorySpending = categoryBudgetSummary.reduce(
    (total, item) => total + item.spending,
    0
  );

  return (
    <section className="page-panel">
      <div className="page-intro">
        <h2>Budgets</h2>
        <p>
          Set a budget for each category, compare it with live spending, and use
          the chart below to spot categories that need attention.
        </p>
      </div>

      <div className="category-total-grid">
        <article className="category-total-card">
          <p>Configured Budgets</p>
          <strong>{configuredBudgets}</strong>
        </article>
        <article className="category-total-card">
          <p>Over Budget Categories</p>
          <strong>{overBudgetCategories}</strong>
        </article>
        <article className="category-total-card">
          <p>Total Category Budget</p>
          <strong>{formatCurrency(totalCategoryBudget)}</strong>
        </article>
        <article className="category-total-card">
          <p>Total Category Spending</p>
          <strong>{formatCurrency(totalCategorySpending)}</strong>
        </article>
      </div>

      <CategoryBudgetSection
        categoryBudgetSummary={categoryBudgetSummary}
        onCategoryBudgetChange={onCategoryBudgetChange}
      />
    </section>
  );
}

export default BudgetsPage;

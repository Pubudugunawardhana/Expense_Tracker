import CategoryBudgetChart from './CategoryBudgetChart';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);

function CategoryBudgetSection({ categoryBudgetSummary, onCategoryBudgetChange }) {
  const hasChartData = categoryBudgetSummary.some(
    (item) => item.budget > 0 || item.spending > 0
  );

  const handleInputChange = (category, nextValue) => {
    if (nextValue === '') {
      onCategoryBudgetChange(category, 0);
      return;
    }

    const numericValue = Number(nextValue);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return;
    }

    onCategoryBudgetChange(category, numericValue);
  };

  return (
    <section className="category-budget-section">
      <div className="list-header">
        <h2>Category Budgets</h2>
        <span>{categoryBudgetSummary.length} categories</span>
      </div>

      <div className="category-budget-grid">
        {categoryBudgetSummary.map((item) => {
          const inputId = `category-budget-${item.category.toLowerCase()}`;

          return (
            <article className="category-budget-card" key={item.category}>
              <div className="category-budget-card-header">
                <h3>{item.category}</h3>
                <span
                  className={`category-budget-status-chip category-budget-status-chip-${item.status.modifier}`}
                >
                  {item.status.label}
                </span>
              </div>

              <label className="category-budget-input" htmlFor={inputId}>
                <span>{item.category} budget</span>
                <input
                  id={inputId}
                  min="0"
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={item.budget === 0 ? '' : item.budget}
                  onChange={(event) =>
                    handleInputChange(item.category, event.target.value)
                  }
                />
              </label>

              <div className="category-budget-metrics">
                <div className="category-budget-metric">
                  <span>Spent</span>
                  <strong>{formatCurrency(item.spending)}</strong>
                </div>
                <div className="category-budget-metric">
                  <span>Budget</span>
                  <strong>{formatCurrency(item.budget)}</strong>
                </div>
                <div className="category-budget-metric">
                  <span>Remaining</span>
                  <strong
                    className={
                      item.remaining < 0 ? 'budget-negative' : 'budget-positive'
                    }
                  >
                    {formatCurrency(item.remaining)}
                  </strong>
                </div>
                <div className="category-budget-metric">
                  <span>Used</span>
                  <strong>
                    {item.budget > 0 ? `${item.percentageUsed.toFixed(0)}%` : '0%'}
                  </strong>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {hasChartData ? (
        <CategoryBudgetChart categoryBudgetSummary={categoryBudgetSummary} />
      ) : null}
    </section>
  );
}

export default CategoryBudgetSection;

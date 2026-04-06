import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getExpenseAnalytics } from '../utils/expenseAnalytics';

const TIMEFRAME_OPTIONS = [
  {
    id: 'daily',
    label: 'Daily',
    description: 'Line chart showing how spending changes day by day.',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    description: 'Bar chart highlighting your spend across each month.',
  },
  {
    id: 'yearly',
    label: 'Yearly',
    description: 'Area chart showing the long-term trend by year.',
  },
];

const PIE_COLORS = [
  'var(--chart-pie-1)',
  'var(--chart-pie-2)',
  'var(--chart-pie-3)',
  'var(--chart-pie-4)',
  'var(--chart-pie-5)',
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);

function ExpenseCharts({ expenses }) {
  const [activeView, setActiveView] = useState('daily');
  const analytics = getExpenseAnalytics(expenses);
  const activeOption =
    TIMEFRAME_OPTIONS.find((option) => option.id === activeView) ??
    TIMEFRAME_OPTIONS[0];

  const renderTrendChart = () => {
    if (activeView === 'monthly') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.monthly}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="label" minTickGap={24} stroke="var(--chart-text)" />
            <YAxis
              stroke="var(--chart-text)"
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--chart-tooltip-bg)',
                border: '1px solid var(--surface-border)',
                borderRadius: '16px',
                color: 'var(--text-primary)',
              }}
              formatter={(value) => formatCurrency(value)}
            />
            <Legend />
            <Bar
              dataKey="total"
              fill="var(--chart-bar)"
              name="Monthly expenses"
              radius={[10, 10, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (activeView === 'yearly') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={analytics.yearly}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="label" minTickGap={24} stroke="var(--chart-text)" />
            <YAxis
              stroke="var(--chart-text)"
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--chart-tooltip-bg)',
                border: '1px solid var(--surface-border)',
                borderRadius: '16px',
                color: 'var(--text-primary)',
              }}
              formatter={(value) => formatCurrency(value)}
            />
            <Legend />
            <Area
              dataKey="total"
              fill="var(--chart-area-fill)"
              name="Yearly expenses"
              stroke="var(--chart-area)"
              strokeWidth={3}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={analytics.daily}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="label" minTickGap={24} stroke="var(--chart-text)" />
          <YAxis
            stroke="var(--chart-text)"
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--chart-tooltip-bg)',
              border: '1px solid var(--surface-border)',
              borderRadius: '16px',
              color: 'var(--text-primary)',
            }}
            formatter={(value) => formatCurrency(value)}
          />
          <Legend />
          <Line
            dataKey="total"
            dot={{ fill: 'var(--chart-line)', r: 4 }}
            name="Daily expenses"
            stroke="var(--chart-line)"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <section className="chart-dashboard">
      <div className="list-header">
        <h2>Expense Analytics</h2>
        <span>{expenses.length} tracked entries</span>
      </div>

      <div className="chart-dashboard-grid">
        <article className="chart-card chart-card-wide">
          <div className="chart-card-header">
            <div>
              <h3>{activeOption.label} trend</h3>
              <p>{activeOption.description}</p>
            </div>

            <div className="chart-toggle-group" aria-label="Expense chart views">
              {TIMEFRAME_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  aria-pressed={activeView === option.id}
                  className={`chart-toggle${
                    activeView === option.id ? ' chart-toggle-active' : ''
                  }`}
                  type="button"
                  onClick={() => setActiveView(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-frame">{renderTrendChart()}</div>
        </article>

        <article className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Category split</h3>
              <p>Pie chart showing where most of your spending is going.</p>
            </div>
          </div>

          <div className="chart-frame">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={analytics.categories}
                  dataKey="total"
                  innerRadius={55}
                  nameKey="category"
                  outerRadius={96}
                  paddingAngle={3}
                >
                  {analytics.categories.map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: '16px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  );
}

export default ExpenseCharts;

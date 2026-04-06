import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
}

const renderApp = (initialEntries = ['/']) =>
  render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
      initialEntries={initialEntries}
    >
      <App />
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
});

test('renders navbar links, total spending, and budget panel on the home page', () => {
  renderApp();

  expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /add expense/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^budgets$/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^summary$/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^feedback$/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /^home$/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /^budget$/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /budget vs actual/i })).toBeInTheDocument();
  expect(
    screen.getByText('Total Spending', { selector: '.summary-panel span' })
  ).toBeInTheDocument();
});

test('updates the budget and saves it to localStorage', () => {
  renderApp();

  fireEvent.change(screen.getByLabelText(/budget amount/i), {
    target: { value: '1500' },
  });

  expect(screen.getByDisplayValue(1500)).toBeInTheDocument();
  expect(screen.getByText('Current Budget')).toBeInTheDocument();
  expect(screen.getByText('Remaining Budget')).toBeInTheDocument();
  expect(screen.getByText('Percentage Used')).toBeInTheDocument();
  expect(localStorage.getItem('expense-tracker-budget')).toBe('1500');
});

test('changes the progress bar color as budget usage changes', async () => {
  localStorage.setItem(
    'expense-tracker-expenses',
    JSON.stringify([
      {
        id: 'expense-1',
        title: 'Groceries',
        amount: 90,
        category: 'Food',
        date: '2026-04-04',
      },
    ])
  );

  renderApp();

  fireEvent.change(screen.getByLabelText(/budget amount/i), {
    target: { value: '150' },
  });

  expect(await screen.findByText('60%')).toBeInTheDocument();
  expect(screen.getByTestId('budget-progress-fill')).toHaveClass(
    'budget-progress-fill-safe'
  );

  fireEvent.change(screen.getByLabelText(/budget amount/i), {
    target: { value: '100' },
  });

  expect(await screen.findByText('90%')).toBeInTheDocument();
  expect(screen.getByTestId('budget-progress-fill')).toHaveClass(
    'budget-progress-fill-warning'
  );

  fireEvent.change(screen.getByLabelText(/budget amount/i), {
    target: { value: '80' },
  });

  expect(await screen.findByText('113%')).toBeInTheDocument();
  expect(screen.getByTestId('budget-progress-fill')).toHaveClass(
    'budget-progress-fill-over'
  );
});

test('shows within budget, near limit, and over budget statuses', async () => {
  localStorage.setItem(
    'expense-tracker-expenses',
    JSON.stringify([
      {
        id: 'expense-1',
        title: 'Groceries',
        amount: 90,
        category: 'Food',
        date: '2026-04-04',
      },
    ])
  );

  renderApp();

  fireEvent.change(screen.getByLabelText(/budget amount/i), {
    target: { value: '200' },
  });

  expect(await screen.findByText('Within budget')).toBeInTheDocument();
  expect(screen.getByText('45%')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/budget amount/i), {
    target: { value: '100' },
  });

  expect(await screen.findByText('Near limit')).toBeInTheDocument();
  expect(screen.getByText('90%')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/budget amount/i), {
    target: { value: '80' },
  });

  expect(await screen.findByText('Over budget')).toBeInTheDocument();
  expect(screen.getByText('113%')).toBeInTheDocument();
});

test('updates category budgets on the budgets page and shows the category comparison chart', async () => {
  localStorage.setItem(
    'expense-tracker-expenses',
    JSON.stringify([
      {
        id: 'expense-1',
        title: 'Dinner',
        amount: 90,
        category: 'Food',
        date: '2026-04-02',
      },
      {
        id: 'expense-2',
        title: 'Train',
        amount: 35,
        category: 'Travel',
        date: '2026-04-03',
      },
    ])
  );

  renderApp(['/budgets']);

  expect(screen.getByRole('heading', { name: /^budgets$/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /category budgets/i })).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: /budget vs spending by category/i })
  ).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/food budget/i), {
    target: { value: '100' },
  });

  expect(await screen.findByText('Near limit')).toBeInTheDocument();
  expect(localStorage.getItem('expense-tracker-category-budgets')).toContain(
    '"Food":100'
  );
});

test('supports previewing and selecting a feedback star rating', async () => {
  renderApp(['/feedback']);

  const oneStarButton = screen.getByRole('button', { name: /^1 star$/i });
  const fourStarButton = screen.getByRole('button', { name: /^4 stars$/i });
  const fiveStarButton = screen.getByRole('button', { name: /^5 stars$/i });

  fireEvent.mouseEnter(fourStarButton);

  expect(await screen.findByText('Previewing 4 out of 5 stars')).toBeInTheDocument();
  expect(fourStarButton).toHaveClass('feedback-star-button-preview');

  fireEvent.click(fourStarButton);

  expect(await screen.findByText('4 out of 5 stars selected')).toBeInTheDocument();
  expect(oneStarButton).toHaveClass('feedback-star-button-selected');
  expect(fourStarButton).toHaveClass('feedback-star-button-selected');
  expect(fiveStarButton).not.toHaveClass('feedback-star-button-selected');
});

test('submits feedback on the feedback page, saves it, and clears the form', async () => {
  renderApp(['/feedback']);

  expect(screen.getByRole('heading', { name: /^feedback$/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^4 stars$/i }));
  fireEvent.change(screen.getByLabelText(/your feedback/i), {
    target: { value: 'The budget and chart pages are especially helpful.' },
  });
  fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

  expect(await screen.findByText(/thanks for the feedback/i)).toBeInTheDocument();
  expect(screen.getByText(/4-star response was received successfully/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/your feedback/i)).toHaveValue('');
  expect(screen.getByText(/choose a rating from 1 to 5 stars/i)).toBeInTheDocument();

  const storedFeedback = JSON.parse(
    localStorage.getItem('expense-tracker-feedback') || '[]'
  );

  expect(storedFeedback).toHaveLength(1);
  expect(storedFeedback[0]).toMatchObject({
    rating: 4,
    feedback: 'The budget and chart pages are especially helpful.',
  });
});

test('recalculates total spending when expenses change', async () => {
  localStorage.setItem(
    'expense-tracker-expenses',
    JSON.stringify([
      {
        id: 'expense-1',
        title: 'Lunch',
        amount: 50,
        category: 'Food',
        date: '2026-04-04',
      },
      {
        id: 'expense-2',
        title: 'Taxi',
        amount: 30,
        category: 'Travel',
        date: '2026-04-05',
      },
    ])
  );

  renderApp();

  expect(
    await screen.findByText('$80.00', { selector: '.summary-panel strong' })
  ).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

  expect(
    await screen.findByText('$30.00', { selector: '.summary-panel strong' })
  ).toBeInTheDocument();
});

test('edits an existing expense from home and returns to the list', async () => {
  localStorage.setItem(
    'expense-tracker-expenses',
    JSON.stringify([
      {
        id: 'expense-1',
        title: 'Groceries',
        amount: 45,
        category: 'Food',
        date: '2026-04-04',
      },
    ])
  );

  renderApp();

  expect(await screen.findByText('Groceries')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /edit/i }));

  expect(screen.getByRole('heading', { name: /edit expense/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/title/i)).toHaveValue('Groceries');
  expect(screen.getByLabelText(/amount/i)).toHaveValue(45);
  expect(screen.getByLabelText(/category/i)).toHaveValue('Food');
  expect(screen.getByLabelText(/date/i)).toHaveValue('2026-04-04');

  fireEvent.change(screen.getByLabelText(/title/i), {
    target: { value: 'Rent' },
  });
  fireEvent.change(screen.getByLabelText(/amount/i), {
    target: { value: '1200' },
  });
  fireEvent.change(screen.getByLabelText(/category/i), {
    target: { value: 'Bills' },
  });
  fireEvent.change(screen.getByLabelText(/date/i), {
    target: { value: '2026-04-05' },
  });
  fireEvent.click(screen.getByRole('button', { name: /update expense/i }));

  expect(await screen.findByText('Rent')).toBeInTheDocument();
  expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /^home$/i })).toBeInTheDocument();
});

test('shows the summary page with totals and chart controls', async () => {
  localStorage.setItem(
    'expense-tracker-expenses',
    JSON.stringify([
      {
        id: 'expense-1',
        title: 'Flight',
        amount: 500,
        category: 'Travel',
        date: '2026-04-01',
      },
      {
        id: 'expense-2',
        title: 'Dinner',
        amount: 80,
        category: 'Food',
        date: '2026-04-02',
      },
      {
        id: 'expense-3',
        title: 'Power',
        amount: 120,
        category: 'Bills',
        date: '2026-03-28',
      },
    ])
  );

  renderApp(['/summary']);

  expect(screen.getByRole('heading', { name: /^summary$/i })).toBeInTheDocument();
  expect(
    await screen.findByText('$700.00', { selector: '.summary-panel strong' })
  ).toBeInTheDocument();
  expect(
    screen.getByText('Travel', { selector: '.category-total-card p' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: /expense analytics/i })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^daily$/i })).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  fireEvent.click(screen.getByRole('button', { name: /^monthly$/i }));

  expect(screen.getByRole('button', { name: /^monthly$/i })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('toggles dark mode and saves the preference', () => {
  renderApp();

  const themeToggle = screen.getByRole('button', { name: /dark mode/i });

  fireEvent.click(themeToggle);

  expect(screen.getByRole('main')).toHaveClass('theme-dark');
  expect(screen.getByRole('button', { name: /light mode/i })).toBeInTheDocument();
  expect(localStorage.getItem('expense-tracker-theme')).toBe('dark');
});
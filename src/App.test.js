import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

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

test('renders navbar links on the home page', () => {
  renderApp();

  expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /add expense/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^summary$/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /^home$/i })).toBeInTheDocument();
});

test('edits an existing expense from home and returns to the list', async () => {
  localStorage.setItem(
    'expense-tracker-expenses',
    JSON.stringify([
      { id: 'expense-1', title: 'Groceries', amount: 45, category: 'Food' },
    ])
  );

  renderApp();

  expect(await screen.findByText('Groceries')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /edit/i }));

  expect(screen.getByRole('heading', { name: /edit expense/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/title/i)).toHaveValue('Groceries');
  expect(screen.getByLabelText(/amount/i)).toHaveValue(45);
  expect(screen.getByLabelText(/category/i)).toHaveValue('Food');

  fireEvent.change(screen.getByLabelText(/title/i), {
    target: { value: 'Rent' },
  });
  fireEvent.change(screen.getByLabelText(/amount/i), {
    target: { value: '1200' },
  });
  fireEvent.change(screen.getByLabelText(/category/i), {
    target: { value: 'Bills' },
  });
  fireEvent.click(screen.getByRole('button', { name: /update expense/i }));

  expect(await screen.findByText('Rent')).toBeInTheDocument();
  expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /^home$/i })).toBeInTheDocument();
});

test('shows the summary page with total and category breakdown', async () => {
  localStorage.setItem(
    'expense-tracker-expenses',
    JSON.stringify([
      { id: 'expense-1', title: 'Flight', amount: 500, category: 'Travel' },
      { id: 'expense-2', title: 'Dinner', amount: 80, category: 'Food' },
    ])
  );

  renderApp(['/summary']);

  expect(screen.getByRole('heading', { name: /^summary$/i })).toBeInTheDocument();
  expect(await screen.findByText('$580.00', { selector: '.summary-panel strong' })).toBeInTheDocument();
  expect(screen.getByText('Travel', { selector: '.category-total-card p' })).toBeInTheDocument();
  expect(screen.getByText('Food', { selector: '.category-total-card p' })).toBeInTheDocument();
});

test('toggles dark mode and saves the preference', () => {
  renderApp();

  const themeToggle = screen.getByRole('button', { name: /dark mode/i });

  fireEvent.click(themeToggle);

  expect(screen.getByRole('main')).toHaveClass('theme-dark');
  expect(screen.getByRole('button', { name: /light mode/i })).toBeInTheDocument();
  expect(localStorage.getItem('expense-tracker-theme')).toBe('dark');
});

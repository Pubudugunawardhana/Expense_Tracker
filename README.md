# Expense Tracker

A React expense tracker built with functional components, hooks, and React Router. The app lets users browse their expense list on a home page, add or edit expenses on a dedicated form page, review totals on a summary page, and persist both data and theme preference with `localStorage`.

## Features

- Multi-page navigation with React Router
- Home page for viewing and editing expenses
- Add Expense page for creating or updating expenses
- Summary page for total spending and category breakdowns
- Navbar with links between all pages
- Dark mode toggle with saved theme preference
- Add, edit, and delete expenses with unique IDs
- Validate that the title is not empty and the amount is greater than 0
- Save and load expenses with `localStorage`

## File Structure

```text
src/
|-- components/
|   |-- ExpenseForm.js
|   |-- ExpenseItem.js
|   |-- ExpenseList.js
|   |-- Navbar.js
|-- data/
|   |-- expenseCategories.js
|-- pages/
|   |-- AddExpensePage.js
|   |-- HomePage.js
|   |-- SummaryPage.js
|-- App.css
|-- App.js
|-- App.test.js
|-- index.css
|-- index.js
```

## Run the Project

1. Install dependencies if needed:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Open `http://localhost:3000` in your browser.

## Available Scripts

- `npm start` runs the app in development mode
- `npm test` runs the test suite
- `npm run build` creates a production build

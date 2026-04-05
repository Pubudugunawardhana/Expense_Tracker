# Expense Tracker

A simple React expense tracker built with functional components and hooks. The app lets users add, edit, and delete expenses, assign categories, switch between light and dark mode, view the full list, see the running total, and persist data with `localStorage`.

## Features

- Add a new expense with a title, amount, and category
- Edit an existing expense without changing its unique ID
- Validate that the title is not empty and the amount is greater than 0
- Delete any expense from the list
- View the total expense amount
- View totals grouped by category
- Toggle between light and dark mode with saved theme preference
- Save and load expenses with `localStorage`
- Use unique IDs for each expense

## File Structure

```text
src/
|-- components/
|   |-- ExpenseForm.js
|   |-- ExpenseItem.js
|   |-- ExpenseList.js
|-- data/
|   |-- expenseCategories.js
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

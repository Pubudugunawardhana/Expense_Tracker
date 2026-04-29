require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());

app.get('/', (_request, response) => {
  response.json({
    message: 'Expense Tracker API is running.',
  });
});

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/expenses', expenseRoutes);
app.use('/api/budget', budgetRoutes);

mongoose.connection.on('connected', () => {
  console.log('MongoDB Atlas connected successfully.');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});

const startServer = async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing. Add it to your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

startServer();
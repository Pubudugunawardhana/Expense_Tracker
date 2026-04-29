const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'expense_tracker_secret_key';

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized. Invalid or expired token.' });
  }
};

module.exports = protect;

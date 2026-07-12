const jwt = require('jsonwebtoken');

const userAuth = (req, res, next) => {
  const auth = req.header('Authorization');
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = userAuth;

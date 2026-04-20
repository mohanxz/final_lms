const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust the path as needed

const verifyAccessToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    const user = await User.findById(decoded.id);
    

    if (!user || user.activeToken !== token) {
      return res.status(401).json({ error: 'Session expired or invalidated' });
    }

    req.user = decoded; // Contains id, email, role, etc.
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = verifyAccessToken;

// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

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

    // Attach batchId if user is a student
    if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id });
      if (!student) return res.status(404).json({ error: 'Student not found' });
      req.user = { ...decoded, batch: student.batch };
    } else {
      req.user = decoded;
    }

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = verifyAccessToken;

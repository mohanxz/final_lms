require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const Course = require('./models/Course');
const noteRoutes = require('./routes/notes');
const studentRoutes = require('./routes/student');
const settingsRoutes = require('./routes/settings');
const progressRoutes = require('./routes/progress');
const reportRoutes = require('./routes/reportRoutes');
const quizRoutes = require('./routes/quizroute'); // ✅ FIXED POSITION
const quizreportRoutes = require('./routes/quizreportroute');
const codingQuestionRoutes = require('./routes/codingQuestion');
const codingRoutes = require('./routes/codingRoutes');
const courseRoutes = require('./routes/course');
const projectRoutes = require("./routes/project");
const finalQuizRoute = require('./routes/finalQuiz');
const practicalRoutes = require('./routes/practical');
 

const app = express();

// 1. MANUAL CORS MIDDLEWARE (Must be at the very top)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Reflect origin back to client for maximum compatibility
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// 2. Health check route
app.get('/health', (req, res) => res.send('Student Server is Live! 🚀'));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Student DB Connected'))
  .catch(console.error);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ROUTES
app.use('/notes', noteRoutes);
app.use('/student', studentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/quizreports', quizreportRoutes);
app.use('/api/coding-question', codingQuestionRoutes);
app.use("/api/coding", codingRoutes);
app.use('/api/courses', courseRoutes);
app.use("/api/project", projectRoutes);
app.use('/api/final-quiz', finalQuizRoute);
app.use('/api/practical', practicalRoutes);

app.listen(5003, () => console.log('Student server on 5003'));

module.exports = app;
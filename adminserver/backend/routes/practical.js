const express = require('express');
const router = express.Router();
const Practical = require('../models/Practical');
const verifyAccessToken = require('../middleware/auth');

// Create a new practical coding question for a day
router.post('/', verifyAccessToken, async (req, res) => {
  try {
    const { noteId, title, questionHtml, language, testCases, defaultScorePerQuestion, totalMark, createdBy } = req.body;

    const newQuestion = new Practical({
      noteId,
      title,
      questionHtml,
      language,
      testCases,
      defaultScorePerQuestion,
      totalMark,
      createdBy
    });

    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error creating practical question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Batch create/update practical questions for a note
router.post('/batch', verifyAccessToken, async (req, res) => {
  try {
    const { questions } = req.body;
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'No questions provided' });
    }

    const noteId = questions[0].noteId;

    // Delete existing questions for this note before saving the new ones
    await Practical.deleteMany({ noteId });

    // Save all new questions
    const savedQuestions = await Practical.insertMany(questions);
    
    res.status(201).json(savedQuestions);
  } catch (error) {
    console.error('Error saving batch practical questions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get practical questions for a given noteId
router.get('/by-note/:noteId', verifyAccessToken, async (req, res) => {
  try {
    const questions = await Practical.find({ noteId: req.params.noteId });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching practical questions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a practical question
router.put('/:id', verifyAccessToken, async (req, res) => {
  try {
    const { title, questionHtml, language, testCases, defaultScorePerQuestion, totalMark } = req.body;
    const updated = await Practical.findByIdAndUpdate(
      req.params.id,
      { title, questionHtml, language, testCases, defaultScorePerQuestion, totalMark },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Question not found' });

    res.json(updated);
  } catch (error) {
    console.error('Error updating practical question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

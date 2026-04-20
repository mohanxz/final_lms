const express = require('express');
const router = express.Router();
const verifyAccessToken = require('../middleware/auth');
const BatchEvaluation = require('../models/BatchEvaluation');
const Student = require('../models/Student');
// Get all modules in the batch with quiz status// Route: /api/final-quiz/available
router.get('/available', verifyAccessToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ user: userId });
    const batchId = req.user.batch;

    if (!student) return res.status(404).json({ error: "Student not found" });
    const studentId = student._id;
    const evaluations = await BatchEvaluation.find({ batch: batchId });

    const moduleList = evaluations.map(ev => {
      const studentMark = ev.studentMarks.find(sm => sm.student.equals(studentId));
      return {
        module: ev.module,
        hasQuiz: ev.questions && ev.questions.length > 0,
        attempted: studentMark && studentMark.theoryMarks >= 0 // already attempted
      };
    });
    res.json(moduleList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch module list" });
  }
});


// Get quiz for a specific module
router.get('/:module', verifyAccessToken, async (req, res) => {
  try {
    const batchId = req.user.batch;
    const { module } = req.params;

    const evaluation = await BatchEvaluation.findOne({ batch: batchId, module });

    if (!evaluation || !evaluation.questions || evaluation.questions.length === 0) {
      return res.status(404).json({ error: "No quiz available" });
    }

    const questions = evaluation.questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options
    }));

    res.json({ questions, module });
  } catch (err) {
    res.status(500).json({ error: "Failed to load quiz" });
  }
});

// Submit quiz
router.post('/submit/:module', verifyAccessToken, async (req, res) => {
  try {
    const { module } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    // 1. Get Student from User ID
    const student = await Student.findOne({ user: userId });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const batchId = student.batch;
    const studentId = student._id;

    // 2. Find BatchEvaluation
    const evaluation = await BatchEvaluation.findOne({ batch: batchId, module });
    if (!evaluation) return res.status(404).json({ error: "Evaluation not found" });

    const totalQuestions = evaluation.questions.length;
    if (totalQuestions === 0) return res.status(400).json({ error: "No questions available" });

    // 3. Calculate correct answers
    let correct = 0;
    evaluation.questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });

    // 4. Compute scaled theory marks (out of 25)
    const rawScore = (correct / totalQuestions) * 25;
    const theoryMarks = Math.round(rawScore);

    // 5. Update student's theory marks
    const studentMarkIndex = evaluation.studentMarks.findIndex(sm => sm.student.equals(studentId));

    if (studentMarkIndex !== -1) {
      // Already exists → update
      evaluation.studentMarks[studentMarkIndex].theoryMarks = theoryMarks;
    } else {
      // Not found → add new
      evaluation.studentMarks.push({
        student: studentId,
        theoryMarks,
      });
    }

    await evaluation.save();

    res.json({ message: "Submitted successfully", marks: theoryMarks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission failed" });
  }
});

module.exports = router;

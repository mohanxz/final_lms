const mongoose = require("mongoose");

const practicalSubmissionSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  
  results: [{
    questionIndex: Number,
    passed: Boolean,
    score: Number,
    code: String,
    lang: String
  }],
  earnedScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PracticalSubmission", practicalSubmissionSchema);

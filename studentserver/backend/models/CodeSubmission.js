const mongoose = require("mongoose");

const codeSubmissionSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  
  // Legacy support for single-question submissions
  code: { type: String },
  language: { type: String }, 
  
  // New support for multi-question results
  results: [{
    questionIndex: Number,
    passed: Boolean,
    score: Number,
    code: String,
    lang: String
  }],
  earnedScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 10 },
  
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CodeSubmission", codeSubmissionSchema);

const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  batch: String,
  module: String,
  notetitle: String,
  student: String,
  mark: Number,
  type: String
});
 
module.exports = mongoose.model('Result', resultSchema);

const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  chatroom: { type: String, required: true },
  message: { type: String, required: true },
  role: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = {
  StudentAdminGroupChat: mongoose.model('StudentAdminGroupChat', chatMessageSchema),
  StudentAdminOneOnOneChat: mongoose.model('StudentAdminOneOnOneChat', chatMessageSchema),
  AdminSuperAdminGroupChat: mongoose.model('AdminSuperAdminGroupChat', chatMessageSchema),
  AdminSuperAdminOneOnOneChat: mongoose.model('AdminSuperAdminOneOnOneChat', chatMessageSchema),
  ChatMessage: mongoose.model('ChatMessage', chatMessageSchema) // Keep original for compatibility if needed
};
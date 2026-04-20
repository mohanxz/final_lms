const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const verifyAccessToken = require('../middleware/auth');

router.get('/me', verifyAccessToken, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id }).populate("user", "name email");
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({
      name: student.user.name,
      email: student.user.email,
      phone: student.phone || '',
      address: student.address || '',
      dob: student.dob || '',
      github: student.github || '',
      linkedin: student.linkedin || '',
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put('/me', verifyAccessToken, async (req, res) => {
  try {
    const { phone, address, dob, github, linkedin } = req.body;
    
    const student = await Student.findOne({ user: req.user.id });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Update fields if provided
    if (phone !== undefined) student.phone = phone;
    if (address !== undefined) student.address = address;
    if (dob !== undefined) student.dob = dob;
    if (github !== undefined) student.github = github;
    if (linkedin !== undefined) student.linkedin = linkedin;

    await student.save();

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
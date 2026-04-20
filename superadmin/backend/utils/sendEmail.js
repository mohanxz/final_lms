const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const sendReceiptEmail = async (toEmail, subject, htmlContent, attachmentPath) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: toEmail,
    subject,
    html: htmlContent,
    attachments: [
      {
        filename: 'salary-receipt.pdf',
        path: attachmentPath,
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendReceiptEmail;

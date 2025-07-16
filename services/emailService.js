// services/emailService.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // or your SMTP service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"StudyBroo" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your OTP for StudyBroo Registration",
    html: `<p>Hello,</p>
           <p>Your OTP for StudyBroo registration is: <strong>${otp}</strong></p>
           <p>This OTP is valid for 5 minutes.</p>
           <p>Regards,<br/>StudyBroo Team</p>`,
  };

  await transporter.sendMail(mailOptions);
};

exports.sendWelcomeEmail = async (toEmail, name) => {
  const mailOptions = {
    from: `"StudyBroo" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Welcome to StudyBroo!",
    html: `<p>Hi ${name},</p>
           <p>Welcome to StudyBroo! 🎉</p>
           <p>Your account has been successfully verified and created.</p>
           <p>Start exploring the tools and features we've built just for students like you.</p>
           <p>Cheers,<br/>The StudyBroo Team</p>`,
  };

  await transporter.sendMail(mailOptions);
};

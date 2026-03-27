const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', // Replace with your host if not gmail
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465 (SSL), false for other ports (TLS)
  auth: {
    user: process.env.EMAIL_USER || 'admin@bmtechx.in',
    pass: process.env.EMAIL_PASS, // App password or email password
  },
});

const sendOTPEmail = async (toEmail, otp) => {
  try {
    const mailOptions = {
      from: `"BM Techx Admin" <${process.env.EMAIL_USER || 'admin@bmtechx.in'}>`,
      to: toEmail,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">BM Techx Verification</h1>
          </div>
          <div style="padding: 30px; background-color: #f8fafc;">
            <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">Hello,</p>
            <p style="color: #334155; font-size: 16px; margin-bottom: 30px;">Your one-time password (OTP) for verification is:</p>
            <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
};

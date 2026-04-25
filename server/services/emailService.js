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

const sendTaskAssignmentEmail = async (toEmail, taskDetails) => {
  try {
    const { title, boardName, adminName, dueDate, priority, description } = taskDetails;
    const formattedDate = dueDate ? new Date(dueDate).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'Immediate / Flexible';

    const priorityColors = {
      'Low': '#94a3b8',
      'Medium': '#4f46e5',
      'High': '#f97316',
      'Urgent': '#ef4444'
    };

    const mailOptions = {
      from: `"BM Techx Admin" <${process.env.EMAIL_USER || 'admin@bmtechx.in'}>`,
      to: toEmail,
      subject: `[ASSIST] New Task Assigned: ${title}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 24px; overflow: hidden; background-color: white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #000000; padding: 30px; text-align: left; border-bottom: 4px solid #fffe01;">
            <div style="color: #fffe01; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">Operational Intelligence</div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">Task Assignment</h1>
          </div>
          <div style="padding: 40px; background-color: #ffffff;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Hello,</p>
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
              <strong>${adminName}</strong> has assigned you to a new task in the <strong>${boardName}</strong> project.
            </p>
            
            <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #f1f5f9; margin-bottom: 32px;">
              <h2 style="color: #0f172a; font-size: 18px; font-weight: 800; margin: 0 0 16px 0;">${title}</h2>
              ${description ? `<p style="color: #475569; font-size: 14px; margin: 0 0 20px 0; font-style: italic;">"${description}"</p>` : ''}
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; width: 100px;">Priority</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 800; color: ${priorityColors[priority] || '#4f46e5'}">${priority || 'Medium'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Due Date</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 800; color: #1e293b;">${formattedDate}</td>
                </tr>
              </table>
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 32px;">
              Please log in to the dashboard to update the progress and manage subtasks. Ensure all daily updates are recorded as per policy.
            </p>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/kanban" style="display: inline-block; background-color: #000000; color: #fffe01; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s;">
              View Task Workspace
            </a>
          </div>
          <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">&copy; BM Techx System. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Assignment Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending assignment email:', error);
    return false;
  }
};

const sendRequestNotificationToAdmins = async (adminEmails, requestData) => {
  try {
    const { userName, userId, type, reason, duration, appliedOn, approvalUrl, rejectionUrl, details } = requestData;
    
    const mailOptions = {
      from: `"BM Techx Governance" <${process.env.EMAIL_USER || 'admin@bmtechx.in'}>`,
      to: adminEmails.join(','),
      subject: `[ACTION REQUIRED] New ${type.toUpperCase()} Request: ${userName}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 24px; overflow: hidden; background-color: white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #000000; padding: 30px; text-align: left; border-bottom: 4px solid #fffe01;">
            <div style="color: #fffe01; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">Governance Registry</div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">Authorization Request</h1>
          </div>
          <div style="padding: 40px; background-color: #ffffff;">
            <div style="margin-bottom: 32px;">
               <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">Requester Identity</p>
               <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0;">${userName} <span style="font-size: 14px; color: #94a3b8; font-weight: 500;">(${userId})</span></h2>
            </div>
            
            <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #f1f5f9; margin-bottom: 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; width: 120px;">Vector Type</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 800; color: #1e293b; text-transform: capitalize;">${type.replace('_', ' ')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Timeline</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 800; color: #1e293b;">${details}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Applied On</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 800; color: #1e293b;">${appliedOn}</td>
                </tr>
              </table>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Rationale</p>
                <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.6; font-style: italic;">"${reason}"</p>
              </div>
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 32px;">
              Please authorize this structural deviation. You can finalize this decision directly using the vectors below or via the Governance Panel.
            </p>

            <div style="display: flex; gap: 16px;">
              <a href="${approvalUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">
                Approve Request
              </a>
              <a href="${rejectionUrl}" style="display: inline-block; background-color: #ef4444; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-left: 10px;">
                Reject Request
              </a>
            </div>
          </div>
          <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">This is an automated governance feed. Immediate response suggested.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return false;
  }
};

const sendRequestResponseToUser = async (userEmail, responseData) => {
  try {
    const { userName, status, type, adminName, reason, feedback } = responseData;
    const isApproved = status === 'approved';
    const accentColor = isApproved ? '#10b981' : '#ef4444';
    
    const mailOptions = {
      from: `"BM Techx Admin" <${process.env.EMAIL_USER || 'admin@bmtechx.in'}>`,
      to: userEmail,
      subject: `[UPDATE] Your ${type.toUpperCase()} Request Status: ${status.toUpperCase()}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 24px; overflow: hidden; background-color: white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #000000; padding: 30px; text-align: left; border-bottom: 4px solid ${accentColor};">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">Request Verdict</h1>
          </div>
          <div style="padding: 40px; background-color: #ffffff;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Hello ${userName},</p>
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
              Your request for <strong>${type.replace('_', ' ')}</strong> has been <strong style="color: ${accentColor}; text-transform: uppercase;">${status}</strong> by ${adminName || 'Management'}.
            </p>
            
            <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #f1f5f9; margin-bottom: 32px;">
               <p style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Original Reason</p>
               <p style="color: #475569; font-size: 14px; margin: 0 0 20px 0; font-style: italic;">"${reason}"</p>
               
               ${feedback ? `
               <p style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Management Feedback</p>
               <p style="color: #1e293b; font-size: 14px; margin: 0; font-weight: 600;">"${feedback}"</p>
               ` : ''}
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 32px;">
              Attendance records have been updated to reflect this verdict. Please refer to the mobile dashboard for further details.
            </p>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background-color: #000000; color: #fffe01; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">
              Enter Dashboard
            </a>
          </div>
          <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">&copy; BM Techx System. Official Communication Vector.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending user response email:', error);
    return false;
  }
};

const sendMentionEmail = async (toEmail, mentionDetails) => {
  try {
    const { commenterName, taskTitle, commentText, boardName, taskId } = mentionDetails;
    
    const mailOptions = {
      from: `"BM Techx Assistant" <${process.env.EMAIL_USER || 'admin@bmtechx.in'}>`,
      to: toEmail,
      subject: `[MENTION] ${commenterName} tagged you in ${taskTitle}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 24px; overflow: hidden; background-color: white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #000000; padding: 30px; text-align: left; border-bottom: 4px solid #fffe01;">
            <div style="color: #fffe01; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">Collaboration Feed</div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">New Mention</h1>
          </div>
          <div style="padding: 40px; background-color: #ffffff;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Hello,</p>
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
              <strong>${commenterName}</strong> mentioned you in a comment on task <strong>${taskTitle}</strong> within the <strong>${boardName}</strong> project.
            </p>
            
            <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #f1f5f9; margin-bottom: 32px;">
               <p style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Comment Content</p>
               <p style="color: #1e293b; font-size: 14px; margin: 0; line-height: 1.6; font-weight: 500;">"${commentText}"</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/kanban?task=${taskId}" style="display: inline-block; background-color: #000000; color: #fffe01; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">
              Reply in Workspace
            </a>
          </div>
          <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">&copy; BM Techx System. Official Collaboration Vector.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Mention Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending mention email:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  sendTaskAssignmentEmail,
  sendRequestNotificationToAdmins,
  sendRequestResponseToUser,
  sendMentionEmail,
};

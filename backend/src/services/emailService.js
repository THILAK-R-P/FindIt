const nodemailer = require('nodemailer');

let customTransporter = null;

/**
 * Creates or retrieves the Nodemailer transporter for Gmail SMTP
 */
const getTransporter = () => {
  if (customTransporter) {
    return customTransporter;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER || 'findit.bitsathy@gmail.com';
  const pass = process.env.SMTP_PASS || '';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
};

/**
 * Allows setting a custom transporter (useful for testing and mocking)
 */
const setTransporter = (transporter) => {
  customTransporter = transporter;
};

/**
 * Verifies SMTP connection configuration without sending an email
 */
const verifyTransporter = async () => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Validates whether an email is a real recipient address (not dummy seed demo emails)
 */
const isRealRecipientEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const lower = email.toLowerCase().trim();
  if (
    lower.endsWith('@campus.edu') ||
    lower.endsWith('@institution.edu') ||
    lower.includes('priya.staff') ||
    lower === 'test.user@campus.edu'
  ) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower);
};

/**
 * Sends an automated Gmail notification when a qualifying match is detected
 *
 * @param {Object} options
 * @param {string} options.toEmail - Registered email of the recipient
 * @param {string} options.recipientName - Name of the recipient
 * @param {string} options.lostItemName - Name of the reported lost item
 * @param {string} options.foundItemName - Name of the matching found item
 * @param {string} options.foundItemLocation - Location where the found item was discovered
 * @param {string} options.foundItemId - MongoDB ID of the found item
 * @param {number} options.matchScore - AI similarity score (0.0 - 1.0)
 * @param {boolean} [options.isFoundReporter] - Whether the recipient is the person who reported the found item
 * @param {boolean} [options.isSelfMatch] - Whether the recipient reported both lost & found items
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendMatchEmail = async ({
  toEmail,
  recipientName,
  lostItemName,
  foundItemName,
  foundItemLocation,
  foundItemId,
  matchScore,
  isFoundReporter = false,
  isSelfMatch = false,
}) => {
  if (!toEmail) {
    return { success: false, error: 'Recipient email address is required' };
  }

  // Safety check: Never dispatch emails to dummy demo addresses like priya.staff@campus.edu
  if (!isRealRecipientEmail(toEmail)) {
    console.log(`[Email Service] Skipped delivery to demo/seed email: ${toEmail}`);
    return { success: false, error: 'Demo seed email addresses are skipped for live delivery' };
  }

  const senderEmail = process.env.SMTP_USER || 'findit.bitsathy@gmail.com';
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const itemUrl = `${clientUrl}/items/${foundItemId}`;
  const confidencePercent =
    matchScore !== undefined && matchScore !== null
      ? `${(matchScore * 100).toFixed(1)}%`
      : 'High';
  const locationText = foundItemLocation || 'Campus premises';
  const displayName = recipientName ? recipientName.trim() : 'FindIt User';

  let subject = `[FindIt] Potential Match Found for Your Lost Item: ${lostItemName}`;
  let headline = 'Potential Match Found for Your Lost Item';
  let intro = 'Our automated matching system detected a potential match for the item you reported lost on campus.';

  if (isSelfMatch) {
    subject = `[FindIt] Potential Match Between Your Lost & Found Reports: ${lostItemName}`;
    headline = 'Match Detected Between Your Reports';
    intro = 'Our automated matching system detected that your reported found item matches your previous lost report.';
  } else if (isFoundReporter) {
    subject = `[FindIt] Your Reported Found Item Matches a Lost Report: ${foundItemName}`;
    headline = 'Match Found for Your Found Item Report';
    intro = 'Thank you for reporting a found item. Our system detected a potential match with an item reported lost on campus.';
  }

  const plainText = `Hello ${displayName},

${intro}

Match Details:
----------------------------------------
- Lost Item: ${lostItemName}
- Found Item: ${foundItemName}
- Match Confidence: ${confidencePercent} (Score: ${matchScore !== undefined ? matchScore : 'N/A'})
- Campus Location: ${locationText}
- Found Item Link: ${itemUrl}
----------------------------------------

What to do next:
1. Open the link above to view the photos and item details.
2. If this item belongs to you, submit a claim or coordinate pickup with campus security.
3. Bring your student/staff ID for verification.

Best regards,
FindIt Campus Lost & Found Team
Bannari Amman Institute of Technology
${senderEmail}
`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; color: #ffffff; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 28px; }
    .greeting { font-size: 16px; margin-bottom: 16px; }
    .match-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .match-box h3 { margin: 0 0 12px; color: #166534; font-size: 16px; }
    .cta-container { text-align: center; margin: 28px 0 16px; }
    .cta-btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; }
    .notice { font-size: 13px; color: #64748b; line-height: 1.5; background: #f8fafc; padding: 14px; border-radius: 6px; margin-top: 20px; }
    .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FindIt Campus Portal</h1>
      <p>${headline}</p>
    </div>
    <div class="content">
      <div class="greeting">Hello <strong>${displayName}</strong>,</div>
      <p>${intro}</p>
      
      <div class="match-box">
        <h3>Match Summary</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
          <tr>
            <td style="color: #475569; width: 45%;">Lost Item:</td>
            <td style="color: #0f172a; font-weight: 600;">${lostItemName}</td>
          </tr>
          <tr>
            <td style="color: #475569;">Found Item:</td>
            <td style="color: #0f172a; font-weight: 600;">${foundItemName}</td>
          </tr>
          <tr>
            <td style="color: #475569;">Match Confidence:</td>
            <td style="color: #16a34a; font-weight: 700;">${confidencePercent}</td>
          </tr>
          <tr>
            <td style="color: #475569;">Campus Location:</td>
            <td style="color: #0f172a; font-weight: 600;">${locationText}</td>
          </tr>
        </table>
      </div>

      <div class="cta-container">
        <a href="${itemUrl}" class="cta-btn" target="_blank" rel="noopener noreferrer">View Found Item Details</a>
      </div>

      <div class="notice">
        <strong>Next Steps:</strong>
        <ol style="margin: 8px 0 0; padding-left: 18px;">
          <li>Review the item description and photos on FindIt.</li>
          <li>Submit a claim or coordinate handoff if this belongs to you.</li>
          <li>Bring your campus ID card for verification.</li>
        </ol>
      </div>
    </div>
    <div class="footer">
      This is an automated notification from FindIt Campus Lost &amp; Found Platform.<br>
      Sender: <strong>${senderEmail}</strong> | Bannari Amman Institute of Technology
    </div>
  </div>
</body>
</html>
`;

  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: `"FindIt Campus Lost & Found" <${senderEmail}>`,
      to: toEmail,
      subject,
      text: plainText,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Match email successfully sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send match email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendMatchEmail,
  verifyTransporter,
  getTransporter,
  setTransporter,
  isRealRecipientEmail,
};

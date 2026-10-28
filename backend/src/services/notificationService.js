const Notification = require('../models/Notification');
const Item = require('../models/Item');
const User = require('../models/User');
const { sendMatchEmail, isRealRecipientEmail } = require('./emailService');

/**
 * Creates in-app match notifications and triggers automated Gmail notifications
 * for qualifying FAISS matches.
 *
 * Requirements:
 * - Always notify the user who reported the LOST item.
 * - Sender email: findit.bitsathy@gmail.com
 * - Recipient: Registered Gmail / email of the actual person who reported the LOST item,
 *   whether the LOST or FOUND report was submitted first.
 * - Never send emails to faculty Priya or demo seed emails (e.g. priya.staff@campus.edu or @campus.edu).
 * - Never notify a user about their own item (self-match prevention).
 * - Include lost item name, matching found item name, campus location, and details link.
 * - Enforce threshold >= 0.86 (configurable via AI_MATCH_THRESHOLD).
 * - Prevent duplicate notifications and emails for the same pair using persistent database tracking.
 * - Non-blocking: email failures and notification errors are logged and never crash item creation.
 *
 * @param {Object} item - Newly created item (lost or found)
 * @param {Array<Object>} matches - Qualifying matches returned by FAISS search
 * @returns {Promise<Array<Object>>} - Array of created Notification documents
 */
const createMatchNotifications = async (item, matches) => {
  if (!item || !item._id || !item.type || !Array.isArray(matches) || matches.length === 0) {
    return [];
  }

  const threshold = parseFloat(process.env.AI_MATCH_THRESHOLD) || 0.86;
  const createdNotifications = [];
  const seenPairsInRun = new Set();

  for (const match of matches) {
    let lostItemId = null;
    let foundItemId = null;

    try {
      if (!match || !match.itemId || match.similarityScore === undefined) {
        continue;
      }

      // 1. Validate similarity threshold safety
      if (match.similarityScore < threshold) {
        console.log(
          `[Notification] Skipped candidate ${match.itemId}: score ${match.similarityScore} is below threshold ${threshold}`
        );
        continue;
      }

      let lostItemName = '';
      let foundItemName = '';
      let foundItemLocation = '';
      let recipientUserId = null;
      let otherUserId = null;

      if (item.type === 'lost') {
        // Current item is LOST; matched candidate is existing FOUND
        lostItemId = item._id;
        lostItemName = item.itemName || 'item';
        foundItemId = match.itemId;
        foundItemName = match.itemName || 'item';

        // Recipient is the user who reported the LOST item (the actual reporter of lost item)
        recipientUserId = item.reportedBy;

        const foundDoc = await Item.findById(foundItemId).select('reportedBy location itemName').lean();
        otherUserId = match.reportedBy || (foundDoc ? foundDoc.reportedBy : null);
        foundItemLocation = match.location || (foundDoc ? foundDoc.location : '') || '';
        if (foundDoc && foundDoc.itemName) {
          foundItemName = foundDoc.itemName;
        }
      } else if (item.type === 'found') {
        // Current item is FOUND; matched candidate is existing LOST
        foundItemId = item._id;
        foundItemName = item.itemName || 'item';
        foundItemLocation = item.location || '';
        lostItemId = match.itemId;
        lostItemName = match.itemName || 'item';

        otherUserId = item.reportedBy; // found reporter
        let lostReporterId = match.reportedBy;
        const lostDoc = await Item.findById(lostItemId).select('reportedBy itemName').lean();
        if (lostDoc) {
          lostReporterId = lostDoc.reportedBy;
          if (lostDoc.itemName) {
            lostItemName = lostDoc.itemName;
          }
        }
        recipientUserId = lostReporterId;
      } else {
        continue;
      }

      // 2. Validate recipient existence
      if (!recipientUserId) {
        console.warn(`[Notification Warning] No valid recipient user found for lost item ${lostItemId}`);
        continue;
      }

      // 3. Never notify a user about their own item (self-match prevention)
      if (otherUserId && recipientUserId.toString() === otherUserId.toString()) {
        console.log(
          `[Notification] Skipped self-match: user ${recipientUserId} reported both lost (${lostItemId}) and found (${foundItemId}) items.`
        );
        continue;
      }

      // 4. In-run deduplication
      const pairKey = `${recipientUserId.toString()}_${lostItemId.toString()}_${foundItemId.toString()}`;
      if (seenPairsInRun.has(pairKey)) {
        continue;
      }
      seenPairsInRun.add(pairKey);

      // 5. Database-level deduplication check
      const existingNotif = await Notification.findOne({
        user: recipientUserId,
        lostItem: lostItemId,
        foundItem: foundItemId,
        type: 'potential_match',
      });

      if (existingNotif) {
        console.log(
          `[Notification] Duplicate match notification already exists for user ${recipientUserId} (lost: ${lostItemId}, found: ${foundItemId})`
        );
        continue;
      }

      // Fetch recipient user's registered name and email (the actual lost reporter's email)
      const recipientUser = await User.findById(recipientUserId).select('name email').lean();
      const recipientEmail = recipientUser?.email || '';
      const recipientName = recipientUser?.name || '';

      // 6. Create in-app Notification for LOST reporter
      const confidencePercent = (match.similarityScore * 100).toFixed(1);
      const title = 'Potential Match Found';
      const message = `A found item '${foundItemName}' (ID: ${foundItemId}) matching your lost '${lostItemName}' was reported with ${confidencePercent}% match confidence (score: ${match.similarityScore}).`;
      const link = `/items/${foundItemId}`;

      const notification = await Notification.create({
        user: recipientUserId,
        title,
        message,
        type: 'potential_match',
        link,
        lostItem: lostItemId,
        foundItem: foundItemId,
        matchScore: match.similarityScore,
        emailSent: false,
        emailRecipient: recipientEmail,
      });

      console.log(
        `[Notification] Created potential_match notification ${notification._id} for user ${recipientUserId} (lost: ${lostItemId}, found: ${foundItemId}, score: ${match.similarityScore})`
      );
      createdNotifications.push(notification);

      // 7. Persistent database deduplication check for email
      const emailAlreadySent = await Notification.findOne({
        lostItem: lostItemId,
        foundItem: foundItemId,
        emailSent: true,
      })
        .select('_id')
        .lean();

      if (emailAlreadySent) {
        console.log(
          `[Email] Match email already sent to ${recipientEmail} for pair (lost: ${lostItemId}, found: ${foundItemId}). Duplicate email prevented.`
        );
        continue;
      }

      // 8. Safety check: NEVER dispatch emails to faculty Priya or demo seed emails
      if (!isRealRecipientEmail(recipientEmail)) {
        console.log(
          `[Email] Skipped live delivery to demo/faculty seed email ${recipientEmail}. Notification saved in-app only.`
        );
        continue;
      }

      // 9. Dispatch Gmail notification to actual reporter's Gmail
      try {
        const emailResult = await sendMatchEmail({
          toEmail: recipientEmail,
          recipientName,
          lostItemName,
          foundItemName,
          foundItemLocation,
          foundItemId: foundItemId.toString(),
          matchScore: match.similarityScore,
          isFoundReporter: false,
          isSelfMatch: false,
        });

        if (emailResult.success) {
          notification.emailSent = true;
          notification.emailSentAt = new Date();
          notification.emailError = null;
          await notification.save();
          console.log(
            `[Email] Match notification email successfully sent to actual reporter ${recipientEmail} for pair (lost: ${lostItemId}, found: ${foundItemId})`
          );
        } else {
          notification.emailSent = false;
          notification.emailError = emailResult.error || 'Failed to dispatch email';
          await notification.save();
          console.warn(
            `[Email Warning] Could not dispatch match email to ${recipientEmail}: ${emailResult.error}`
          );
        }
      } catch (emailErr) {
        notification.emailSent = false;
        notification.emailError = emailErr.message;
        await notification.save().catch(() => {});
        console.warn(
          `[Email Warning] Error dispatching match email to ${recipientEmail}:`,
          emailErr.message
        );
      }
    } catch (err) {
      if (err.code === 11000) {
        console.log(
          `[Notification] Database duplicate constraint prevented duplicate for pair (lost: ${lostItemId}, found: ${foundItemId})`
        );
      } else {
        console.error(
          `[Notification Error] Failed to create match notification for match ${match?.itemId}:`,
          err.message
        );
      }
    }
  }

  return createdNotifications;
};

module.exports = {
  createMatchNotifications,
};

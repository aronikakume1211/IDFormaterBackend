const Payment = require("../models/payment.schema");
const User = require("../models/user.schema");
const { generateEmailTemplate } = require("../utils/generateEmailTemplate");
const sendEmail = require("../utils/sendEmail");

async function notifyUsersWithLowPoints() {
  const payments = await Payment.find({ status: "success" }).populate("user");

  for (const payment of payments) {
    const { points, remainingPoints, user, notified75, notified100 } = payment;

    // Skip invalid records
    if (!user || !user.email || points === 0) continue;

    const used = points - remainingPoints;
    const percentUsed = (used / points) * 100;

    // Prepare email if usage crosses thresholds
    if (percentUsed >= 100 && !notified100) {
      await sendPointUsageEmail(payment, user, percentUsed, "notified100");
    } else if (percentUsed >= 75 && !notified75) {
      await sendPointUsageEmail(payment, user, percentUsed, "notified75");
    }
  }

  console.log("Point usage notification job completed.");
}

/**
 * Helper to send notification email and update the payment document.
 */
async function sendPointUsageEmail(payment, user, percentUsed, notifyField) {
  const emailHtmlContent = generateEmailTemplate(user, percentUsed);

  await sendEmail({
    to: user.email,
    subject: "You're running low on points - Fayda ID Processor",
    html: emailHtmlContent,
  });

  payment[notifyField] = true;
  await payment.save();

  console.log(`Notification sent to ${user.email} for ${notifyField} (${Math.round(percentUsed)}%).`);
}

module.exports = notifyUsersWithLowPoints;

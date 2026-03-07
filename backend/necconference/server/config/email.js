const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDateTime = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return escapeHtml(date);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

const normalizeEventNames = (events) => {
  if (!Array.isArray(events)) return [];
  return events
    .map((ev) => (typeof ev === "string" ? ev : ev?.name || ev?.title || ev?.id || ""))
    .map((name) => String(name).trim())
    .filter(Boolean);
};

const wrapEmail = ({ title, intro, content, footerNote }) => `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f7fb;padding:24px;color:#111827;">
    <div style="max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#4c1d95;color:#ffffff;padding:18px 22px;">
        <h2 style="margin:0;font-size:20px;">${escapeHtml(title)}</h2>
      </div>
      <div style="padding:22px;">
        <p style="margin:0 0 14px 0;line-height:1.6;">${intro}</p>
        ${content}
      </div>
      <div style="padding:16px 22px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.6;">
        ${
          footerNote ||
          "NEC Conference 2026 | This is an automated email. Please do not share your account credentials."
        }
      </div>
    </div>
  </div>
`;

const makeKeyValueRows = (items) =>
  items
    .map(
      ([k, v]) => `
        <tr>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;width:220px;">${escapeHtml(k)}</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(v)}</td>
        </tr>
      `
    )
    .join("");

const sendWelcomeEmail = async (userData) => {
  const participantName = userData?.name || "Participant";
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userData?.email,
    subject: "Registration Successful | NEC Conference 2026",
    html: wrapEmail({
      title: "Welcome to NEC Conference 2026",
      intro: `Dear <strong>${escapeHtml(participantName)}</strong>, your account has been created successfully.`,
      content: `
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0;">
          ${makeKeyValueRows([
            ["Participant Name", participantName],
            ["Email", userData?.email || "-"],
            ["Department", userData?.department || "-"],
            ["Role", userData?.role || "Participant"],
            ["Registered On", formatDateTime(new Date())],
          ])}
        </table>
        <p style="margin:12px 0 0 0;line-height:1.6;">You can now log in, choose tracks, and complete your registration payment.</p>
      `,
    }),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent to:", userData?.email);
  } catch (error) {
    console.error("Welcome Email Failed:", error.message);
  }
};

const sendLoginAlert = async (userData) => {
  const participantName = userData?.name || "Participant";
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userData?.email,
    subject: "Login Alert | NEC Conference 2026",
    html: wrapEmail({
      title: "Login Notification",
      intro: `Dear <strong>${escapeHtml(participantName)}</strong>, a login was detected on your NEC Conference account.`,
      content: `
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0;">
          ${makeKeyValueRows([
            ["Participant Name", participantName],
            ["Email", userData?.email || "-"],
            ["Login Time", formatDateTime(new Date())],
          ])}
        </table>
        <p style="margin:12px 0 0 0;line-height:1.6;">If this was not you, please reset your password immediately and contact support.</p>
      `,
    }),
  };
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Login Alert Failed:", error.message);
    return false;
  }
};

const sendEventBookConfirmationEmail = async (userData, transactionId, amount, billData = {}) => {
  const participantId = billData?.participantId || userData?.participantId || userData?.userId || "-";
  const participantName = billData?.name || userData?.name || "Participant";
  const participantEmail = billData?.email || userData?.email || "-";
  const paymentStatus = billData?.paymentStatus || "Paid";
  const registeredEvents = normalizeEventNames(billData?.events || userData?.events);
  const amountText = Number.isFinite(Number(amount)) ? `${Number(amount)}` : `${amount || 0}`;
  const orderId = billData?.orderId || "-";
  const paymentId = billData?.paymentId || transactionId || "-";
  const upiId = billData?.upiId || "-";
  const currency = billData?.currency || "INR";

  // Generate QR Code with registration details
  let qrCodeDataUrl = "";
  let qrCodeBuffer = null;
  try {
    // Create a compact QR data object
    const qrData = {
      pid: participantId,
      nm: participantName,
      em: participantEmail,
      ath: billData?.ath || billData?.auth || billData?.authToken || "",
      ev: registeredEvents.join("|"),
      amt: amountText,
      cur: currency,
      oid: orderId,
      pyid: paymentId,
      upi: upiId,
      tid: transactionId || "N/A"
    };

    const qrString = JSON.stringify(qrData);
    console.log("[QR Code] Generating QR code with data:", qrString);

    qrCodeDataUrl = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 200,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });
    qrCodeBuffer = await QRCode.toBuffer(qrString, {
      errorCorrectionLevel: "H",
      type: "png",
      width: 300,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });
    console.log("[QR Code] QR code generated successfully");
  } catch (qrError) {
    console.error("QR Code generation failed:", qrError.message);
    console.error("QR Code error stack:", qrError.stack);
    // Continue without QR code - it's not critical
  }

  // NEC College Department Map Information
  const departmentMap = {
    "Computer Science": "Campus Building A, 2nd Floor",
    "Information Technology": "Campus Building A, 2nd Floor",
    "Electronics": "Campus Building B, 1st Floor",
    "Electrical Engineering": "Campus Building B, 1st Floor",
    "Mechanical Engineering": "Campus Building C, Ground Floor",
    "Civil Engineering": "Campus Building C, 1st Floor",
    "Chemical Engineering": "Campus Building D, 1st Floor",
    "Biotechnology": "Campus Building D, 2nd Floor",
    "Architecture": "Campus Building E, Ground Floor",
    "MBA": "Administrative Building, 3rd Floor",
    "MCA": "Campus Building A, 3rd Floor"
  };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: participantEmail,
    subject: "PAYMENT BILL (PID) | NEC Conference 2026",
    html: wrapEmail({
      title: "Payment Bill (PID) - Registration Confirmed",
      intro: `Dear <strong>${escapeHtml(participantName)}</strong>, your payment was successful. Your registration bill details are below.`,
      content: `
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0;">
          ${makeKeyValueRows([
            ["Participant ID", participantId],
            ["Participant Name", participantName],
            ["Email", participantEmail],
            ["Payment Status", paymentStatus],
            ["Payment Amount (INR)", amountText],
            ["Currency", currency],
            ["Order ID", orderId],
            ["Payment ID", paymentId],
            ["UPI ID", upiId],
            ["Transaction ID", transactionId || "N/A"],
            ["Payment Time", formatDateTime(billData?.paymentDate || new Date())],
          ])}
        </table>
        
        <div style="margin-top:16px;">
          <div style="font-weight:600;margin-bottom:8px;">Events Registered</div>
          <ul style="margin:0;padding-left:18px;line-height:1.7;">
            ${
              registeredEvents.length
                ? registeredEvents.map((ev) => `<li>${escapeHtml(ev)}</li>`).join("")
                : "<li>-</li>"
            }
          </ul>
        </div>

        ${qrCodeDataUrl ? `
        <div style="margin-top:20px;padding:16px;background:#f3f4f6;border-radius:8px;border:1px solid #e5e7eb;text-align:center;">
          <div style="font-weight:600;margin-bottom:12px;font-size:14px;">Registration QR Code</div>
          <img src="cid:registration-qr" alt="Registration QR Code" style="width:200px;height:200px;border:2px solid #4c1d95;border-radius:4px;" />
          <p style="margin:12px 0 0 0;font-size:12px;color:#6b7280;">Scan this QR code at the venue for verification</p>
        </div>
        ` : ''}

        <p style="margin:14px 0 0 0;line-height:1.6;">Please carry this bill copy for verification at the venue.</p>
      `,
    }),
    attachments: qrCodeBuffer
      ? [
          {
            filename: `NEC-Registration-QR-${participantId || "PID"}.png`,
            content: qrCodeBuffer,
            contentType: "image/png",
            cid: "registration-qr"
          }
        ]
      : []
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Payment Email Failed:", error.message);
  }
};

const sendCartChangeEmail = async (userData, action, item) => {
  const participantName = userData?.name || "Participant";
  const actionText = action === "cart_add" ? "Added to Cart" : "Removed from Cart";
  const eventName =
    typeof item === "string"
      ? item
      : item?.name || item?.title || item?.eventName || item?.eventId || "Selected Event";
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userData?.email,
    subject: `${actionText} | NEC Conference 2026`,
    html: wrapEmail({
      title: "Cart Update Notification",
      intro: `Dear <strong>${escapeHtml(participantName)}</strong>, your conference cart has been updated.`,
      content: `
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0;">
          ${makeKeyValueRows([
            ["Participant Name", participantName],
            ["Email", userData?.email || "-"],
            ["Action", actionText],
            ["Event", eventName],
            ["Updated At", formatDateTime(new Date())],
          ])}
        </table>
      `,
    }),
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Cart Change Email Failed:", err?.message || err);
  }
};

const sendRegistrationReminderEmail = async (userData, registrationId, details = {}) => {
  const participantName = userData?.name || "Participant";
  const participantEmail = userData?.email || details?.email || "-";
  const participantId = details?.participantId || userData?.participantId || userData?.userId || "-";
  const amount = details?.amount ?? "-";
  const events = normalizeEventNames(details?.events);
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: participantEmail,
    subject: "Payment Reminder | NEC Conference 2026",
    html: wrapEmail({
      title: "Pending Payment Reminder",
      intro: `Dear <strong>${escapeHtml(participantName)}</strong>, your registration is pending because payment has not been completed.`,
      content: `
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0;">
          ${makeKeyValueRows([
            ["Registration ID", registrationId || "-"],
            ["Participant ID", participantId],
            ["Participant Name", participantName],
            ["Email", participantEmail],
            ["Payment Status", "Pending"],
            ["Amount Due (INR)", amount],
          ])}
        </table>
        <div style="margin-top:12px;">
          <div style="font-weight:600;margin-bottom:8px;">Selected Events</div>
          <ul style="margin:0;padding-left:18px;line-height:1.7;">
            ${events.length ? events.map((ev) => `<li>${escapeHtml(ev)}</li>`).join("") : "<li>-</li>"}
          </ul>
        </div>
        <p style="margin-top:14px;line-height:1.6;">Please complete payment at the earliest to confirm your participation.</p>
      `,
    }),
  };
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("Registration Reminder Failed:", err?.message || err);
    return false;
  }
};

const sendFailedPaymentEmail = async (userData, details) => {
  const participantName = userData?.name || "Participant";
  const participantEmail = userData?.email || "-";
  const orderId = details?.razorpayOrderId || "-";
  const paymentId = details?.razorpayPaymentId || "-";
  const reason = details?.reason || "Payment cancelled or failed";
  const amount = details?.amount ?? "-";
  const events = normalizeEventNames(details?.events);
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userData?.email,
    subject: "Payment Failed | NEC Conference 2026",
    html: wrapEmail({
      title: "Payment Failure Notification",
      intro: `Dear <strong>${escapeHtml(participantName)}</strong>, your payment attempt could not be completed.`,
      content: `
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0;">
          ${makeKeyValueRows([
            ["Participant Name", participantName],
            ["Email", participantEmail],
            ["Payment Status", "Failed"],
            ["Amount (INR)", amount],
            ["Order ID", orderId],
            ["Payment ID", paymentId],
            ["Reason", reason],
            ["Time", formatDateTime(new Date())],
          ])}
        </table>
        <div style="margin-top:12px;">
          <div style="font-weight:600;margin-bottom:8px;">Selected Events</div>
          <ul style="margin:0;padding-left:18px;line-height:1.7;">
            ${events.length ? events.map((ev) => `<li>${escapeHtml(ev)}</li>`).join("") : "<li>-</li>"}
          </ul>
        </div>
        <p style="margin-top:12px;">Please try again or contact support for assistance.</p>
      `,
    }),
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed Payment Email Failed:", err?.message || err);
  }
};

const sendAdminNotification = async (log) => {
  const admin = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!admin) return;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: admin,
    subject: `NEC Action: ${log.action}`,
    html: wrapEmail({
      title: `Action Recorded: ${log.action}`,
      intro: "A new tracked action has been recorded.",
      content: `
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0;">
          ${makeKeyValueRows([
            ["Action", log.action || "-"],
            ["User", log.email || log.user || "unknown"],
            ["Time", formatDateTime(log.createdAt || new Date())],
          ])}
        </table>
        <pre style="background:#f3f4f6;padding:12px;border-radius:8px;border:1px solid #e5e7eb;overflow:auto;">${escapeHtml(
          JSON.stringify(log.details || log.meta || {}, null, 2)
        )}</pre>
      `,
    }),
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Admin Notification Failed:", err?.message || err);
  }
};

const sendEmail = async (to, subject, html, attachments = []) => {
  if (!to) return;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    attachments,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Generic sendEmail failed:", err?.message || err);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendLoginAlert,
  sendEventBookConfirmationEmail,
  sendCartChangeEmail,
  sendRegistrationReminderEmail,
  sendFailedPaymentEmail,
  sendAdminNotification,
  sendEmail,
};

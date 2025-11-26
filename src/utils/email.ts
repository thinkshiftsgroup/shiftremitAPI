import sgMail from "@sendgrid/mail";
import {
  generateEmailFooter,
  generateEmailHeader,
} from "../services/admin/admin.transfers.service";
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

const SENDER_EMAIL = process.env.EMAIL_FROM || "no-reply@shiftremit.com";
const ADMIN_SUPPORT_EMAIL = process.env.EMAIL_FROM || "support@shiftremit.com";
interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
}

export const sendEmail = async ({
  to,
  subject,
  htmlBody,
}: SendEmailParams): Promise<void> => {
  const msg = {
    to: to,
    from: ADMIN_SUPPORT_EMAIL,
    subject: subject,
    html: htmlBody,
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log(
      `Email sent to ${to}: ${subject}. Status: ${response.statusCode}`
    );
  } catch (error: any) {
    console.error(
      "Error sending email via SendGrid:",
      error.response?.body || error
    );
    throw new Error("Failed to send email.");
  }
};
export const sendAdminEmail = async ({
  to,
  subject,
  htmlBody,
}: SendEmailParams): Promise<void> => {
  const msg = {
    to: to,
    from: ADMIN_SUPPORT_EMAIL,
    cc: "office@getprospa.com",
    subject: subject,
    html: htmlBody,
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log(
      `Email sent to ${to}: ${subject}. Status: ${response.statusCode}`
    );
  } catch (error: any) {
    console.error(
      "Error sending email via SendGrid:",
      error.response?.body || error
    );
    throw new Error("Failed to send email.");
  }
};
export const sendTransferEmail = async ({
  to,
  subject,
  htmlBody,
}: SendEmailParams): Promise<void> => {
  const msg = {
    to: to,
    from: ADMIN_SUPPORT_EMAIL,
    subject: subject,
    html: htmlBody,
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log(
      `Email sent to ${to}: ${subject}. Status: ${response.statusCode}`
    );
  } catch (error: any) {
    console.error(
      "Error sending email via SendGrid:",
      error.response?.body || error
    );
    throw new Error("Failed to send email.");
  }
};
export const sendVerificationCodeEmail = async (
  email: string,
  code: string,
  fullName: string
): Promise<void> => {
  const subject = "Verify Your Email Address";
  const htmlBody = `
        <h1>Hello ${fullName},</h1>
        <p>Thank you for signing up. Please use the following 6-digit code to verify your account:</p>
        <h2 style="color: #4CAF50;">${code}</h2>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
    `;
  await sendEmail({ to: email, subject, htmlBody });
};

export const sendPasswordResetCodeEmail = async (
  email: string,
  code: string,
  fullName: string
): Promise<void> => {
  const subject = "Password Reset Request";
  const htmlBody = `
        <h1>Hello ${fullName},</h1>
        <p>You requested a password reset. Please use the following 6-digit code to reset your password:</p>
        <h2 style="color: #F44336;">${code}</h2>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
    `;
  await sendEmail({ to: email, subject, htmlBody });
};

export const createRateAlertHtmlBody = (
  currencyPair: string,
  thresholdRate: number,
  currentRate: number
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rate Alert from ShiftRemit</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
        .header { background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; }
        .content { padding: 30px; line-height: 1.6; color: #333333; }
        .rate-box { background-color: #e9ecef; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0; }
        .rate-box h2 { margin-top: 0; color: #007bff; }
        .cta-button { display: inline-block; padding: 10px 20px; margin-top: 20px; background-color: #28a745; color: #ffffff !important; text-decoration: none; border-radius: 5px; }
        .footer { background-color: #f8f9fa; color: #6c757d; text-align: center; padding: 20px; font-size: 12px; }
        a { color: #007bff; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Rate Drop Alert</h1>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p>Your exchange rate alert for **${currencyPair}** has been triggered! This means the rate has dropped below your set threshold.</p>
            <div class="rate-box">
                <h2>${currencyPair} Rate Alert</h2>
                <p>Your Threshold: **1 ${
                  currencyPair.split(" to ")[0]
                } = ${thresholdRate.toFixed(2)} ${
    currencyPair.split(" to ")[1]
  }**</p>
                <p>Current Rate: **1 ${
                  currencyPair.split(" to ")[0]
                } = ${currentRate.toFixed(6)} ${
    currencyPair.split(" to ")[1]
  }**</p>
            </div>
            <p>Don't miss out on this opportunity. Log in to check the latest rate and make a transfer.</p>
            <p style="text-align: center;">
                <a href="[Your Transfer URL]" class="cta-button">Go to ShiftRemit</a>
            </p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ShiftRemit. All rights reserved.</p>
            <p>You received this email because you set up a rate alert. You can manage your alerts in your account settings.</p>
        </div>
    </div>
</body>
</html>
`;
};

export const generateKYCAdminEmailHtml = (
  kycType: "Individual" | "Business",
  userName: string,
  userId: string
): string => {
  const headerHtml = generateEmailHeader();
  const footerHtml = generateEmailFooter();
  const BRAND_COLOR = "#813FD6";
  const ADMIN_LINK = `${process.env.ADMIN_PORTAL_BASE_URL}/admin/customers/${userId}`;

  return `
    <div style="background-color: #f3f4f6; padding: 20px; min-height: 100vh;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; color: #1f2937; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <div style="padding: 0 24px; border-bottom: 1px solid #e5e7eb;">
          ${headerHtml}
        </div>
        
        <div style="padding: 24px 24px 0 24px;">
            <h2 style="color: black; font-size: 20px; margin-bottom: 20px;">
              ACTION REQUIRED: New ${kycType} KYC Submitted
            </h2>

            <p style="margin-top: 0;">Dear Operations Team,</p>
            <p>A new ${kycType} KYC application has been submitted and is awaiting your review.</p>
            
            <div style="border: 1px dashed #ccc; padding: 15px; margin-bottom: 20px; background-color: #f0f8ff;">
              <h3 style="margin-top: 0; color: ${BRAND_COLOR}; font-size: 16px;">Submission Details</h3>
              <p style="margin: 4px 0;"><strong>User:</strong> ${userName}</p>
              <p style="margin: 4px 0;"><strong>User ID:</strong> ${userId}</p>
              <p style="margin: 4px 0;"><strong>Type:</strong> ${kycType} KYC</p>
              <p style="margin: 4px 0;"><strong>Submission Date:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a 
                href="${ADMIN_LINK}" 
                style="display: inline-block; padding: 10px 20px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;"
              >
                Review ${kycType} KYC Application
              </a>
            </p>
            
            <p style="margin: 0;">Thank you,</p>
            <p style="margin: 0;"><strong>ShiftRemit System Alerts</strong></p>
        </div>

        <div style="padding: 0 24px 24px 24px;">
            ${footerHtml}
        </div>
      </div>
    </div>
  `;
};

const BRAND_COLOR = "#813FD6";
export const generateKYCUserEmailHtml = (
  kycType: "Individual" | "Business",
  status: "APPROVED" | "REJECTED",
  userName: string,
  reason?: string
): string => {
  const headerHtml = generateEmailHeader();
  const footerHtml = generateEmailFooter();

  const isApproved = status === "APPROVED";
  const statusColor = isApproved ? "#10B981" : "#EF4444";
  const titleText = isApproved
    ? `Congratulations! Your ${kycType} KYC is Approved.`
    : `Update: Your ${kycType} KYC Requires Attention.`;
  const bodyText = isApproved
    ? `We are pleased to inform you that your ${kycType} Know Your Customer (KYC) application has been **successfully approved**. You now have full access to our platform features.`
    : `We have reviewed your ${kycType} Know Your Customer (KYC) application. Unfortunately, we were unable to approve it at this time. Please review the details below.`;

  const actionText = isApproved
    ? "Go to Your Account"
    : "Review and Resubmit Documents";
  const actionLink = `${process.env.APP_BASE_URL}/account`;

  return `
    <div style="background-color: #f3f4f6; padding: 20px; min-height: 100vh;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; color: #1f2937; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <div style="padding: 0 24px; border-bottom: 1px solid #e5e7eb;">
          ${headerHtml}
        </div>
        
        <div style="padding: 24px;">
            <h2 style="color: ${statusColor}; font-size: 20px; margin-bottom: 20px;">
              ${titleText}
            </h2>

            <p style="margin-top: 0;">Dear ${userName},</p>
            <p>${bodyText}</p>
            
            ${
              !isApproved && reason
                ? `
              <div style="border: 1px dashed ${statusColor}; padding: 15px; margin-bottom: 20px; background-color: #fef2f2;">
                <h3 style="margin-top: 0; color: ${statusColor}; font-size: 16px;">Rejection Details</h3>
                <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason}</p>
                <p style="margin: 4px 0;">Please log into your account to see which specific documents were rejected and upload the corrected files.</p>
              </div>
            `
                : ""
            }

            <p style="text-align: center; margin: 30px 0;">
              <a 
                href="${actionLink}" 
                style="display: inline-block; padding: 10px 20px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;"
              >
                ${actionText}
              </a>
            </p>
            
            <p style="margin: 0;">Thank you,</p>
            <p style="margin: 0;"><strong>ShiftRemit Team</strong></p>
        </div>

        <div style="padding: 0 24px 24px 24px;">
            ${footerHtml}
        </div>
      </div>
    </div>
  `;
};

export const generateDocStatusUpdateEmailHtml = (
  userName: string,
  docName: string,
  status: "APPROVED" | "REJECTED",
  kycType: "Individual" | "Business",
  rejectionReason?: string
): string => {
  const headerHtml = generateEmailHeader();
  const footerHtml = generateEmailFooter();

  const isApproved = status === "APPROVED";
  const statusColor = isApproved ? "#10B981" : "#EF4444";
  const titleText = isApproved
    ? `Update: Your ${docName} Document is Approved!`
    : `Action Required: ${docName} Document Rejected.`;

  const bodyText = isApproved
    ? `We have reviewed your **${docName}** submission for your ${kycType} KYC and have **approved** it. Thank you for providing the necessary information.`
    : `We have reviewed your **${docName}** submission. Unfortunately, it was **rejected** because it did not meet our compliance requirements.`;

  const actionText = isApproved
    ? "View Account Status"
    : "Review and Resubmit Document";
  const actionLink = `${process.env.APP_BASE_URL}/kyc/documents`;

  return `
    <div style="background-color: #f3f4f6; padding: 20px; min-height: 100vh;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; color: #1f2937; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <div style="padding: 0 24px; border-bottom: 1px solid #e5e7eb;">
          ${headerHtml}
        </div>
        
        <div style="padding: 24px;">
            <h2 style="color: ${statusColor}; font-size: 20px; margin-bottom: 20px;">
              ${titleText}
            </h2>

            <p style="margin-top: 0;">Dear ${userName},</p>
            <p>${bodyText}</p>
            
            ${
              !isApproved && rejectionReason
                ? `
              <div style="border: 1px solid ${statusColor}; padding: 15px; margin-bottom: 20px; background-color: #fef2f2; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #374151; font-size: 16px;">Reason for Rejection:</h3>
                <p style="margin: 4px 0;">${rejectionReason}</p>
                <p style="margin-bottom: 0; font-size: 14px;">Please click the button below to upload a compliant copy.</p>
              </div>
            `
                : ""
            }

            <p style="text-align: center; margin: 30px 0;">
              <a 
                href="${actionLink}" 
                style="display: inline-block; padding: 10px 20px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;"
              >
                ${actionText}
              </a>
            </p>
            
            <p style="margin: 0;">Thank you,</p>
            <p style="margin: 0;"><strong>ShiftRemit Team</strong></p>
        </div>

        <div style="padding: 0 24px 24px 24px;">
            ${footerHtml}
        </div>
      </div>
    </div>
  `;
};

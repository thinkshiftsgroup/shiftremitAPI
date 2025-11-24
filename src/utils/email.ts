import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

const SENDER_EMAIL = process.env.EMAIL_FROM || "no-reply@shiftremit.com";
const TRANSFER_EMAIL = process.env.EMAIL_FROM || "support@shiftremit.com";

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
    from: TRANSFER_EMAIL,
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
    from: TRANSFER_EMAIL,
    // cc: "office@getprospa.com",
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
    from: TRANSFER_EMAIL,
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

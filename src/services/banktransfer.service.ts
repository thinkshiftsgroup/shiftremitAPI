import prisma from "@config/db";
import { BankTransfer, User } from "@prisma/client";
import { sendEmail } from "@utils/email";
const ADMIN_EMAIL = "thinkshifts@gmail.com";
const MARKUP_PER_GBP = 30;

interface BankTransferInput {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  recipientBankName: string;
  recipientAccountNumber: string;
  recipientFullName: string;
  recipientEmail: string;
  purpose: string;
  isRecipientBusinessAccount: boolean;
  userId: string;
}

const generateTransferReference = (): string => {
  const min = 1000000000;
  const max = 9999999999;
  const uniqueNum = Math.floor(Math.random() * (max - min + 1)) + min;
  return `SR${uniqueNum}`;
};

const getLatestRates = async () => {
  const rate = await prisma.ratesData.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      benchmarkGBP: true,
      rateNGN: true,
    },
  });
  if (!rate) {
    throw new Error(
      "Exchange rate data is unavailable. Cannot proceed with transfer."
    );
  }
  return rate;
};

const generateAdminEmailHtml = (
  transfer: BankTransfer,
  user: { fullName: string; email: string },
  ngnEquivalent: number,
  rateUsed: number
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
      <h2 style="color: #1a4d9f;">ShiftRemit &mdash; Customer Transfer Confirmation (Ref: ${
        transfer.transferReference
      })</h2>
      
      <p>Dear Prospa Team,</p>
      <p>Kindly confirm and process the following transfer instruction within <strong>5 minutes</strong> of receipt:</p>
      
      <div style="border: 1px dashed #ccc; padding: 15px; margin-bottom: 20px;">
        <p><strong>Reference:</strong> ${transfer.transferReference}</p>
        <p><strong>Amount Received in GBP:</strong> &pound;${transfer.amount.toFixed(
          2
        )}</p>
        <p><strong>Exchange Rate Used:</strong> &pound;1 = &#8358;${rateUsed.toFixed(
          2
        )}</p>
        <p><strong>Equivalent Amount in NGN:</strong> &#8358;${ngnEquivalent.toLocaleString(
          "en-NG",
          { maximumFractionDigits: 2 }
        )}</p>
        <p style="font-size: 12px;">(Please double-check the equivalent before disbursement.)</p>
      </div>
      
      <p><strong>Sender Information:</strong></p>
      <p>Account Holder: ${user.fullName}</p>
      <p>Sender Email: ${user.email}</p>
      
      <p><strong>Recipient Bank Account:</strong></p>
      <p>Bank Name: ${transfer.recipientBankName}</p>
      <p>Account Number: ${transfer.recipientAccountNumber}</p>
      <p>Account Name: ${transfer.recipientFullName}</p>
      <p>Recipient Email: ${transfer.recipientEmail}</p>
      <p>Purpose: ${transfer.purpose}</p>
      <p>Business Account: ${
        transfer.isRecipientBusinessAccount ? "Yes" : "No"
      }</p>
      
      <hr style="margin: 20px 0;">
      
      <p><strong>Instruction:</strong></p>
      <p>Retain our markup of <strong>&#8358;${MARKUP_PER_GBP} per &pound;</strong></p>
      <p>Please send INSTANT confirmation once the Naira transfer has been successfully completed.</p>
      
      <br>
      <p>Thank you,</p>
      <p><strong>ShiftRemit Operations Team</strong></p>
      <p><a href="mailto:support@shiftremit.com">support@shiftremit.com</a></p>
      <p><a href="https://www.shiftremit.com">www.shiftremit.com</a></p>
    </div>
  `;
};

export const createBankTransfer = async (
  input: BankTransferInput
): Promise<{ accountDetails: any; transferReference: string }> => {
  let transferReference: string;
  let isUnique = false;

  do {
    transferReference = generateTransferReference();
    const existing = await prisma.bankTransfer.findUnique({
      where: { transferReference },
    });
    isUnique = !existing;
  } while (!isUnique);

  const rates = await getLatestRates();
  const rateUsed = rates.rateNGN;
  const ngnEquivalent = input.amount * rateUsed;

  const newTransfer = await prisma.bankTransfer.create({
    data: {
      userId: input.userId,
      amount: input.amount,
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
      recipientBankName: input.recipientBankName,
      recipientAccountNumber: input.recipientAccountNumber,
      recipientFullName: input.recipientFullName,
      recipientEmail: input.recipientEmail,
      purpose: input.purpose,
      isRecipientBusinessAccount: input.isRecipientBusinessAccount,
      transferReference: transferReference,
      status: "PENDING",
    },
  });

  const [user, accountDetails] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.userId },
      select: { fullName: true, email: true },
    }),
    prisma.accountData.findFirst({}),
  ]);

  if (!user || !accountDetails) {
    console.error("User or AccountData not found. Cannot send admin email.");
  } else {
    const htmlBody = generateAdminEmailHtml(
      newTransfer,
      user as { fullName: string; email: string },
      ngnEquivalent,
      rateUsed
    );

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `ACTION REQUIRED: New Transfer Instruction (Ref: ${transferReference})`,
      htmlBody: htmlBody,
    });
  }

  return { accountDetails, transferReference };
};

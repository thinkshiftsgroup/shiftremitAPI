import prisma from "@config/db";
import { BankTransfer } from "@prisma/client";
import { sendTransferEmail } from "@utils/email";
import { generateTransferReference, getLatestRates } from "@utils/helpers";
const ADMIN_EMAIL = "thinkshifts@gmail.com";

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

const generateAdminEmailHtml = (
  transfer: BankTransfer,
  user: { fullName: string; email: string },
  ngnEquivalent: number,
  effectiveRate: number,
  benchmarkNgnRate: number,
  markup: number
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
        <p><strong>Benchmark NGN Rate:</strong> &#8358;${benchmarkNgnRate.toFixed(
          2
        )}</p>
        <p><strong>Customer Rate Used:</strong> &pound;1 = &#8358;${effectiveRate.toFixed(
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
      <p>Retain our markup of <strong>&#8358;${markup.toFixed(
        2
      )} per &pound;</strong></p>
      <p>Please send INSTANT confirmation once the Naira transfer has been successfully completed.</p>
      
      <br>
      <p>Thank yourself,</p>
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
  const benchmarkNgnRate = rates.rateNGN;
  const markup = rates.benchmarkGBP;
  const effectiveRate = benchmarkNgnRate - markup;
  const ngnEquivalent = input.amount * effectiveRate;

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
      effectiveRate,
      benchmarkNgnRate,
      markup
    );

    await sendTransferEmail({
      to: ADMIN_EMAIL,
      subject: `ACTION REQUIRED: New Transfer Instruction (Ref: ${transferReference})`,
      htmlBody: htmlBody,
    });
  }

  return { accountDetails, transferReference };
};

export const fetchUserTransfers = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;
  return prisma.bankTransfer.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
    skip: skip,
    take: limit,
  });
};

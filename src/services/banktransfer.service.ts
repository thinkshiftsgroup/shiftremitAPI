import prisma from "@config/db";
import { BankTransfer } from "@prisma/client";
import { sendTransferEmail } from "@utils/email";
import { generateTransferReference, getLatestRates } from "@utils/helpers";
import {
  generateEmailFooter,
  generateEmailHeader,
} from "./admin/admin.transfers.service";
const ADMIN_EMAIL = "finance@shiftremit.com";

interface BankTransferInput {
  amount: number;
  convertedNGNAmount?: number;
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
  const headerHtml = generateEmailHeader();
  const footerHtml = generateEmailFooter();

  return `
    <div style="background-color: #f3f4f6; padding: 20px; min-height: 100vh;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; color: #1f2937; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <div style="padding: 0 24px; border-bottom: 1px solid #e5e7eb;">
          ${headerHtml}
        </div>
        
        <div style="padding: 24px 24px 0 24px;">
            <h2 style="color: #1a4d9f; font-size: 20px; margin-bottom: 20px;">
                NEW Transfer Confirmation (Ref: ${transfer.transferReference})
            </h2>

            <p style="margin-top: 0;">Dear Prospa Team,</p>
            <p>Kindly confirm and process the following transfer instruction within <strong>5 minutes</strong> of receipt:</p>
            
            <div style="border: 1px dashed #ccc; padding: 15px; margin-bottom: 20px; background-color: #fffbf5;">
              <h3 style="margin-top: 0; color: #813FD6; font-size: 16px;">Transfer Summary</h3>
              <p style="margin: 4px 0;"><strong>Reference:</strong> ${
                transfer.transferReference
              }</p>
              <p style="margin: 4px 0;"><strong>Amount Received in ${
                transfer.fromCurrency
              }:</strong> ${
    transfer.fromCurrency === "GBP" ? "&pound;" : ""
  }${transfer.amount.toFixed(2)}</p>
              
              <p style="margin: 8px 0 4px 0;"><strong>Exchange Rate Used:</strong> 1 &pound; = &#8358;${effectiveRate.toFixed(
                2
              )}</p>
              <p style="margin: 4px 0 8px 0;"><strong>Equivalent Amount in NGN:</strong> &#8358;${ngnEquivalent.toLocaleString(
                "en-NG",
                { maximumFractionDigits: 2 }
              )}</p>
              <p style="font-size: 12px; margin: 0; color: #cc6600;">(Please double-check the equivalent before disbursement.)</p>
            </div>
            
            <h3 style="font-size: 16px; margin-top: 24px; margin-bottom: 8px; color: #1f2937;">Sender Information:</h3>
            <p style="margin: 4px 0;">Account Holder: ${user.fullName}</p>
            <p style="margin: 4px 0;">Sender Email: ${user.email}</p>
            
            <h3 style="font-size: 16px; margin-top: 24px; margin-bottom: 8px; color: #1f2937;">Recipient Bank Account:</h3>
            <p style="margin: 4px 0;">Bank Name: ${
              transfer.recipientBankName
            }</p>
            <p style="margin: 4px 0;">Account Number: ${
              transfer.recipientAccountNumber
            }</p>
            <p style="margin: 4px 0;">Account Name: ${
              transfer.recipientFullName
            }</p>
            <p style="margin: 4px 0;">Recipient Email: ${
              transfer.recipientEmail
            }</p>
            <p style="margin: 4px 0;">Purpose: ${transfer.purpose}</p>
            <p style="margin: 4px 0;">Business Account: <strong>${
              transfer.isRecipientBusinessAccount ? "Yes" : "No"
            }</strong></p>
            
            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
            
            <h3 style="font-size: 16px; margin-top: 0; margin-bottom: 8px; color: #1f2937;">Processing Instruction:</h3>
            <p style="margin: 4px 0;">Retain our markup of <strong>&#8358;${markup.toFixed(
              2
            )} per &pound;</strong> (Benchmark Rate: &#8358;${benchmarkNgnRate.toFixed(
    2
  )})</p>
            <p style="margin: 4px 0;">Please send INSTANT confirmation once the Naira transfer has been successfully completed.</p>
            
            <br>
            <p style="margin: 0;">Thank you,</p>
            <p style="margin: 0;"><strong>ShiftRemit Operations Team</strong></p>
        </div>

        <div style="padding: 0 24px 24px 24px;">
            ${footerHtml}
        </div>
      </div>
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
  const ngnEquivalent =
    input.convertedNGNAmount || input.amount * effectiveRate;

  const newTransfer = await prisma.bankTransfer.create({
    data: {
      userId: input.userId,
      amount: input.amount,
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
      convertedNGNAmount: input.convertedNGNAmount || ngnEquivalent,
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

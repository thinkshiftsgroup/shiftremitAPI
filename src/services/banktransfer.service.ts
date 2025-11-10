import prisma from "@config/db";
import { BankTransfer, TransferStatus } from "@prisma/client";
import { sendAdminEmail } from "@utils/email";
import { generateTransferReference, getLatestRates } from "@utils/helpers";
import {
  generateEmailFooter,
  generateEmailHeader,
} from "./admin/admin.transfers.service";
const ADMIN_EMAIL = "finance@shiftremit.com";
import { FilterOptions, UserKpis } from "src/types/Transfers";

interface BankTransferInput {
  amount: number;
  convertedNGNAmount?: number;
  fromCurrency: string;
  toCurrency: string;
  recipientBankName: string;
  recipientAccountNumber: string;
  recipientFullName: string;
  recipientEmail: string;
  userReference?: string;
  conversionRate?: string;
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
  const BRAND_COLOR = "#813FD6";
  return `
    <div style="background-color: #f3f4f6; padding: 20px; min-height: 100vh;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; color: #1f2937; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <div style="padding: 0 24px; border-bottom: 1px solid #e5e7eb;">
          ${headerHtml}
        </div>
        
        <div style="padding: 24px 24px 0 24px;">
            <h2 style="color: black; font-size: 20px; margin-bottom: 20px;">
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
            <p style="margin: 4px 0; ">Sender Email: ${user.email}</p>
            
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

const generateNgnToGbpAdminEmailHtml = (
  transfer: BankTransfer,
  user: { fullName: string; email: string },
  gbpEquivalent: number,
  effectiveRate: number
): string => {
  const headerHtml = generateEmailHeader();
  const footerHtml = generateEmailFooter();
  const BRAND_COLOR = "#813FD6";
  return `
    <div style="background-color: #f3f4f6; padding: 20px; min-height: 100vh;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; color: #1f2937; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <div style="padding: 0 24px; border-bottom: 1px solid #e5e7eb;">
          ${headerHtml}
        </div>
        
        <div style="padding: 24px 24px 0 24px;">
            <h2 style="color: black; font-size: 20px; margin-bottom: 20px;">
                NEW NGN to GBP Transfer (Ref: ${transfer.transferReference})
            </h2>

            <p style="margin-top: 0;">Dear Prospa Team,</p>
            <p>Kindly confirm and initiate the following $\text{NGN} \to \text{GBP}$ transfer instruction within <strong>5 minutes</strong> of receipt:</p>
            
            <div style="border: 1px dashed #ccc; padding: 15px; margin-bottom: 20px; background-color: #f0f8ff;">
              <h3 style="margin-top: 0; color: #813FD6; font-size: 16px;">Transfer Summary</h3>
              <p style="margin: 4px 0;"><strong>Reference:</strong> ${
                transfer.transferReference
              }</p>
              <p style="margin: 4px 0;"><strong>Amount Sent in NGN:</strong> &#8358;${transfer.amount.toLocaleString(
                "en-NG",
                { maximumFractionDigits: 2 }
              )}</p>
              
              <p style="margin: 8px 0 4px 0;"><strong>Exchange Rate Used:</strong> &#8358;${effectiveRate.toFixed(
                2
              )} / &pound;1</p>
              <p style="margin: 4px 0 8px 0;"><strong>Equivalent Amount in GBP:</strong> &pound;${gbpEquivalent.toFixed(
                2
              )}</p>
              <p style="font-size: 12px; margin: 0; color: #cc6600;">(Please double-check the equivalent before disbursement.)</p>
            </div>
            
            <h3 style="font-size: 16px; margin-top: 24px; margin-bottom: 8px; color: #1f2937;">Sender Information:</h3>
            <p style="margin: 4px 0;">Account Holder: ${user.fullName}</p>
            <p style="margin: 4px 0; ">Sender Email: ${user.email}</p>
            
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

  let effectiveRate: number;
  let benchmarkNgnRate: number = 0;
  let markup: number = 0;
  let ngnEquivalent: number;

  const inputRate = input.conversionRate
    ? Number(input.conversionRate)
    : undefined;

  if (inputRate && !isNaN(inputRate)) {
    effectiveRate = inputRate;
  } else {
    const rates = await getLatestRates();
    benchmarkNgnRate = rates.rateNGN;
    markup = rates.benchmarkGBP;

    effectiveRate = benchmarkNgnRate - markup;
  }
  if (input.fromCurrency === "GBP" && input.toCurrency === "NGN") {
    ngnEquivalent = input.convertedNGNAmount || input.amount * effectiveRate;
  } else if (input.fromCurrency === "NGN" && input.toCurrency === "GBP") {
    ngnEquivalent = input.amount;
  } else {
    throw new Error("Unsupported currency pair for transfer creation.");
  }

  const convertedAmount =
    input.fromCurrency === "GBP" && input.toCurrency === "NGN"
      ? ngnEquivalent
      : input.amount;

  const newTransfer = await prisma.bankTransfer.create({
    data: {
      userId: input.userId,
      amount: input.amount,
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
      convertedNGNAmount: convertedAmount,
      recipientBankName: input.recipientBankName,
      recipientAccountNumber: input.recipientAccountNumber,
      recipientFullName: input.recipientFullName,
      recipientEmail: input.recipientEmail,
      userReference: input.userReference,
      purpose: input.purpose,
      isRecipientBusinessAccount: input.isRecipientBusinessAccount,
      transferReference: transferReference,
      status: "PENDING",
      conversionRate: effectiveRate,
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
    let subject: string;
    let htmlBody: string;

    if (input.fromCurrency === "GBP" && input.toCurrency === "NGN") {
      subject = `ACTION REQUIRED: New GBP to NGN Transfer (Ref: ${transferReference})`;
      htmlBody = generateAdminEmailHtml(
        newTransfer,
        user as { fullName: string; email: string },
        ngnEquivalent,
        effectiveRate,
        benchmarkNgnRate,
        markup
      );
    } else if (input.fromCurrency === "NGN" && input.toCurrency === "GBP") {
      subject = `ACTION REQUIRED: New NGN to GBP Transfer (Ref: ${transferReference})`;
      const gbpEquivalent = input.amount / effectiveRate;
      htmlBody = generateNgnToGbpAdminEmailHtml(
        newTransfer,
        user as { fullName: string; email: string },
        gbpEquivalent,
        effectiveRate
      );
    } else {
      subject = `ACTION REQUIRED: New Transfer (Ref: ${transferReference}) - Unknown Currency Pair`;
      htmlBody = `<p>Transfer created with reference ${transferReference} but currency pair ${input.fromCurrency}/${input.toCurrency} is unsupported for email generation.</p>`;
    }

    await sendAdminEmail({
      to: ADMIN_EMAIL,
      subject: subject,
      htmlBody: htmlBody,
    });
  }

  return { accountDetails, transferReference };
};

export const fetchUserTransfers = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  filters: Partial<FilterOptions> = {}
) => {
  const {
    startDate,
    endDate,
    transactionReference,
    currency,
    status,
    recipientName,
    minAmount,
    maxAmount,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;
  const skip = (page - 1) * limit;

  const where: any = { userId };

  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }

  if (endDate) {
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
    where.createdAt = { ...where.createdAt, lt: adjustedEndDate };
  }

  if (transactionReference) {
    where.transferReference = transactionReference;
  }

  if (currency === "GBP") {
    where.fromCurrency = "GBP";
  } else if (currency === "NGN") {
    where.toCurrency = "NGN";
  }

  if (status) {
    where.status = status;
  }

  if (recipientName) {
    where.recipientFullName = { contains: recipientName, mode: "insensitive" };
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    where.amount = {};
    if (minAmount !== undefined) {
      where.amount.gte = minAmount;
    }
    if (maxAmount !== undefined) {
      where.amount.lte = maxAmount;
    }
  }

  const allUserTransfers = await prisma.bankTransfer.findMany({
    where: { userId },
    select: {
      status: true,
      amount: true,
      createdAt: true,
    },
  });

  const kpis: UserKpis = allUserTransfers.reduce(
    (acc, transfer) => {
      acc.totalTransfers += 1;
      acc.totalAmountSentGBP += transfer.amount;

      if (
        transfer.status === TransferStatus.PENDING ||
        transfer.status === TransferStatus.PROCESSING
      ) {
        acc.totalPending += 1;
        acc.totalAmountPendingGBP += transfer.amount;
      } else if (transfer.status === TransferStatus.COMPLETED) {
        acc.totalCompleted += 1;
        acc.totalAmountCompletedGBP += transfer.amount;
      } else if (
        transfer.status === TransferStatus.FAILED ||
        transfer.status === TransferStatus.REJECTED ||
        transfer.status === TransferStatus.CANCELED
      ) {
        acc.totalFailed += 1;
      }

      if (!acc.lastTransferDate || transfer.createdAt > acc.lastTransferDate) {
        acc.lastTransferDate = transfer.createdAt;
      }

      return acc;
    },
    {
      totalTransfers: 0,
      totalCompleted: 0,
      totalPending: 0,
      totalFailed: 0,
      totalAmountSentGBP: 0,
      totalAmountPendingGBP: 0,
      totalAmountCompletedGBP: 0,
      lastTransferDate: null,
    } as UserKpis
  );

  const [transfers, totalFilteredTransfers] = await prisma.$transaction([
    prisma.bankTransfer.findMany({
      where: where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: skip,
      take: limit,
    }),
    prisma.bankTransfer.count({
      where: where,
    }),
  ]);

  return { transfers, totalFilteredTransfers, kpis };
};

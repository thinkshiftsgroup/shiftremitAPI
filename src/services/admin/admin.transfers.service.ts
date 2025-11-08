import prisma from "@config/db";
import { TransferStatus, BankTransfer } from "@prisma/client";
import { sendTransferEmail } from "@utils/email";
import { getLatestRates } from "@utils/helpers";

const generateSenderConfirmationEmailHtml = (
  transfer: BankTransfer,
  ngnEquivalent: number
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #00AA44; padding: 20px;">
      <h2 style="color: #00AA44;">Transfer Successful! 🎉</h2>
      
      <p>Hello ${transfer.recipientFullName},</p>
      <p>Your transfer instruction with reference <strong>${
        transfer.transferReference
      }</strong> has been successfully processed and the funds have been sent to the recipient.</p>
      
      <div style="background-color: #f0f0f0; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
        <p><strong>Recipient Bank Name:</strong> ${
          transfer.recipientBankName
        }</p>
        <p><strong>Recipient Account:</strong> ${
          transfer.recipientAccountNumber
        }</p>
        <p><strong>Amount Credited (NGN):</strong> &#8358;${ngnEquivalent.toLocaleString(
          "en-NG",
          { maximumFractionDigits: 2 }
        )}</p>
      </div>
      
      <p>Thank you for choosing ShiftRemit.</p>
    </div>
  `;
};

const generateRecipientNotificationEmailHtml = (
  transfer: BankTransfer,
  senderName: string,
  ngnEquivalent: number
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #1a4d9f; padding: 20px;">
      <h2 style="color: #1a4d9f;">You've Got Money! 💰</h2>
      
      <p>Hello ${transfer.recipientFullName},</p>
      <p>You have received a bank transfer from <strong>${senderName}</strong> (via ShiftRemit).</p>
      
      <div style="background-color: #e6f0ff; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
        <p><strong>Amount Received:</strong> &#8358;${ngnEquivalent.toLocaleString(
          "en-NG",
          { maximumFractionDigits: 2 }
        )}</p>
        <p><strong>Sender Reference:</strong> ${transfer.transferReference}</p>
        <p><strong>Purpose:</strong> ${transfer.purpose}</p>
      </div>
      
      <p>The funds should reflect in your account shortly.</p>
      <p>Best regards,</p>
      <p>ShiftRemit Team</p>
    </div>
  `;
};

export const fetchAllTransfers = async (
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;
  return prisma.bankTransfer.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          username: true,
          fullName: true,
          email: true,
          profilePhotoUrl: true,
        },
      },
    },
    skip: skip,
    take: limit,
  });
};

interface DashboardData {
  transfers: (BankTransfer & {
    user: {
      username: string;
      fullName: string;
      email: string;
      profilePhotoUrl: string | null;
    };
  })[];
  kpis: {
    totalTransactions: number;
    totalCompleted: number;
    totalAbandoned: number;
    totalPending: number;
    totalFailed: number;
    totalRejected: number;
    totalCanceled: number;
    totalProcessing: number;
  };
  totals: {
    totalAmountGBP: number;
    totalAmountNGN: number;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

interface FilterOptions {
  startDate?: string;
  endDate?: string;
  transactionReference?: string;
  currency?: "GBP" | "NGN";
  status?: TransferStatus;
}

export const fetchDashboardData = async (
  page: number = 1,
  limit: number = 10,
  filters: FilterOptions = {}
): Promise<DashboardData> => {
  const { startDate, endDate, transactionReference, currency, status } =
    filters;
  const skip = (page - 1) * limit;

  const where: any = {};

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
  // NEW: Add status filter to the where clause
  if (status) {
    where.status = status;
  }

  const allMatchingTransfers = await prisma.bankTransfer.findMany({
    where: where,
    select: {
      status: true,
      amount: true,
      convertedNGNAmount: true,
    },
  });

  const kpis = allMatchingTransfers.reduce(
    (acc, transfer) => {
      acc.totalTransactions += 1;

      switch (transfer.status) {
        case TransferStatus.COMPLETED:
          acc.totalCompleted += 1;
          break;
        case TransferStatus.ABANDONED:
          acc.totalAbandoned += 1;
          break;
        case TransferStatus.PENDING:
          acc.totalPending += 1;
          break;
        case TransferStatus.REJECTED:
          acc.totalRejected += 1; // FIX: Corrected the typo/logic from original to match enum name
          break;
        case TransferStatus.FAILED:
          acc.totalFailed += 1;
          break;
        case TransferStatus.CANCELED:
          acc.totalCanceled += 1;
          break;
        case TransferStatus.PROCESSING:
          acc.totalProcessing += 1;
          break;
      }

      return acc;
    },
    {
      totalTransactions: 0,
      totalCompleted: 0,
      totalAbandoned: 0,
      totalPending: 0,
      totalFailed: 0,
      totalRejected: 0,
      totalCanceled: 0,
      totalProcessing: 0,
    }
  );

  const totals = allMatchingTransfers.reduce(
    (acc, transfer) => {
      acc.totalAmountGBP += transfer.amount;

      acc.totalAmountNGN += transfer.convertedNGNAmount || 0;

      return acc;
    },
    {
      totalAmountGBP: 0,
      totalAmountNGN: 0,
    }
  );

  const totalItems = kpis.totalTransactions;
  const totalPages = Math.ceil(totalItems / limit);

  const transfers = await prisma.bankTransfer.findMany({
    where: where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          username: true,
          fullName: true,
          email: true,
          profilePhotoUrl: true,
        },
      },
    },
    skip: skip,
    take: limit,
  });

  return {
    transfers,
    kpis,
    totals,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
    },
  };
};
export const updateTransferStatus = async (
  transferId: string,
  newStatus: TransferStatus
) => {
  const transfer = await prisma.bankTransfer.findUnique({
    where: { id: transferId },
    include: {
      user: {
        select: {
          email: true,
          fullName: true,
        },
      },
    },
  });

  if (!transfer) {
    throw new Error(`Transfer with ID ${transferId} not found.`);
  }

  const updatedTransfer = await prisma.bankTransfer.update({
    where: { id: transferId },
    data: { status: newStatus },
  });

  if (newStatus === "COMPLETED" && transfer.status !== "COMPLETED") {
    const rates = await getLatestRates();
    const benchmarkNgnRate = rates.rateNGN;
    const markup = rates.benchmarkGBP;
    const effectiveRate = benchmarkNgnRate - markup;
    const ngnEquivalent = transfer.amount * effectiveRate;

    if (transfer.user) {
      const senderHtml = generateSenderConfirmationEmailHtml(
        updatedTransfer,
        ngnEquivalent
      );
      await sendTransferEmail({
        to: transfer.user.email,
        subject: `Success! Your Transfer SR${updatedTransfer.transferReference.slice(
          2
        )} is Complete`,
        htmlBody: senderHtml,
      });

      const recipientHtml = generateRecipientNotificationEmailHtml(
        updatedTransfer,
        transfer.user.fullName,
        ngnEquivalent
      );
      await sendTransferEmail({
        to: updatedTransfer.recipientEmail,
        subject: `Funds Received: You have a transfer from ${transfer.user.fullName}`,
        htmlBody: recipientHtml,
      });
    }
  }

  return updatedTransfer;
};

export const deleteAllTransfers = async () => {
  const result = await prisma.bankTransfer.deleteMany({});
  return result;
};

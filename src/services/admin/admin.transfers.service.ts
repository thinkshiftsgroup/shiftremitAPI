import prisma from "@config/db";
import { TransferStatus, BankTransfer } from "@prisma/client";
import { sendTransferEmail } from "@utils/email";
import { getLatestRates } from "@utils/helpers";
import {
  SortOrder,
  TransferWithPdf,
  DashboardData,
  FilterOptions,
} from "src/types/Transfers";
export const generateEmailHeader = (): string => {
  const logoUrl =
    "https://shiftremit.com/_next/image?url=%2Fimages%2Fshiftremit-logo.png&w=128&q=75";

  return `
    <div style="padding: 20px 0;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <a href="YOUR_WEBSITE_URL" target="_blank" style="text-decoration: none;">
          <img
            src="${logoUrl}"
            alt="ShiftRemit Logo"
            width="40"
            height="40"
            style="width: 40px; height: 40px; object-fit: cover; cursor: pointer; border: 0;"
          />
        </a>
        <div>
          <h1 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0; line-height: 1.2;">
            Shift<span style="color: #813FD6;">Remit</span>
          </h1>
          <p style="font-size: 12px; font-weight: normal; color: #4b5563; margin: 0; line-height: 1.2;">
            Unbeatable Transfer Rates
          </p>
        </div>
      </div>
    </div>
  `;
};

export const generateEmailFooter = (): string => {
  const BRAND_COLOR = "#813FD6";
  const TEXT_COLOR = "#6b7280";
  return `
    <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px; color: ${TEXT_COLOR}; font-size: 12px; font-family: sans-serif;">
      
      <div style="margin-bottom: 8px;">
        <a href="mailto:support@shiftremit.com" target="_blank" style="color: ${BRAND_COLOR}; text-decoration: none; font-size: 14px; display: inline-flex; align-items: center; font-family: sans-serif;">
          <img
            src="https://res.cloudinary.com/dqny2b4gb/image/upload/v1762790487/mage--email_npabw0.png"
            alt="Email Icon"
            width="16"
            height="16"
            style="width: 16px; height: 16px; object-fit: contain; margin-right: 5px; vertical-align: middle; border: 0;"
          />
          support@shiftremit.com
        </a>
      </div>
      
      <div style="margin-bottom: 16px;">
        <a href="YOUR_WEBSITE_URL" target="_blank" style="color: ${BRAND_COLOR}; text-decoration: none; font-size: 14px; display: inline-flex; align-items: center; font-family: sans-serif;">
          <img
            src="https://res.cloudinary.com/dqny2b4gb/image/upload/v1762790487/streamline-plump--web_hkel9o.png"
            alt="Website Icon"
            width="16"
            height="16"
            style="width: 16px; height: 16px; object-fit: contain; margin-right: 5px; vertical-align: middle; border: 0;"
          />
          www.shiftremit.com
        </a>
      </div>

      <p style="margin: 0 0 4px 0;">©2025 ShiftRemit. All Rights Reserved.</p>
   
    </div>
  `;
};

const generateSenderConfirmationEmailHtml = (
  transfer: BankTransfer,
  ngnEquivalent: number
): string => {
  const headerHtml = generateEmailHeader();
  const footerHtml = generateEmailFooter();

  const rate = ngnEquivalent / transfer.amount;

  return `
    <div style="background-color: #f3f4f6; padding: 20px; min-height: 100vh;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; color: #1f2937; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <div style="padding: 0 24px; border-bottom: 1px solid #e5e7eb;">
          ${headerHtml}
        </div>
        
        <div style="padding: 24px 24px 0 24px;">
          <p style="color: #374151; font-size: 16px; margin-top: 8px;">Dear ${
            transfer.recipientFullName
          },</p>
          <p style="color: #4b5563; font-size: 16px; margin-top: 16px;">
            This is to confirm that the transfer instruction with 
            <strong style="font-weight: 600;">Reference: ${
              transfer.transferReference
            }</strong> has been 
            <strong style="font-weight: 700; color: #10b981;">successfully processed</strong> 
            and disbursed to the recipient.
          </p>
        </div>

        <div style="padding: 24px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 16px;">
            Transfer Overview
          </h2>
          
          <div style="background-color: #f7f3ff; padding: 16px; margin-bottom: 32px; border-radius: 6px;">
            <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Transfer Reference:</strong> ${
              transfer.transferReference
            }</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Amount Sent (${
              transfer.fromCurrency
            }):</strong> ${
    transfer.fromCurrency === "GBP" ? "£" : ""
  }${transfer.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Equivalent Amount (NGN):</strong> &#8358;${ngnEquivalent.toLocaleString(
              "en-NG",
              { maximumFractionDigits: 2 }
            )}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Exchange Rate Used:</strong> 1 ${
              transfer.fromCurrency
            } = &#8358;${rate.toLocaleString("en-NG", {
    maximumFractionDigits: 2,
  })}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Recipient:</strong> ${
              transfer.recipientFullName
            } </p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Recipient Account:</strong>
            ${transfer.recipientBankName} (${
    transfer.recipientAccountNumber
  })</p>
            <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Processed Date:</strong> ${new Date()
              .toISOString()
              .slice(0, 19)
              .replace("T", " ")}</p>
          </div>

          <p style="color: #4b5563; font-size: 14px; margin-bottom: 4px;">Thank you,</p>
          <p style="color: #4b5563; font-weight: 600; font-size: 14px; margin-top: 0;">
            ShiftRemit Operations Team
          </p>

          ${footerHtml}
        </div>
      </div>
    </div>
  `;
};

const generateRecipientNotificationEmailHtml = (
  transfer: BankTransfer,
  senderName: string,
  ngnEquivalent: number
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
          <p style="color: #374151; font-size: 16px; margin-top: 8px;">Hello ${
            transfer.recipientFullName
          },</p>
          <p style="color: #4b5563; font-size: 16px; margin-top: 16px;">
            You have received a bank transfer from <strong>${senderName}</strong> (via ShiftRemit). The funds should reflect in your account shortly.
          </p>
        </div>
        
        <div style="padding: 24px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 16px;">
            Transfer Details
          </h2>
          
          <div style="background-color: #e8f0ff; padding: 16px; margin-bottom: 32px; border-radius: 6px;">
            <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Amount Received:</strong> &#8358;${ngnEquivalent.toLocaleString(
              "en-NG",
              { maximumFractionDigits: 2 }
            )}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Recipient Bank:</strong> ${
              transfer.recipientBankName
            }</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Transfer Reference:</strong> ${
              transfer.transferReference
            }</p>
            <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Purpose:</strong> ${
              transfer.purpose || "Money transfer"
            }</p>
          </div>
          
          <p style="color: #4b5563; font-size: 14px; margin-bottom: 4px;">Best regards,</p>
          <p style="color: #4b5563; font-weight: 600; font-size: 14px; margin-top: 0;">
            ShiftRemit Team
          </p>

          ${footerHtml}
        </div>
      </div>
    </div>
  `;
};

type TransferSelect = {
  status: TransferStatus;
  amount: number;
  convertedNGNAmount: number | null;
};

type KpiAccumulator = {
  totalTransactions: number;
  totalCompleted: number;
  totalAbandoned: number;
  totalPending: number;
  totalFailed: number;
  totalRejected: number;
  totalCanceled: number;
  totalProcessing: number;
};

type TotalsAccumulator = {
  totalAmountGBP: number;
  totalAmountNGN: number;
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
export const fetchUserTransfers = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  status?: string,
  sortByAmount?: "asc" | "desc"
) => {
  const skip = (page - 1) * limit;

  let orderBy: Record<string, "asc" | "desc">;
  if (sortByAmount) {
    orderBy = { amount: sortByAmount };
  } else {
    orderBy = { createdAt: "desc" };
  }

  const where: any = {
    userId: userId,
  };

  if (status) {
    where.status = status as TransferStatus;
  }

  const [transfers, totalCount] = await prisma.$transaction([
    prisma.bankTransfer.findMany({
      where: where,
      orderBy: orderBy,
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
    }),
    prisma.bankTransfer.count({
      where: where,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    message: "Transfers fetched successfully",
    data: transfers,
    meta: {
      totalCount: totalCount,
      totalPages: totalPages,
      currentPage: page,
      limit: limit,
      status: status,
      sortByAmount: sortByAmount,
    },
  };
};

export const fetchDashboardData = async (
  page: number = 1,
  limit: number = 10,
  filters: FilterOptions = {}
): Promise<DashboardData> => {
  const {
    startDate,
    endDate,
    transactionReference,
    currency,
    status,
    recipientName,
    senderName,
    minAmount,
    maxAmount,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;
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
  if (status) {
    where.status = status;
  }

  if (recipientName) {
    where.recipientFullName = { contains: recipientName, mode: "insensitive" };
  }

  if (senderName) {
    where.user = { fullName: { contains: senderName, mode: "insensitive" } };
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

  const [
    allMatchingTransfers,
    totalSentGBPResult,
    totalReceivedGBPResult,
    totalSentNGNResult,
    totalReceivedNGNResult,
    totalPendingSentAmountGBPResult,
    totalPendingSentAmountNGNResult,
  ] = await prisma.$transaction([
    prisma.bankTransfer.findMany({
      where: where,
      select: {
        status: true,
        amount: true,
        convertedNGNAmount: true,
      } as const,
    }),
    prisma.bankTransfer.aggregate({
      _sum: { amount: true },
      where: {
        ...where,
        fromCurrency: "GBP",
        status: { not: "CANCELED" },
      },
    }),
    prisma.bankTransfer.aggregate({
      _sum: { convertedGBPAmount: true },
      where: {
        ...where,
        toCurrency: "GBP",
        status: { in: ["COMPLETED", "PROCESSING"] },
      },
    }),
    prisma.bankTransfer.aggregate({
      _sum: { amount: true },
      where: {
        ...where,
        fromCurrency: "NGN",
        status: { not: "CANCELED" },
      },
    }),
    prisma.bankTransfer.aggregate({
      _sum: { convertedNGNAmount: true },
      where: {
        ...where,
        toCurrency: "NGN",
        status: { in: ["COMPLETED", "PROCESSING"] },
      },
    }),
    prisma.bankTransfer.aggregate({
      _sum: { amount: true },
      where: {
        ...where,
        fromCurrency: "GBP",
        status: "PENDING",
      },
    }),
    prisma.bankTransfer.aggregate({
      _sum: { amount: true },
      where: {
        ...where,
        fromCurrency: "NGN",
        status: "PENDING",
      },
    }),
  ]);

  const totalSentGBP = totalSentGBPResult._sum.amount ?? 0;
  const totalReceivedGBP = totalReceivedGBPResult._sum.convertedGBPAmount ?? 0;
  const totalSentNGN = totalSentNGNResult._sum.amount ?? 0;
  const totalReceivedNGN = totalReceivedNGNResult._sum.convertedNGNAmount ?? 0;
  const totalPendingSentAmountGBP =
    totalPendingSentAmountGBPResult._sum.amount ?? 0;
  const totalPendingSentAmountNGN =
    totalPendingSentAmountNGNResult._sum.amount ?? 0;

  const detailedTotals = {
    totalSentGBP: parseFloat(totalSentGBP.toFixed(2)),
    totalReceivedGBP: parseFloat(totalReceivedGBP.toFixed(2)),
    totalSentNGN: parseFloat(totalSentNGN.toFixed(2)),
    totalReceivedNGN: parseFloat(totalReceivedNGN.toFixed(2)),
    totalPendingSentAmountGBP: parseFloat(totalPendingSentAmountGBP.toFixed(2)),
    totalPendingSentAmountNGN: parseFloat(totalPendingSentAmountNGN.toFixed(2)),
  };

  const kpis: KpiAccumulator = (
    allMatchingTransfers as TransferSelect[]
  ).reduce(
    (acc: KpiAccumulator, transfer: TransferSelect) => {
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
          acc.totalRejected += 1;
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

  const totals: TotalsAccumulator = (
    allMatchingTransfers as TransferSelect[]
  ).reduce(
    (acc: TotalsAccumulator, transfer: TransferSelect) => {
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

  const rawTransfers = await prisma.bankTransfer.findMany({
    where: where,
    orderBy: {
      [sortBy]: sortOrder,
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

  const transfers = rawTransfers.map((transfer) => ({
    ...transfer,
    pdfFile: (transfer as any).pdfFile || "",
  })) as TransferWithPdf[];

  return {
    transfers,
    kpis,
    totals: {
      ...totals,
      ...detailedTotals,
    },
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
export const deleteAllTransfersExcept = async (
  referenceToKeep: string = "SR149037"
) => {
  const result = await prisma.bankTransfer.deleteMany({
    where: {
      transferReference: {
        not: referenceToKeep,
      },
    },
  });
  return result;
};
export const deleteSingleTransfer = async (transferId: string) => {
  const deletedTransfer = await prisma.bankTransfer.delete({
    where: {
      id: transferId,
    },
  });
  return deletedTransfer;
};

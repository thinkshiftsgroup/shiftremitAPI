import prisma from "@config/db";

interface AdminDashboardData {
  totalSentGBP: number;
  totalReceivedGBP: number;
  totalSentNGN: number;
  totalReceivedNGN: number;
  totalPendingSentAmountGBP: number;
  totalPendingSentAmountNGN: number;
}

export const getAdminDashboardData = async (): Promise<AdminDashboardData> => {
  const [
    totalSentGBPResult,
    totalReceivedGBPResult,
    totalSentNGNResult,
    totalReceivedNGNResult,
    totalPendingSentAmountGBPResult,
    totalPendingSentAmountNGNResult,
  ] = await prisma.$transaction([
    prisma.bankTransfer.aggregate({
      _sum: { amount: true },
      where: {
        fromCurrency: "GBP",
        status: { not: "CANCELED" },
      },
    }),

    prisma.bankTransfer.aggregate({
      _sum: { convertedGBPAmount: true },
      where: {
        toCurrency: "GBP",
        status: { in: ["COMPLETED", "PROCESSING"] },
      },
    }),

    prisma.bankTransfer.aggregate({
      _sum: { amount: true },
      where: {
        fromCurrency: "NGN",
        status: { not: "CANCELED" },
      },
    }),

    prisma.bankTransfer.aggregate({
      _sum: { convertedNGNAmount: true },
      where: {
        toCurrency: "NGN",
        status: { in: ["COMPLETED", "PROCESSING"] },
      },
    }),

    prisma.bankTransfer.aggregate({
      _sum: { amount: true },
      where: {
        fromCurrency: "GBP",
        status: "PENDING",
      },
    }),

    prisma.bankTransfer.aggregate({
      _sum: { amount: true },
      where: {
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

  return {
    totalSentGBP: parseFloat(totalSentGBP.toFixed(2)),
    totalReceivedGBP: parseFloat(totalReceivedGBP.toFixed(2)),
    totalSentNGN: parseFloat(totalSentNGN.toFixed(2)),
    totalReceivedNGN: parseFloat(totalReceivedNGN.toFixed(2)),
    totalPendingSentAmountGBP: parseFloat(totalPendingSentAmountGBP.toFixed(2)),
    totalPendingSentAmountNGN: parseFloat(totalPendingSentAmountNGN.toFixed(2)),
  };
};

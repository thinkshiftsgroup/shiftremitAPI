import { TransferStatus, BankTransfer } from "@prisma/client";
export interface TransferWithPdf extends BankTransfer {
  pdfFile: string;
  user: {
    username: string;
    fullName: string;
    email: string;
    profilePhotoUrl: string | null;
  };
}

export interface DashboardData {
  transfers: TransferWithPdf[];
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

export type SortOrder = "asc" | "desc";

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  transactionReference?: string;
  currency?: "GBP" | "NGN";
  status?: TransferStatus;
  recipientName?: string;
  senderName?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: "createdAt" | "amount";
  sortOrder?: SortOrder;
}

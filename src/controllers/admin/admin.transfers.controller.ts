import { Request, Response } from "express";
import { TransferStatus } from "@prisma/client";
import {
  fetchDashboardData,
  updateTransferStatus,
  deleteAllTransfers,
} from "@services/admin/admin.transfers.service";
import { SortOrder, FilterOptions } from "src/types/Transfers";
const validStatuses: TransferStatus[] = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "ABANDONED",
  "REJECTED",
  "FAILED",
  "CANCELED",
];

export const getAllTransfers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const transactionReference = req.query.transactionReference as
    | string
    | undefined;

  const rawCurrency = req.query.currency as string | undefined;
  const rawStatus = req.query.status as string | undefined;
  const recipientName = req.query.recipientName as string | undefined;
  const senderName = req.query.senderName as string | undefined;
  const minAmount = req.query.minAmount
    ? parseFloat(req.query.minAmount as string)
    : undefined;
  const maxAmount = req.query.maxAmount
    ? parseFloat(req.query.maxAmount as string)
    : undefined;

  const sortBy: "createdAt" | "amount" | undefined =
    req.query.sortBy === "amount" ? "amount" : "createdAt";
  const sortOrder: SortOrder | undefined =
    req.query.sortOrder === "asc" || req.query.sortOrder === "desc"
      ? (req.query.sortOrder as SortOrder)
      : "desc";

  const currency: "GBP" | "NGN" | undefined =
    rawCurrency === "GBP" || rawCurrency === "NGN" ? rawCurrency : undefined;

  const status: TransferStatus | undefined =
    rawStatus && validStatuses.includes(rawStatus as TransferStatus)
      ? (rawStatus as TransferStatus)
      : undefined;

  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      message:
        "Invalid pagination parameters. Page must be >= 1 and Limit must be between 1 and 100.",
    });
  }

  if (
    minAmount !== undefined &&
    maxAmount !== undefined &&
    minAmount > maxAmount
  ) {
    return res.status(400).json({
      message: "Minimum amount cannot be greater than maximum amount.",
    });
  }

  const filters: FilterOptions = {
    startDate,
    endDate,
    transactionReference,
    currency,
    status,
    recipientName,
    senderName,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
  };

  try {
    const dashboardData = await fetchDashboardData(page, limit, filters);

    const { transfers, kpis, totals, pagination } = dashboardData;

    res.status(200).json({
      message: "Dashboard data and transfers retrieved successfully.",
      transfers,
      kpis,
      totals,
      meta: {
        ...pagination,
        limit,
        sortBy,
        sortOrder,
      },
    });
  } catch (error: any) {
    console.error("Error fetching all transfers:", error.message);
    res.status(500).json({
      message: "Failed to fetch dashboard data and transfers.",
      details: error.message,
    });
  }
};
export const patchTransferStatus = async (req: Request, res: Response) => {
  const { transferId } = req.params;
  const { status } = req.body;

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Invalid status provided. Must be one of: ${validStatuses.join(
        ", "
      )}`,
    });
  }

  try {
    const updatedTransfer = await updateTransferStatus(
      transferId,
      status as TransferStatus
    );

    if (!updatedTransfer) {
      return res.status(404).json({ message: "Transfer not found." });
    }

    res.status(200).json({
      message: `Transfer ${transferId} status updated to ${updatedTransfer.status}.`,
      transfer: updatedTransfer,
    });
  } catch (error: any) {
    console.error("Error updating transfer status:", error.message);
    res.status(500).json({
      message: "Failed to update transfer status.",
      details: error.message,
    });
  }
};

export const adminDeleteAllTransfers = async (req: any, res: any) => {
  try {
    const { count } = await deleteAllTransfers();
    res.status(200).json({
      message: `Successfully deleted ${count} bank transfer records.`,
      deletedCount: count,
    });
  } catch (error) {
    console.error("Error deleting all transfers:", error);
    res.status(500).json({
      error: "An error occurred while attempting to delete all transfers.",
    });
  }
};

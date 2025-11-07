import { Request, Response } from "express";
import {
  createBankTransfer,
  fetchUserTransfers,
} from "@services/banktransfer.service";

interface TransferRequestBody {
  amount: number;
  fromCurrency?: string;
  toCurrency?: string;
  recipientBankName: string;
  recipientAccountNumber: string;
  recipientFullName: string;
  recipientEmail: string;
  purpose: string;
  isRecipientBusinessAccount: boolean;
}

export const requestBankTransfer = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const {
    amount,
    fromCurrency,
    toCurrency,
    recipientBankName,
    recipientAccountNumber,
    recipientFullName,
    recipientEmail,
    purpose,
    isRecipientBusinessAccount,
  } = req.body as TransferRequestBody;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({
      message: "Invalid amount provided. Amount must be a positive number.",
    });
  }
  if (!recipientAccountNumber || !recipientFullName || !recipientBankName) {
    return res.status(400).json({
      message:
        "Missing required recipient details (bankName, accountNumber, fullName).",
    });
  }

  try {
    const { accountDetails, transferReference } = await createBankTransfer({
      userId,
      amount,
      fromCurrency: fromCurrency || "GBP",
      toCurrency: toCurrency || "NGN",
      recipientBankName,
      recipientAccountNumber,
      recipientFullName,
      recipientEmail,
      purpose,
      isRecipientBusinessAccount,
    });

    res.status(201).json({
      message:
        "Transfer instruction created successfully. Please use the details below to make your GBP payment.",
      transferReference: transferReference,
      GBP_Payment_Details: {
        GBPAccountName:
          accountDetails?.GBPAccountName || "Contact Support for GBP Details",
        GBPAccountNumber:
          accountDetails?.GBPAccountNumber || "Contact Support for GBP Details",
      },
      nextStep: `Please transfer £${amount.toFixed(
        2
      )} to the GBP Payment Details provided and use your Transfer Reference (${transferReference}) as the payment reference.`,
    });
  } catch (error: any) {
    console.error("Error creating bank transfer:", error.message);
    res.status(500).json({
      message: "Failed to process transfer request.",
      details: error.message,
    });
  }
};

export const getUserTransfers = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      message:
        "Invalid pagination parameters. Page must be >= 1 and Limit must be between 1 and 100.",
    });
  }

  try {
    const transfers = await fetchUserTransfers(userId, page, limit);
    res.status(200).json({
      message: "User transaction history retrieved successfully.",
      transfers,
      meta: {
        page,
        limit,
        totalTransfers: transfers.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user transfers:", error.message);
    res.status(500).json({
      message: "Failed to fetch user transfers.",
      details: error.message,
    });
  }
};

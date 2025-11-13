import { Request, Response, NextFunction } from "express";
import {
  fetchRecentRecipients,
  createRecipient,
  updateRecipient,
  deleteRecipient,
  getRecipientById,
} from "@services/recipient.service";

export const getRecentRecipientsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const nameFilter = req.query.name as string | undefined;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const recipients = await fetchRecentRecipients(userId, limit, nameFilter);

    res.status(200).json({
      message: "Recent recipients fetched successfully.",
      data: recipients,
    });
  } catch (error) {
    next(error);
  }
};

export const createRecipientController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const {
      recipientBankName,
      recipientAccountNumber,
      recipientFullName,
      recipientEmail,
      recipientMobileNumber,
      isRecipientBusinessAccount,
      sortCode,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!recipientBankName || !recipientAccountNumber || !recipientFullName) {
      return res
        .status(400)
        .json({
          message: "Bank name, account number, and full name are required.",
        });
    }

    const newRecipient = await createRecipient(userId, {
      recipientBankName,
      recipientAccountNumber,
      recipientFullName,
      recipientEmail,
      recipientMobileNumber,
      isRecipientBusinessAccount: isRecipientBusinessAccount || false,
      sortCode,
    });

    res.status(201).json({
      message: "Recipient saved successfully.",
      data: newRecipient,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage.includes("A recipient with this account number")) {
      return res.status(409).json({ message: errorMessage });
    }
    next(error);
  }
};

export const updateRecipientController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const recipientId = req.params.id;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const existingRecipient = await getRecipientById(recipientId, userId);
    if (!existingRecipient) {
      return res
        .status(404)
        .json({ message: "Recipient not found or unauthorized." });
    }

    const updatedRecipient = await updateRecipient(
      recipientId,
      userId,
      updateData
    );

    res.status(200).json({
      message: "Recipient updated successfully.",
      data: updatedRecipient,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRecipientController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const recipientId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const existingRecipient = await getRecipientById(recipientId, userId);
    if (!existingRecipient) {
      return res
        .status(404)
        .json({ message: "Recipient not found or unauthorized." });
    }

    const deletedRecipient = await deleteRecipient(recipientId, userId);

    res.status(200).json({
      message: "Recipient deleted successfully.",
      data: deletedRecipient,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecipientDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const recipientId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const recipient = await getRecipientById(recipientId, userId);

    if (!recipient) {
      return res
        .status(404)
        .json({ message: "Recipient not found or unauthorized." });
    }

    res.status(200).json({
      message: "Recipient details fetched successfully.",
      data: recipient,
    });
  } catch (error) {
    next(error);
  }
};

import { Request, Response } from "express";
import {
  getOrCreateAccount,
  updateAccount,
} from "@services/admin/admin.transferaccount.service";

export const getAccountData = async (req: Request, res: Response) => {
  try {
    const accountData = await getOrCreateAccount();
    res.status(200).json(accountData);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve account data", error });
  }
};

export const updateAccountData = async (req: Request, res: Response) => {
  try {
    const { GBPAccountName, GBPAccountNumber } = req.body;

    if (!GBPAccountName && !GBPAccountNumber) {
      return res.status(400).json({
        message:
          "At least one of GBPAccountName or GBPAccountNumber must be provided.",
      });
    }

    const updatedData = await updateAccount({
      GBPAccountName,
      GBPAccountNumber,
    });
    res.status(200).json(updatedData);
  } catch (error) {
    res.status(500).json({ message: "Failed to update account data", error });
  }
};

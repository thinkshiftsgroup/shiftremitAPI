import { Request, Response, NextFunction } from "express";
import {
  submitIndividualKYC,
  fetchIndividualKYCStatus,
} from "@services/KYC/kyc.submission.service";

export const submitKYCController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const submissionStatus = await submitIndividualKYC(userId);

    res.status(200).json({
      message: "KYC documents submitted successfully and set for review.",
      status: submissionStatus.status,
      submissionDate: submissionStatus.submissionDate,
    });
  } catch (error) {
    next(error);
  }
};

export const getKYCStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const status = await fetchIndividualKYCStatus(userId);

    res.status(200).json({
      message: "KYC submission status fetched successfully.",
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

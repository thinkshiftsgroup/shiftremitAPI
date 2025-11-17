import { Request, Response, NextFunction } from "express";
import {
  submitIndividualKYC,
  fetchIndividualKYCStatus,
  submitBusinessKYC,
  fetchBusinessKYCStatus,
} from "@services/KYC/kyc.submission.service";

export const submitKYCController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const accountType = req.query.type as string;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    let submissionStatus;

    if (accountType === "BUSINESS") {
      submissionStatus = await submitBusinessKYC(userId);
    } else {
      submissionStatus = await submitIndividualKYC(userId);
    }

    res.status(200).json({
      message: `${
        accountType === "BUSINESS" ? "Business" : "Individual"
      } KYC documents submitted successfully and set for review.`,
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
    const accountType = req.query.type as string;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    let status;

    if (accountType === "BUSINESS") {
      status = await fetchBusinessKYCStatus(userId);
    } else {
      status = await fetchIndividualKYCStatus(userId);
    }

    res.status(200).json({
      message: `${
        accountType === "BUSINESS" ? "Business" : "Individual"
      } KYC submission status fetched successfully.`,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

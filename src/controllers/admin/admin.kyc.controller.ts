import { Request, Response, NextFunction } from "express";
import {
  listIndividualKYCSubmissions,
  approveIndividualKYC,
  rejectIndividualKYC,
  listBusinessKYCSubmissions,
  approveBusinessKYC,
  rejectBusinessKYC,
} from "@services/admin/admin.kyc.service";

export const listIndividualKYCController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const submissions = await listIndividualKYCSubmissions();
    res.status(200).json(submissions);
  } catch (error) {
    next(error);
  }
};

export const approveIndividualKYCController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const kycId = req.params.kycId;

    if (!kycId) {
      return res.status(400).json({ message: "KYC ID is required." });
    }

    const updatedKYC = await approveIndividualKYC(kycId);

    res.status(200).json({
      message: `KYC submission ${kycId} and all associated documents have been successfully approved.`,
      kyc: updatedKYC,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectIndividualKYCController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const kycId = req.params.kycId;

    if (!kycId) {
      return res.status(400).json({ message: "KYC ID is required." });
    }

    const updatedKYC = await rejectIndividualKYC(kycId);

    res.status(200).json({
      message: `KYC submission ${kycId} and all associated documents have been successfully rejected.`,
      kyc: updatedKYC,
    });
  } catch (error) {
    next(error);
  }
};

export const listBusinessKYCController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const submissions = await listBusinessKYCSubmissions();
    res.status(200).json(submissions);
  } catch (error) {
    next(error);
  }
};

export const approveBusinessKYCController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const kycId = req.params.kycId;

    if (!kycId) {
      return res.status(400).json({ message: "KYC ID is required." });
    }

    const updatedKYC = await approveBusinessKYC(kycId);

    res.status(200).json({
      message: `Business KYC submission ${kycId} and all associated documents have been successfully approved.`,
      kyc: updatedKYC,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectBusinessKYCController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const kycId = req.params.kycId;

    if (!kycId) {
      return res.status(400).json({ message: "KYC ID is required." });
    }

    const updatedKYC = await rejectBusinessKYC(kycId);

    res.status(200).json({
      message: `Business KYC submission ${kycId} and all associated documents have been successfully rejected.`,
      kyc: updatedKYC,
    });
  } catch (error) {
    next(error);
  }
};

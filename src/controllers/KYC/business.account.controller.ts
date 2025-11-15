import { Request, Response, NextFunction } from "express";
import {
  getOrCreateBusinessAccount,
  updateBusinessAccountFields,
  updateOrCreateDirector,
  updateOrCreateShareholder,
  updateOrCreatePEP,
  DirectorPayloadData,
  ShareholderPayloadData,
  PEPPayloadData,
} from "@services/KYC/business.account.service";
import { MulterFile } from "src/types/Upload";
import {
  docMapping,
  DocumentType,
  uploadAndSaveBusinessDocuments,
} from "@services/KYC/business.account.document.service";
import { Prisma } from "@prisma/client";

export const fetchBusinessAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const businessAccount = await getOrCreateBusinessAccount(userId);
    res.status(200).json(businessAccount);
  } catch (error) {
    next(error);
  }
};

export const updateBusinessAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const data = req.body;

    const updatedAccount = await updateBusinessAccountFields(userId, data);
    res.status(200).json(updatedAccount);
  } catch (error) {
    next(error);
  }
};

export const updateDirectorController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const directorId = req.params.directorId || null;
    const data = req.body as DirectorPayloadData;
    const files = req.files as { [fieldname: string]: MulterFile[] };

    const updatedDirector = await updateOrCreateDirector(
      userId,
      directorId,
      data,
      files
    );
    res.status(200).json(updatedDirector);
  } catch (error) {
    next(error);
  }
};

export const updateShareholderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const shareholderId = req.params.shareholderId || null;
    const data = req.body as ShareholderPayloadData;
    const files = req.files as { [fieldname: string]: MulterFile[] };

    const updatedShareholder = await updateOrCreateShareholder(
      userId,
      shareholderId,
      data,
      files
    );
    res.status(200).json(updatedShareholder);
  } catch (error) {
    next(error);
  }
};

export const updatePEPController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const pepId = req.params.pepId || null;
    const data = req.body as PEPPayloadData;

    const updatedPEP = await updateOrCreatePEP(userId, pepId, data);
    res.status(200).json(updatedPEP);
  } catch (error) {
    next(error);
  }
};

export const uploadBusinessDocumentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const files = req.files as { [fieldname: string]: MulterFile[] };

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    const uploadPromises = [];
    const allowedKeys: DocumentType[] = Object.keys(
      docMapping
    ) as DocumentType[];

    for (const docType of Object.keys(files)) {
      const fileArray = files[docType];

      if (!allowedKeys.includes(docType as DocumentType)) {
        return res.status(400).json({
          message: `Invalid document type field name provided: ${docType}`,
        });
      }

      if (fileArray && fileArray.length > 0) {
        uploadPromises.push(
          uploadAndSaveBusinessDocuments(
            userId,
            fileArray,
            docType as DocumentType
          )
        );
      }
    }

    await Promise.all(uploadPromises);

    res.status(200).json({
      message:
        "All specified business documents uploaded and statuses set to PENDING_REVIEW.",
    });
  } catch (error) {
    next(error);
  }
};

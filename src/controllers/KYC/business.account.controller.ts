import { Request, Response, NextFunction } from "express";
import {
  getOrCreateBusinessAccount,
  updateBusinessAccountFields,
  upsertMultipleDirectors,
  upsertMultipleShareholders,
  upsertMultiplePEPs,
  DirectorPayloadData,
  ShareholderPayloadData,
  PEPPayloadData,
  UpdateBusinessAccountData,
  deleteDirectorById,
  deleteShareholderById,
  deletePEPById,
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
    const data = req.body as UpdateBusinessAccountData;

    const updatedAccount = await updateBusinessAccountFields(userId, data);
    res.status(200).json(updatedAccount);
  } catch (error) {
    next(error);
  }
};

export const upsertDirectorsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const data = req.body as DirectorPayloadData[];

    if (!Array.isArray(data)) {
      return res.status(400).json({
        message: "Request body must be an array of director objects.",
      });
    }

    const upsertedDirectors = await upsertMultipleDirectors(userId, data);
    res.status(200).json({
      message: "directors updated successfully",
      data: upsertedDirectors,
    });
  } catch (error) {
    next(error);
  }
};

export const upsertShareholdersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const data = req.body as ShareholderPayloadData[];

    if (!Array.isArray(data)) {
      return res.status(400).json({
        message: "Request body must be an array of shareholder objects.",
      });
    }

    const upsertedShareholders = await upsertMultipleShareholders(userId, data);
    res.status(200).json({
      message: "shareholders updated successfully",
      data: upsertedShareholders,
    });
  } catch (error) {
    next(error);
  }
};

export const upsertPEPsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const data = req.body as PEPPayloadData[];

    if (!Array.isArray(data)) {
      return res
        .status(400)
        .json({ message: "Request body must be an array of PEP objects." });
    }

    const upsertedPEPs = await upsertMultiplePEPs(userId, data);
    res.status(200).json({
      message: "peps updated successfully",
      data: upsertedPEPs,
    });
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

//delete records
export const deleteDirectorController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const directorId = req.params.directorId;

    if (!directorId) {
      return res.status(400).json({ message: "Director ID is required." });
    }

    await deleteDirectorById(userId, directorId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const deleteShareholderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const shareholderId = req.params.shareholderId;

    if (!shareholderId) {
      return res.status(400).json({ message: "Shareholder ID is required." });
    }

    await deleteShareholderById(userId, shareholderId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const deletePEPController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const pepId = req.params.pepId;

    if (!pepId) {
      return res.status(400).json({ message: "PEP ID is required." });
    }

    await deletePEPById(userId, pepId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

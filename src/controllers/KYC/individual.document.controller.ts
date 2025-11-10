import { Request, Response, NextFunction } from "express";
import {
  uploadAndSaveDocuments,
  docMapping,
  DocumentType,
  fetchIndividualDocuments,
} from "@services/KYC/individual.document.service";
import { MulterFile } from "src/types/Upload";

export const uploadMultipleDocumentsController = async (
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
          uploadAndSaveDocuments(userId, fileArray, docType as DocumentType)
        );
      }
    }

    await Promise.all(uploadPromises);

    res.status(200).json({
      message: "All specified documents uploaded and statuses set to PENDING.",
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const documents = await fetchIndividualDocuments(userId);

    if (!documents) {
      return res.status(200).json({
        message: "No document record found for this user.",
        data: null,
      });
    }

    res.status(200).json({
      message: "Documents and statuses fetched successfully.",
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

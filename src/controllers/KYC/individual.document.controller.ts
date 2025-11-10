import { Request, Response, NextFunction } from "express";
import {
  uploadAndSaveDocuments,
  docMapping,
  DocumentType,
  fetchIndividualDocuments,
} from "@services/KYC/individual.document.service";
import { MulterFile } from "src/types/Upload";

export const uploadDocumentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const docType = req.body.docType as DocumentType;
    const files = req.files as MulterFile[];

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!docType || !files || files.length === 0) {
      return res
        .status(400)
        .json({ message: "Document type and file are required." });
    }

    const allowedTypes: DocumentType[] = Object.keys(
      docMapping
    ) as DocumentType[];

    if (!allowedTypes.includes(docType)) {
      return res
        .status(400)
        .json({ message: "Invalid document type provided." });
    }

    const result = await uploadAndSaveDocuments(userId, files, docType);

    res.status(200).json({
      message: result.message,
      docUrl: result.docUrl,
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
    const userId = req.userId;

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

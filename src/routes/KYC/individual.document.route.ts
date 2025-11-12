import { Router } from "express";
import multer from "multer";
import {
  uploadMultipleDocumentsController,
  getDocumentsController,
  deleteDocumentsController,
  deleteSingleDocumentController,
} from "@controllers/KYC/individual.document.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

const documentRouter = Router();

documentRouter.post(
  "/upload",
  protect,
  upload.fields([
    { name: "recentProofOfAddress", maxCount: 1 },
    { name: "recentSelfieWithID", maxCount: 1 },
    { name: "proofOfValidID", maxCount: 1 },
    { name: "proofOfValidIDBackView", maxCount: 1 },
    { name: "recentBankStatement", maxCount: 1 },
    { name: "additionalDocuments", maxCount: 1 },
  ]),
  asyncHandler(uploadMultipleDocumentsController)
);

documentRouter.get("/", protect, asyncHandler(getDocumentsController));
documentRouter.delete(
  "/delete",
  protect,
  asyncHandler(deleteDocumentsController)
);

documentRouter.delete(
  "/delete-single/:docType",
  protect,
  asyncHandler(deleteSingleDocumentController)
);

export const individualDocumentRouter = documentRouter;

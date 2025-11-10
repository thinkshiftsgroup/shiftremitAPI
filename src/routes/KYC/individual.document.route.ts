import { Router } from "express";
import multer from "multer";
import {
  uploadMultipleDocumentsController,
  getDocumentsController,
} from "@controllers/KYC/individual.document.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const documentRouter = Router();

documentRouter.post(
  "/upload",
  protect,
  upload.fields([
    { name: "businessRegistrationCertificate", maxCount: 1 },
    { name: "articleOfAssociation", maxCount: 1 },
    { name: "operatingBusinessUtilityBill", maxCount: 1 },
    { name: "companyStatusReport", maxCount: 1 },
    { name: "additionalDocuments", maxCount: 1 },
  ]),
  asyncHandler(uploadMultipleDocumentsController)
);

documentRouter.get("/", protect, asyncHandler(getDocumentsController));

export const individualDocumentRouter = documentRouter;

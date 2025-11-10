import { Router } from "express";
import multer from "multer";
import {
  uploadDocumentController,
  getDocumentsController,
} from "@controllers/KYC/individual.document.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const documentRouter = Router();

documentRouter.use(protect);
documentRouter.post(
  "/upload",
  protect,
  upload.array("files", 4),
  asyncHandler(uploadDocumentController)
);

documentRouter.get(
  "/",

  asyncHandler(getDocumentsController)
);
export const individualDocumentRouter = documentRouter;

import { Router } from "express";
import multer from "multer";
import { uploadDocumentController } from "@controllers/KYC/individual.document.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const documentRouter = Router();

documentRouter.post(
  "/upload",
  protect,
  upload.array("files", 4),
  asyncHandler(uploadDocumentController)
);

export default documentRouter;

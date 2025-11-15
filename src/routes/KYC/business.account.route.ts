import { Router } from "express";
import {
  fetchBusinessAccountController,
  updateBusinessAccountController,
  upsertDirectorsController,
  upsertShareholdersController,
  upsertPEPsController,
  uploadBusinessDocumentsController,
  deleteDirectorController,
  deleteShareholderController,
  deletePEPController,
} from "@controllers/KYC/business.account.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
import multer from "multer";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

const documentFields = [
  { name: "businessRegistrationIncorporationCertificate", maxCount: 1 },
  { name: "articleOfAssociation", maxCount: 1 },
  { name: "operatingBusinessUtilityBill", maxCount: 1 },
  { name: "companyStatusReports", maxCount: 1 },
  { name: "additionalDocument", maxCount: 1 },
];

router.use(protect);

router.get("/", asyncHandler(fetchBusinessAccountController));

router.put("/details", asyncHandler(updateBusinessAccountController));

router.put("/directors", asyncHandler(upsertDirectorsController));

router.put("/shareholders", asyncHandler(upsertShareholdersController));

router.put("/peps", asyncHandler(upsertPEPsController));

router.post(
  "/documents/upload",
  upload.fields(documentFields),
  asyncHandler(uploadBusinessDocumentsController)
);

// Delete
router.delete("/directors/:directorId", asyncHandler(deleteDirectorController));
router.delete(
  "/shareholders/:shareholderId",
  asyncHandler(deleteShareholderController)
);
router.delete("/peps/:pepId", asyncHandler(deletePEPController));
export const businessAccountRouter = router;

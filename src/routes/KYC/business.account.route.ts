import { Router } from "express";
import {
  fetchBusinessAccountController,
  updateBusinessAccountController,
  updateDirectorController,
  updateShareholderController,
  updatePEPController,
  uploadBusinessDocumentsController,
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

const directorDocumentFields = [
  { name: "identificationDocumentProofUrl", maxCount: 1 },
  { name: "residentialAddressUrlProof", maxCount: 1 },
];

const shareholderDocumentFields = [
  { name: "validIdUrl", maxCount: 1 },
  { name: "proofOfAddressUrl", maxCount: 1 },
];

router.use(protect);

router.get("/", asyncHandler(fetchBusinessAccountController));

router.put("/details", updateBusinessAccountController);

router.put(
  "/director/:directorId",
  upload.fields(directorDocumentFields),
  updateDirectorController
);

router.put(
  "/shareholder/:shareholderId",
  upload.fields(shareholderDocumentFields),
  updateShareholderController
);

router.put("/pep/:pepId", updatePEPController);

router.post(
  "/documents/upload",
  upload.fields(documentFields),
  asyncHandler(uploadBusinessDocumentsController)
);

export const businessAccountRouter = router;

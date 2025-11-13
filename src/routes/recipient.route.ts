import { Router } from "express";
import {
  getRecentRecipientsController,
  createRecipientController,
  updateRecipientController,
  deleteRecipientController,
  getRecipientDetailsController,
} from "@controllers/recipient.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";

const recipientRouter = Router();
recipientRouter.use(protect);
recipientRouter.get("/", asyncHandler(getRecentRecipientsController));

recipientRouter.post("/", asyncHandler(createRecipientController));

recipientRouter.get("/:id", asyncHandler(getRecipientDetailsController));

recipientRouter.put("/:id", asyncHandler(updateRecipientController));

recipientRouter.delete("/:id", asyncHandler(deleteRecipientController));
export const userRecipientRouter = recipientRouter;

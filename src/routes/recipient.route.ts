import { Router } from "express";
import { getRecentRecipientsController } from "@controllers/recipient.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";

const recipientRouter = Router();

recipientRouter.get(
  "/recent",
  protect,
  asyncHandler(getRecentRecipientsController)
);

export const userRecipientRouter = recipientRouter;

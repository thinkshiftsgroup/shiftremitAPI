import { Request, Response, NextFunction } from "express";
import { fetchRecentRecipients } from "@services/recipient.service";

export const getRecentRecipientsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const recipients = await fetchRecentRecipients(userId, limit);

    res.status(200).json({
      message: "Recent recipients fetched successfully.",
      data: recipients,
    });
  } catch (error) {
    next(error);
  }
};

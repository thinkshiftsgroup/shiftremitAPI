import { Request, Response, NextFunction } from "express";
import { getAdminDashboardData } from "@services/admin/admin.dahboard.service";
export const getAdminDashboardSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (!user || user.userType !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }

    const data = await getAdminDashboardData();

    res.status(200).json({
      message: "Admin dashboard summary data fetched successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

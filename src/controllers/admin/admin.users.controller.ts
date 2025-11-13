import { Request, Response } from "express";
import {
  getAllUsers,
  getUserWithDocs,
  UserQueryOptions,
} from "@services/admin/admin.users.service";

export const listAllUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (page < 1 || limit < 1) {
    return res
      .status(400)
      .json({ message: "Page and limit must be positive numbers" });
  }

  const sortByAmount = req.query.sortByAmount as "asc" | "desc" | undefined;
  const sortByDate = req.query.sortByDate as "asc" | "desc" | undefined;

  const name = req.query.name as string | undefined;
  const isVerifiedQuery = req.query.isVerified as string | undefined;

  let isVerified: boolean | undefined;
  if (isVerifiedQuery !== undefined) {
    const lowerCaseValue = isVerifiedQuery.toLowerCase();
    if (lowerCaseValue === "true") {
      isVerified = true;
    } else if (lowerCaseValue === "false") {
      isVerified = false;
    } else {
      return res
        .status(400)
        .json({ message: "isVerified filter must be 'true' or 'false'" });
    }
  }

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (req.query.startDate) {
    startDate = new Date(req.query.startDate as string);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        message: "Invalid startDate format. Use ISO format (YYYY-MM-DD).",
      });
    }
  }

  if (req.query.endDate) {
    endDate = new Date(req.query.endDate as string);
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: "Invalid endDate format. Use ISO format (YYYY-MM-DD).",
      });
    }
  }

  const options: UserQueryOptions = {
    page,
    limit,
    sortByAmount,
    sortByDate,
    startDate,
    endDate,
    name, // This property must exist in the imported UserQueryOptions
    isVerified, // This property must exist in the imported UserQueryOptions
  };

  try {
    const { users, totalCount } = await getAllUsers(options);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      message: "Users fetched successfully",
      data: users,
      meta: {
        totalCount,
        totalPages,
        currentPage: page,
        limit: limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getUserDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await getUserWithDocs(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "User details fetched successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user details" });
  }
};

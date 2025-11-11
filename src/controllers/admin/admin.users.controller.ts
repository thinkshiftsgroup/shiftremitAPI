import { Request, Response } from "express";
import {
  getAllUsers,
  getUserWithDocs,
} from "@services/admin/admin.users.service";

export const listAllUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (page < 1 || limit < 1) {
    return res
      .status(400)
      .json({ message: "Page and limit must be positive numbers" });
  }

  try {
    const { users, totalCount } = await getAllUsers(page, limit);

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

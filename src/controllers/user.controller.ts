import { Request, Response } from "express";
import {
  getBasicProfile,
  updateBasicProfile,
  updateProfilePhoto,
  updateProfilePhotoApp,
} from "@services/user.service";

export const getProfileController = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  try {
    const profile = await getBasicProfile(userId);
    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      status: "success",
      data: profile,
      message: "Profile fetched successfully",
    });
  } catch (error) {
    console.error("GET Profile Error:", error);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfileController = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const data = req.body;

  try {
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No data provided for update" });
    }

    const updatedProfile = await updateBasicProfile(userId, data);

    return res.status(200).json({
      status: "success",
      data: updatedProfile,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("PATCH Profile Error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

export const updateProfilePhotoAppController = async (
  req: Request,
  res: Response
) => {
  const userId = (req as any).user.id;
  const file = (req as any).file;

  try {
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const updatedProfile = await updateProfilePhotoApp(userId, file);

    return res.status(200).json({
      status: "success",
      data: updatedProfile,
      message: "Profile photo updated successfully",
    });
  } catch (error) {
    console.error("PATCH Profile Photo Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update profile photo";
    return res.status(500).json({ message: errorMessage });
  }
};
export const updateProfilePhotoController = async (
  req: Request,
  res: Response
) => {
  const userId = (req as any).user.id;
  const { profilePhotoUrl } = req.body;

  try {
    if (!profilePhotoUrl) {
      return res.status(400).json({ message: "Missing profilePhotoUrl" });
    }
    const updatedProfile = await updateProfilePhoto(userId, profilePhotoUrl);
    return res.status(200).json({
      status: "success",
      data: updatedProfile,
      message: "Profile photo updated successfully",
    });
  } catch (error) {
    console.error("PATCH Profile Photo Error:", error);
    return res.status(500).json({ message: "Failed to update profile photo" });
  }
};

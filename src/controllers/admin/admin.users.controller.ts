import { Request, Response } from "express";
import {
  getAllUsers,
  getUserWithDocs,
  updateUserDetails,
  updateIndividualDocStatus,
  UserQueryOptions,
  UserUpdatePayload,
  DocType,
  BusinessDocType,
  updateBusinessDocStatus,
} from "@services/admin/admin.users.service";
import { DocStatus } from "@prisma/client";

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
    name,
    isVerified,
    startDate,
    endDate,
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

export const updateUserController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UserUpdatePayload = req.body;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: "Request body cannot be empty" });
  }

  try {
    const updatedUser = await updateUserDetails(id, updateData);

    res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update user";
    res.status(500).json({ message: errorMessage });
  }
};

export const updateIndividualDocStatusController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const { docType, status } = req.body;

  if (!docType || !status) {
    return res
      .status(400)
      .json({ message: "Missing required fields: docType and status" });
  }

  const allowedDocTypes: DocType[] = [
    "recentProofOfAddress",
    "recentSelfieWithID",
    "proofOfValidID",
    "proofOfValidIDBackView",
    "recentBankStatement",
    "additionalDocuments",
  ];

  const allowedDocStatuses: DocStatus[] = [
    DocStatus.APPROVED,
    DocStatus.PENDING,
    DocStatus.IN_REVIEW,
    DocStatus.REJECTED,
  ];

  if (!allowedDocTypes.includes(docType)) {
    return res.status(400).json({ message: `Invalid docType: ${docType}` });
  }

  if (!allowedDocStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status: ${status}` });
  }

  try {
    const updatedDoc = await updateIndividualDocStatus(id, docType, status);

    res.status(200).json({
      message: "Document status updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update document status";
    const statusCode = errorMessage.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ message: errorMessage });
  }
};

export const updateBusinessDocStatusController = async (
  req: Request,
  res: Response
) => {
  const { businessAccountId } = req.params;
  const { docType, status } = req.body;

  if (!docType || !status) {
    return res
      .status(400)
      .json({ message: "Missing required fields: docType and status" });
  }

  const allowedDocTypes: BusinessDocType[] = [
    "businessRegistrationIncorporationCertificate",
    "articleOfAssociation",
    "operatingBusinessUtilityBill",
    "companyStatusReports",
    "additionalDocument",
  ];

  const allowedDocStatuses: DocStatus[] = [
    DocStatus.APPROVED,
    DocStatus.PENDING,
    DocStatus.IN_REVIEW,
    DocStatus.REJECTED,
  ];

  if (!allowedDocTypes.includes(docType as BusinessDocType)) {
    return res.status(400).json({ message: `Invalid docType: ${docType}` });
  }

  if (!allowedDocStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status: ${status}` });
  }

  try {
    const updatedDoc = await updateBusinessDocStatus(
      businessAccountId,
      docType as BusinessDocType,
      status
    );

    res.status(200).json({
      message: "Business document status updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update business document status";
    const statusCode = errorMessage.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ message: errorMessage });
  }
};

import { Request, Response } from "express";
import {
  ActivityLogService,
  GetLogsParams,
} from "@services/admin/admin.logs.service";
import { ActivityType } from "@prisma/client";
const adminLogService = new ActivityLogService();

export const getAdminLogs = async (req: Request, res: Response) => {
  try {
    const {
      page,
      pageSize,
      usernameFilter,
      ipAddressFilter,
      activityTypeFilter,
    } = req.query;

    const typeFilter = activityTypeFilter as ActivityType | undefined;

    const params: GetLogsParams = {
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      usernameFilter: usernameFilter as string,
      ipAddressFilter: ipAddressFilter as string,
      activityTypeFilter: typeFilter,
    };

    const { logs, totalCount } = await adminLogService.getLogs(params);

    res.status(200).json({
      message: "Activity logs fetched successfully",
      data: logs,
      meta: {
        total: totalCount,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        totalPages: Math.ceil(totalCount / (params.pageSize || 20)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch activity logs" });
  }
};

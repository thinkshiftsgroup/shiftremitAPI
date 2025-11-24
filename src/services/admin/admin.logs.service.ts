import { PrismaClient, UserActivityLog, ActivityType } from "@prisma/client";

const prisma = new PrismaClient();

export interface GetLogsParams {
  page?: number;
  pageSize?: number;
  usernameFilter?: string;
  ipAddressFilter?: string;
  activityTypeFilter?: ActivityType;
}

export interface LogActivityParams {
  userId: string;
  activityType: ActivityType;
  description: string;
  ipAddress?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: any;
}

export class ActivityLogService {
  async getUnreadCount(): Promise<number> {
    return 0;
  }

  async getLogs(
    params: GetLogsParams
  ): Promise<{ logs: UserActivityLog[]; totalCount: number }> {
    const {
      page = 1,
      pageSize = 20,
      usernameFilter,
      ipAddressFilter,
      activityTypeFilter,
    } = params;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: any = {};

    if (activityTypeFilter) {
      where.activityType = activityTypeFilter;
    }

    if (ipAddressFilter) {
      where.ipAddress = ipAddressFilter;
    }

    if (usernameFilter) {
      where.user = {
        username: {
          contains: usernameFilter,
          mode: "insensitive",
        },
      };
    }

    const [logs, totalCount] = await prisma.$transaction([
      prisma.userActivityLog.findMany({
        where,
        take,
        skip,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.userActivityLog.count({ where }),
    ]);

    return { logs, totalCount };
  }

  async logActivity(params: LogActivityParams): Promise<UserActivityLog> {
    const {
      userId,
      activityType,
      description,
      ipAddress,
      resourceId,
      resourceType,
      metadata,
    } = params;

    return prisma.userActivityLog.create({
      data: {
        userId,
        activityType,
        description,
        ipAddress,
        resourceId,
        resourceType,
        metadata: metadata ? (metadata as any) : undefined,
      },
    });
  }
}

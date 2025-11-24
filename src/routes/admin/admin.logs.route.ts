import { Router } from "express";
import { getAdminLogs } from "@controllers/admin/admin.logs.controller";

import { adminProtect } from "@middlewares/auth.middleware";
const adminLogsRouter = Router();

adminLogsRouter.use(adminProtect);

adminLogsRouter.get("/", getAdminLogs);

export default adminLogsRouter;

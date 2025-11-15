import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import axios from "axios";
import { errorHandler } from "@middlewares/error.middleware";

import { authRouter } from "@routes/auth.routes";
import { ratesRouter } from "@routes/fx-rates.route";
import { adminRatesRouter } from "@routes/admin/admin.rates.routes";
import { verificationRouter } from "@routes/verification.route";
import { bankTransferRouter } from "@routes/banktransfer.route";
import { profileRouter } from "@routes/user.route";
import { individualDocumentRouter } from "@routes/KYC/individual.document.route";
import { userRecipientRouter } from "@routes/recipient.route";
import { individualKYCRouter } from "@routes/KYC/kyc.submission.route";
import { businessAccountRouter } from "@routes/KYC/business.account.route";

import { adminTransferAccountRouter } from "@routes/admin/admin.transferaccount.route";
import { adminTransferRouter } from "@routes/admin/admin.transfers.route";
import { adminUsersRouter } from "@routes/admin/admin.user.route";
import { adminDashboardRouter } from "@routes/admin/admin.dashboard.route";
import { adminKycRouter } from "@routes/admin/admin.kyc.route";
const app = express();

const allowedOrigins = [
  "http://shiftremit.com",
  "https://shiftremit.com",
  "https://www.shiftremit.com",
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:3003",
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/rates", ratesRouter);
app.use("/api/verification", verificationRouter);
app.use("/api/recipients", userRecipientRouter);
app.use("/api/bank-transfer", bankTransferRouter);
app.use("/api/profile", profileRouter);
app.use("/api/individual-doc", individualDocumentRouter);
app.use("/api/kyc", individualKYCRouter);
app.use("/api/business-account", businessAccountRouter);

app.use("/api/admin/rates", adminRatesRouter);
app.use("/api/admin/transfer-account", adminTransferAccountRouter);
app.use("/api/admin/transfers", adminTransferRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/admin/kyc", adminKycRouter);

app.get("/health", async (req: Request, res: Response) => {
  res.status(200).json({ status: "UP", message: "Service is healthy" });
});

app.get("/", (req: Request, res: Response) => {
  res.send(`
    <div style="text-align:center;margin-top:10rem">
      Welcome to Shiftremit 😜
    </div>
  `);
});

app.use(errorHandler);

export default app;

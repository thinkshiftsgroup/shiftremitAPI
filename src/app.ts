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

import { adminTransferAccountRouter } from "@routes/admin/admin.transferaccount.route";
import { adminTransferRouter } from "@routes/admin/admin.transfers.route";
import { adminUsersRouter } from "@routes/admin/admin.user.route";
import e from "express";
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
app.use("/api/bank-transfer", bankTransferRouter);
app.use("/api/profile", profileRouter);
app.use("/api/individual-doc", individualDocumentRouter);
app.use("/api/admin/rates", adminRatesRouter);
app.use("/api/admin/transfer-account", adminTransferAccountRouter);
app.use("/api/admin/transfers", adminTransferRouter);
app.use("/api/admin/users", adminUsersRouter);

app.get("/health", async (req: Request, res: Response) => {
  res.status(200).json({ status: "UP", message: "Service is healthy" });
});

const TAP_TAP_SEND_URL = "https://api.taptapsend.com/api/fxRates";

const fetchTaptapRates = async () => {
  try {
    const response = await axios.get(TAP_TAP_SEND_URL, {
      headers: {
        Host: "api.taptapsend.com",
        accept: "*/*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "appian-version": "web/2022-05-03.0",
        origin: "https://www.taptapsend.com",
        referer: "https://www.taptapsend.com/",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        "sec-ch-ua":
          '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        priority: "u=1, i",
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "TapTap API Error:",
      axios.isAxiosError(error) ? error.response?.data : error
    );
    throw new Error("Failed to retrieve rates from external service.");
  }
};

app.get("/api/taptap-rates", async (req: Request, res: Response) => {
  try {
    const rates = await fetchTaptapRates();
    res.status(200).json(rates);
  } catch (error) {
    res.status(503).json({
      message: error instanceof Error ? error.message : "Service Unavailable",
    });
  }
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

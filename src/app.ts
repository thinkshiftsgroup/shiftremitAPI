import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "@middlewares/error.middleware";

import { authRouter } from "@routes/auth.routes";
import { ratesRouter } from "@routes/fx-rates.route";
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/rates", ratesRouter);

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

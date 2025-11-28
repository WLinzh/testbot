// server/src/index.ts

import dotenv from "dotenv";
dotenv.config();

import chatRoute from "./chatRoute.js";
import express, { Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { logger } from "./logger.js";

const app = express();
const PORT = process.env.PORT || 3000;

logger.info("LLM_BASE_URL from env", { url: process.env.LLM_BASE_URL });

// ---------------------------------------------------------
// CORS 配置优化
// ---------------------------------------------------------
// 允许通过环境变量配置前端地址，方便在 Cloud Run 上运行
const ALLOWED_ORIGIN = process.env.CLIENT_URL || "*";

app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    credentials: false // 如果 origin 为 "*"，这里必须是 false
  })
);
// ---------------------------------------------------------

app.use(express.json());



// Rate Limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests, please try again later." }
});

// Apply rate limiting to all requests under /api
app.use("/api", limiter);

// 健康检查
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// 聊天路由
app.use("/api", chatRoute);

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
  logger.info(`CORS enabled for: ${ALLOWED_ORIGIN}`);
});
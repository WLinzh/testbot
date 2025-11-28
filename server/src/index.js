// server/src/index.js

import dotenv from "dotenv";
dotenv.config();

import chatRoute from "./chatRoute.js";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

console.log("LLM_BASE_URL from env:", process.env.LLM_BASE_URL);

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

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 聊天路由
app.use("/api", chatRoute);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`CORS enabled for: ${ALLOWED_ORIGIN}`);
});
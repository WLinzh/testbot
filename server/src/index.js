// server/src/index.js

import dotenv from "dotenv";

dotenv.config();

import chatRoute from "./chatRoute.js";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

console.log("LLM_BASE_URL from env:", process.env.LLM_BASE_URL);

// 允许前端跨域（开发阶段）
app.use(
  cors({
    origin: "http://localhost:5173", // Vite 默认端口
    credentials: false
  })
);

app.use(express.json());

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 聊天路由
app.use("/api", chatRoute);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
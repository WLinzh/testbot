// server/src/chatRoute.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// 固定的 system prompt
const SYSTEM_MESSAGE = {
  role: "system",
  content:
    "You are a supportive, non-judgmental mental health companion. " +
    "You are NOT a doctor, psychiatrist, or licensed therapist. " +
    "You must NOT provide any diagnosis or recommend prescription medication.\n" +
    "\n" +
    "Your goals are:\n" +
    "1. Help users understand and name their emotions.\n" +
    "2. Clarify sources of stress in work, study, relationships, or daily life.\n" +
    "3. Suggest healthy, low-risk coping strategies.\n" +
    "4. Encourage self-reflection and realistic expectations.\n" +
    "5. If there is any risk of self-harm or harm to others, clearly recommend seeking immediate professional help."
};

router.post("/chat", async (req, res) => {
  try {
    const rawBaseUrl = process.env.LLM_BASE_URL || ""; // ✅ 每次请求时读取
    const LLM_MODEL =
      process.env.LLM_MODEL || "Qwen/Qwen2.5-1.5B-Instruct";

    // 防止环境变量里带上了 /v1 或尾部的斜杠，避免拼出 /v1/v1/chat/completions
    const LLM_BASE_URL = rawBaseUrl
      .replace(/\/+$/, "")
      .replace(/\/v1$/, "");

    if (!LLM_BASE_URL) {
      console.error("LLM_BASE_URL missing in env");
      return res.status(500).json({ error: "LLM_BASE_URL not configured" });
    }

    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const payload = {
      model: LLM_MODEL,
      messages: [SYSTEM_MESSAGE, ...messages],
      max_tokens: 256
    };

    const resp = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("LLM backend error:", resp.status, text);
      return res
        .status(502)
        .json({ error: "LLM backend failed", detail: text });
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content ?? "";

    return res.json({ reply, raw: data });
  } catch (err) {
    console.error("Chat route error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

// server/src/chatRoute.js
import express, { Request, Response } from "express";
import fetch from "node-fetch";
import { z } from "zod";
import { logger } from "./logger.js";

const router = express.Router();

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1, "Content cannot be empty"),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1, "At least one message is required"),
});

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

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const rawBaseUrl = process.env.LLM_BASE_URL || "";
    const LLM_MODEL = process.env.LLM_MODEL || "Qwen/Qwen2.5-1.5B-Instruct";

    const LLM_BASE_URL = rawBaseUrl.replace(/\/+$/, "").replace(/\/v1$/, "");

    if (!LLM_BASE_URL) {
      logger.error("LLM_BASE_URL missing in env");
      return res.status(500).json({ error: "LLM_BASE_URL not configured" });
    }

    // ... inside the route handler ...

    const validationResult = ChatRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: validationResult.error.errors
      });
    }

    const { messages } = validationResult.data;

    // Set headers for Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const payload = {
      model: LLM_MODEL,
      messages: [SYSTEM_MESSAGE, ...messages],
      max_tokens: 512, // Increased slightly for better responses
      stream: true, // Enable streaming
    };

    const resp = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      logger.error("LLM backend error", { status: resp.status, text });
      res.write(`data: ${JSON.stringify({ error: "LLM backend failed" })}\n\n`);
      return res.end();
    }

    // Pipe the stream
    if (!resp.body) {
      throw new Error("No response body");
    }

    let buffer = "";
    for await (const chunk of resp.body) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim() === "") continue;
        if (line.trim() === "data: [DONE]") continue;

        // Forward the raw SSE line from OpenAI to our client
        // OpenAI format: data: {"id":"...","choices":[{"delta":{"content":"..."}}]}
        // We can just forward it, or parse and re-emit. Forwarding is simpler for now,
        // but let's ensure we are safe.
        // To be safe and consistent, let's parse and re-emit only the content delta.

        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.replace("data: ", "");
            const data = JSON.parse(jsonStr);
            const content = data.choices?.[0]?.delta?.content || "";
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            logger.error("Error parsing chunk", { error: e });
          }
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

  } catch (err) {
    logger.error("Chat route error", { error: err });
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`);
      res.end();
    }
  }
});

export default router;

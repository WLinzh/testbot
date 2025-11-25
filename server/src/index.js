import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import OpenAI from 'openai';

const app = express();
const port = process.env.PORT || 4000;

const openai = new OpenAI({
  baseURL: process.env.LLM_BASE_URL || 'http://localhost:8000/v1',
  apiKey: process.env.LLM_API_KEY || 'llm-api-key-placeholder',
});

const SYSTEM_PROMPT = `
You are CalmSpace, a warm and non-judgmental stress management companion.
- Listen with empathy and keep language simple and clear.
- First: reflect what you heard in 1-3 sentences to validate feelings.
- Second: offer 1-2 gentle clarifying thoughts or questions.
- Third: give 2-4 small, concrete, actionable suggestions as bullet points.
- Do not give medical advice, diagnoses, or mention medication or treatment plans.
- For self-harm or suicide content, gently encourage reaching out to professionals, trusted people, or emergency services.
`.trim();

const sessionHistory = new Map();
const MAX_HISTORY = 10;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, userMessage } = req.body || {};

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    const history = sessionHistory.get(sessionId) || [];
    const trimmedHistory = history.slice(-MAX_HISTORY);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...trimmedHistory,
      { role: 'user', content: userMessage.trim() },
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-oss-20b',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ error: 'No reply generated' });
    }

    const updatedHistory = [
      ...trimmedHistory,
      { role: 'user', content: userMessage.trim() },
      { role: 'assistant', content: reply },
    ].slice(-MAX_HISTORY);

    sessionHistory.set(sessionId, updatedHistory);

    return res.json({ reply });
  } catch (error) {
    console.error('Error handling /api/chat', error);
    return res.status(500).json({ error: 'Failed to process message' });
  }
});

app.listen(port, () => {
  console.log(`CalmSpace server listening on http://localhost:${port}`);
});

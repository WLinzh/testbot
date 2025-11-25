# CalmSpace (testbot)

Minimal stress-management and listening chatbot built for quick local runs.

## Quick start

1) Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

2) Environment

- `server/.env` (see `server/.env.example`)
  - `PORT` - server port (default 4000)
  - `LLM_BASE_URL` - base URL of your OpenAI-compatible endpoint, e.g. `http://localhost:8000/v1`
  - `LLM_API_KEY` - API key/token for that endpoint
  - `LLM_MODEL` - model name, e.g. `gpt-oss-20b`
- `client/.env` (see `client/.env.example`)
  - `VITE_API_URL` - URL where the server is reachable, e.g. `http://localhost:4000`

3) Run

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

4) Use the app at the Vite dev URL (typically `http://localhost:5173`). The chat UI posts to `POST {VITE_API_URL}/api/chat` with `{ sessionId, userMessage }` and expects `{ reply }`.

## Behavior

- Backend keeps a small in-memory history per `sessionId`, prepends a system prompt focused on empathetic, non-clinical stress support, and forwards to an OpenAI-compatible `/chat/completions` endpoint.
- Frontend shows a centered chat card, right-aligned user bubbles, left-aligned assistant replies, a thinking indicator, and Shift+Enter for new lines.
- All copy avoids medical advice and reminds users this is a supportive listener, not a clinical tool.

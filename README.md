# CalmSpace (testbot)

Lightweight stress-management chatbot: Express API + React/Vite UI, with an optional FastAPI proxy for vLLM-style backends.

## Project layout
- `server/` – Express API exposing `/api/chat`, adds a supportive system prompt, and forwards requests to an OpenAI-compatible endpoint.
- `client/` – React + Vite UI for chatting with the backend.
- `vllm-proxy/` – Optional FastAPI bridge to wrap a vLLM deployment in the OpenAI `/v1/chat/completions` shape (Docker-friendly).

## Prerequisites
- Node.js 18+ and npm
- Python 3.11+ (or Docker) if you plan to run `vllm-proxy`

## Setup
1) Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

2) Environment
- `server/.env` (create manually)
  ```bash
  PORT=4000                              # defaults to 3000 if unset; 4000 keeps parity with the client example
  LLM_BASE_URL=http://localhost:8000     # OpenAI-compatible base URL, without the /v1 suffix
  LLM_MODEL=Qwen/Qwen2.5-1.5B-Instruct   # Any chat-completions-capable model name
  ```
- `client/.env` (or copy `client/.env.example`)
  ```bash
  VITE_API_URL=http://localhost:4000
  ```
- `vllm-proxy` (optional) – set `VLLM_BASE_URL=http://<your-vllm-host>:8000` when running it.

3) Run dev servers
```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```
Open `http://localhost:5173`.

## API contract
- Endpoint: `POST /api/chat`
- Body (server-side expectation):  
  ```json
  { "messages": [ { "role": "user" | "assistant", "content": "..." }, ... ] }
  ```
- Behavior: the server prepends a supportive system prompt, caps `max_tokens` at 256, and forwards to `${LLM_BASE_URL}/v1/chat/completions`. Response shape: `{ "reply": string, "raw": <upstream response> }`.
- Note: the current React helper (`client/src/api/chat.ts`) posts `{ sessionId, userMessage }`. Update the client or adjust the server if you prefer that shape.

## vLLM proxy (optional)
- Local run:
  ```bash
  cd vllm-proxy
  python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  export VLLM_BASE_URL=http://<vllm-host>:8000
  uvicorn app:app --host 0.0.0.0 --port 8080
  ```
- Docker:
  ```bash
  cd vllm-proxy
  docker build -t vllm-proxy .
  docker run -e VLLM_BASE_URL=http://<vllm-host>:8000 -p 8080:8080 vllm-proxy
  ```
Point `LLM_BASE_URL` in `server/.env` to `http://localhost:8080` when using the proxy.

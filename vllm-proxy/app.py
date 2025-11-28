from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import httpx

# 从环境变量读 vLLM 地址，例如 http://35.240.149.159:8000
VLLM_BASE_URL = os.getenv("VLLM_BASE_URL", "").rstrip("/")
TIMEOUT = 60

app = FastAPI()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    max_tokens: int | None = 128

@app.get("/")
async def health():
    # 简单健康检查，Cloud Run 想看 8080 端口有服务，这个也方便你本地 curl
    return {"status": "ok"}

@app.post("/v1/chat/completions")
async def chat_completions(req: ChatRequest):
    if not VLLM_BASE_URL:
        raise HTTPException(status_code=500, detail="VLLM_BASE_URL not configured.")

    payload = {
        "model": req.model,
        "messages": [m.model_dump() for m in req.messages],
        "max_tokens": req.max_tokens or 128,
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            r = await client.post(
                f"{VLLM_BASE_URL}/v1/chat/completions",
                json=payload,
            )
            r.raise_for_status()
            return r.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Upstream error: {e}")

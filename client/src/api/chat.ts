// client/src/api/chat.ts
export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function streamChat(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
) {
  const baseURL =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL) ||
    "http://localhost:3000";
  const apiURL = `${baseURL.replace(/\/$/, "")}/api/chat`;


  try {
    const resp = await fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Chat API error: ${resp.status} ${text}`);
    }

    if (!resp.body) {
      throw new Error("No response body");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || ""; // Keep the last incomplete chunk

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.replace("data: ", "").trim();
          if (dataStr === "[DONE]") {
            onDone();
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.content) {
              onChunk(data.content);
            }
          } catch (e) {
            console.error("Error parsing SSE chunk:", e);
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.startsWith("data: ")) {
      const dataStr = buffer.replace("data: ", "").trim();
      if (dataStr === "[DONE]") {
        onDone();
        return;
      }
      try {
        const data = JSON.parse(dataStr);
        if (data.content) onChunk(data.content);
      } catch (e) {
        // ignore incomplete json at very end
      }
    }

    onDone();
  } catch (err) {
    console.error("Stream chat error:", err);
    onError(err as Error);
  }
}

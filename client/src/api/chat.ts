// client/src/api/chat.ts
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const baseURL =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL) ||
    "http://localhost:3000";
  const apiURL = `${baseURL.replace(/\/$/, "")}/api/chat`;

  const resp = await fetch(apiURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Chat API error:", text);
    throw new Error("Chat API error");
  }

  const data = await resp.json();
  return data.reply as string;
}

import { useState } from "react";
import { sendChat } from "./api/chat";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendChat(newMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, the server had an issue. Please try again soon."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h1>Mental Health Chatbot (vLLM @ GCP)</h1>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 12,
          height: 480,
          overflowY: "auto",
          marginBottom: 12
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "#777" }}>
            Share any stress, emotions, or sleep concerns, and I'll help you unpack
            them.
          </div>
        )}
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 8,
              textAlign: m.role === "user" ? "right" : "left"
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "6px 10px",
                borderRadius: 8,
                background:
                  m.role === "user" ? "#007bff" : "rgba(0,0,0,0.05)",
                color: m.role === "user" ? "#fff" : "#000",
                maxWidth: "80%",
                whiteSpace: "pre-wrap"
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: "#777", fontStyle: "italic" }}>
            Assistant is thinking...
          </div>
        )}
      </div>

      <div>
        <textarea
          rows={3}
          style={{ width: "100%", padding: 8, borderRadius: 8 }}
          placeholder="Start by describing what's been stressing you. (Enter sends, Shift+Enter adds a new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ marginTop: 8, padding: "6px 12px" }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;

import { useState, useRef, useEffect } from "react";
import { streamChat } from "./api/chat";
import MessageContent from "./components/MessageContent";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Add a placeholder for the assistant's response
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamChat(
      newMessages,
      (chunk) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + chunk },
            ];
          }
          return prev;
        });
      },
      () => {
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          // If the last message was empty (just started), replace it with error
          // If it had content, maybe append error or just stop.
          // Let's append a system error note.
          return [
            ...prev.slice(0, -1),
            { ...last, content: last.content + "\n\n*[Error: Connection failed]*" },
          ];
        });
        setLoading(false);
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app">
      <div className="shell">
        <div className="header">
          <div>
            <div className="eyebrow">AI Companion</div>
            <h1>Mental Health Chatbot</h1>
            <p className="subtitle">
              Share any stress, emotions, or sleep concerns, and I'll help you unpack them.
            </p>
          </div>
          <div className="badge">vLLM @ GCP</div>
        </div>

        <div className="chat">
          {messages.length === 0 && (
            <div style={{ color: "var(--text-subtle)", textAlign: "center", marginTop: 40 }}>
              Say hello to start the conversation.
            </div>
          )}
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`row ${m.role === "user" ? "row-user" : "row-assistant"}`}
            >
              <div className={`bubble ${m.role}`}>
                {m.role === "user" ? (
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                ) : (
                  <MessageContent content={m.content} />
                )}
              </div>
            </div>
          ))}
          {loading && messages.length > 0 && messages[messages.length - 1].content === "" && (
            <div className="row row-assistant">
              <div className="bubble assistant thinking">
                Thinking
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="composer">
          <textarea
            rows={1}
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

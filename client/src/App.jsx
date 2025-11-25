import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const initialAssistantMessage =
  "Hi, I'm CalmSpace. Share whatever feels heavy right now and I'll listen and offer small, practical steps.";

function App() {
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: initialAssistantMessage },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatRef = useRef(null);

  const sessionId = useMemo(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userEntry = { sender: 'user', text };
    setMessages((prev) => [...prev, userEntry]);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userMessage: text,
        }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const data = await response.json();
      const reply =
        (typeof data?.reply === 'string' && data.reply.trim()) ||
        "I'm here to listen. Could we try again in a moment?";

      setMessages((prev) => [...prev, { sender: 'assistant', text: reply }]);
    } catch (err) {
      console.error('Error sending message', err);
      setError(
        'I had trouble reaching the server. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      <div className="shell">
        <header className="header">
          <div>
            <p className="eyebrow">CalmSpace</p>
            <h1>Stress Listener</h1>
            <p className="subtitle">
              A gentle, non-judgmental companion for when you feel overwhelmed.
              I'm not a clinical tool, but I can listen and share small steps.
            </p>
          </div>
          <div className="badge">Here to listen</div>
        </header>

        <div className="chat" ref={chatRef}>
          {messages.map((message, index) => (
            <div
              key={`${message.sender}-${index}-${message.text.slice(0, 6)}`}
              className={`row ${
                message.sender === 'user' ? 'row-user' : 'row-assistant'
              }`}
            >
              <div className={`bubble ${message.sender}`}>{message.text}</div>
            </div>
          ))}

          {isLoading && (
            <div className="row row-assistant">
              <div className="bubble assistant thinking">I'm thinking...</div>
            </div>
          )}
        </div>

        {error ? <div className="error">{error}</div> : null}

        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind. Shift+Enter adds a new line."
            rows={3}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;

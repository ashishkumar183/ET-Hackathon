import { useState, useRef, useEffect } from "react";

export default function NavigatorSidebar({ onProfileComplete, hasProfile }) {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hey! I'm your ET Financial Navigator 👋 I'd love to build a custom financial roadmap for you. What's your name?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Map frontend messages to format Groq expects
      const chatHistory = messages.map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content
      }));

      // FIX: Updated the URL route here! 
      // If this still fails, try changing it to just "/api/chat" or "/api/navigator-chat" depending on your app.js setup!
     const response = await fetch("http://localhost:3000/api/navigator-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          chatHistory: chatHistory 
        }),
      });

      // ADDED: Better error handling to catch 404 Not Found errors
      if (!response.ok) {
         throw new Error(`Server rejected the request with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update chat UI with the AI's natural response
      setMessages((prev) => [...prev, { role: "ai", content: data.replyText }]);

      // THE MAGIC: If the AI gathered enough info, trigger the Dashboard and pass the massive JSON!
      if (data.isComplete && data.dashboardData) {
        onProfileComplete(data.dashboardData);
      }

    } catch (error) {
      console.error("Chat error details:", error);
      setMessages((prev) => [...prev, { role: "ai", content: "Sorry, I had a network hiccup! Check the browser console for details." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasProfile) {
    return (
      <div style={{ width: 340, background: "#111", borderRight: "1px solid #222", padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
        <div style={{ color: "#F0EDE8", fontWeight: "bold" }}>Profile Complete</div>
        <div style={{ color: "#888580", fontSize: 13, textAlign: "center", marginTop: 8 }}>Your dashboard is ready to view.</div>
      </div>
    );
  }

  return (
    <div style={{ width: 340, background: "#111", borderRight: "1px solid #222", display: "flex", flexDirection: "column", height: "100%" }}>
      
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #222", color: "#F0EDE8", fontWeight: "bold" }}>
        ET Navigator
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            alignSelf: msg.role === "ai" ? "flex-start" : "flex-end",
            background: msg.role === "ai" ? "#1A1A1A" : "#FF6B00",
            color: msg.role === "ai" ? "#F0EDE8" : "#fff",
            padding: "12px 16px",
            borderRadius: msg.role === "ai" ? "12px 12px 12px 2px" : "12px 12px 2px 12px",
            maxWidth: "85%",
            fontSize: 14,
            lineHeight: 1.5
          }}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div style={{ color: "#888580", fontSize: 12 }}>Typing...</div>}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: 20, borderTop: "1px solid #222" }}>
        <form onSubmit={handleSend} style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            style={{
              flex: 1, background: "#1A1A1A", border: "1px solid #333",
              color: "#F0EDE8", padding: "12px 16px", borderRadius: 8, outline: "none"
            }}
          />
          <button type="submit" disabled={isLoading} style={{
            background: "#FF6B00", color: "#fff", border: "none",
            borderRadius: 8, padding: "0 16px", cursor: isLoading ? "default" : "pointer"
          }}>
            →
          </button>
        </form>
      </div>
    </div>
  );
}
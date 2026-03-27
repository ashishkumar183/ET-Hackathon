import { useState, useRef, useEffect } from "react";

const QUESTIONS = [
  {
    id: "name",
    field: "name",
    text: "Hey! I'm your ET Financial Navigator 👋 What's your name?",
    type: "text",
    placeholder: "e.g. Arjun Sharma",
  },
  {
    id: "age",
    field: "age",
    text: (profile) => `Nice to meet you, ${profile.name}! How old are you?`,
    type: "chips",
    options: ["Under 25", "25–30", "31–35", "36–45", "45+"],
  },
  {
    id: "occupation",
    field: "occupation",
    text: "What best describes your occupation?",
    type: "chips",
    options: ["Software Engineer", "Business Owner", "Finance Professional", "Doctor / Lawyer", "Government / PSU", "Student"],
  },
  {
    id: "income",
    field: "income",
    text: "What's your approximate monthly take-home income?",
    type: "chips",
    options: ["Under ₹30K", "₹30K–60K", "₹60K–1L", "₹1L–2L", "₹2L+"],
  },
  {
    id: "savings",
    field: "savings",
    text: "How much do you save or invest per month right now?",
    type: "chips",
    options: ["Under ₹5K", "₹5K–15K", "₹15K–30K", "₹30K–50K", "₹50K+"],
  },
  {
    id: "liabilities",
    field: "liabilities",
    text: "Do you have any active loans or liabilities?",
    type: "chips",
    options: ["No loans", "Home Loan", "Car Loan", "Personal Loan", "Education Loan", "Multiple loans"],
  },
  {
    id: "insurance",
    field: "insurance",
    text: "What insurance do you currently have?",
    type: "chips",
    options: ["None", "Term insurance only", "Health insurance only", "Both term + health", "Have multiple policies"],
  },
  {
    id: "goal",
    field: "goal",
    text: "What's your #1 financial goal right now?",
    type: "chips",
    options: ["Save on taxes", "Build wealth via SIP", "Buy a home", "Retirement planning", "Child's education", "Emergency fund"],
  },
  {
    id: "risk",
    field: "risk",
    text: "Last one! 🎯 What's your risk appetite when investing?",
    type: "chips",
    options: ["Conservative (FD lover)", "Moderate (balanced)", "Aggressive (high risk = high reward)"],
  },
];

export default function NavigatorSidebar({ onProfileComplete, hasProfile }) {
  const [messages, setMessages] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [profile, setProfile] = useState({});
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [done, setDone] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initial greeting
    setTimeout(() => {
      pushAI(QUESTIONS[0].text);
    }, 500);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function pushAI(text) {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "ai", text }]);
    }, 800);
  }

  function handleAnswer(answer) {
    const q = QUESTIONS[currentQ];
    const newProfile = { ...profile, [q.field]: answer };
    setProfile(newProfile);

    setMessages((prev) => [...prev, { role: "user", text: answer }]);

    const next = currentQ + 1;
    if (next < QUESTIONS.length) {
      setCurrentQ(next);
      const nextQ = QUESTIONS[next];
      const qText = typeof nextQ.text === "function" ? nextQ.text(newProfile) : nextQ.text;
      pushAI(qText);
    } else {
      // All done
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setDone(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: `Perfect, ${newProfile.name}! 🎉 I have everything I need. Let me build your personalised Financial Dashboard now...`,
          },
        ]);
        setTimeout(() => onProfileComplete(newProfile), 1200);
      }, 800);
    }
  }

  function handleTextSubmit(e) {
    e.preventDefault();
    if (!inputVal.trim()) return;
    handleAnswer(inputVal.trim());
    setInputVal("");
  }

  const currentQuestion = QUESTIONS[currentQ];
  const progress = Math.round((currentQ / QUESTIONS.length) * 100);

  return (
    <aside className="nav-sidebar">
      {/* Header */}
      <div className="ns-header">
        <div className="ns-avatar">🤖</div>
        <div className="ns-header-info">
          <div className="ns-title">ET Financial Navigator</div>
          <div className="ns-status">
            {done ? (
              <span style={{ color: "#2ECC71" }}>● Analysis complete</span>
            ) : (
              <span style={{ color: "#FF6B00" }}>● Profiling in progress</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {!done && (
        <div className="ns-progress-wrap">
          <div className="ns-progress-label">
            <span>Question {Math.min(currentQ + 1, QUESTIONS.length)} of {QUESTIONS.length}</span>
            <span style={{ color: "#FF6B00" }}>{progress}%</span>
          </div>
          <div className="ns-progress-track">
            <div className="ns-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="ns-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ns-msg ns-msg-${msg.role}`}>
            {msg.role === "ai" && <div className="ns-msg-avatar">🤖</div>}
            <div className="ns-bubble">{msg.text}</div>
            {msg.role === "user" && <div className="ns-msg-avatar ns-user-av">👤</div>}
          </div>
        ))}
        {isTyping && (
          <div className="ns-msg ns-msg-ai">
            <div className="ns-msg-avatar">🤖</div>
            <div className="ns-bubble ns-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!done && !isTyping && messages.length > 0 && (
        <div className="ns-input-area">
          {currentQuestion?.type === "chips" ? (
            <div className="ns-chips">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt}
                  className="ns-chip"
                  onClick={() => handleAnswer(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <form className="ns-text-form" onSubmit={handleTextSubmit}>
              <input
                className="ns-text-input"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={currentQuestion?.placeholder || "Type your answer..."}
                autoFocus
              />
              <button type="submit" className="ns-send-btn">→</button>
            </form>
          )}
        </div>
      )}

      {done && hasProfile && (
        <div className="ns-done-footer">
          <div style={{ fontSize: 12, color: "#888580", textAlign: "center" }}>
            Dashboard built ✓ Ask me anything below
          </div>
          <form className="ns-text-form" onSubmit={(e) => {
            e.preventDefault();
            if (!inputVal.trim()) return;
            setMessages((prev) => [
              ...prev,
              { role: "user", text: inputVal },
              { role: "ai", text: "Great question! Check the dashboard for detailed insights on that. I've highlighted the relevant section for you. 👆" },
            ]);
            setInputVal("");
          }}>
            <input
              className="ns-text-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask a follow-up question..."
            />
            <button type="submit" className="ns-send-btn">→</button>
          </form>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        .nav-sidebar {
          width: 320px;
          flex-shrink: 0;
          background: #111111;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }
        .ns-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 12px;
          background: #161616;
          flex-shrink: 0;
        }
        .ns-avatar {
          width: 42px; height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #FF6B00, #FF9A00);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 4px 16px rgba(255,107,0,0.3);
          flex-shrink: 0;
        }
        .ns-title {
          font-family: 'Playfair Display', serif;
          font-size: 14px; font-weight: 700;
          color: #F0EDE8;
        }
        .ns-status { font-size: 11px; margin-top: 2px; }

        .ns-progress-wrap {
          padding: 12px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .ns-progress-label {
          display: flex; justify-content: space-between;
          font-size: 11px; color: #888580;
          margin-bottom: 6px;
          font-family: 'DM Mono', monospace;
        }
        .ns-progress-track {
          height: 3px; background: #1E1E1E; border-radius: 2px; overflow: hidden;
        }
        .ns-progress-fill {
          height: 100%; background: #FF6B00; border-radius: 2px;
          transition: width 0.4s ease;
        }

        .ns-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ns-messages::-webkit-scrollbar { width: 3px; }
        .ns-messages::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

        .ns-msg { display: flex; gap: 8px; align-items: flex-end; }
        .ns-msg-user { flex-direction: row-reverse; }
        .ns-msg-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
        }
        .ns-msg-ai .ns-msg-avatar { background: linear-gradient(135deg, #FF6B00, #FF9A00); }
        .ns-user-av { background: #1E1E1E; border: 1px solid #2a2a2a; }

        .ns-bubble {
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.55;
          max-width: 80%;
          word-break: break-word;
        }
        .ns-msg-ai .ns-bubble {
          background: #1A1A1A;
          border: 1px solid rgba(255,255,255,0.06);
          border-bottom-left-radius: 4px;
          color: #F0EDE8;
        }
        .ns-msg-user .ns-bubble {
          background: #FF6B00;
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        .ns-typing {
          display: flex; gap: 5px; align-items: center;
          padding: 14px 16px !important;
        }
        .ns-typing span {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #888580;
          animation: typingBounce 1.2s ease infinite;
        }
        .ns-typing span:nth-child(2) { animation-delay: 0.2s; }
        .ns-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
          0%,60%,100% { transform: none; opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .ns-input-area {
          padding: 12px 16px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .ns-chips {
          display: flex; flex-wrap: wrap; gap: 7px;
        }
        .ns-chip {
          padding: 7px 13px;
          border-radius: 20px;
          border: 1px solid rgba(255,107,0,0.3);
          background: rgba(255,107,0,0.06);
          color: #FF6B00;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          line-height: 1.3;
        }
        .ns-chip:hover {
          background: #FF6B00;
          color: #fff;
          border-color: #FF6B00;
          transform: translateY(-1px);
        }

        .ns-text-form {
          display: flex; gap: 8px; align-items: center;
        }
        .ns-text-input {
          flex: 1;
          background: #1A1A1A;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 14px;
          color: #F0EDE8;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .ns-text-input:focus { border-color: #FF6B00; }
        .ns-text-input::placeholder { color: #555; }
        .ns-send-btn {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: #FF6B00;
          border: none;
          color: #fff;
          font-size: 16px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .ns-send-btn:hover { background: #CC5500; transform: scale(0.95); }

        .ns-done-footer {
          padding: 12px 16px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column; gap: 10px;
          flex-shrink: 0;
        }
      `}</style>
    </aside>
  );
}

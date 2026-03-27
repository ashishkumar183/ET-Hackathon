import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function Onboarding({ user, setUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  const persona = user.persona || {};
  const currentStep = !persona.role ? 1 : !persona.goal ? 2 : !persona.interests ? 3 : 4;

  // --- INITIALIZATION ---
  useEffect(() => {
    // Only start the chat greeting if they are NOT onboarded yet
    if (!user.onboardingComplete && messages.length === 0) {
      if (user.chatHistory && user.chatHistory.length > 0) {
        setMessages(user.chatHistory);
      } else {
        const greeting = `Welcome to Economic Times! I'm your personal ET Concierge. I'll help you discover everything ET can do for you — from breaking markets news to mutual funds and exclusive masterclasses. This will take just 3 minutes. 🎯\n\nFirst up — **who are you?** What best describes your current role or occupation?`;
        setMessages([{ role: 'ai', content: greeting }]);
        speakText("Welcome to Economic Times! I'm your personal ET Concierge. First up, who are you?");
      }
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- VOICE AI ---
  const speakText = (text) => {
    window.speechSynthesis.cancel(); 
    // Strip markdown bolding for speech
    const cleanText = text.replace(/\*\*/g, ''); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; 
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser doesn't support voice input. Use Chrome.");

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleSendMessage(transcript); 
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // --- CHAT LOGIC ---
  const handleSendMessage = async (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, userId: user.id, currentPersona: user.persona || {} })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.replyText }]);
      speakText(data.replyText);

      if (data.extractedData) {
        setUser(prev => ({ ...prev, persona: { ...prev.persona, ...data.extractedData } }));
      }

      if (data.ui_trigger === "PersonaComplete") {
        setUser(prev => ({ ...prev, onboardingComplete: true }));
        // We do NOT redirect automatically anymore! We let them see the success screen.
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Network error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- SUGGESTION PILLS LOGIC ---
  const renderPills = () => {
    if (isLoading || user.onboardingComplete) return null;
    if (currentStep === 1) return ['👨‍💻 Software Engineer', '📈 Finance Professional', '🏢 Business Owner', '🎓 Student', '💼 Other'].map(p => <Pill key={p} text={p} onClick={() => handleSendMessage(p)} />);
    if (currentStep === 2) return ['💰 Save tax (ELSS, NPS)', '📊 Grow wealth (SIP, stocks)', '🏠 Buy a home / car', '🎓 Learn about investing'].map(p => <Pill key={p} text={p} onClick={() => handleSendMessage(p)} />);
    if (currentStep === 3) return ['Tech Stocks', 'Mutual Funds', 'Real Estate', 'Cryptocurrency'].map(p => <Pill key={p} text={p} onClick={() => handleSendMessage(p)} />);
    if (currentStep === 4) return ['Immediately', 'Next 3-6 months', 'Just exploring'].map(p => <Pill key={p} text={p} onClick={() => handleSendMessage(p)} />);
    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-[#080808] font-sans overflow-hidden text-white">
      <NavBar />

      <div className="flex flex-1 pt-[72px] h-full overflow-hidden">
        
        {/* LEFT SIDEBAR (Progress) */}
        <div className="w-[30%] max-w-sm border-r border-gray-900 bg-[#0a0a0a] p-8 flex flex-col z-10">
          <div className="flex items-center gap-3 mb-12 mt-4">
            <div className="bg-[#FF5000] text-white font-serif font-bold text-xl px-2 py-0.5 rounded shadow-lg">ET</div>
            <div className="font-serif text-xl tracking-wide">Economic<span className="text-[#FF5000]">Times</span></div>
          </div>

          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-8">Profiling Progress</div>

          <div className="space-y-8 flex-1 relative">
            {/* Connecting line behind steps */}
            <div className="absolute left-[15px] top-4 bottom-12 w-[2px] bg-gray-900 -z-10"></div>
            
            <Step active={currentStep === 1} done={currentStep > 1 || user.onboardingComplete} num="1" title="Who are you?" sub={persona.role || "Pending..."} />
            <Step active={currentStep === 2} done={currentStep > 2 || user.onboardingComplete} num="2" title="What's your goal?" sub={persona.goal || "Invest, grow, learn"} />
            <Step active={currentStep === 3} done={currentStep > 3 || user.onboardingComplete} num="3" title="Your interests?" sub={persona.interests || "Markets, sectors"} />
            <Step active={currentStep === 4} done={currentStep > 4 || user.onboardingComplete} num="4" title="Urgency?" sub={persona.urgency || "Timeline, stage"} />
          </div>

          {/* Live Persona Tracker Widget */}
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 mt-auto shadow-xl">
            <div className="text-[10px] text-[#FF5000] font-mono tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5000] animate-pulse"></span> {user.onboardingComplete ? 'Persona Built' : 'Building Persona'}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`px-3 py-2 rounded-lg border flex flex-col gap-1 ${persona.role ? 'border-[#FF5000]/30 bg-[#FF5000]/5 text-[#FF5000]' : 'border-gray-800 text-gray-600'}`}>
                <span className="text-[9px] uppercase tracking-wider text-gray-500">Role</span>
                <span className="font-medium truncate">{persona.role || 'TBD'}</span>
              </div>
              <div className={`px-3 py-2 rounded-lg border flex flex-col gap-1 ${persona.goal ? 'border-[#FF5000]/30 bg-[#FF5000]/5 text-[#FF5000]' : 'border-gray-800 text-gray-600'}`}>
                <span className="text-[9px] uppercase tracking-wider text-gray-500">Goal</span>
                <span className="font-medium truncate">{persona.goal || 'TBD'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN AREA */}
        <div className="flex-1 flex flex-col relative bg-[#080808]">
          
          {/* STATE 1: ONBOARDING COMPLETE SUMMARY */}
          {user.onboardingComplete ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 animate-fade-in-up">
              <div className="w-full max-w-2xl bg-[#111] border border-gray-800 rounded-3xl p-12 shadow-2xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-[#FF5000]"></div>
                
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-4xl font-serif font-bold text-white mb-4">Onboarding Complete</h2>
                <p className="text-gray-400 mb-10">We've mapped your financial persona. Here is what we learned about you:</p>
                
                <div className="grid grid-cols-2 gap-4 mb-10 text-left">
                  <SummaryCard label="Role" value={persona.role} />
                  <SummaryCard label="Goal" value={persona.goal} />
                  <SummaryCard label="Interests" value={persona.interests} />
                  <SummaryCard label="Urgency" value={persona.urgency} />
                </div>

                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-[#FF5000] hover:bg-[#ff6a20] text-white font-bold text-lg px-10 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(255,80,0,0.3)]"
                >
                  Go to Co-Pilot Dashboard →
                </button>
              </div>
            </div>
          ) : (
            /* STATE 2: ACTIVE CHAT INTERFACE */
            <>
              {/* Header */}
              <div className="p-8 pb-6 flex items-center gap-4 border-b border-gray-900 bg-[#080808]/90 backdrop-blur-md z-10 sticky top-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF5000] to-orange-700 flex items-center justify-center text-2xl shadow-lg shrink-0">🤖</div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-white">ET Concierge</h2>
                  <p className="text-sm text-green-500 flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Profiling in progress — step {currentStep} of 4
                  </p>
                </div>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex gap-4 max-w-[75%] items-end">
                      
                      {/* AI Avatar */}
                      {msg.role === 'ai' && (
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0 mb-1">🤖</div>
                      )}
                      
                      {/* Bubble */}
                      <div className={`p-5 text-[15px] leading-relaxed shadow-lg ${
                        msg.role === 'user' 
                          ? 'bg-[#FF5000] text-white rounded-3xl rounded-br-sm' 
                          : 'bg-[#1a1a1a] text-gray-200 border border-gray-800 rounded-3xl rounded-bl-sm whitespace-pre-wrap'
                      }`}>
                        {msg.content}
                      </div>

                      {/* User Avatar */}
                      {msg.role === 'user' && (
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0 mb-1 text-gray-400">👤</div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Render Suggestion Pills */}
                {messages.length > 0 && messages[messages.length - 1].role === 'ai' && (
                  <div className="flex flex-wrap gap-3 pl-14 pt-2 animate-fade-in-up">
                    {renderPills()}
                  </div>
                )}
                
                {isLoading && <div className="pl-14 text-sm text-gray-500 animate-pulse">Concierge is typing...</div>}
                <div ref={chatEndRef} className="h-4" />
              </div>

              {/* Input Area with Voice */}
              <div className="p-8 pt-4 bg-[#080808]">
                <div className="bg-[#111] border border-gray-800 rounded-2xl p-2 pl-4 flex items-center gap-3 focus-within:border-[#FF5000]/50 transition-all shadow-xl">
                  
                  <button 
                    onClick={startListening}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shrink-0 ${isListening ? 'bg-[#FF5000] animate-pulse text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}
                  >
                    🎙️
                  </button>

                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isListening ? "Listening..." : "Or type your answer here..."}
                    className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder-gray-600"
                  />
                  
                  <button 
                    onClick={() => handleSendMessage()}
                    className="bg-[#FF5000] hover:bg-[#ff6a20] text-white w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-lg shrink-0"
                  >
                    →
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// Sub-components
function Step({ active, done, num, title, sub }) {
  return (
    <div className={`flex gap-4 relative z-10 transition-opacity duration-300 ${active || done ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
        done ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
             : (active ? 'bg-[#FF5000] text-white shadow-[0_0_10px_rgba(255,80,0,0.3)]' 
                       : 'bg-gray-900 text-gray-500 border border-gray-800')
      }`}>
        {done ? '✓' : num}
      </div>
      <div>
        <div className={`font-bold text-sm ${active || done ? 'text-white' : 'text-gray-400'}`}>{title}</div>
        <div className="text-xs text-gray-500 mt-1 capitalize">{sub}</div>
      </div>
    </div>
  );
}

function Pill({ text, onClick }) {
  return (
    <button onClick={onClick} className="border border-[#FF5000]/30 text-[#FF5000] hover:bg-[#FF5000] hover:text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-[#FF5000]/20 flex items-center gap-2">
      {text}
    </button>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-800">
      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">{label}</div>
      <div className="text-white font-medium capitalize text-lg">{value || '---'}</div>
    </div>
  );
}
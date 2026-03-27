import React, { useState, useEffect, useRef } from 'react';
import NavBar from '../components/NavBar';

export default function Dashboard({ user, setUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [dashboardWidgets, setDashboardWidgets] = useState([]); 
  
  const chatEndRef = useRef(null);

  // --- RESTORE HISTORY & WIDGETS ---
  useEffect(() => {
    if (user && messages.length === 0) {
      if (user.chatHistory && user.chatHistory.length > 0) {
        setMessages(user.chatHistory);
      } else {
        const greeting = `Your profile is ready, ${user.name.split(' ')[0]}! I've curated your ET home. How can I help you invest today?`;
        setMessages([{ role: 'ai', content: greeting }]);
      }

      // Always show the Profile Success/Home card at the top
      setDashboardWidgets([{ id: 'profile-success', type: 'PersonaComplete', data: null }]);
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- VOICE AI ---
  const speakText = (text) => {
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; 
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser doesn't support voice. Use Chrome.");

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

      if (data.ui_trigger && data.ui_trigger !== "None" && data.ui_trigger !== "PersonaComplete") {
        setDashboardWidgets(prev => [
          { id: Date.now(), type: data.ui_trigger, data: data.widgetData },
          ...prev
        ]);
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Network error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] font-sans overflow-hidden">
      
      {/* Top Navigation Bar */}
      <NavBar />

      {/* Main Layout Area (Padding top to account for fixed NavBar) */}
      <div className="flex flex-1 pt-[72px] h-full overflow-hidden">
        
        {/* --------------------------------------------------------- */}
        {/* LEFT PANEL: Chat Interface (Dark Theme)                   */}
        {/* --------------------------------------------------------- */}
        <div className="w-[30%] bg-[#0b0b0b] border-r border-gray-800 flex flex-col z-10">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5000] to-orange-700 flex items-center justify-center text-xl shadow-lg">🤖</div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white">ET Concierge</h2>
              <p className="text-xs text-green-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Persona locked
              </p>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[14px] shadow-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#FF5000] text-white rounded-tr-sm' 
                    : 'bg-[#1a1a1a] border border-gray-800 text-gray-200 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-gray-500 text-xs animate-pulse ml-2">ET AI is analyzing...</div>}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 pt-2 bg-[#0b0b0b]">
            <div className="bg-[#111] border border-gray-800 rounded-full p-1.5 pl-4 flex items-center gap-3 focus-within:border-[#FF5000]/50 transition-colors shadow-xl">
              <button 
                onClick={startListening}
                className={`p-2 rounded-full transition-all ${isListening ? 'bg-[#FF5000] animate-pulse text-white' : 'text-gray-400 hover:text-[#FF5000]'}`}
              >
                {isListening ? '🎙️' : '🎤'}
              </button>
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about stocks, mutual funds..."
                className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder-gray-600 text-sm"
              />
              <button 
                onClick={() => handleSendMessage()}
                className="bg-[#FF5000] text-white w-10 h-10 rounded-full font-bold hover:bg-[#ff6a20] transition-colors flex items-center justify-center shrink-0"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* RIGHT PANEL: Dynamic Canvas Widgets (Dark Theme)          */}
        {/* --------------------------------------------------------- */}
        <div className="w-[70%] bg-[#050505] p-10 relative overflow-y-auto flex flex-col gap-10">
          
          {dashboardWidgets.map((widget) => {
            
            {/* 1. Profile Success / Dashboard Header */}
            if (widget.type === 'PersonaComplete') {
              return (
                <div key={widget.id} className="animate-fade-in-up w-full">
                  <div className="mb-10 flex justify-between items-end border-b border-gray-800/50 pb-6">
                    <div>
                      <h1 className="text-4xl font-serif font-bold text-white mb-3">
                        Your ET Home — Curated for <span className="text-[#FF5000]">{user.name?.split(' ')[0]}</span>
                      </h1>
                      <div className="text-gray-500 text-sm flex items-center gap-3 font-medium">
                        <span>Updated just now</span>
                        <span className="text-gray-700">•</span>
                        <span>Persona: <span className="text-gray-300">{user.persona?.role || 'Professional'}</span></span>
                        <span className="text-gray-700">•</span>
                        <span>Goal: <span className="text-gray-300">{user.persona?.goal || 'Investing'}</span></span>
                      </div>
                    </div>
                    <div className="flex gap-2 text-[10px] font-bold tracking-widest uppercase text-[#FF5000]">
                      <span className="px-2 py-1 bg-[#FF5000]/10 rounded border border-[#FF5000]/20">ELSS</span>
                      <span className="px-2 py-1 bg-[#FF5000]/10 rounded border border-[#FF5000]/20">80C</span>
                      <span className="px-2 py-1 bg-[#FF5000]/10 rounded border border-[#FF5000]/20">MODERATE RISK</span>
                    </div>
                  </div>

                  {/* Dummy Visual ET Prime Section to match mockup */}
                  <div className="mb-4">
                    <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-6 flex items-center gap-2">
                      <span className="text-gray-700">■</span> ET PRIME - FOR YOU
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-colors cursor-pointer">
                        <div className="bg-yellow-600/20 text-yellow-500 text-xs font-bold px-2 py-1 rounded inline-block mb-8">PRIME</div>
                        <h4 className="text-white font-serif text-lg font-bold leading-tight mb-4">Budget 2026: New Tax Regime vs Old — What to Choose</h4>
                        <div className="flex justify-between text-xs text-gray-500"><span className="flex items-center gap-1">⏱ 6 min read</span><span className="text-red-500 font-bold">MUST READ</span></div>
                      </div>
                      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-colors cursor-pointer">
                        <div className="bg-blue-600/20 text-blue-400 text-xs font-bold px-2 py-1 rounded inline-block mb-8">MARKETS</div>
                        <h4 className="text-white font-serif text-lg font-bold leading-tight mb-4">Nifty 50 at 25,500 — Is Now the Right Time to Start SIP?</h4>
                        <div className="flex justify-between text-xs text-gray-500"><span className="flex items-center gap-1">⏱ 4 min read</span><span>2h ago</span></div>
                      </div>
                      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-colors cursor-pointer">
                        <div className="bg-purple-600/20 text-purple-400 text-xs font-bold px-2 py-1 rounded inline-block mb-8">TECH</div>
                        <h4 className="text-white font-serif text-lg font-bold leading-tight mb-4">How India's Tech Sector Is Responding to Global AI Boom</h4>
                        <div className="flex justify-between text-xs text-gray-500"><span className="flex items-center gap-1">⏱ 8 min read</span><span>6h ago</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            {/* 2. ET Markets Screener Widget (Dark Table Format from Mockup) */}
            if (widget.type === 'FundScreener' && widget.data) {
              return (
                <div key={widget.id} className="w-full animate-fade-in-up mt-8">
                  <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-6 flex items-center gap-2">
                    <span className="text-gray-700">■</span> ET WEALTH - SCREENER RESULTS
                  </div>
                  
                  <div className="bg-[#111] border border-gray-800 rounded-2xl p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-serif font-bold text-white">{widget.data.title || 'Curated Top Picks'}</h3>
                      <div className="flex gap-2">
                         <button className="border border-[#FF5000] text-[#FF5000] text-xs px-4 py-1.5 rounded-full font-bold">Moderate Risk</button>
                         <button className="border border-gray-700 text-gray-400 text-xs px-4 py-1.5 rounded-full font-medium">High Risk</button>
                      </div>
                    </div>

                    {/* Table Header */}
                    <div className="flex justify-between border-b border-gray-800 pb-4 mb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <div className="w-2/5">Asset Name</div>
                      <div className="w-1/5 text-center">Risk Profile</div>
                      <div className="w-1/5 text-center">1Y Return</div>
                      <div className="w-1/5 text-right">Action</div>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-2">
                      {(widget.data.stocks || widget.data.funds || []).map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-4 border-b border-gray-800/50 hover:bg-[#1a1a1a] transition-colors rounded-lg px-2 -mx-2">
                          <div className="w-2/5">
                            <p className="font-bold text-gray-200 text-lg">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-1">₹{item.current_price || item.nav || '---'} • Large Cap</p>
                          </div>
                          <div className="w-1/5 text-center">
                            <span className="text-yellow-600 text-xs font-bold bg-yellow-900/20 px-2 py-1 rounded">Moderate</span>
                          </div>
                          <div className="w-1/5 text-center text-green-500 font-bold text-lg">
                            +{item.return_1yr}
                          </div>
                          <div className="w-1/5 text-right">
                            <button className="bg-[#FF5000] hover:bg-[#ff6a20] text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm shadow-lg shadow-[#FF5000]/20">
                              Invest Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}

        </div>
      </div>
    </div>
  );
}
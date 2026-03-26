import React, { useState, useEffect, useRef } from 'react';
import AuthScreen from './components/AuthScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  // This array stores our feed of widgets!
  const [dashboardWidgets, setDashboardWidgets] = useState([]); 
  
  const chatEndRef = useRef(null);

  // --- INITIALIZATION & RESTORING PROGRESS ---
  useEffect(() => {
    if (user && messages.length === 0) {
      
      // 1. If they have chat history in the database, LOAD IT!
      if (user.chatHistory && user.chatHistory.length > 0) {
        setMessages(user.chatHistory);
        
        // If they are also fully onboarded, show the success widget
        if (user.onboardingComplete) {
          setDashboardWidgets([{ id: Date.now(), type: 'PersonaComplete', data: null }]);
        }
        return; // Stop here so we don't say the greeting again!
      }

      // 2. If they are brand new, start the greeting
      if (user.onboardingComplete) {
        const greeting = `Welcome back, ${user.name}. Your ET financial hub is ready.`;
        setMessages([{ role: 'ai', content: greeting }]);
        speakText(greeting);
        setDashboardWidgets([{ id: Date.now(), type: 'PersonaComplete', data: null }]);
      } else {
        const knownTraits = Object.values(user.persona || {}).filter(v => v !== "").length;
        const greeting = knownTraits > 0 
          ? `Welcome back, ${user.name}! We still need a few more details to finish your profile.`
          : `Hi ${user.name}! I'm your ET AI. Before we unlock your dashboard, let's set up your profile.`;
        
        setMessages([{ role: 'ai', content: greeting }]);
        speakText(greeting);
      }
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- VOICE AI: TEXT-TO-SPEECH ---
  const speakText = (text) => {
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; 
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // --- VOICE AI: SPEECH-TO-TEXT ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support voice input. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      // AUTO-SEND the voice reply so the user doesn't have to click anything!
      handleSendMessage(transcript); 
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
    };

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
        body: JSON.stringify({
          message: userMsg.content,
          userId: user.id, 
          currentPersona: user.persona || {} 
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, { role: 'ai', content: data.replyText }]);
      speakText(data.replyText);

      if (data.extractedData) {
        setUser(prev => ({
          ...prev,
          persona: {
            ...prev.persona,
            ...data.extractedData
          }
        }));
      }

      // Handle UI triggers from Groq (Now adds to the feed!)
      if (data.ui_trigger === "PersonaComplete") {
        setUser(prev => ({ ...prev, onboardingComplete: true }));
        // Add the success card to the dashboard
        setDashboardWidgets([{ id: Date.now(), type: 'PersonaComplete', data: null }]);
      } else if (data.ui_trigger && data.ui_trigger !== "None") {
        // Push new widgets to the TOP of the feed
        setDashboardWidgets(prev => [
          { id: Date.now(), type: data.ui_trigger, data: data.widgetData },
          ...prev
        ]);
      }

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Network error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Auth Screen (Gatekeeper)
  if (!user) return <AuthScreen onLoginSuccess={setUser} />;

  // Get the latest AI question to display prominently on the popup modal
  const latestAiMessage = [...messages].reverse().find(m => m.role === 'ai')?.content || "Loading...";

  // 2. Main Application UI
  return (
    <div className="flex h-screen bg-gray-100 font-sans relative">
      
      {/* --------------------------------------------------------- */}
      {/* ONBOARDING POPUP (MODAL) - Shows only if incomplete       */}
      {/* --------------------------------------------------------- */}
      {!user.onboardingComplete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center transform transition-all relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
            <h2 className="text-gray-400 font-bold text-xs tracking-widest uppercase mb-6">ET AI Profiling</h2>
            
            <p className="text-2xl font-semibold text-gray-800 mb-10 leading-relaxed min-h-[80px] flex items-center justify-center">
              {isLoading ? (
                <span className="animate-pulse text-gray-400">Processing your answer...</span>
              ) : (
                `"${latestAiMessage}"`
              )}
            </p>

            <div className="flex flex-col items-center justify-center mb-6">
              <button 
                onClick={startListening}
                disabled={isLoading}
                className={`w-24 h-24 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-500 animate-pulse scale-110 shadow-red-500/50' 
                    : 'bg-gray-900 hover:bg-black hover:scale-105 disabled:opacity-50 disabled:hover:scale-100'
                }`}
              >
                <span className="text-4xl">{isListening ? '🎙️' : '🎤'}</span>
              </button>
              <p className="mt-4 text-sm text-gray-500 font-medium">
                {isListening ? 'Listening... Speak now' : 'Tap to answer'}
              </p>
            </div>

            <div className="flex mt-8">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Or type your answer here..."
                disabled={isLoading}
                className="flex-1 border-b-2 border-gray-200 p-2 focus:outline-none focus:border-red-500 bg-transparent text-center text-gray-700 transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* BACKGROUND DASHBOARD                                      */}
      {/* --------------------------------------------------------- */}
      <div className={`flex w-full h-full transition-all duration-700 ${!user.onboardingComplete ? 'blur-sm scale-[0.98] opacity-60 pointer-events-none' : ''}`}>
        
        {/* LEFT PANEL: Chat History */}
        <div className="w-[35%] bg-white border-r border-gray-200 flex flex-col shadow-2xl z-10">
          <div className="p-5 bg-red-600 text-white font-bold text-xl flex justify-between items-center shadow-md">
            <span>ET Concierge</span>
            <button 
              onClick={() => {
                setUser(null);
                localStorage.removeItem('et_token');
              }} 
              className="text-sm bg-red-700 px-3 py-1 rounded hover:bg-red-800 transition shadow-sm"
            >
              Logout
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-xl text-sm shadow-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-gray-900 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 text-gray-800   rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-gray-400 text-sm animate-pulse ml-2">ET AI is typing...</div>}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-200 flex gap-2">
            <button 
              onClick={startListening}
              className={`p-3 rounded-lg text-white transition-all shadow-md ${
                  isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-800 hover:bg-black'
              }`}
            >
              {isListening ? '🎙️' : '🎤'}
            </button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type or speak..."
              className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
            />
            <button 
              onClick={() => handleSendMessage()}
              className="bg-red-600 text-white px-5 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md"
            >
              Send
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* RIGHT PANEL: Dynamic Canvas Widgets (Scrollable Feed)     */}
        {/* --------------------------------------------------------- */}
        <div className="w-[65%] bg-gray-100 p-8 relative overflow-y-auto flex flex-col items-center gap-8 pb-20">
          
          {dashboardWidgets.map((widget) => {
            
            {/* 1. Profile Success State */}
            if (widget.type === 'PersonaComplete') {
              return (
                <div key={widget.id} className="p-10 bg-white shadow-2xl rounded-2xl border-t-8 border-red-600 text-center max-w-lg w-full transform transition-all animate-fade-in-up">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-3xl font-extrabold text-gray-900 mb-2">Profile Unlocked!</h3>
                  <p className="text-gray-600 mb-6 text-lg">Your ET ecosystem is now perfectly tailored.</p>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                      <span className="block text-xs font-bold text-gray-400 uppercase">Role</span>
                      <span className="font-semibold text-gray-800">{user.persona?.role || 'Professional'}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                      <span className="block text-xs font-bold text-gray-400 uppercase">Goal</span>
                      <span className="font-semibold text-gray-800">{user.persona?.goal || 'Investing'}</span>
                    </div>
                  </div>
                </div>
              );
            }

            {/* 2. ET Markets Fund/Stock Screener */}
            if (widget.type === 'FundScreener' && widget.data) {
              return (
                <div key={widget.id} className="bg-white shadow-2xl rounded-2xl border-t-8 border-green-500 w-full max-w-4xl p-8 transform transition-all animate-fade-in-up">
                  
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-3xl font-extrabold text-gray-900">{widget.data.title || 'Market Screener'}</h3>
                      <p className="text-gray-500 mt-1">Curated picks based on your profile</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-sm">
                      Live Data
                    </span>
                  </div>

                  {/* Grid of Stock/Fund Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(widget.data.stocks || widget.data.funds || []).map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                        
                        {/* Hover Effect Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>

                        <h4 className="text-xl font-bold text-gray-800 mb-4">{item.name}</h4>

                        <div className="flex justify-between items-end mb-6">
                          <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Price</p>
                            <p className="text-2xl font-black text-gray-900">
                              ₹{item.current_price || item.nav || '---'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">1Y Return</p>
                            <p className="text-lg font-bold text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                              +{item.return_1yr}
                            </p>
                          </div>
                        </div>

                        <button className="w-full bg-gray-900 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors duration-300 shadow-md">
                          Invest Now
                        </button>
                      </div>
                    ))}
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
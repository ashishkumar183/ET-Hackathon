import React, { useState } from 'react';
// We will build these widget components next!
// import ArticleCard from './components/ArticleCard';
// import FundScreener from './components/FundScreener';
// import EventPass from './components/EventPass';

export default function ETConciergeDashboard() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Welcome to ET. I'm your AI Concierge. What are your financial goals today?" }
  ]);
  const [inputText, setInputText] = useState('');
  
  // These states control the right side of the screen
  const [activeWidget, setActiveWidget] = useState(null); 
  const [widgetData, setWidgetData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // 1. Add user message to chat
    const userMsg = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // 2. Call your Node.js Backend
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          // You can expand this later with real user data
          userProfile: { role: "Early Career", goal: "Investing" } 
        })
      });

      const data = await response.json();

      // 3. Update chat with Groq's text reply
      setMessages(prev => [...prev, { role: 'ai', content: data.replyText }]);

      // 4. THE MAGIC: Update the Right Canvas based on Groq's decision
      if (data.ui_trigger && data.ui_trigger !== "None") {
        setActiveWidget(data.ui_trigger);
        setWidgetData(data.widgetData);
      }

    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting to the ET network." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* LEFT PANEL: The Chat (30% width) */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col shadow-lg z-10">
        <div className="p-4 bg-red-600 text-white font-bold text-xl">
          ET Concierge
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                msg.role === 'user' ? 'bg-black text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-gray-400 text-sm animate-pulse">Thinking...</div>}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 flex">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about markets, taxes, or events..."
            className="flex-1 border border-gray-300 rounded-l-lg p-2 focus:outline-none focus:border-red-500"
          />
          <button 
            onClick={sendMessage}
            className="bg-red-600 text-white px-4 rounded-r-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: The Dynamic Canvas (70% width) */}
      <div className="w-2/3 bg-gray-50 flex items-center justify-center p-8 relative overflow-hidden">
        {/* We use a switch statement to render the correct widget based on state */}
        {!activeWidget && (
          <div className="text-center text-gray-400">
            <h2 className="text-2xl font-bold mb-2">Your Financial Hub</h2>
            <p>Chat with the concierge to unlock tools and insights.</p>
          </div>
        )}

        {/* Placeholder for when we build the components */}
        {activeWidget === 'ArticleCard' && (
          <div className="p-8 bg-white shadow-xl rounded-xl border-l-4 border-red-500 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-gray-800">Reading Mode</h3>
            <pre className="mt-4 text-sm text-gray-600 overflow-auto">{JSON.stringify(widgetData, null, 2)}</pre>
          </div>
        )}
        
        {activeWidget === 'FundScreener' && (
           <div className="p-8 bg-white shadow-xl rounded-xl border-l-4 border-green-500 max-w-2xl w-full">
             <h3 className="text-xl font-bold text-gray-800">ET Markets Screener</h3>
             <pre className="mt-4 text-sm text-gray-600 overflow-auto">{JSON.stringify(widgetData, null, 2)}</pre>
           </div>
        )}

        {activeWidget === 'EventPass' && (
           <div className="p-8 bg-white shadow-xl rounded-xl border-l-4 border-blue-500 max-w-2xl w-full">
             <h3 className="text-xl font-bold text-gray-800">ET Masterclass Invite</h3>
             <pre className="mt-4 text-sm text-gray-600 overflow-auto">{JSON.stringify(widgetData, null, 2)}</pre>
           </div>
        )}
      </div>

    </div>
  );
}
import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import AuthModal from '../components/AuthModal';

export default function Landing({ onLoginSuccess }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#080808] relative font-sans selection:bg-[#FF5000] selection:text-white">
      <NavBar />

      {/* Background patterns */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#080808_85%)]"></div>

      {/* Main Content */}
      <div className="relative z-10 pt-32 flex flex-col items-center">
        
        {/* CENTERED ET LOGO */}
        <div className="flex items-center justify-center gap-3 mb-10 mt-10">
          <div className="bg-[#FF5000] text-white font-serif font-bold text-3xl px-3 py-1 rounded-lg shadow-lg">ET</div>
          <div className="text-white font-serif text-3xl font-medium tracking-wide">
            Economic<span className="text-[#FF5000]">Times</span>
          </div>
        </div>

        {/* HERO SECTION */}
        <div className="text-center flex flex-col items-center px-6 max-w-5xl animate-fade-in-up w-full">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-12 bg-gray-800"></div>
            <span className="text-[#FF5000] tracking-[0.25em] text-xs font-bold uppercase">AI-Powered Financial Concierge</span>
            <div className="h-[1px] w-12 bg-gray-800"></div>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif font-bold text-white leading-[1.05] tracking-tight mb-8 drop-shadow-2xl">
            Your entire <br/>
            <span className="text-[#FF5000]">financial universe,</span><br/>
            understood in 3 minutes.
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-16 font-light">
            ET's AI concierge learns who you are, maps your goals, and becomes your personal guide to everything Economic Times can do for you — from markets to masterclasses.
          </p>

          <div className="flex flex-col items-center gap-10">
            <button 
              onClick={() => setShowModal(true)}
              className="bg-[#FF5000] hover:bg-[#ff6a20] text-white font-bold text-lg px-12 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-[0_0_30px_rgba(255,80,0,0.3)] hover:shadow-[0_0_40px_rgba(255,80,0,0.5)] flex items-center gap-2"
            >
              Start My Profile <span className="text-xl">→</span>
            </button>
            <div className="border border-gray-800 text-white rounded-full px-8 py-3 hover:bg-gray-900 transition-colors text-sm cursor-pointer font-medium tracking-wide">
              Explore Dashboard
            </div>
          </div>
        </div>

        {/* PRODUCT CARDS */}
        <div className="w-full max-w-7xl px-6 py-24 flex flex-col items-center mt-20 mb-20 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            <ProductCard icon="🎯" title="ET Welcome Concierge" text="3-minute smart profiling that maps you to the right ET products and creates your personalized onboarding path." />
            <ProductCard icon="💼" title="Financial Life Navigator" text="Deep conversational AI that understands your complete financial picture and guides you to the right tools and services." />
            <ProductCard icon="📈" title="ET Markets & Wealth" text="Portfolio gap analysis, curated mutual fund recommendations, and proactive SIP nudges based on your profile." />
            <ProductCard icon="🎓" title="Masterclasses & Summits" text="AI-matched events and masterclasses based on your learning goals and career stage. VIP access, curated for you." />
          </div>
        </div>
      </div>

      {/* Conditionally render the modal */}
      {showModal && (
        <AuthModal 
          onClose={() => setShowModal(false)} 
          onLoginSuccess={onLoginSuccess} 
        />
      )}
    </div>
  );
}

function ProductCard({ icon, title, text }) {
  return (
    <div className="bg-[#0f0f0f] rounded-2xl p-8 border border-gray-800/80 shadow-2xl hover:border-gray-600 transition-all duration-300 text-left flex flex-col gap-4">
      <div className="w-12 h-12 flex items-center justify-center bg-gray-900 rounded-xl text-2xl border border-gray-800">{icon}</div>
      <h4 className="text-xl font-serif font-bold text-gray-100 leading-tight tracking-wide">{title}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
import React from 'react';

export default function NavBar() {
  return (
    <header className="fixed top-0 left-0 w-full bg-[#080808]/90 backdrop-blur-md border-b border-gray-900 z-50 flex items-center justify-between px-8 py-4 shadow-2xl">
      <div className="text-gray-500 font-mono text-sm tracking-[0.15em] uppercase">
        ET AI CONCIERGE
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 text-sm font-semibold text-white bg-[#FF5000] px-5 py-2 rounded-full shadow-lg">
          <span>🏠</span> Landing
        </button>
        <button className="flex items-center gap-2 text-sm font-medium text-gray-400 bg-transparent border border-gray-800 px-5 py-2 rounded-full hover:text-white hover:border-gray-600 transition-colors">
          <span>💬</span> Onboarding
        </button>
        <button className="flex items-center gap-2 text-sm font-medium text-gray-400 bg-transparent border border-gray-800 px-5 py-2 rounded-full hover:text-white hover:border-gray-600 transition-colors">
          <span>🧭</span> Co-Pilot Dashboard
        </button>
        <button className="flex items-center gap-2 text-sm font-medium text-gray-400 bg-transparent border border-gray-800 px-5 py-2 rounded-full hover:text-white hover:border-gray-600 transition-colors">
          <span>📊</span> Financial Navigator
        </button>
      </div>
    </header>
  );
}
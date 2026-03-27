import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function NavBar() {
  // Get the current URL path and navigation function
  const location = useLocation();
  const navigate = useNavigate();

  // Helper function to check if the button matches the current page
  const isActive = (path) => location.pathname === path;

  // Reusable active/inactive CSS styles
  const activeStyle = "text-white bg-[#FF5000] border border-[#FF5000] shadow-[0_0_15px_rgba(255,80,0,0.3)]";
  const inactiveStyle = "text-gray-400 bg-transparent border border-gray-800 hover:text-white hover:border-gray-600";
  const baseStyle = "flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300";

  return (
    <header className="fixed top-0 left-0 w-full bg-[#080808]/90 backdrop-blur-md border-b border-gray-900 z-50 flex items-center justify-between px-8 py-4 shadow-2xl">
      <div className="text-gray-500 font-mono text-sm tracking-[0.15em] uppercase">
        ET AI CONCIERGE — UI MOCKUP
      </div>
      
      <div className="flex items-center gap-3">
        
        {/* Landing Button */}
        <button 
          onClick={() => navigate('/')}
          className={`${baseStyle} ${isActive('/') ? activeStyle : inactiveStyle}`}
        >
          <span>🏠</span> Landing
        </button>

        {/* Onboarding Button */}
        <button 
          onClick={() => navigate('/onboarding')}
          className={`${baseStyle} ${isActive('/onboarding') ? activeStyle : inactiveStyle}`}
        >
          <span>💬</span> Onboarding
        </button>

        {/* Dashboard Button */}
        <button 
          onClick={() => navigate('/dashboard')}
          className={`${baseStyle} ${isActive('/dashboard') ? activeStyle : inactiveStyle}`}
        >
          <span>🧭</span> Co-Pilot Dashboard
        </button>

        {/* Financial Navigator (Future Feature) */}
        <button 
          className={`${baseStyle} ${isActive('/navigator') ? activeStyle : inactiveStyle} opacity-50 cursor-not-allowed`}
          title="Coming Soon"
        >
          <span>📊</span> Financial Navigator
        </button>

      </div>
    </header>
  );
}
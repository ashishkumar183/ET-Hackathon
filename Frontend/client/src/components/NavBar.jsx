import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const activeStyle = "text-white bg-[#FF5000] border border-[#FF5000] shadow-[0_0_15px_rgba(255,80,0,0.3)]";
  const inactiveStyle = "text-gray-400 bg-transparent border border-gray-800 hover:text-white hover:border-gray-600";
  const baseStyle = "flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300";

  return (
    <header className="fixed top-0 left-0 w-full bg-[#080808]/90 backdrop-blur-md border-b border-gray-900 z-50 flex items-center justify-between px-8 py-4 shadow-2xl">
      
      <div className="text-gray-500 font-mono text-sm tracking-[0.15em] uppercase">
        ET AI CONCIERGE 
      </div>
      
      <div className="flex items-center gap-3">
        
        {/* Landing */}
        <button 
          onClick={() => navigate('/')}
          className={`${baseStyle} ${isActive('/') ? activeStyle : inactiveStyle}`}
        >
          🏠 Landing
        </button>

        {/* Onboarding */}
        <button 
          onClick={() => navigate('/onboarding')}
          className={`${baseStyle} ${isActive('/onboarding') ? activeStyle : inactiveStyle}`}
        >
          💬 Onboarding
        </button>

        {/* Dashboard */}
        <button 
          onClick={() => navigate('/dashboard')}
          className={`${baseStyle} ${isActive('/dashboard') ? activeStyle : inactiveStyle}`}
        >
          🧭 Co-Pilot Dashboard
        </button>

        {/*  Financial Navigator  */}
        <button 
          onClick={() => navigate('/navigator')}
          className={`${baseStyle} ${isActive('/navigator') ? activeStyle : inactiveStyle}`}
        >
          📊 Financial Navigator
        </button>

      </div>
    </header>
  );
}
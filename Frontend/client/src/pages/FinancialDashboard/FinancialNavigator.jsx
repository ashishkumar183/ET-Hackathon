import { useState, useEffect } from "react";
import NavigatorSidebar from "./NavigatorSidebar";
import FinancialDashboard from "./FinancialDashboard";
import EmptyDashboard from "./EmptyDashboard";

export default function FinancialNavigator() {
  const [financialProfile, setFinancialProfile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // CRITICAL FIX: Changed the key to force a clean slate, ignoring old string data!
    const saved = localStorage.getItem("et_dynamic_dashboard");
    if (saved) {
      setFinancialProfile(JSON.parse(saved));
    }
  }, []);

  // Add a quick reset function for testing!
  const handleReset = () => {
    localStorage.removeItem("et_dynamic_dashboard");
    setFinancialProfile(null);
  };

  return (
    <div className="navigator-root">
      
      {/* Sidebar with chatbot */}
      <NavigatorSidebar
        onProfileComplete={(profile) => {
          setIsGenerating(true);

          setTimeout(() => {
            // Save using the new key
            localStorage.setItem("et_dynamic_dashboard", JSON.stringify(profile));
            setFinancialProfile(profile);
            setIsGenerating(false);
          }, 2200);
        }}
        hasProfile={!!financialProfile}
      />

      {/* Main canvas */}
      <main className="navigator-canvas">
        {/* Quick hackathon reset button */}
        {financialProfile && (
            <button 
              onClick={handleReset}
              style={{ position: "absolute", top: 20, right: 20, zIndex: 100, background: "#111", border: "1px solid #333", color: "#888", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}
            >
              Reset Chat
            </button>
        )}

        {isGenerating ? (
          <GeneratingScreen />
        ) : financialProfile ? (
          <FinancialDashboard profile={financialProfile} />
        ) : (
          <EmptyDashboard />
        )}
      </main>

      <style>{`
        .navigator-root {
          display: flex;
          height: 100vh;
          background: #0A0A0A;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          position: relative;
        }
        .navigator-canvas {
          flex: 1;
          overflow-y: auto;
          background: #0A0A0A;
        }
        .navigator-canvas::-webkit-scrollbar { width: 5px; }
        .navigator-canvas::-webkit-scrollbar-track { background: transparent; }
        .navigator-canvas::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
      `}</style>
    </div>
  );
}

function GeneratingScreen() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "40px" }}>
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,107,0,0.15)", borderTopColor: "#FF6B00", animation: "spin 1s linear infinite" }} />
        <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: "2px solid rgba(255,107,0,0.1)", borderBottomColor: "#FF9A00", animation: "spin 1.5s linear infinite reverse" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🧠</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#F0EDE8", marginBottom: 10 }}>Building Your Financial Dashboard</div>
        <div style={{ color: "#888580", fontSize: 14, maxWidth: 340 }}>Analysing your inputs, identifying gaps, and generating a personalised action plan...</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 360 }}>
        {["Calculating net worth & gaps", "Running risk analysis", "Matching ET products", "Generating action timeline"].map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#161616", borderRadius: 10, border: "1px solid #1E1E1E", animation: `fadeIn 0.4s ease ${i * 0.3}s both` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF6B00", animation: "pulse 1.5s ease infinite", animationDelay: `${i * 0.3}s` }} />
            <span style={{ fontSize: 13, color: "#888580" }}>{step}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  );
}
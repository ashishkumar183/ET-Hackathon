export default function EmptyDashboard() {
  return (
    <div style={{
      height: "100%",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px",
      textAlign: "center",
      background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,107,0,0.07) 0%, transparent 60%), #0A0A0A",
    }}>

      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,107,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Icon cluster */}
        <div style={{
          width: 100, height: 100,
          borderRadius: "50%",
          background: "rgba(255,107,0,0.08)",
          border: "1px solid rgba(255,107,0,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px",
          fontSize: 44,
          boxShadow: "0 0 60px rgba(255,107,0,0.1)",
        }}>
          📊
        </div>

        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(24px, 4vw, 36px)",
          fontWeight: 900,
          color: "#F0EDE8",
          lineHeight: 1.2,
          marginBottom: 14,
          letterSpacing: "-0.5px",
        }}>
          Your Financial Dashboard<br />
          <span style={{ color: "#FF6B00" }}>awaits</span>
        </div>

        <div style={{
          fontSize: 15,
          color: "#888580",
          maxWidth: 380,
          lineHeight: 1.7,
          marginBottom: 40,
        }}>
          Answer 9 quick questions in the chat on the left. Your personalised financial snapshot, gap analysis, and action plan will appear right here.
        </div>

        {/* Feature previews */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          maxWidth: 680,
          width: "100%",
        }}>
          {[
            { icon: "💼", title: "Financial Snapshot", desc: "Net worth, savings rate, liabilities" },
            { icon: "⚠️", title: "Gap Analysis", desc: "Insurance, emergency fund, tax gaps" },
            { icon: "🎯", title: "Action Plan", desc: "Immediate, medium & long-term steps" },
            { icon: "📈", title: "Curated Products", desc: "ET funds, services matched to you" },
          ].map((item) => (
            <div key={item.title} style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14,
              padding: "18px 16px",
              textAlign: "left",
              opacity: 0.5,
            }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#F0EDE8", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#888580" }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 36,
          display: "flex", alignItems: "center", gap: 10,
          color: "#888580", fontSize: 12,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF6B00", animation: "pulseEmpty 2s ease infinite" }} />
          Waiting for your inputs from the chat panel
        </div>
      </div>

      <style>{`
        @keyframes pulseEmpty { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
      `}</style>
    </div>
  );
}

import { useState } from "react";

// Helper to format numbers dynamically
function fmtINR(n) {
  if (!n) return "₹0";
  // Force it into a strict number just in case the AI outputs a string like "80000"
  const num = Number(n);
  if (isNaN(num)) return n; // Fallback if AI gives plain text
  
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
  return `₹${num}`;
}

// ── Sub-components ────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#888580", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
      {children}
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = "#FF6B00", size = "md" }) {
  return (
    <div style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: size === "lg" ? "22px 24px" : "16px 18px", transition: "border-color 0.2s, transform 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,107,0,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ fontSize: size === "lg" ? 28 : 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: size === "lg" ? 28 : 20, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#F0EDE8", marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#888580" }}>{sub}</div>}
    </div>
  );
}

function GapRow({ icon, name, status, severity, action }) {
  const colors = { critical: "#E74C3C", moderate: "#C9A84C", good: "#2ECC71" };
  const bg = { critical: "rgba(231,76,60,0.08)", moderate: "rgba(201,168,76,0.08)", good: "rgba(46,204,113,0.08)" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: bg[severity] || bg.moderate, borderRadius: 10, border: `1px solid ${colors[severity] || colors.moderate}22`, marginBottom: 8 }}>
      <div style={{ fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#F0EDE8", marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 11, color: "#888580" }}>{status}</div>
      </div>
      <div style={{ padding: "3px 10px", borderRadius: 4, background: `${colors[severity] || colors.moderate}20`, color: colors[severity] || colors.moderate, fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>{severity}</div>
      {action && <button style={{ padding: "6px 14px", borderRadius: 8, background: "#FF6B00", border: "none", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{action}</button>}
    </div>
  );
}

function ActionCard({ icon, title, desc, urgency, primaryLabel, bgColor }) {
  const urgencyColor = { "Critical Now": "#E74C3C", "This Month": "#C9A84C", "This Quarter": "#2ECC71" };
  return (
    <div style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `3px solid ${urgencyColor[urgency] || "#FF6B00"}`, borderRadius: 14, padding: "18px 18px 18px 20px", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(255,107,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: bgColor || "rgba(255,107,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
        <div style={{ padding: "3px 10px", borderRadius: 4, background: `${urgencyColor[urgency] || "#FF6B00"}20`, color: urgencyColor[urgency] || "#FF6B00", fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em" }}>{urgency}</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#F0EDE8", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: "#888580", lineHeight: 1.6, marginBottom: 14 }}>{desc}</div>
      <button style={{ padding: "8px 16px", borderRadius: 8, background: "#FF6B00", border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{primaryLabel || "Take Action →"}</button>
    </div>
  );
}

function MiniSparkline({ color, up }) {
  const pts = up ? "0,30 15,24 30,20 45,14 60,10 80,5" : "0,10 15,16 30,12 45,20 60,16 80,22";
  return (
    <svg viewBox="0 0 80 36" style={{ width: 70, height: 30 }}>
      <polyline points={pts} stroke={color} strokeWidth="2" fill="none" />
    </svg>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function FinancialDashboard({ profile }) {
  // profile is now the DYNAMIC JSON generated by Groq!
  const d = profile || {}; 
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "actions", label: "🎯 Action Plan" },
    { id: "investments", label: "💼 ET Products" },
    { id: "timeline", label: "🗓 Roadmap" },
  ];

  if (!d.income) return null; // Safety check

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Dashboard header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: "#F0EDE8", letterSpacing: "-0.5px" }}>
            {d.name || "User"}'s Financial Dashboard
          </div>
          <div style={{ fontSize: 12, color: "#888580", marginTop: 4 }}>
            {d.occupation} · {d.age} · Goal: {d.goal}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: d.healthScore >= 65 ? "rgba(46,204,113,0.08)" : "rgba(201,168,76,0.08)", border: `1px solid ${d.healthScore >= 65 ? "rgba(46,204,113,0.2)" : "rgba(201,168,76,0.2)"}`, borderRadius: 50 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: d.healthScore >= 65 ? "#2ECC71" : "#C9A84C" }}>{d.healthScore}</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#F0EDE8" }}>Health Score</div>
            <div style={{ fontSize: 10, color: "#888580" }}>{d.healthScore >= 65 ? "Good" : "Needs Attention"}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "#111111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 6, width: "fit-content" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: activeTab === t.id ? "#FF6B00" : "transparent", color: activeTab === t.id ? "#fff" : "#888580", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>{t.label}</button>
        ))}
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            <StatCard icon="💰" label="Net Worth (Est.)" value={fmtINR(d.netWorth)} sub="Calculated by AI" color="#2ECC71" size="lg" />
            <StatCard icon="📥" label="Monthly Income" value={fmtINR(d.income)} sub="Stated" color="#F0EDE8" />
            <StatCard icon="🏦" label="Monthly Savings" value={fmtINR(d.savings)} sub={`${d.savingsRate}% savings rate`} color={d.savingsRate >= 20 ? "#2ECC71" : "#C9A84C"} />
            <StatCard icon="⚡" label="Risk Appetite" value={d.risk} sub="Based on profile" color="#FF6B00" />
          </div>

          {/* Dynamic Gap Analysis */}
          <div style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
            <SectionLabel>⚠️ AI Gap Analysis</SectionLabel>
            {d.gapAnalysis?.map((gap, i) => (
              <GapRow key={i} {...gap} />
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: ACTION PLAN ── */}
      {activeTab === "actions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <SectionLabel>🔴 Dynamic Action Plan</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {d.actionPlan?.map((action, i) => (
              <ActionCard key={i} {...action} />
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: ET PRODUCTS ── */}
      {activeTab === "investments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#F0EDE8" }}>💼 AI Curated Funds</div>
            </div>
            {d.products?.map((f, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 130px", gap: 16, padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#F0EDE8" }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: "#888580", marginTop: 2 }}>{f.cat}</div>
                </div>
                <div><span style={{ padding: "3px 10px", borderRadius: 4, background: `${f.riskColor}15`, color: f.riskColor, fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{f.risk}</span></div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#2ECC71" }}>{f.returns}</div>
                <MiniSparkline color={f.up ? "#2ECC71" : "#E74C3C"} up={f.up} />
                <button style={{ padding: "8px 16px", borderRadius: 8, background: "#FF6B00", border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Invest Now</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: ROADMAP ── */}
      {activeTab === "timeline" && (
        <div style={{ maxWidth: 680 }}>
          <SectionLabel>🗓 Your Financial Roadmap</SectionLabel>
          {d.roadmap?.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 16, paddingBottom: 24, position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.dot, flexShrink: 0 }} />
                {i < d.roadmap.length - 1 && <div style={{ width: 2, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 6 }} />}
              </div>
              <div style={{ flex: 1, background: "#111111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, marginTop: -2 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888580", marginBottom: 6 }}>{item.time}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F0EDE8", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#888580", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
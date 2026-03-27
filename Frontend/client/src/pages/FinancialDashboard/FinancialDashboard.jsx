import { useState } from "react";

// ── Helpers ──────────────────────────────────────────────
function deriveData(profile) {
  const incomeMap = {
    "Under ₹30K": 25000, "₹30K–60K": 45000,
    "₹60K–1L": 80000, "₹1L–2L": 150000, "₹2L+": 250000,
  };
  const savingsMap = {
    "Under ₹5K": 3000, "₹5K–15K": 10000,
    "₹15K–30K": 22000, "₹30K–50K": 40000, "₹50K+": 70000,
  };
  const income = incomeMap[profile.income] || 80000;
  const savings = savingsMap[profile.savings] || 10000;
  const savingsRate = Math.round((savings / income) * 100);
  const hasLoan = profile.liabilities !== "No loans";
  const hasInsurance = profile.insurance !== "None";
  const hasHealth = profile.insurance?.includes("health") || profile.insurance?.includes("Both");
  const hasTerm = profile.insurance?.includes("term") || profile.insurance?.includes("Both") || profile.insurance?.includes("multiple");
  const emergencyTarget = income * 6;
  const emergencyHave = savings * 2; // rough mock
  const emergencyPct = Math.min(Math.round((emergencyHave / emergencyTarget) * 100), 100);
  const taxUsed = Math.round(savings * 12 * 0.35);
  const taxLimit = 150000;
  const taxPct = Math.min(Math.round((taxUsed / taxLimit) * 100), 100);

  const healthScore = Math.round(
    (hasTerm ? 20 : 0) +
    (hasHealth ? 15 : 0) +
    (emergencyPct * 0.25) +
    (savingsRate > 20 ? 20 : savingsRate) +
    (taxPct * 0.2)
  );

  return {
    income, savings, savingsRate, hasLoan, hasInsurance, hasHealth, hasTerm,
    emergencyHave, emergencyTarget, emergencyPct, taxUsed, taxLimit, taxPct, healthScore,
    netWorth: income * 18 + (hasLoan ? -income * 5 : 0),
  };
}

function fmtINR(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

// ── Sub-components ────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em",
      color: "#888580", marginBottom: 14,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = "#FF6B00", size = "md" }) {
  return (
    <div style={{
      background: "#111111",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14,
      padding: size === "lg" ? "22px 24px" : "16px 18px",
      transition: "border-color 0.2s, transform 0.2s",
      cursor: "default",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,107,0,0.25)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{ fontSize: size === "lg" ? 28 : 22, marginBottom: 10 }}>{icon}</div>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: size === "lg" ? 28 : 20,
        fontWeight: 900,
        color,
        lineHeight: 1,
        marginBottom: 4,
      }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#F0EDE8", marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#888580" }}>{sub}</div>}
    </div>
  );
}

function GapRow({ icon, name, status, severity, action }) {
  const colors = { critical: "#E74C3C", moderate: "#C9A84C", good: "#2ECC71" };
  const bg = { critical: "rgba(231,76,60,0.08)", moderate: "rgba(201,168,76,0.08)", good: "rgba(46,204,113,0.08)" };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 16px",
      background: bg[severity],
      borderRadius: 10,
      border: `1px solid ${colors[severity]}22`,
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#F0EDE8", marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 11, color: "#888580" }}>{status}</div>
      </div>
      <div style={{
        padding: "3px 10px", borderRadius: 4,
        background: `${colors[severity]}20`,
        color: colors[severity],
        fontSize: 10, fontWeight: 700,
        fontFamily: "'DM Mono', monospace",
        textTransform: "uppercase", letterSpacing: "0.05em",
        flexShrink: 0,
      }}>{severity}</div>
      {action && (
        <button style={{
          padding: "6px 14px", borderRadius: 8,
          background: "#FF6B00", border: "none",
          color: "#fff", fontSize: 11, fontWeight: 600,
          cursor: "pointer", flexShrink: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}>{action}</button>
      )}
    </div>
  );
}

function ProgressBar({ label, pct, color }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: "#888580" }}>{label}</span>
        <span style={{ color, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "#1A1A1A", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: color, borderRadius: 3,
          transition: "width 1.2s ease",
        }} />
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, urgency, priority, primaryLabel, bgColor }) {
  const urgencyColor = { "Critical Now": "#E74C3C", "This Month": "#C9A84C", "This Quarter": "#2ECC71" };
  const borderColor = { "Critical Now": "#E74C3C", "This Month": "#C9A84C", "This Quarter": "#2ECC71" };
  return (
    <div style={{
      background: "#111111",
      border: "1px solid rgba(255,255,255,0.06)",
      borderLeft: `3px solid ${borderColor[urgency] || "#FF6B00"}`,
      borderRadius: 14,
      padding: "18px 18px 18px 20px",
      transition: "all 0.2s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(255,107,0,0.2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: bgColor || "rgba(255,107,0,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>{icon}</div>
        <div style={{
          padding: "3px 10px", borderRadius: 4,
          background: `${urgencyColor[urgency] || "#FF6B00"}20`,
          color: urgencyColor[urgency] || "#FF6B00",
          fontSize: 10, fontWeight: 700,
          fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em",
        }}>{urgency}</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#F0EDE8", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: "#888580", lineHeight: 1.6, marginBottom: 14 }}>{desc}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{
          padding: "8px 16px", borderRadius: 8,
          background: "#FF6B00", border: "none",
          color: "#fff", fontSize: 12, fontWeight: 600,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>{primaryLabel || "Take Action →"}</button>
        <button style={{
          padding: "8px 16px", borderRadius: 8,
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#888580", fontSize: 12, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}>Learn More</button>
      </div>
    </div>
  );
}

function MiniSparkline({ color, up }) {
  const pts = up
    ? "0,30 15,24 30,20 45,14 60,10 80,5"
    : "0,10 15,16 30,12 45,20 60,16 80,22";
  return (
    <svg viewBox="0 0 80 36" style={{ width: 70, height: 30 }}>
      <polyline points={pts} stroke={color} strokeWidth="2" fill="none" />
    </svg>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function FinancialDashboard({ profile }) {
  const d = deriveData(profile);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "actions", label: "🎯 Action Plan" },
    { id: "investments", label: "💼 ET Products" },
    { id: "timeline", label: "🗓 Roadmap" },
  ];

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Dashboard header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 28, flexWrap: "wrap", gap: 14,
      }}>
        <div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 26, fontWeight: 900,
            color: "#F0EDE8", letterSpacing: "-0.5px",
          }}>
            {profile.name}'s Financial Dashboard
          </div>
          <div style={{ fontSize: 12, color: "#888580", marginTop: 4 }}>
            {profile.occupation} · {profile.age} · Goal: {profile.goal}
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px",
          background: d.healthScore >= 65 ? "rgba(46,204,113,0.08)" : "rgba(201,168,76,0.08)",
          border: `1px solid ${d.healthScore >= 65 ? "rgba(46,204,113,0.2)" : "rgba(201,168,76,0.2)"}`,
          borderRadius: 50,
        }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22, fontWeight: 900,
            color: d.healthScore >= 65 ? "#2ECC71" : "#C9A84C",
          }}>{d.healthScore}</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#F0EDE8" }}>Health Score</div>
            <div style={{ fontSize: 10, color: "#888580" }}>{d.healthScore >= 65 ? "Good" : "Needs Attention"}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 28,
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12, padding: 6,
        width: "fit-content",
      }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: activeTab === t.id ? "#FF6B00" : "transparent",
            color: activeTab === t.id ? "#fff" : "#888580",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            transition: "all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Stat row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            <StatCard icon="💰" label="Net Worth (Est.)" value={fmtINR(d.netWorth)} sub="Based on income & savings" color="#2ECC71" size="lg" />
            <StatCard icon="📥" label="Monthly Income" value={fmtINR(d.income)} sub={profile.income} color="#F0EDE8" />
            <StatCard icon="🏦" label="Monthly Savings" value={fmtINR(d.savings)} sub={`${d.savingsRate}% savings rate`} color={d.savingsRate >= 20 ? "#2ECC71" : "#C9A84C"} />
            <StatCard icon="⚡" label="Risk Appetite" value={profile.risk === "Conservative (FD lover)" ? "Low" : profile.risk === "Moderate (balanced)" ? "Moderate" : "High"} sub={profile.risk} color="#FF6B00" />
          </div>

          {/* Health score breakdown */}
          <div style={{
            background: "#111111", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 24,
          }}>
            <SectionLabel>📈 Financial Health Breakdown</SectionLabel>
            <ProgressBar label="Term Insurance" pct={d.hasTerm ? 90 : 10} color={d.hasTerm ? "#2ECC71" : "#E74C3C"} />
            <ProgressBar label="Health Insurance" pct={d.hasHealth ? 85 : 10} color={d.hasHealth ? "#2ECC71" : "#E74C3C"} />
            <ProgressBar label="Emergency Fund" pct={d.emergencyPct} color={d.emergencyPct >= 60 ? "#2ECC71" : d.emergencyPct >= 30 ? "#C9A84C" : "#E74C3C"} />
            <ProgressBar label="Tax Efficiency (80C)" pct={d.taxPct} color={d.taxPct >= 70 ? "#2ECC71" : "#C9A84C"} />
            <ProgressBar label="Savings Rate" pct={Math.min(d.savingsRate * 2, 100)} color={d.savingsRate >= 20 ? "#2ECC71" : "#C9A84C"} />
          </div>

          {/* Gap Analysis */}
          <div style={{
            background: "#111111", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 24,
          }}>
            <SectionLabel>⚠️ Gap Analysis</SectionLabel>
            {!d.hasTerm && <GapRow icon="🛡️" name="Term Insurance" status="No life cover detected — high exposure" severity="critical" action="Fix Now" />}
            {!d.hasHealth && <GapRow icon="🏥" name="Health Insurance" status="Medical emergencies can wipe savings" severity="critical" action="Compare Plans" />}
            {d.emergencyPct < 40 && <GapRow icon="🆘" name="Emergency Fund" status={`Only ${d.emergencyPct}% of 6-month target`} severity="critical" action="Start SIP" />}
            {d.taxPct < 70 && <GapRow icon="💸" name="Tax Efficiency" status={`${fmtINR(d.taxLimit - d.taxUsed)} 80C allowance unused`} severity="moderate" action="Invest in ELSS" />}
            {d.hasInsurance && d.emergencyPct >= 40 && <GapRow icon="✅" name="Insurance Coverage" status="Basic coverage in place — review annually" severity="good" />}
          </div>
        </div>
      )}

      {/* ── TAB: ACTION PLAN ── */}
      {activeTab === "actions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <SectionLabel>🔴 Immediate Actions</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {!d.hasTerm && (
              <ActionCard
                icon="🛡️" urgency="Critical Now"
                title="Buy Term Insurance Cover"
                desc={`You need at least ₹1.5 Cr life cover. At ${profile.age}, premium would be ~₹800–1,200/month. ET Services partners offer exclusive discounts.`}
                primaryLabel="Compare Plans →"
                bgColor="rgba(231,76,60,0.1)"
              />
            )}
            {!d.hasHealth && (
              <ActionCard
                icon="🏥" urgency="Critical Now"
                title="Get Health Insurance"
                desc="A single hospitalisation can cost ₹2–5L. A ₹10L family floater plan costs ~₹12,000/year. Don't delay this."
                primaryLabel="View Plans →"
                bgColor="rgba(231,76,60,0.1)"
              />
            )}
            {d.emergencyPct < 40 && (
              <ActionCard
                icon="🏦" urgency="Critical Now"
                title="Build Emergency Fund"
                desc={`Target: ${fmtINR(d.emergencyTarget)} (6 months of income). Start a ₹${Math.round(d.income * 0.12 / 1000)}K/month SIP in a liquid fund.`}
                primaryLabel="Start SIP →"
                bgColor="rgba(231,76,60,0.1)"
              />
            )}
            {d.taxPct < 70 && (
              <ActionCard
                icon="💰" urgency="This Month"
                title="Max Out 80C with ELSS"
                desc={`You have ${fmtINR(d.taxLimit - d.taxUsed)} remaining under 80C. Investing in ELSS saves you ${fmtINR(Math.round((d.taxLimit - d.taxUsed) * 0.3))} in taxes.`}
                primaryLabel="Invest in ELSS →"
                bgColor="rgba(201,168,76,0.1)"
              />
            )}
            <ActionCard
              icon="📈" urgency="This Quarter"
              title={`Start ₹${Math.round(d.savings * 0.4 / 1000)}K/month SIP`}
              desc={`Based on your ${profile.risk} risk profile, we recommend a ${profile.risk === "Conservative (FD lover)" ? "debt-heavy hybrid" : profile.risk === "Moderate (balanced)" ? "balanced flexi cap" : "pure equity"} portfolio.`}
              primaryLabel="Build Portfolio →"
              bgColor="rgba(46,204,113,0.1)"
            />
            <ActionCard
              icon="🎓" urgency="This Quarter"
              title="Attend ET Masterclass on Investing"
              desc="ET's next wealth masterclass on SIP strategies and tax planning is on April 19. Free for ET Prime members."
              primaryLabel="Register Free →"
              bgColor="rgba(52,152,219,0.1)"
            />
          </div>
        </div>
      )}

      {/* ── TAB: ET PRODUCTS ── */}
      {activeTab === "investments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Funds */}
          <div style={{
            background: "#111111", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, overflow: "hidden",
          }}>
            <div style={{
              padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#F0EDE8" }}>
                💼 Curated Funds for You
              </div>
              <div style={{ fontSize: 11, color: "#FF6B00", fontFamily: "'DM Mono', monospace" }}>
                {profile.risk?.split(" ")[0]?.toUpperCase()} · {profile.goal?.toUpperCase()}
              </div>
            </div>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 130px",
              gap: 16, padding: "12px 24px",
              background: "#161616",
              fontSize: 10, color: "#888580",
              fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              <span>Fund</span><span>Risk</span><span>3Y Returns</span><span>Trend</span><span>Action</span>
            </div>
            {[
              { name: "Mirae Asset Tax Saver", cat: "ELSS · Large Cap", risk: "Moderate", returns: "+18.4%", up: true, riskColor: "#C9A84C" },
              { name: "Parag Parikh Flexi Cap", cat: "Flexi Cap · Global", risk: "Moderate", returns: "+22.1%", up: true, riskColor: "#C9A84C" },
              { name: "Quant Small Cap Fund", cat: "Small Cap", risk: "High", returns: "+34.7%", up: true, riskColor: "#E74C3C" },
              { name: "HDFC Short Term Debt", cat: "Debt · Low Risk", risk: "Low", returns: "+7.2%", up: false, riskColor: "#2ECC71" },
            ].map((f) => (
              <div key={f.name} style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 130px",
                gap: 16, padding: "16px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                alignItems: "center",
                transition: "background 0.2s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#161616"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#F0EDE8" }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: "#888580", marginTop: 2 }}>{f.cat}</div>
                </div>
                <div>
                  <span style={{
                    padding: "3px 10px", borderRadius: 4,
                    background: `${f.riskColor}15`, color: f.riskColor,
                    fontSize: 11, fontWeight: 600,
                    fontFamily: "'DM Mono', monospace",
                  }}>{f.risk}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#2ECC71" }}>{f.returns}</div>
                <MiniSparkline color={f.up ? "#2ECC71" : "#E74C3C"} up={f.up} />
                <button style={{
                  padding: "8px 16px", borderRadius: 8,
                  background: "#FF6B00", border: "none",
                  color: "#fff", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>Invest Now</button>
              </div>
            ))}
          </div>

          {/* Services */}
          <div>
            <SectionLabel>🏦 ET Services — Matched for You</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {[
                { icon: "💳", title: "ET Credit Card", desc: "Cashback on market data & subscriptions", badge: "PRE-APPROVED" },
                { icon: "🏡", title: "Home Loan", desc: "Best rates via ET partner banks. EMI starts ₹22K/L", badge: profile.liabilities?.includes("Home") ? "ACTIVE" : "EXPLORE" },
                { icon: "📋", title: "Will & Estate", desc: "Secure your wealth for your family", badge: "NEW" },
                { icon: "🤝", title: "Fee-only Advisor", desc: "1-on-1 with a SEBI-registered planner", badge: "RECOMMENDED" },
              ].map((s) => (
                <div key={s.title} style={{
                  background: "#111111", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 14, padding: "18px 18px 14px",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,107,0,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ fontSize: 26 }}>{s.icon}</div>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4,
                      background: "rgba(255,107,0,0.1)", color: "#FF6B00",
                      fontSize: 9, fontWeight: 700,
                      fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
                    }}>{s.badge}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F0EDE8", marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "#888580", lineHeight: 1.5, marginBottom: 12 }}>{s.desc}</div>
                  <div style={{ fontSize: 12, color: "#FF6B00", fontWeight: 600 }}>Explore →</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ROADMAP ── */}
      {activeTab === "timeline" && (
        <div style={{ maxWidth: 680 }}>
          <SectionLabel>🗓 Your Financial Roadmap</SectionLabel>
          {[
            { time: "Week 1 · Now", dot: "#E74C3C", title: "🛡️ Get insured + start emergency SIP", desc: "30-minute action. Buy term insurance online and set up a liquid fund SIP. ET Services has partner discounts." },
            { time: "Month 1 · April 2025", dot: "#C9A84C", title: "💰 Max out 80C — invest in ELSS", desc: `Put ${fmtINR(Math.max(0, d.taxLimit - d.taxUsed))} in ELSS before year-end to save on taxes. We've pre-selected the best fund for your risk profile.` },
            { time: "Month 3 · June 2025", dot: "#C9A84C", title: "📈 Launch your SIP portfolio", desc: `Emergency fund building on track — now start a ₹${Math.round(d.savings * 0.4 / 1000)}K/month equity SIP. Diversify across large cap + flexi cap.` },
            { time: "Month 6 · Sept 2025", dot: "#3498DB", title: "🔄 Portfolio review + NPS top-up", desc: "Rebalance after 6 months. Consider adding NPS for an extra ₹50K deduction under 80CCD(1B)." },
            { time: "Year 2 · 2026", dot: "#2ECC71", title: "🏆 Target Health Score 80+", desc: "Attend ET Wealth Summit for next-level strategy. Your dashboard will update automatically as you take actions." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 16, paddingBottom: i < 4 ? 24 : 0, position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.dot, flexShrink: 0 }} />
                {i < 4 && <div style={{ width: 2, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 6 }} />}
              </div>
              <div style={{
                flex: 1, background: "#111111",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: 16, marginTop: -2,
              }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: "#888580", marginBottom: 6,
                }}>{item.time}</div>
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

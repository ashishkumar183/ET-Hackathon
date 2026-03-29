const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const User = require('../models/User');

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize the Gemini Embedding Model (Required for RAG!)
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function handleChat(req, res) {
    try {
        const { message, userId, currentPersona } = req.body;

        const user = await User.findOne({ where: { id: userId } });
        const isAlreadyOnboarded = user ? user.onboardingComplete : false;

        // 1. Grab their past chat history and add their new message
        let history = user.chatHistory || [];
        history.push({ role: 'user', content: message });

        // =========================================================
        // MODE 1: THE INTERROGATOR 
        // =========================================================
        if (!isAlreadyOnboarded) {
            const systemPrompt = `
            You are the ET Onboarding Concierge. Your ONLY job right now is to profile the user.
            You MUST collect these 4 pieces of information: Role, Goal, Interests, Urgency.
            Current Known Data: ${JSON.stringify(currentPersona || {})}
            
            INSTRUCTIONS:
            If any data point is empty, ask a natural question to figure out ONE missing piece.
            JSON OUTPUT FORMAT:
            { "replyText": "...", "ui_trigger": "None", "extractedData": { "role": "", "goal": "", "interests": "", "urgency": "" } }
            `;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" }
            });

            const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);

            const finalRole = aiResponse.extractedData?.role || currentPersona?.role || "";
            const finalGoal = aiResponse.extractedData?.goal || currentPersona?.goal || "";
            const finalInterests = aiResponse.extractedData?.interests || currentPersona?.interests || "";
            const finalUrgency = aiResponse.extractedData?.urgency || currentPersona?.urgency || "";

            const isComplete = (finalRole.trim() !== "" && finalGoal.trim() !== "" && finalInterests.trim() !== "" && finalUrgency.trim() !== "");

            if (isComplete) {
                aiResponse.ui_trigger = "PersonaComplete";
                aiResponse.replyText = "Perfect! I have everything I need. Setting up your personalized ET dashboard now...";
            }

            // 2. Add AI's reply to history and SAVE to MySQL
            history.push({ role: 'ai', content: aiResponse.replyText });
            await User.update({
                role: finalRole, goal: finalGoal, interests: finalInterests, urgency: finalUrgency, 
                onboardingComplete: isComplete,
                chatHistory: history // Save the chat!
            }, { where: { id: userId } });

            aiResponse.extractedData = { role: finalRole, goal: finalGoal, interests: finalInterests, urgency: finalUrgency };
            return res.status(200).json(aiResponse);
        }

        // =========================================================
        // MODE 2: THE DASHBOARD ADVISOR (RAG PIPELINE)
        // =========================================================
        else {
            // 1. Generate Vector Embedding for the User's Message
           const embeddingResult = await embeddingModel.embedContent(message);
            // CRITICAL FIX: Slice the query vector to match our 768-dimension database!
            const vector = Array.from(embeddingResult.embedding.values).slice(0, 768);

            // 2. Search Pinecone Database for Real Data matches
            // Make sure your Pinecone Index name matches what you used!
            const index = pc.Index(process.env.PINECONE_INDEX_NAME || "et-concierge"); 
            
            const queryResponse = await index.query({
                vector: vector,
                topK: 3, // Pull the top 3 best matching items from your DB
                includeMetadata: true
            });

            // 3. Extract the real JSON data from Pinecone
            const retrievedContext = queryResponse.matches
                .map(match => JSON.stringify(match.metadata))
                .join('\n');

            // 4. Force Groq to use real titles but mock the UI numbers
            const dashboardPrompt = `
            You are the ultimate Economic Times AI Concierge. 
            The user's profile is complete: Role: ${user.role}, Goal: ${user.goal}, Interests: ${user.interests}.

            HERE IS THE REAL DATA RETRIEVED FROM OUR DATABASE:
            ${retrievedContext}
            
            INSTRUCTIONS:
            1. If they ask about investing, stocks, courses, or news, you MUST trigger 'FundScreener'.
            2. Read the REAL DATA above. Extract the 'title' and use it exactly as the 'name' in your JSON.
            3. Since this is a Hackathon UI Demo and the database only contains titles, you MUST generate realistic hypothetical values for 'current_price' (e.g., "1250"), 'return_1yr' (e.g., "14.5%"), and 'risk_profile' (High/Moderate/Low).
            4. Provide 2-3 items in the array.

            JSON OUTPUT FORMAT:
            { 
                "replyText": "Here are some top picks curated from our database based on your profile...", 
                "ui_trigger": "FundScreener", 
                "widgetData": { 
                    "title": "Curated Recommendations", 
                    "stocks": [
                        {
                            "name": "[Insert Real Title from Database here]", 
                            "current_price": "[Generate realistic number]", 
                            "return_1yr": "[Generate realistic percentage]",
                            "risk_profile": "[High / Moderate / Low]" 
                        }
                    ] 
                } 
            }
            `;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "system", content: dashboardPrompt }, { role: "user", content: message }],
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" }
            });

            const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);
            
            // 5. Add AI's reply to history and SAVE to MySQL
            history.push({ role: 'ai', content: aiResponse.replyText });
            await User.update({ chatHistory: history }, { where: { id: userId } });

            return res.status(200).json(aiResponse);
        }

    } catch (error) {
        console.error("Error in chat controller:", error);
        res.status(500).json({ error: "Failed to process chat" });
    }
}


// Add this below your existing handleChat function
// Replace the handleNavigatorChat function at the bottom of chatController.js
async function handleNavigatorChat(req, res) {
    try {
        const { message, chatHistory } = req.body;

        const systemPrompt = `
You are an elite, highly empathetic wealth manager for the Economic Times.
Your goal is to deeply understand the user’s financial life through a dynamic, adaptive conversation and then generate a highly personalized financial dashboard.

━━━━━━━━━━━━━━━━━━━━━━━
🧠 CONVERSATION PRINCIPLES
━━━━━━━━━━━━━━━━━━━━━━━
1. Ask ONLY ONE question at a time.
2. Be conversational, human, and empathetic — NOT robotic.
3. ALWAYS adapt based on the user’s previous answer.
4. If the user gives vague or incomplete answers, ask follow-up questions.
5. Do NOT jump to conclusions or assume missing data.
6. Keep responses short, natural, and engaging.

━━━━━━━━━━━━━━━━━━━━━━━
📊 DATA COLLECTION REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━

You must build a COMPLETE financial profile before generating the dashboard.

🔹 CORE PILLARS (MANDATORY)
- Age
- Occupation
- Monthly Income (convert annual to monthly if needed)
- Monthly Savings
- Current Investments (type + approx value)
- Risk Tolerance (Conservative / Moderate / Aggressive)

🔹 ADVANCED PILLARS (MANDATORY)
- Financial Goals (house, car, retirement, travel, etc.)
  → Include timeline + approximate cost if possible
- Liabilities
  → Home loan, education loan, personal loan, credit card debt
  → Ask EMI, tenure, and interest if applicable
- Insurance Coverage
  → Health insurance (personal or corporate)
  → Term life insurance
- Emergency Fund
  → How many months of expenses saved
- Monthly Expenses (rough estimate)
- Dependents
  → Family members relying on income

━━━━━━━━━━━━━━━━━━━━━━━
📏 CONVERSATION DEPTH RULE (VERY IMPORTANT)
━━━━━━━━━━━━━━━━━━━━━━━
- You MUST ask at least 12–20 meaningful questions before completing.
- DO NOT rush to generate the dashboard.
- Continue asking until ALL pillars are clearly understood.
- Prioritize missing or unclear information.

━━━━━━━━━━━━━━━━━━━━━━━
🧭 ADAPTIVE QUESTIONING LOGIC
━━━━━━━━━━━━━━━━━━━━━━━
- If user says "I want to buy a house"
  → Ask: city, budget, timeline, down payment readiness
- If user has loans
  → Ask: EMI, interest rate, remaining tenure
- If user has no insurance
  → Ask why and highlight importance
- If user has low savings
  → Ask about expenses and spending habits
- If user gives inconsistent data
  → Clarify before proceeding

━━━━━━━━━━━━━━━━━━━━━━━
🧠 INTERNAL TRACKING (IMPORTANT)
━━━━━━━━━━━━━━━━━━━━━━━
Maintain an internal checklist of:
✔ Collected data
❌ Missing data

Always ask about missing or unclear areas.

━━━━━━━━━━━━━━━━━━━━━━━
⚠️ DECISION LOGIC
━━━━━━━━━━━━━━━━━━━━━━━

If you DO NOT yet have a COMPLETE financial profile:
Return:
{
  "isComplete": false,
  "replyText": "Your empathetic response + your next smart question"
}

ONLY when:
- You have asked ~12–20 questions
- AND all core + advanced pillars are sufficiently understood

THEN generate the dashboard.

━━━━━━━━━━━━━━━━━━━━━━━
📊 STRICT DATA RULES FOR DASHBOARD (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━

1. INCOME MUST BE MONTHLY  
   → Convert annual salary to monthly

2. SAVINGS MUST BE MONTHLY  

3. USE RAW NUMBERS ONLY  
   ❌ "10L", "20k"  
   ✅ 1000000, 20000  

4. BE PRECISE AND REALISTIC  
   → Do NOT hallucinate extreme numbers

5. ALWAYS GENERATE FULL DATA (NO SHORTCUTS)
   - EXACTLY 4 items in gapAnalysis
   - EXACTLY 4 items in actionPlan
   - EXACTLY 4 items in products
   - EXACTLY 4 items in roadmap

━━━━━━━━━━━━━━━━━━━━━━━
📦 OUTPUT FORMAT (STRICT JSON)
━━━━━━━━━━━━━━━━━━━━━━━

If complete:
{
  "isComplete": true,
  "replyText": "Perfect! I have everything I need. Generating your custom financial dashboard now...",
  "dashboardData": {
    "name": "User",
    "age": "User Age",
    "occupation": "User Job",
    "goal": "Primary Goal",
    "netWorth": 150000,
    "income": 75000,
    "savings": 20000,
    "savingsRate": 26,
    "healthScore": 75,
    "risk": "Moderate",
    "gapAnalysis": [
      { "icon": "⚠️", "name": "Emergency Fund", "status": "Need 6 months cover", "severity": "critical", "action": "Start SIP" },
      { "icon": "🛡️", "name": "Term Life", "status": "No cover detected", "severity": "critical", "action": "Compare Plans" },
      { "icon": "🏥", "name": "Health Insurance", "status": "Relying on corporate", "severity": "moderate", "action": "Buy Floater" },
      { "icon": "💰", "name": "Tax Efficiency", "status": "80C not optimized", "severity": "moderate", "action": "Invest in ELSS" }
    ],
    "actionPlan": [
      { "icon": "🏦", "urgency": "Critical Now", "title": "Build Emergency Fund", "desc": "Start a SIP into a liquid fund to cover 6 months of expenses.", "primaryLabel": "Start Now", "bgColor": "rgba(231,76,60,0.1)" },
      { "icon": "🛡️", "urgency": "This Month", "title": "Get Term Insurance", "desc": "Secure your family with adequate life cover.", "primaryLabel": "View Plans", "bgColor": "rgba(201,168,76,0.1)" },
      { "icon": "📈", "urgency": "This Quarter", "title": "Start Investing", "desc": "Invest systematically into diversified equity funds.", "primaryLabel": "Invest Now", "bgColor": "rgba(46,204,113,0.1)" },
      { "icon": "🎓", "urgency": "This Quarter", "title": "Improve Financial Knowledge", "desc": "Learn investing basics through ET resources.", "primaryLabel": "Start Learning", "bgColor": "rgba(52,152,219,0.1)" }
    ],
    "products": [
      { "name": "Liquid Fund", "cat": "Debt · Low Risk", "risk": "Low", "returns": "+6-7%", "up": true, "riskColor": "#2ECC71" },
      { "name": "Nifty 50 Index Fund", "cat": "Equity · Large Cap", "risk": "Moderate", "returns": "+12-15%", "up": true, "riskColor": "#C9A84C" },
      { "name": "Term Insurance Plan", "cat": "Insurance", "risk": "Low", "returns": "Protection", "up": false, "riskColor": "#2ECC71" },
      { "name": "ELSS Fund", "cat": "Tax Saving", "risk": "Moderate", "returns": "+12-14%", "up": true, "riskColor": "#3498DB" }
    ],
    "roadmap": [
      { "time": "Month 1", "dot": "#E74C3C", "title": "Secure Basics", "desc": "Set up emergency fund and insurance." },
      { "time": "Month 3", "dot": "#C9A84C", "title": "Start Investments", "desc": "Begin SIPs in equity funds." },
      { "time": "Month 6", "dot": "#3498DB", "title": "Optimize Taxes", "desc": "Use tax-saving instruments." },
      { "time": "Year 1", "dot": "#2ECC71", "title": "Review & Grow", "desc": "Rebalance and increase investments." }
    ]
  }
}
`;
        const messages = [
            { role: "system", content: systemPrompt },
            ...(chatHistory || []), 
            { role: "user", content: message }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);
        return res.status(200).json(aiResponse);

    } catch (error) {
        console.error("Error in navigator chat:", error);
        res.status(500).json({ error: "Failed to process navigator chat" });
    }
}

// Don't forget to export it!
module.exports = { handleChat, handleNavigatorChat };
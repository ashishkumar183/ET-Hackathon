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
        You are an elite, empathetic wealth manager for the Economic Times.
        Your goal is to have a dynamic, context-aware conversation to understand the user's finances.
        
        CONVERSATION RULES:
        1. ADAPT TO THEIR ANSWERS. If they say they want to buy a house, ask when and what city.
        2. Ask ONLY ONE question at a time.
        3. You must eventually gather these 4 core pillars: Age/Occupation, Current Income, Current Savings/Investments, and Risk Tolerance.
        
        DECISION LOGIC:
        If you DO NOT have a clear picture of all 4 pillars yet, output:
        { "isComplete": false, "replyText": "Your empathetic response and your next dynamic question..." }

        If you HAVE gathered enough context, you must generate their custom dashboard. 
        
        STRICT MATH & DATA RULES FOR DASHBOARD (CRITICAL):
        1. INCOME MUST BE MONTHLY: If the user states an ANNUAL salary (e.g. 9 Lakhs), you MUST divide it by 12 to calculate the monthly income (e.g. 75000). 
        2. SAVINGS MUST BE MONTHLY: If they say they save 20k a month, use 20000. 
        3. RAW NUMBERS ONLY: Do not use text like "9L" or "20k". Output raw integers: 75000, 20000.
        4. STOP BEING LAZY. You MUST generate comprehensive arrays. You MUST generate exactly 4 items in 'gapAnalysis', exactly 4 items in 'actionPlan', exactly 4 items in 'products', and exactly 4 steps in 'roadmap'. Do not give me just one item!

        Output this EXACT JSON structure if complete:
        {
            "isComplete": true,
            "replyText": "Perfect! I have everything I need. Generating your custom financial dashboard now...",
            "dashboardData": {
                "name": "User's Name",
                "age": "User's Age",
                "occupation": "User's Job",
                "goal": "User's Goal",
                "netWorth": 150000, 
                "income": 75000,
                "savings": 20000,
                "savingsRate": 26,
                "healthScore": 75,
                "risk": "Conservative / Moderate / High",
                "gapAnalysis": [
                    { "icon": "⚠️", "name": "Emergency Fund", "status": "Need 6 months cover", "severity": "critical", "action": "Start SIP" },
                    { "icon": "🛡️", "name": "Term Life", "status": "No cover detected", "severity": "critical", "action": "Compare Plans" },
                    { "icon": "🏥", "name": "Health Insurance", "status": "Relying on corporate", "severity": "moderate", "action": "Buy Floater" },
                    { "icon": "💰", "name": "Tax Efficiency", "status": "80C not maxed out", "severity": "moderate", "action": "Invest in ELSS" }
                ],
                "actionPlan": [
                    { "icon": "🏦", "urgency": "Critical Now", "title": "Build Liquid Fund", "desc": "Start a ₹10,000 SIP into a Liquid Fund for emergencies.", "primaryLabel": "Start SIP", "bgColor": "rgba(231,76,60,0.1)" },
                    { "icon": "🛡️", "urgency": "This Month", "title": "Buy Term Cover", "desc": "Get a ₹1Cr term plan for your family.", "primaryLabel": "View Plans", "bgColor": "rgba(201,168,76,0.1)" },
                    { "icon": "📈", "urgency": "This Quarter", "title": "Start Index SIP", "desc": "Invest your remaining ₹10k monthly into a Nifty 50 Index.", "primaryLabel": "Build Portfolio", "bgColor": "rgba(46,204,113,0.1)" },
                    { "icon": "🎓", "urgency": "This Quarter", "title": "ET Masterclass", "desc": "Learn the basics of mutual funds.", "primaryLabel": "Register Free", "bgColor": "rgba(52,152,219,0.1)" }
                ],
                "products": [
                    { "name": "Nippon India Liquid", "cat": "Debt · Low Risk", "risk": "Low", "returns": "+7.1%", "up": true, "riskColor": "#2ECC71" },
                    { "name": "UTI Nifty 50 Index", "cat": "Equity · Large Cap", "risk": "Moderate", "returns": "+15.2%", "up": true, "riskColor": "#C9A84C" },
                    { "name": "HDFC Term Life", "cat": "Insurance · Term", "risk": "Low", "returns": "N/A", "up": false, "riskColor": "#2ECC71" },
                    { "name": "ET Money Genius", "cat": "Advisory", "risk": "Low", "returns": "Smart", "up": true, "riskColor": "#3498DB" }
                ],
                "roadmap": [
                    { "time": "Month 1", "dot": "#E74C3C", "title": "Set up Basics", "desc": "Buy insurance and start liquid fund." },
                    { "time": "Month 3", "dot": "#C9A84C", "title": "Begin Equity", "desc": "Start index fund investments." },
                    { "time": "Month 6", "dot": "#3498DB", "title": "Review Taxes", "desc": "Check 80C limits." },
                    { "time": "Year 1", "dot": "#2ECC71", "title": "Annual Review", "desc": "Rebalance portfolio." }
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
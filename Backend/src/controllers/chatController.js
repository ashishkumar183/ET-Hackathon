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

module.exports = { handleChat };
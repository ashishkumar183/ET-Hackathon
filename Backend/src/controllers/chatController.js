const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const User = require('../models/User'); // Import the MySQL model to save progress

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function handleChat(req, res) {
    try {
        // We now expect the frontend to send the user's ID and current persona state
        const { message, userId, currentPersona } = req.body;

        // ---------------------------------------------------------
        // THE INTERROGATOR PROMPT (Phase 2 Magic)
        // ---------------------------------------------------------
        const systemPrompt = `
        You are the ET Onboarding Concierge. Your ONLY job right now is to profile the user in a warm, conversational way.
        Do NOT suggest specific ET products, mutual funds, or articles yet. 
        Keep your responses short, punchy, and under 2 sentences.

        You MUST collect these 4 pieces of information:
        1. Role (e.g., Student, IT Professional, Freelancer, Retiree)
        2. Goal (e.g., Save tax, Buy a house, Start investing, Learn markets)
        3. Interests (e.g., Mutual funds, Tech stocks, Cryptos, Real estate)
        4. Urgency (e.g., Immediately, Next 6 months, Just exploring)

        Current Known Data: ${JSON.stringify(currentPersona || {})}

        INSTRUCTIONS:
        - Review the 'Current Known Data'. 
        - If any of the 4 data points are missing or empty, ask a natural, human-sounding question to figure out ONE of the missing pieces based on the user's message.
        - Do NOT ask them to fill out a form. 
        - Your output MUST be strictly in JSON format.

        JSON OUTPUT FORMAT:
        {
           "replyText": "Your conversational response or next question here.",
           "ui_trigger": "None", 
           "extractedData": { 
               "role": "fill if known, else blank", 
               "goal": "fill if known, else blank", 
               "interests": "fill if known, else blank", 
               "urgency": "fill if known, else blank"
           }
        }

        CRITICAL TRIGGER:
        If you have successfully gathered ALL 4 data points (none are blank), change "ui_trigger" to "PersonaComplete" and congratulate them on finishing their profile.
        `;

        // Call Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);

        // ---------------------------------------------------------
        // SAVE PROGRESS TO MYSQL
        // ---------------------------------------------------------
        if (userId) {
            const isComplete = aiResponse.ui_trigger === "PersonaComplete";
            
            await User.update({
                role: aiResponse.extractedData.role,
                goal: aiResponse.extractedData.goal,
                interests: aiResponse.extractedData.interests,
                urgency: aiResponse.extractedData.urgency,
                onboardingComplete: isComplete // Flip to true if finished!
            }, { where: { id: userId } });

            if (isComplete) {
                console.log(`🎯 Persona Complete & Saved to DB for user ID: ${userId}`);
            }
        }

        res.status(200).json(aiResponse);

    } catch (error) {
        console.error("Error in chat controller:", error);
        res.status(500).json({ error: "Failed to process chat" });
    }
}

module.exports = { handleChat };
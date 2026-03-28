require('dotenv').config();

async function checkModels() {
    console.log("🔍 Asking Google for available embedding models...");
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        
        if (data.error) {
            console.error("API Error:", data.error.message);
            return;
        }

        // Filter out only the models that support embeddings
        const embedModels = data.models.filter(m => 
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes("embedContent")
        );

        console.log("\n✅ YOUR KEY CAN USE THESE EMBEDDING MODELS:");
        embedModels.forEach(m => {
            // Strip the "models/" prefix so it's ready to copy-paste
            console.log(`👉 "${m.name.replace('models/', '')}"`);
        });

        if (embedModels.length === 0) {
            console.log("\n❌ Uh oh! Your key has ZERO embedding models enabled.");
        }

    } catch (error) {
        console.error("Network error:", error.message);
    }
}

checkModels();
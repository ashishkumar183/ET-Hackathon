require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function processAndUpload(fileName, host) {
    const filePath = path.join(__dirname, 'src/data', fileName); 
    if (!fs.existsSync(filePath)) return;

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const items = JSON.parse(rawData);
    const vectors = [];

    console.log(`\n--- Processing ${fileName} ---`);

    for (const item of items) {
        const textToEmbed = `
            Title: ${item.title || item.name || 'Unknown Title'}
            Category: ${item.category || item.service || 'General'}
            Description: ${item.summary || item.description || item.content || ''}
        `.trim();

        try {
            const result = await embeddingModel.embedContent(textToEmbed);
            
            // CRITICAL FIX: Slice the 3072 vector down to exactly 768 to fit your database!
            const embeddingValues = Array.from(result.embedding.values).slice(0, 768);

            vectors.push({
                id: String(item.id || `auto-id-${Math.random().toString(36).substr(2, 9)}`), 
                values: embeddingValues,
                metadata: {
                    title: String(item.title || item.name || 'Unknown Title'),
                    category: String(item.category || item.service || 'General'),
                    source_file: String(fileName)
                }
            });
        } catch (err) {
            console.error(`Failed embedding item: ${item.title || 'Unknown'}`, err.message);
        }
        await new Promise(resolve => setTimeout(resolve, 500)); 
    }

    if (vectors.length > 0) {
        console.log(`Bypassing SDK... Uploading ${vectors.length} vectors directly to Pinecone server...`);
        
        try {
            // NATIVE REST API UPLOAD (Completely bypasses local SDK bugs)
            const response = await fetch(`https://${host}/vectors/upsert`, {
                method: 'POST',
                headers: {
                    'Api-Key': process.env.PINECONE_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    vectors: vectors,
                    namespace: ""
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log(`✅ SUCCESS! Database accepted ${fileName}.`);
            } else {
                console.error(`❌ Server Rejected Upload:`, data);
            }
        } catch (rawError) {
            console.error(`❌ Network Error:`, rawError.message);
        }
    }
}

async function main() {
    const INDEX_NAME = 'et-concierge';
    console.log("🚀 Starting Unblockable Seeding process...");

    try {
        // Automatically fetch your exact Pinecone database URL
        const indexData = await pc.describeIndex(INDEX_NAME);
        const host = indexData.host;
        
        await processAndUpload('articles.json', host);
        await processAndUpload('courses.json', host);
        await processAndUpload('markets.json', host);
        await processAndUpload('services.json', host);
        
        console.log("\n🎉 Database fully seeded! Go test your dashboard!");
    } catch (error) {
        console.error("❌ Setup Error:", error.message);
    }
}

main();
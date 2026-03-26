require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// 1. Initialize Pinecone & Gemini
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Use the correct active model
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function getEmbedding(text) {
    try {
        const result = await embeddingModel.embedContent(text);
        // Shrink the 3072-dimension vector down to exactly 768 dimensions
        return result.embedding.values.slice(0, 768); 
    } catch (error) {
        console.error("Error generating embedding:", error.message);
        throw error;
    }
}

async function processAndUpload(fileName, indexName) {
    const filePath = path.join(__dirname, '../data', fileName);
    
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Warning: ${fileName} not found. Skipping...`);
        return;
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const items = JSON.parse(rawData);
    const index = pc.index(indexName);
    const vectors = [];

    console.log(`Processing ${items.length} items from ${fileName}...`);

    // THE LOOP: Converts text to numbers and pushes to the vectors array
    for (const item of items) {
        const textToEmbed = `
            Title: ${item.title || item.name || 'Unknown Title'}
            Category: ${item.category || item.service || 'General'}
            Description: ${item.summary || item.description || item.content || ''}
            Tags: ${item.tags ? item.tags.join(', ') : 'None'}
        `.trim();

        const embeddingValues = await getEmbedding(textToEmbed);

        vectors.push({
            id: item.id || `auto-id-${Math.random().toString(36).substr(2, 9)}`, 
            values: embeddingValues,
            metadata: {
                ...item,
                tags: item.tags || [],
                source_file: fileName 
            }
        });
        
        // 500ms delay to respect Gemini's free tier rate limits
        await new Promise(resolve => setTimeout(resolve, 500)); 
    }

    // Safety check: Only upsert if the loop actually pushed items
    if (vectors.length > 0) {
        await index.upsert({ records: vectors });
        console.log(`✅ Successfully uploaded ${vectors.length} vectors from ${fileName}!`);
    } else {
        console.log(`⚠️ No vectors were generated for ${fileName}. Check your JSON formatting.`);
    }
}

async function main() {
    const INDEX_NAME = 'et-concierge'; // Must match your Pinecone dashboard

    console.log("🚀 Starting Vector Seeding process...");

    try {
        await processAndUpload('articles.json', INDEX_NAME);
        await processAndUpload('courses.json', INDEX_NAME);
        await processAndUpload('markets.json', INDEX_NAME);
        await processAndUpload('services.json', INDEX_NAME);
        
        console.log("🎉 Database fully seeded with all 4 pillars! Ready for Groq integration.");
    } catch (error) {
        console.error("❌ Error during seeding:", error);
    }
}

main();
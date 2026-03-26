// testChat.js

async function testConcierge() {
    const url = 'http://localhost:3000/api/chat'; // Change 3000 if your server uses a different port

    const payload = {
        message: "I just got my first job and I really need to save on taxes. What's the best way to do that?",
        userProfile: {
            role: "Early Career Professional",
            goal: "Tax Saving"
        }
    };

    console.log("📨 Sending message to ET Concierge...");
    console.log(`Message: "${payload.message}"\n`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log("✅ Groq AI Response Received:");
        console.log("--------------------------------------------------");
        console.log(JSON.stringify(data, null, 2));
        console.log("--------------------------------------------------");

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

testConcierge();
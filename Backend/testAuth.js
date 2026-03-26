// testAuth.js
async function testSignup() {
    console.log("📨 Attempting to register a new user...");

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Aryan Pachore",
                email: "aryan@veneratech.demo", // Fake email for testing
                password: "hackathonwinner123"
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log("✅ SUCCESS! User saved to MySQL Database.");
            console.log("--------------------------------------------------");
            console.log(JSON.stringify(data, null, 2));
            console.log("--------------------------------------------------");
        } else {
            console.error("❌ Registration Failed:", data);
        }

    } catch (error) {
        console.error("❌ Test script error:", error);
    }
}

testSignup();
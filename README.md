#  ET AI Concierge

> **A Next-Generation Generative AI Wealth Manager built for the Economic Times Hackathon.**

---

##  About the Project

In today's fast-paced financial landscape, retail investors are often overwhelmed by a flood of generic financial advice, complex jargon, and static tools. Traditional wealth management platforms force users through tedious, rigid questionnaires (like Typeform) and output one-size-fits-all dashboards that lack empathy and context.

**ET AI Concierge** flips this paradigm on its head by bridging the gap between financial literacy and actionable wealth-building. Instead of static forms, we engineered a **Stateful Generative UI (GenUI)**. 

Our platform acts as a highly personalized, conversational wealth manager. By leveraging **Retrieval-Augmented Generation (RAG)** on real Economic Times data and utilizing advanced LLM state machines, the AI dynamically builds custom financial dashboards, gap analyses, and mutual fund recommendations strictly based on natural, empathetic conversation. 

**Key Innovations:**
* **From GUI to GenUI:** The UI is not hardcoded; it is dynamically generated and hydrated by JSON payloads synthesized by the AI in real-time.
* **Context-Aware Memory:** The AI evaluates the entire chat history to determine exactly what financial pillars (Income, Savings, Risk, Goals) are missing, asking targeted follow-up questions until the profile is complete.
* **Actionable RAG:** We don't just return text. We query a vector database of ET articles and courses, and the AI converts that knowledge into interactive UI widgets.

---

## ✨ Core Features & Walkthrough

### 1. Onboarding & Profiling
A seamless, frictionless entry point that captures the user's basic financial baseline and sets up their personalized workspace without overwhelming them with data entry.

<img width="1910" height="926" alt="image" src="https://github.com/user-attachments/assets/d7c6ebc8-764a-46c5-a37a-afb4174a190b" />


* **Frictionless Entry:** Replaces traditional 20-question forms with an intuitive, guided setup.
* **Baseline Generation:** Instantly sets the context for the AI agents, ensuring all future advice respects the user's base financial standing.

### 2. Financial Navigator (Stateful Generative UI)
An empathetic conversational AI that interviews the user to understand their financial standing, automatically calculating net worth, health scores, and dynamic gap analysis.

<img width="1913" height="908" alt="image" src="https://github.com/user-attachments/assets/f672df4a-64e0-4172-ab02-37a3b49567ba" />
<img width="1914" height="903" alt="image" src="https://github.com/user-attachments/assets/149e5f01-b067-4f07-bc87-7fdcc114493b" />


* **Dynamic Chat Engine:** The AI processes the entire conversation history to ask context-aware follow-up questions without relying on hardcoded logic trees.
* **Strict Math & Formatting:** The AI is strictly prompted to handle financial math (e.g., converting annual salaries to monthly) and output raw integers.
* **Generative Dashboard Rendering:** Once the AI has gathered enough context, it outputs a strict JSON payload that instantly renders a fully personalized, dark-mode dashboard featuring Action Plans, Gap Analysis, and Curated ET Products.

### 3. Co-Pilot Dashboard (RAG Pipeline)
A powerful search and discovery engine loaded with real Economic Times data, allowing users to ask complex financial questions and get actionable widgets in return.

<img width="1917" height="913" alt="image" src="https://github.com/user-attachments/assets/faf015b7-c9f5-41ef-bc02-53c9be99798c" />


* **Vector Search Engine:** Uses Gemini embeddings and a Pinecone vector database to execute semantic "Nearest Neighbor" searches over ET articles, courses, and market data.
* **Actionable Output:** Synthesizes database knowledge into beautiful UI widgets (like stock tickers, fund comparisons, and action steps) rather than just generating plain text responses.

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** React.js, Custom CSS (Dark Mode, Responsive Design)
* **Backend:** Node.js, Express.js
* **AI Models:** * `llama-3.3-70b-versatile` (via Groq) for lightning-fast logical reasoning, state evaluation, and GenUI JSON synthesis.
    * `gemini-embedding-001` (via Google) for high-fidelity text vectorization (sliced to 768 dimensions).
* **Database:** Pinecone (Vector DB) for ultra-low latency RAG semantic search.

---

## 💻 How to Run Locally

Follow these steps to get the ET AI Concierge up and running on your local machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* [Git](https://git-scm.com/)
* API Keys for **Groq**, **Google Gemini**, and **Pinecone**.

### 1. Clone the Repository
```bash
git clone [https://github.com/ashishkumar183/ET-Hackathon.git]
cd ET-Hackathon

2. Backend Setup
Navigate to the backend directory, install dependencies, and configure your environment variables.

Bash
cd Backend
npm install
Create a .env file in the Backend root and add your API keys:

Code snippet
PORT=3000
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_URL=your_pinecone_index_url
Start the backend server:

Bash
npm start
# or node src/server.js
The Express server should now be running on http://localhost:3000.

3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, install dependencies, and start the React app.

Bash
cd Frontend
npm install
npm run dev
# or npm start depending on your bundler

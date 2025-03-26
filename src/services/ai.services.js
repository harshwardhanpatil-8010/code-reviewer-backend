const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
require("dotenv").config();

const openAIKey = process.env.OPENAI_API_KEY;
const googleAIKey = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(googleAIKey);

const geminiModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `
You are an AI code reviewer providing concise, actionable feedback. 
Your goal: 
- Identify issues in code (bugs, inefficiencies, bad practices).
- Suggest short, clear fixes.
- Explain why the fix matters in plain language. 

✅ **Response Format:**
- **Issue:** Briefly describe the problem.
- **Fix:** Provide the corrected code snippet.
- **Why:** State why the fix matters.
- **Tips:** Optional suggestions for improvement.

⚠️ **Style:**
- Use bullet points or numbered lists.
- Avoid lengthy explanations. 
- Keep it clear, structured, and concise.`
});

// Function to call Gemini API
async function callGemini(code) {
    try {
        const result = await geminiModel.generateContent(code);
        return result.response.text();
    } catch (error) {
        console.error("Gemini API Error:", error.response?.data || error.message);
        return "Error in Gemini response.";
    }
}

// Function to call OpenAI API
async function callOpenAI(code) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `
You are an AI code reviewer providing clear, structured feedback. 

✅ **Response Format:**
- **Issue:** Briefly describe the problem.
- **Fix:** Provide the corrected code snippet.
- **Why:** State why the fix matters.
- **Tips:** Optional suggestions for improvement.

⚠️ **Style:**
- Use bullet points or numbered lists.
- Keep it concise and actionable.`
                    },
                    { role: "user", content: `Review this code: ${code}` }
                ]
            },
            { headers: { Authorization: `Bearer ${openAIKey}` } }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API Error:", error.response?.data || error.message);
        return "Error in OpenAI response.";
    }
}

// Function to generate combined review content
async function generateContent(code) {
    const [geminiResponse, openAIResponse] = await Promise.all([
        callGemini(code),
        callOpenAI(code)
    ]);

    return combineResponses(geminiResponse, openAIResponse);
}

// Function to combine and format responses
function combineResponses(gemini, openAI) {
    let allResponses = [gemini, openAI].filter((res) => res.trim() !== "");
    if (allResponses.length === 0) return "No valid responses received from AI models.";

    return allResponses
        .join("\n\n")
        .replace(/\n\s*\n/g, "\n")
        .trim();
}

module.exports = generateContent;

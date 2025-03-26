const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
require("dotenv").config();
const openAIKey = process.env.OPENAI_API_KEY;
const googleAIKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(googleAIKey);
const geminiModel = genAI.getGenerativeModel({
model: "gemini-2.0-flash",
systemInstruction: "You are a friendly code reviewer designed to help new developers understand code reviews quickly. Provide clear, simple explanations focusing on code quality, security, performance, and maintainability. Use plain language and examples to help beginners learn."
});
async function callGemini(code) {
try {
const result = await geminiModel.generateContent(code);
return result.response.text();
} catch (error) {
console.error("Gemini API Error:", error.response?.data || error.message);
return "";
}
}
async function callOpenAI(code) {
try {
const response = await axios.post("https://api.openai.com/v1/chat/completions", {
model: "gpt-3.5",
messages: [
{ role: "system", content: "You are a friendly code reviewer designed to help new developers understand code reviews quickly. Provide clear, simple explanations focusing on code quality, security, performance, and maintainability. Use plain language and examples to help beginners learn." },
{ role: "user", content: `Review this code: ${code}` }
]
}, { headers: { Authorization: `Bearer ${openAIKey}` } });
return response.data.choices[0].message.content;
} catch (error) {
console.error("OpenAI API Error:", error.response?.data || error.message);
return "";
}
}
async function generateContent(code) {
const [geminiResponse, openAIResponse] = await Promise.all([callGemini(code), callOpenAI(code)]);
const combinedReview = `${combineResponses(geminiResponse, openAIResponse)}`;
return combinedReview;
}
function combineResponses(gemini, openAI) {
let allResponses = [gemini, openAI].filter((res) => res.trim() !== "");
if (allResponses.length === 0) return "No valid responses received from AI models.";
return allResponses.join("\n\n").replace(/\n\s*\n/g, "\n");
}
module.exports = generateContent;

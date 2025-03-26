const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
require("dotenv").config();
const fs = require("fs");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const openAIKey = process.env.OPENAI_API_KEY;
const googleAIKey = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(googleAIKey);

const geminiModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `
You are an AI code reviewer providing concise, actionable feedback with time complexity insights. 

✅ **Response Format:**
- **Issue:** Briefly describe the problem.
- **Fix:** Provide the corrected code snippet.
- **Why:** State why the fix matters.
- **Tips:** Optional suggestions for improvement.
- **Time Complexity:** Best, Average, and Worst-case complexities in Big-O notation.

⚠️ **Style:**
- Use bullet points or numbered lists.
- Keep it concise and actionable.
- Include time complexity visualizations.
`
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
You are an AI code reviewer providing clear, structured feedback with time complexity insights. 

✅ **Response Format:**
- **Issue:** Briefly describe the problem.
- **Fix:** Provide the corrected code snippet.
- **Why:** State why the fix matters.
- **Tips:** Optional suggestions for improvement.
- **Time Complexity:** Best, Average, and Worst-case complexities in Big-O notation.

⚠️ **Style:**
- Use bullet points or numbered lists.
- Keep it concise and actionable.
- Include time complexity visualizations.
`
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

    const review = combineResponses(geminiResponse, openAIResponse);
    const complexityData = extractComplexity(review);

    if (complexityData) {
        await generateComplexityGraph(complexityData);
        console.log("✅ Time Complexity Graph Generated.");
    } else {
        console.log("⚠️ No valid complexity data found.");
    }

    return review;
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

// Function to extract time complexity data from the review
function extractComplexity(review) {
    const complexityRegex = /Time Complexity:\s*Best:\s*O\(([^)]+)\)\s*Average:\s*O\(([^)]+)\)\s*Worst:\s*O\(([^)]+)\)/i;
    const match = review.match(complexityRegex);

    if (match) {
        return {
            best: match[1],
            average: match[2],
            worst: match[3]
        };
    }
    return null;
}

// Function to generate a time complexity graph
async function generateComplexityGraph({ best, average, worst }) {
    const width = 800;
    const height = 600;

    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const configuration = {
        type: "line",
        data: {
            labels: ["n = 10", "n = 20", "n = 30", "n = 40", "n = 50"],
            datasets: [
                {
                    label: "Best Case",
                    data: [10, 20, 30, 40, 50], // Simulated data for visualization
                    borderColor: "green",
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: "Average Case",
                    data: [15, 30, 45, 60, 75],
                    borderColor: "orange",
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: "Worst Case",
                    data: [20, 40, 60, 80, 100],
                    borderColor: "red",
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: "Time Complexity Analysis"
                }
            }
        }
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);

    // Save the graph as an image
    fs.writeFileSync("./time-complexity-graph.png", imageBuffer);
    console.log("✅ Graph saved as time-complexity-graph.png");
}

module.exports = generateContent;
